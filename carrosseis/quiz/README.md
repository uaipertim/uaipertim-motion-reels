# Carrossel animado "Quiz" (Instagram @uaipertim)

Teste de formato: carrossel em que cada lâmina é um vídeo curto em loop. O primeiro é o
**#01 "Você é mineiro raiz?"** (sáb 21/11, 12h), em [`out/carrosseis/quiz/01-voce-e-mineiro-raiz/`](../../out/carrosseis/quiz/01-voce-e-mineiro-raiz).

## Formato

- 8 lâminas MP4: H.264 (yuv420p), 1080 × 1440 (3:4), 30 fps, **sem áudio** (a música entra pelo app).
- Capa 6 s · perguntas 7 s · resultado 8 s.
- **Loop:** o Instagram repete o vídeo da lâmina. Por isso toda animação é periódica na duração da lâmina:
  - os raios giram 20° por lâmina, que é exatamente um raio;
  - os brilhos, a respiração e a fumaça do café fecham ciclos inteiros;
  - na pergunta, o envelope da resposta volta a 0 entre 6,2 e 6,9 s;
  - resultado: o quadro final emenda no quadro 0.
- **Lâmina 1 = capa da grade:** o quadro 0 já é a capa inteira, sem entrada. `capa-3x4.png` é esse quadro.
- **Margem:** todo o conteúdo em x 135–945, a mesma regra das capas da Coisa de mineiro.
- **Plano B:** `lamina-N.png` é a versão estática de cada lâmina.
  - capa: o quadro 0;
  - perguntas: o quadro 138 (4,6 s), com a resposta acesa;
  - resultado: o quadro 0.

  O último quadro do vídeo é igual ao primeiro (é o loop), então ele não serve como estático da pergunta.

## Identidade

- Fundo creme com raios amarelos e brilhinhos, como nas capas da grade.
- Selo em pílula coral "QUIZ · **MINEIRO RAIZ**" (a 2ª parte em amarelo) com o ícone do balão "?".
- Títulos em Poppins 900 tinta, com a palavra-chave em coral sobre o marcador amarelo (`*palavra*` no JSON).
  - Uma chave de várias palavras ("*ir embora*") fica inteira numa linha, sob um marcador só.
  - `quebra` (opcional, na pergunta) fixa as linhas do título; sem ela, o título quebra sozinho em até 3 linhas.
- O Pertim é o do rig oficial (`src/personagem`), sem redesenho. Ele olha para a câmera e nunca aparece bravo.
  - capa: "curioso", com a prancheta e a lupa desenhadas por trás da luva;
  - perguntas: "sorrindo" e, na resposta, "piscadinha" com a reação (`comemora` = braços para cima com pulinho e
    confete; `aponta` = aponta para a resposta);
  - resultado: comemorando.
- **Troca de pose sem pulo:** o viewBox do componente muda com a pose, então tudo usa o sistema das poses de braço
  (`PertimFixo`). A troca de expressão na volta acontece no meio de uma piscada.
- Rodapé do resultado: a logo redonda sem fundo (`public/pedir-no-uaipertim/logo/logo-selo-transparente.png`) e
  "Tudo pertim de você".

## A pergunta (lâminas 2–7)

| tempo | o que acontece |
|---|---|
| 0–2,5 s | pergunta + cartões A e B neutros; a barrinha "Qual é a raiz?" enche |
| 2,5 s | a resposta raiz (B) acende: borda e check verdes, pulinho, estrelinhas; A esmaece (cinza, 45%); o Pertim reage e o balão com a fala dele entra |
| 2,5–6,2 s | resposta acesa |
| 6,2–6,9 s | tudo volta suave ao estado do quadro 0 |
| 6,9–7,0 s | igual ao quadro 0 (emenda do loop) |

## Arquivos

```
carrosseis/quiz/NN-tema.json     os textos (selo, capa, perguntas com a reação e a fala do Pertim, resultado)
src/quiz/QuizMineiro.tsx         a composição QuizMineiro (uma lâmina por render: --props {"lamina": 0..N-1})
scripts/quiz.mjs                 node scripts/quiz.mjs 01            → lamina-*.mp4, lamina-*.png, capa-3x4.png
                                 node scripts/quiz.mjs 01 quadros <lâmina> <quadro…>   → revisao/quadros/
                                 node scripts/quiz.mjs 01 mascara    → revisao/mascara/ (sem fundo, para o QA)
                                 node scripts/quiz.mjs 01 loop       → revisao/loop/ (quadros D-1, 0 e 1 em PNG, para o QA)
scripts/quiz_qa.py               python3 scripts/quiz_qa.py 01       → revisao/relatorio-tecnico.txt + previa.png
```

O QA confere:

- formato, duração e ausência de áudio;
- loop: a diferença último→primeiro quadro no MP4 não passa da maior diferença entre quadros seguidos. Sem
  compressão (PNG), a emenda D-1→0 é um passo como 0→1;
- o quadro 0 da lâmina 1 é igual à `capa-3x4.png`;
- cada PNG é igual ao quadro dele no vídeo;
- pela máscara, o conteúdo fica em x 135–945.

Os textos são texto normal (CSS ou o `Text` dos carrosséis), sem layout palavra a palavra, então o espaço entre as
palavras fica preservado.
