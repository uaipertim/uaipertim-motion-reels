#!/usr/bin/env python3
"""
QA DOS TEXTOS de um carrossel animado (complementa o scripts/quiz_qa.py, que confere formato, loop, capa e bordas).

    python3 scripts/carrossel_textos_qa.py carrosseis/animados/03-seu-comercio-no-uaipertim.json

Lê os PNGs das lâminas (o quadro "estatico" de cada uma: lamina-N.png) com OCR (tesseract, português) e confere:
  • espaços entre palavras: cada par de palavras vizinhas do texto de tela aparece SEPARADO no OCR (em ao menos uma das
    passadas, uma palavra logo depois da outra); acusa o par que só aparece grudado num token ("comércio" + "no" → "comérciono");
  • legibilidade: o OCR reconhece ≥ 90% das palavras de tela da lâmina, com confiança média ≥ 75; e nenhum texto da
    composição tem fonte menor que 24 px (fora as telas do app, que são imagem);
  • valores: os do JSON ("valores": as 3 faixas da mensalidade, o teto e a comissão) estão na tela (OCR), na tabela e na
    legenda do post; nenhum outro valor aparece e nada sobra da política antiga (3 meses grátis, R$ 49,90);
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
    toks, passadas = {}, []
    tmp = OUT / "revisao" / f"ocr-{png.stem}.png"
    for ch in im.split():
        for v in (ch, ImageOps.invert(ch)):
            v.save(tmp)
            tsv = "".join(subprocess.run(["tesseract", str(tmp), "-", "-l", "por", "--psm", psm, "tsv"], capture_output=True, text=True).stdout for psm in ("11", "3"))
            passadas.append([ln.split("\t")[11].strip() for ln in tsv.splitlines() if len(ln.split("\t")) == 12 and ln.split("\t")[11].strip()])
            for ln in tsv.splitlines():
                c = ln.split("\t")
                if len(c) == 12 and c[11].strip() and re.fullmatch(r"-?[\d.]+", c[10]) and float(c[10]) >= 0:
                    w = c[11].strip()
                    toks[w] = max(toks.get(w, 0), float(c[10]))
    # + faixas horizontais (o modo de página às vezes pula uma pílula inteira): 220 px com passo de 110, linha a linha
    for y in range(0, im.height - 110, 220):
        faixa = im.crop((0, y, im.width, min(im.height, y + 440)))
        for v in (ImageOps.invert(ImageOps.grayscale(faixa)), ImageOps.invert(faixa.split()[2]), ImageOps.grayscale(faixa)):
            v.save(tmp)
            tsv = subprocess.run(["tesseract", str(tmp), "-", "-l", "por", "--psm", "6", "tsv"], capture_output=True, text=True).stdout
            passadas.append([ln.split("\t")[11].strip() for ln in tsv.splitlines() if len(ln.split("\t")) == 12 and ln.split("\t")[11].strip()])
            for ln in tsv.splitlines():
                c = ln.split("\t")
                if len(c) == 12 and c[11].strip() and re.fullmatch(r"-?[\d.]+", c[10]) and float(c[10]) >= 0:
                    w = c[11].strip()
                    toks[w] = max(toks.get(w, 0), float(c[10]))
    tmp.unlink()
    return list(toks.items()), passadas


parecido = lambda a, b: a == b or (len(a) >= 4 and SequenceMatcher(None, a, b).ratio() >= 0.8)
OCR = {}
for i, L in enumerate(D["laminas"]):
    rel.append(f"--- lâmina {i + 1} ({L['rotulo']})")
    toks, passadas = ocr(OUT / f"lamina-{i + 1}.png")
    pares_sep = {(nrm(a), nrm(b)) for ps in passadas for a, b in zip(ps, ps[1:])}
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
            # grudado = alguma passada lê as duas como um token só E nenhuma passada lê as duas separadas, uma depois da outra
            separado = any(parecido(x, a) and parecido(y, b) for x, y in pares_sep)
            if not separado and len(junto) >= 5 and any(n == junto or (len(n) >= len(junto) - 1 and parecido(n, junto) and not parecido(n, a) and not parecido(n, b)) for n in ns):
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
    # a política de mensalidade (revisada em 2026-11-24): 3 faixas pelo que a loja vende pelo app + a comissão de 5%
    i6 = next(i for i, L in enumerate(D["laminas"]) if L["tipo"] == "mensalidade")
    i5 = next(i for i, L in enumerate(D["laminas"]) if L["tipo"] == "pagamento")
    sem = lambda x: re.sub(r"\s", "", x)
    t6 = sem(" ".join(t for t, _ in OCR[i6]))
    t5 = " ".join(t for t, _ in OCR[i5])
    vals = [V["mensalidade_minima"], V["faixa_1_ate"], V["faixa_2_ate"], V["percentual_faixa_2"], V["teto"]]
    faltam_v = [v for v in vals if sem(v).replace("R$", "") not in t6]
    ok(not faltam_v, f"as 3 faixas na tela da lâmina {i6 + 1} (OCR): até {V['faixa_1_ate']} → {V['mensalidade_minima']}; até {V['faixa_2_ate']} → {V['percentual_faixa_2']}; acima → {V['teto']} (teto)"
       + (f" (não lidos: {', '.join(faltam_v)})" if faltam_v else ""))
    ok(V["comissao"] in t5 and V["comissao"] in t6, f"comissão de {V['comissao']} dos pedidos pagos pelo app: nas lâminas {i5 + 1} e {i6 + 1}")
    fx = D["laminas"][i6]["faixas"]
    ok([f["valor"] for f in fx] == [V["mensalidade_minima"], V["percentual_faixa_2"], V["teto"]] and V["faixa_1_ate"] in fx[0]["quando"] and V["faixa_1_ate"] in fx[1]["quando"]
       and V["faixa_2_ate"] in fx[1]["quando"] and V["faixa_2_ate"] in fx[2]["quando"] and "teto" in fx[2].get("obs", ""), "a tabela da lâmina bate com o campo 'valores' do JSON (as faixas em ordem, o teto marcado)")
    js = json.dumps(D["laminas"], ensure_ascii=False)
    permitidos = {sem(v) for v in (V["mensalidade_minima"], V["faixa_1_ate"], V["faixa_2_ate"], V["teto"])}
    outros = [x for x in re.findall(r"R\$\s?[\d.]+(?:,\d\d)?", js) if sem(x) not in permitidos]
    ok(not outros, "nenhum outro valor em R$ nas lâminas" + (f" (achados: {', '.join(outros)})" if outros else ""))
    ok(not [x for x in re.findall(r"\d+\s?%", js) if sem(x) != V["comissao"]], f"nenhuma outra porcentagem além de {V['comissao']}")
    velho = re.compile(r"3\s?\*?\s?meses|sem mensalidade|gr[áa]tis|49,90|lançamento", re.I)
    ok(not velho.search(js) and not velho.search(LEG) and not velho.search(" ".join(t for i in OCR for t, _ in OCR[i])),
       'nada da política antiga ("3 meses", "sem mensalidade", "grátis", "R$ 49,90", "lojas do lançamento") nas lâminas, na tela nem na legenda')
    if LEG:
        ok(V["mensalidade_minima"] in LEG and V["teto"] in LEG and "acompanha" in LEG and V["comissao"] in LEG,
           f"a legenda do post traz a regra nova (a partir de {V['mensalidade_minima']}, acompanha as vendas pelo app, teto de {V['teto']}) e a comissão de {V['comissao']}")
ok(not [t for L in D["laminas"] for t in ([L["titulo"]] if isinstance(L["titulo"], str) else L["titulo"]) + L.get("quebra", []) if re.search(r"\*[^*\s]+\s[^*]+\*", t)],
   "o marcador vai numa palavra só (num marcador de várias palavras o espaço fica estreito)")
texto_total = json.dumps({k: v for k, v in D.items() if not k.startswith("_")}, ensure_ascii=False) + LEG
ok(not re.search(r"\bfrete", texto_total, re.I), 'sem "frete" (sempre "entrega")')
ok(not re.search(r"vend(a|e)r? mais|aument\w* (as |suas |de )?vendas|mais vendas|garant|fatur\w+ mais|lucr", texto_total, re.I), "sem promessa de vendas ou resultado")
wa = [L["rotulo"] for L in D["laminas"] if "whatsapp" in json.dumps(L, ensure_ascii=False).lower()]
ok(wa == ["pedido no painel", "mensalidade"] and "whatsapp" not in LEG.lower() and not re.search(r"\(?\d{2}\)?\s?9?\d{4}-?\d{4}", texto_total),
   'WhatsApp só como o jeito antigo (lâmina 3) e como venda que não entra na conta da mensalidade (lâmina 6), nunca como canal de suporte; sem telefone')
ok(not re.search(r"\b(a|da|na|de)\s+Glória", texto_total), '"o Glória" no masculino')
ok(re.search(r"\bpertim\b", texto_total, re.I) and not re.search(r"P[ée]rr-?t[ií]m|P[ée]r-t[ií]m|Pértim|Pertím", texto_total), '"Pertim" sem troca de grafia na tela')

rel.append("")
rel.append(f"RESULTADO: {'aprovado' if not falhas else 'ajustar'}")
(OUT / "revisao" / "textos-qa.txt").write_text("\n".join(rel) + "\n")
print("\n".join(rel))
