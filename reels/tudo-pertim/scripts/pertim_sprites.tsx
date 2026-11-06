// Os quadros do PERTIM (o personagem oficial, src/personagem — V1) para o motor do Tudo Pertim, que desenha em canvas.
// Tudo sai do próprio componente <Pertim> com o rig dele (piscada, olhar, aceno): nada é redesenhado.
// A única montagem própria é a MOTO ESTACIONADA (depois que ele desce no CHEGOU): os mesmos caminhos e cores da moto do
// arquivo (MotoTras/MotoFrente), só sem as pernas, o tênis e a luva do piloto e sem o rastro de velocidade.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Pertim, Sombra } from "../../../src/personagem/Pertim";
import { COR, PertimBase, pertimVals } from "../../../src/personagem/logica";

type Quadro = { nome: string; svg: string; vb: number[]; chao: [number, number] };
const ALTURA = 800;
const chaoDe = (p: PertimBase): [number, number] => (p.pose === "moto" ? [150, 284] : [120, 276]);   // o centro da sombra no desenho
const quadro = (nome: string, p: PertimBase, rig: Record<string, unknown> = {}): Quadro => ({
  nome, svg: renderToStaticMarkup(<Pertim {...p} altura={ALTURA} rig={rig} />), vb: pertimVals(p).vb, chao: chaoDe(p),
});

const T = COR;
const MotoEstacionada: React.FC = () => {
  const x = pertimVals({ v: 1, pose: "moto" });
  const [vx, vy, vw, vh] = x.vb;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${vx} ${vy} ${vw} ${vh}`} width={Math.round((ALTURA * vw) / vh)} height={ALTURA}>
      <Sombra x={x} />
      {[62, 236].map((cx) => (
        <g key={cx}><circle cx={cx} cy={256} r={24} fill={T.tinta} /><circle cx={cx} cy={256} r={10} fill={T.creme} /><circle cx={cx} cy={256} r={4} fill={T.tinta} /></g>
      ))}
      <path d="M70,204 Q70,190 86,190 L148,190 Q160,190 160,204 Z" fill={T.tinta} />
      <path d="M26,234 Q24,206 60,202 L150,202 Q168,202 174,218 L180,236 L196,236 L196,248 L40,248 Q26,248 26,234 Z" fill={T.coral} />
      <path d="M27,240 H196 V248 H40 Q30,248 27,240 Z" fill={T.coralEscuro} />
      <path d="M60,214 H140" stroke={T.creme} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
      <rect x={23} y={210} width={9} height={12} rx={3} fill={T.amarelo} />
      <path d="M188,248 L194,190 Q196,162 214,158 L222,158 Q232,192 248,230 Q252,248 236,248 Z" fill={T.coral} />
      <path d="M222,158 Q232,192 248,230 Q252,248 236,248 L230,248 Q240,238 236,224 Q224,192 216,160 Z" fill={T.coralEscuro} />
      <ellipse cx={226} cy={188} rx={5} ry={8} fill={T.amarelo} />
      <path d="M214,160 L208,140" stroke={T.tinta} strokeWidth={6} strokeLinecap="round" />
      <path d="M194,136 L222,140" stroke={T.tinta} strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
};

const PISCA = [0, 0.5, 1];
const ACENO = [-24, -12, 0, 12, 24];
const QUADROS: Quadro[] = [];
// pilotando a moto (vista de três quartos, olhando para a câmera)
for (const pc of PISCA) QUADROS.push(quadro(`moto-p${pc * 10}`, { v: 1, pose: "moto", expr: "sorrindo" }, { piscada: pc, centro: true, olhar: [0, 0] }));
// em pé, de frente, com a sacola da marca na mão (a entrega)
for (const pc of PISCA) QUADROS.push(quadro(`sacola-p${pc * 10}`, { v: 1, pose: "sacola", expr: "sorrindo" }, { piscada: pc, centro: true, olhar: [0, 0] }));
// acenando, sorrindo (o braço gira no ombro: aceno em graus)
for (const a of ACENO) for (const pc of PISCA) QUADROS.push(quadro(`acena-a${a}-p${pc * 10}`, { v: 1, pose: "acenando", expr: "sorrindo" }, { piscada: pc, centro: true, olhar: [0, 0], aceno: a }));
// acenando com a piscadinha (o fecho)
for (const a of ACENO) QUADROS.push(quadro(`pisca-a${a}`, { v: 1, pose: "acenando", expr: "piscadinha" }, { aceno: a }));
// alegre (olhos fechados de felicidade), acenando — a comemoração
for (const a of ACENO) QUADROS.push(quadro(`alegre-a${a}`, { v: 1, pose: "acenando", expr: "alegre" }, { aceno: a }));
// em pé, parado (braços ao lado), olhando para a câmera — e com a piscadinha (o EP. 07: entrega o bolo e pisca)
for (const pc of PISCA) QUADROS.push(quadro(`parado-p${pc * 10}`, { v: 1, pose: "parado", expr: "sorrindo" }, { piscada: pc, centro: true, olhar: [0, 0] }));
QUADROS.push(quadro("parado-pisca", { v: 1, pose: "parado", expr: "piscadinha" }));
const mv = pertimVals({ v: 1, pose: "moto" }).vb;
QUADROS.push({ nome: "moto-estacionada", svg: renderToStaticMarkup(<MotoEstacionada />), vb: mv, chao: [150, 284] });

(globalThis as unknown as { PERTIM_Q: unknown }).PERTIM_Q = { QUADROS, ALTURA };
