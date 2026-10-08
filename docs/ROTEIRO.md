# 🎬 Vídeo 1 — "Não precisa baixar nada" (roteiro de produção)

**Formato:** Reels 9:16 — 1080×1920 · **FPS:** 30 · **Duração:** 26s (780 frames)
**Estilo:** cartoon flat 2D com micro-animações, SEM figuras humanas. Vivo, colorido,
interação em tudo, nada morno.
**Safe areas (Reels):** topo ~220px e base ~420px livres de texto crítico (UI do app cobre).

## 🎨 Direção visual (global)
- **Paleta:** coral `#F2502B` · coral-fundo `#E7431C` · creme `#F6EEE2` · amarelo `#F9B233` · verde `#3E9E4E` · tinta `#221C19`.
- **Tipografia:** Poppins — Black (títulos), ExtraBold (destaques), Medium (apoio).
- **Easing padrão:** `easeOutBack` / spring com overshoot em TODA entrada (dá o "pulinho"). Nada de linear.
- **Transições entre cenas:** swipe de cor (faixa coral/amarela cruza) OU um objeto "engole" a cena (a lupa/o link vira o próximo cenário).
- **Partículas sempre presentes:** confete, estrelinhas e coraçõezinhos nos momentos positivos.
- **Vida constante:** tudo respira (loop de scale 1.00↔1.02), ícones têm leve idle float, sombras suaves acompanham.

## ⏱️ Mapa de frames (30fps)
| Cena | Tempo | Frames |
|---|---|---|
| 1 — A dor | 0.0–3.0s | 0–90 |
| 2 — Transborda | 3.0–6.0s | 90–180 |
| 3 — A virada | 6.0–10.0s | 180–300 |
| 4 — É só o link | 10.0–15.0s | 300–450 |
| 5 — A cidade ganha vida | 15.0–20.0s | 450–600 |
| 6 — Fecho + CTA | 20.0–26.0s | 600–780 |

---

## 🎞️ Cena a cena

### CENA 1 · A dor — 0:00–0:03
- **Visual:** **celular-personagem** cartoon (com olhinhos) tremendo, abarrotado de ícones de apps coloridos que transbordam e pulam pra fora. Barra "Armazenamento" sobe até **99%** (vermelha). Gotinhas de suor.
- **Movimento:** celular entra com drop + squash no chão; ícones pipocam empilhando; shake contínuo leve; barra preenche com easeOut.
- **Texto na tela:** `Mais um app pra baixar? 😩` (entra bounce, treme junto)
- **Locução:** "Uai… seu celular já vive cheio, né?"
- **SFX:** "glup" de app empilhando + alarme curto.

### CENA 2 · Transborda — 0:03–0:06
- **Visual:** um ícone de app novo tenta entrar, **quica e é cuspido** pra fora. Selo **"ARMAZENAMENTO CHEIO!"** carimba com impacto.
- **Movimento:** app entra por cima → colide → overshoot pra fora; no impacto do carimbo, **shake de câmera** (3–4 frames) + flash branco rápido.
- **Texto na tela:** `Não cabe mais nada!`
- **Locução:** "E aí vem mais um aplicativo… não cabe mais nada!"
- **SFX:** "boing" + carimbo seco.

### CENA 3 · A virada — 0:06–0:10
- **Visual:** **swipe coral** cruza e limpa tudo → fundo creme. **Logo do UaiPertim** entra com pulo + brilho/estrelinhas. Palavra **"NÃO"** gigante com **marcador amarelo** riscando por baixo (anima o traço da esquerda p/ direita).
- **Movimento:** swipe (whoosh) → logo spring-in + wiggle; marcador desenha em ~10 frames; estrelinhas pop ao redor.
- **Texto na tela:** `O UaiPertim NÃO é app.`
- **Locução:** "Calma! O UaiPertim não é aplicativo pra baixar."
- **SFX:** whoosh + "pop" mágico + sininho.

### CENA 4 · É só o link — 0:10–0:15
- **Visual:** **barra de navegador** cartoon; o endereço **`uaipertim.com.br` se digita sozinho** (cursor piscando) → **toque** (ripple) → a home **sobe deslizando** dentro de um celular. Ícones de categoria (🍔 🛒 ➕ 🥖 🐾) **pipocam um a um**.
- **Movimento:** digitação char-a-char; ripple no tap; tela faz slide-up com overshoot; ícones em stagger (3–4 frames entre cada) com bounce.
- **Texto na tela:** `É só abrir o link 🔗` → `Sem baixar nada.`
- **Locução:** "É só abrir o link no navegador. Sem instalar, sem ocupar espaço."
- **SFX:** digitação + "tap" + whoosh da tela + "plop plop" dos ícones.

### CENA 5 · A cidade ganha vida — 0:15–0:20
- **Visual:** zoom-out e a **cidadezinha cartoon** se monta: lojinhas coloridas **brotam do chão** (squash&stretch), **pin coral desce quicando**, **coraçõezinhos** sobem flutuando, as categorias **orbitam** o celular.
- **Movimento:** casinhas em stagger (pop de baixo p/ cima); pin dropa com 2 quiques; parallax leve no fundo; coraçõezinhos em loop subindo e sumindo.
- **Texto na tela:** `Tudo da sua cidade, num lugar só.`
- **Locução:** "Todo o comércio da sua cidade, pertim de você."
- **SFX:** "pop" das casinhas + chime alegre.

### CENA 6 · Fecho + CTA — 0:20–0:26
- **Visual:** logo central pulsando devagar. **Sininho** balança soltando ondinhas (ativar lembrete). **Faixa desenrola** com `ESTREIA · SEGUNDA QUINZENA DE AGOSTO`. Confete coral/amarelo. Fecha no slogan.
- **Movimento:** sininho em swing (rotação ±15°) + ondas; faixa desenrola da esquerda; confete cai; slogan entra por último com pop.
- **Texto na tela:** `Segue e ativa o 🔔` → `Tudo pertim de você.`
- **Locução:** "Em agosto a gente chega. Segue e ativa o lembrete, ó!"
- **SFX:** sininho + confete + logo sting (assinatura sonora curtinha).

### END CARD (último ~1s, 756–780)
Logo + **@uaipertim** + `Tudo pertim de você.` (segura estático pra fechar).

---

## 🎵 Áudio
- **Trilha:** pop/folk alegre e saltitante, **120–128 bpm** — ukulele + claps + marimba/sininhos (clima mineiro leve). Sobe nas cenas 1–2, **dá um "respiro" na cena 3** ("calma!"), volta a crescer até o CTA.
- **Narração (locked, ~55 palavras):** voz amigável, calorosa, tom mineiro leve, ritmo de conversa (não locutor sério). TTS natural ou gravada.
- **Mix:** ducking da trilha sob a locução; SFX pontuando cada interação; pico de energia no CTA.

## 🧩 Assets a reaproveitar (já existem no projeto)
- Logo circular UaiPertim · ícones de categoria (burger/carrinho/cruz/pão/patinha) · cidadezinha cartoon · barra de navegador · marcador amarelo · confete/estrelinhas/coraçõezinhos.
> Mesma linguagem servirá de molde pros próximos vídeos ("Vai funcionar assim, ó" e "Qual comércio PRECISA estar aqui?").
