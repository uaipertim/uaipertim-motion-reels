# 📦 Pacote de produção — Vídeo 1 "Não precisa baixar nada" (UaiPertim)

Leve esta pasta inteira pro Code. Contém: o roteiro, os assets nomeados e o prompt.

## Arquivos
- `ROTEIRO.md` — roteiro de produção completo (specs, cenas, narração cronometrada, trilha).
- `assets/uaipertim_logo.png` — logo oficial (usar no fecho e marca). **Essencial.**
- `assets/uaipertim_home.png` — captura real da home (cena 4, dentro do celular).
- `assets/ref_comercio_local.png`, `ref_arte_7/8/9.png` — **referências de estilo** (cartoon,
  cidadezinha, cores). Não precisam entrar no vídeo; são só norte visual.

---

## ✅ Antes de começar — pergunte ao Code
Cole no Code:
> "Você tem o **Remotion** disponível neste ambiente? Se não, instale: `npm i remotion @remotion/cli @remotion/google-fonts`. Pra áudio/voz, confirme o que há disponível pra **TTS** e pra **gerar/compor trilha** (ex.: ffmpeg + biblioteca de TTS). Me diga o que tem antes de produzir."

Se não usar Remotion, troque a lib no prompt abaixo pela que já estiver no seu fluxo.

---

## 🎬 PROMPT (colar no Code, junto com esta pasta)

Crie um vídeo de **motion graphic em Remotion (React + TypeScript)**, seguindo **exatamente**
o `ROTEIRO.md` em anexo.

**Specs:** Reels **9:16 — 1080×1920, 30fps, 26s (780 frames)**.

**Estilo:** cartoon **flat 2D, vivo, colorido e cheio de interação, SEM figuras humanas**.
Micro-animações em tudo, com **overshoot/spring em todas as entradas** (nada linear).
Respeite a **paleta**, as **fontes Poppins**, as **6 cenas**, o **mapa de frames** e as
**safe areas** do roteiro. Na cena 1, o celular é um **personagem com olhinhos**. Na cena 4,
a URL **`uaipertim.com.br` se digita sozinha** e a `uaipertim_home.png` sobe dentro do celular.
No fecho (cena 6), **lançamento = "EM BREVE"** (sem data), com **sininho pulsando + "ative o
lembrete"**.

**Áudio (gerar pelo projeto):**
- **Locução (TTS)** em pt-BR, tom amigável/caloroso, **sotaque mineiro leve**, conversando
  (não locutor sério). Use o texto e os tempos da **tabela de narração** do roteiro.
- **Trilha** pop/folk saltitante **124 bpm** (ukulele + claps + marimba + sininhos), com
  **respiro de ~1s na cena 3** e **pico no CTA**. Aplique **ducking** da trilha sob a locução.

**Assets:** use `assets/uaipertim_logo.png` e `assets/uaipertim_home.png`. Ícones de categoria,
cidadezinha, marcador amarelo e partículas podem ser desenhados em SVG/React no estilo das
referências `assets/ref_*`.

**Entregáveis:**
1. Projeto Remotion completo e organizado (componentes por cena).
2. **MP4 final renderizado** (H.264, 1080×1920, 30fps) com áudio embutido.
3. Deixe **fácil de editar textos e tempos** (constantes/props por cena).

---

## 🎨 Lembretes rápidos da marca
- Coral `#F2502B` · coral-fundo `#E7431C` · creme `#F6EEE2` · amarelo `#F9B233` · verde `#3E9E4E` · tinta `#221C19`.
- Poppins: Black (títulos), ExtraBold (destaques), Medium (apoio).
- Slogan de fecho: **"Tudo pertim de você."** · Marca: **@uaipertim** · Site: **uaipertim.com.br**
- Lançamento: **"em breve"** (NÃO usar data).
