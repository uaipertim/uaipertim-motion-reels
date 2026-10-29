// As variações do Pertim que viram SVG estático (src/personagem/svg/) — e a mesma lista que a conferência compara com o
// arquivo original do Claude Design.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Pertim } from "../../src/personagem/Pertim";
import { BOCAS, EXPRESSOES, POSES, PertimBase } from "../../src/personagem/logica";

export const VARIACOES: Array<[string, PertimBase]> = [
  ...([1, 3] as const).flatMap((v) => (["frente", "tq"] as const).map((view) => [`v${v}-${view}`, { v, view }] as [string, PertimBase])),
  ...EXPRESSOES.map((expr) => [`v1-expressao-${expr}`, { v: 1, expr }] as [string, PertimBase]),
  ...EXPRESSOES.map((expr) => [`v3-expressao-${expr}`, { v: 3, expr }] as [string, PertimBase]),
  ...BOCAS.map((mouth) => [`v1-boca-${mouth}`, { v: 1, mouth, crop: "rosto" }] as [string, PertimBase]),
  ...BOCAS.map((mouth) => [`v3-boca-${mouth}`, { v: 3, mouth, crop: "rosto" }] as [string, PertimBase]),
  ...POSES.map((pose) => [`v1-pose-${pose}`, { v: 1, pose }] as [string, PertimBase]),
  ...(["mochila", "pernas", "corpo", "capacete", "viseira", "olhos", "boca", "bracos"] as const).map((layer) => [`v1-camada-${layer}`, { v: 1, layer, view: layer === "mochila" ? "tq" : "frente" }] as [string, PertimBase]),
];
export const svgDe = (p: PertimBase, altura = 300) => renderToStaticMarkup(<Pertim {...p} altura={altura} />);
(globalThis as unknown as { PERTIM: unknown }).PERTIM = { VARIACOES, svgDe };
