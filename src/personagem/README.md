# Pertim — o personagem oficial no motor

O desenho é o do Claude Design (`fonte/pertim-personagem.dc.html`, referência aprovada em `fonte/pertim-referencia.jpg`).
Nada foi redesenhado: as camadas, os caminhos e as cores são os do arquivo, só reorganizados em React/SVG.

| arquivo | o que é |
|---|---|
| `logica.ts` | a lógica de variações do componente original (`renderVals`), em TypeScript: versão (V1/V3), vista (frente/tq), expressão, boca, pose, recorte e camada → os valores de cada camada. Cores exatas em `COR`. |
| `Pertim.tsx` | o componente `<Pertim>` em camadas (sombra, moto, pernas, mochila, corpo, alças, capacete, viseira, rosto, boca, braços, efeitos) com o `rig` opcional. |
| `rig.ts` | o rig, funções puras do tempo: `bocaNoQuadro` (visemas), `piscadaEm`, `respiracao`, `trocaDePose`. |
| `svg/` | as 45 variações em SVG estático (versões × vistas, expressões, as 5 bocas, as poses, as camadas soltas) + `conferencia.txt`. |

## Uso

```tsx
<Pertim v={1} pose="acenando" expr="piscadinha" mouth="A" altura={600}
        rig={{ respira, capacete, quique, piscada, olhar: [x, y], aceno, braco: { de: "sacola", u } }} />
```

- **Respiração/quique:** `respira` (−1..1) escala o corpo em torno do pé; o capacete vai junto com um tiquinho de atraso (`capacete`, em graus).
- **Piscada:** `piscada` 0..1 fecha as pálpebras. O Reel sorteia as piscadas a cada 2–4 s e nunca as põe com a boca aberta (A/O).
- **Olhar:** `olhar` [x, y] em −1..1 move as pupilas para onde a cena manda.
- **Braços:** `braco: { de, u }` faz a transição curta entre as poses: os braços da pose anterior somem enquanto os novos entram. `aceno` gira o braço que acena ou aponta, em graus.
- **Boca:** `mouth` = `repouso | A | E | O | MBP`, ou `auto` para usar a boca da expressão. A boca da fala vem dos visemas do alinhamento da voz (ver `reels/prazer-pertim/scripts/preparar.py`):
  - vogal aberta → A; "e/i" → E; "o/u" → O; "m/b/p" → M/B/P; pausa → repouso;
  - as outras consoantes pegam a forma da vogal seguinte;
  - nenhuma boca fica menos de 2 quadros.

## Conferência do desenho

`npm run personagem:exportar` regrava os SVGs e, com `--conferir`, rasteriza cada variação no Chromium duas vezes: uma pelo componente React e outra pelo próprio script do `.dc.html`. Resultado atual: **0,000 % de pixels diferentes nas 45 variações** (`svg/conferencia.txt`).

As camadas exclusivas da V2 do arquivo original não entraram, porque as propriedades do componente só oferecem V1 e V3.
