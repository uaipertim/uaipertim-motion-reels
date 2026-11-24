#!/usr/bin/env python3
"""
QA DOS TEXTOS de um carrossel animado (complementa o scripts/quiz_qa.py, que confere formato, loop, capa e bordas).

    python3 scripts/carrossel_textos_qa.py carrosseis/animados/03-seu-comercio-no-uaipertim.json

Lê os PNGs das lâminas (o quadro "estatico" de cada uma: lamina-N.png) com OCR (tesseract, português) e confere:
  • espaços entre palavras: cada par de palavras vizinhas do texto de tela aparece SEPARADO no OCR, nunca grudado num token
    só (ex.: "comércio" + "no" → "comérciono");
  • legibilidade: o OCR reconhece ≥ 90% das palavras de tela da lâmina, com confiança média ≥ 75; e nenhum texto da
    composição tem fonte menor que 24 px (fora as telas do app, que são imagem);
  • valores: os do JSON ("valores": meses grátis, mensalidade, comissão) estão na tela (OCR) e na legenda do post, e
    nenhum outro valor de mensalidade/comissão aparece;
  • regras: "entrega" (nunca "frete"); sem promessa de vendas/resultado; sem WhatsApp de suporte nem telefone; "o Glória"
    no masculino; "Pertim" sem troca de grafia.
Grava <saida>/revisao/textos-qa.txt e termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import json
import re
import subprocess
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
J = Path(sys.argv[1]).resolve()
D = json.loads(J.read_text())
OUT = RAIZ / D["saida"]
SRC = (RAIZ / "src" / "carrossel-animado" / f'{"SeuComercio" if D["composicao"] == "SeuComercio" else D["composicao"]}.tsx').read_text()
LEG = (OUT / "legenda.txt").read_text() if (OUT / "legenda.txt").exists() else ""
rel, falhas = [], []


def ok(c, msg):
    rel.append(("ok    " if c else "FALHA ") + msg)
    if not c:
        falhas.append(msg)


def nrm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9%$,]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def palavras(t):
    return [w for w in re.split(r"\s+", t.replace("*", "").replace(" ", " ")) if nrm(w)]


# os textos de tela de cada lâmina (o que está visível no quadro do PNG)
def textos(i, L):
    ts = [D["selo"]]
    ts += L["quebra"] if L.get("quebra") else (L["titulo"] if isinstance(L["titulo"], list) else [L["titulo"]])
    for k in ("rodape", "texto", "aviso", "selo", "nota", "depois", "destaque", "cta", "email", "assinatura"):
        if L.get(k):
            ts.append(L[k])
    ts += L.get("itens", [])
    for o in L.get("opcoes", []):
        ts += [o["titulo"], o["texto"]]
    for g in L.get("grupos", []):
        ts += [g["titulo"]] + g["formas"]
    if L["tipo"] in ("vitrine", "pedido"):
        ts.append(D["ilustrativo"])
    return ts


def ocr(png):
    # o PNG em 2× (letras maiores), em 12 passadas (modos 11 e 3 do tesseract × (canais R, G e B, normais e invertidos: texto branco no coral, tinta no
    # amarelo, branco no escuro…), modo de texto esparso; junta os tokens de todas as passadas (fica a maior confiança)
    from PIL import Image, ImageOps
    im = Image.open(png).convert("RGB")
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    toks = {}
    tmp = OUT / "revisao" / f"ocr-{png.stem}.png"
    for ch in im.split():
        for v in (ch, ImageOps.invert(ch)):
            v.save(tmp)
            tsv = "".join(subprocess.run(["tesseract", str(tmp), "-", "-l", "por", "--psm", psm, "tsv"], capture_output=True, text=True).stdout for psm in ("11", "3"))
            for ln in tsv.splitlines():
                c = ln.split("\t")
                if len(c) == 12 and c[11].strip() and float(c[10]) >= 0:
                    w = c[11].strip()
                    toks[w] = max(toks.get(w, 0), float(c[10]))
    tmp.unlink()
    return list(toks.items())


parecido = lambda a, b: a == b or (len(a) >= 4 and SequenceMatcher(None, a, b).ratio() >= 0.8)
OCR = {}
for i, L in enumerate(D["laminas"]):
    rel.append(f"--- lâmina {i + 1} ({L['rotulo']})")
    toks = ocr(OUT / f"lamina-{i + 1}.png")
    OCR[i] = toks
    ns = [nrm(t) for t, _ in toks]
    esperadas, achadas, conf, grudadas, faltam = 0, 0, [], [], []
    for tx in textos(i, L):
        ws = [nrm(w) for w in palavras(tx) if not re.fullmatch(r"[\W_]+", w)]
        ws = [w for w in ws if w]
        for w in ws:
            esperadas += 1
            hit = [k for k, n in enumerate(ns) if parecido(n, w)]
            if hit:
                achadas += 1
                conf.append(max(toks[k][1] for k in hit))
            else:
                faltam.append(w)
        for a, b in zip(ws, ws[1:]):
            junto = a + b
            if len(junto) >= 5 and any(n == junto or (len(n) >= len(junto) - 1 and parecido(n, junto) and not parecido(n, a) and not parecido(n, b)) for n in ns):
                grudadas.append(f"{a}+{b}")
    taxa = achadas / max(1, esperadas)
    cm = sum(conf) / max(1, len(conf))
    ok(not grudadas, "espaços entre palavras: nenhum par grudado" + (f" (grudadas: {', '.join(grudadas)})" if grudadas else ""))
    ok(taxa >= 0.9 and cm >= 75, f"legível: o OCR reconhece {achadas}/{esperadas} palavras ({100 * taxa:.0f}%), confiança média {cm:.0f}" + (f" (não lidas: {', '.join(faltam)})" if faltam else ""))

rel.append("--- a composição, os valores e as regras")
# a menor fonte dos textos da composição (os PNGs das telas do app não contam)
tamanhos = [int(x) for x in re.findall(r"fontSize:\s*(\d+)", SRC)]
ok(min(tamanhos) >= 24, f"menor fonte dos textos da composição: {min(tamanhos)} px (mínimo 24)")
V = D.get("valores", {})
tudo_tela = " ".join(t for i in OCR for t, _ in OCR[i])
if V:
    meses, mens, com = str(V["meses_gratis"]), V["mensalidade"], V["comissao"]
    i6 = next(i for i, L in enumerate(D["laminas"]) if L["tipo"] == "mensalidade")
    i5 = next(i for i, L in enumerate(D["laminas"]) if L["tipo"] == "pagamento")
    t6 = " ".join(t for t, _ in OCR[i6])
    t5 = " ".join(t for t, _ in OCR[i5])
    ok(re.search(rf"\b{meses}\b", t6) and "meses" in t6.lower(), f"{meses} meses sem mensalidade: na tela da lâmina {i6 + 1} (OCR: o contador parado em {meses})")
    ok(mens.split()[-1] in t6, f"mensalidade depois: {mens}/mês na tela da lâmina {i6 + 1} (OCR: {mens.split()[-1]})")
    ok(com in t5, f"comissão: {com} só nos pedidos pagos pelo app, na tela da lâmina {i5 + 1}")
    js = json.dumps(D["laminas"], ensure_ascii=False)
    ok(re.search(rf"\*?{meses}\*? \*?meses\*?", js) and f"{mens}/mês" in js and f"Comissão de {com}" in js, "os valores do texto das lâminas batem com o campo 'valores' do JSON")
    ok(not [x for x in re.findall(r"R\$\s?\d+,\d\d", js) if x.replace(" ", "") != mens.replace(" ", "")], f"nenhum outro valor em R$ nas lâminas além de {mens}")
    ok(not [x for x in re.findall(r"\d+\s?%", js) if x.replace(" ", "") != com], f"nenhuma outra porcentagem além de {com}")
    if LEG:
        ok(f"{meses} meses" in LEG and mens in LEG and com in LEG, f"a legenda do post traz os mesmos valores ({meses} meses, {mens}, {com})")
ok(not [t for L in D["laminas"] for t in ([L["titulo"]] if isinstance(L["titulo"], str) else L["titulo"]) + L.get("quebra", []) if re.search(r"\*[^*\s]+\s[^*]+\*", t)],
   "o marcador vai numa palavra só (num marcador de várias palavras o espaço fica estreito)")
texto_total = json.dumps({k: v for k, v in D.items() if not k.startswith("_")}, ensure_ascii=False) + LEG
ok(not re.search(r"\bfrete", texto_total, re.I), 'sem "frete" (sempre "entrega")')
ok(not re.search(r"vend(a|e)r? mais|aument\w* (as |suas |de )?vendas|mais vendas|garant|fatur\w+ mais|lucr", texto_total, re.I), "sem promessa de vendas ou resultado")
wa = [L["rotulo"] for L in D["laminas"] if "whatsapp" in json.dumps(L, ensure_ascii=False).lower()]
ok(wa == ["pedido no painel"] and "whatsapp" not in LEG.lower() and not re.search(r"\(?\d{2}\)?\s?9?\d{4}-?\d{4}", texto_total),
   'WhatsApp só como o jeito antigo ("Sem ficar repetindo cardápio e preço no WhatsApp"), nunca como canal de suporte; sem telefone')
ok(not re.search(r"\b(a|da|na|de)\s+Glória", texto_total), '"o Glória" no masculino')
ok(re.search(r"\bpertim\b", texto_total, re.I) and not re.search(r"P[ée]rr-?t[ií]m|P[ée]r-t[ií]m|Pértim|Pertím", texto_total), '"Pertim" sem troca de grafia na tela')

rel.append("")
rel.append(f"RESULTADO: {'aprovado' if not falhas else 'ajustar'}")
(OUT / "revisao" / "textos-qa.txt").write_text("\n".join(rel) + "\n")
print("\n".join(rel))
