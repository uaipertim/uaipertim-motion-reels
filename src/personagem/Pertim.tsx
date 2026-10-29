import React from "react";
import { BOCAS, Boca, COR, OlhoFinal, PertimBase, PertimVals, Pose, pertimVals } from "./logica";

// O PERTIM em SVG/React, camada por camada, com o desenho e as cores exatas do componente do Claude Design
// (src/personagem/fonte/pertim-personagem.dc.html). Nada foi redesenhado: só reorganizado em componentes por camada
// (sombra, mochila, pernas, corpo, alças, capacete, viseira, rosto = bochechas + olhos + boca, braços, efeitos, moto).
//
// O RIG entra pela prop `rig` (tudo opcional; sem rig, o desenho é o do arquivo):
//   respira  -1..1  respiração/quique leve do corpo (escala vertical a partir do pé do pin; o capacete vai junto)
//   quique   px     deslocamento vertical do personagem (unidades do desenho)
//   piscada  0..1   pálpebra descendo sobre os olhos abertos (1 = fechado)
//   olhar    [x, y] -1..1, para onde as pupilas olham
//   centro   true: o olhar parte da pupila centrada (olhar [0, 0] = olhando para a câmera); sem ele, da pupila da expressão
//   braco    {de, u} troca de pose dos braços: os braços da pose `de` somem e os da pose atual entram (u: 0..1)
//   aceno    graus  o braço direito (o que acena ou o que aponta) girando a partir do ombro
//   capacete graus  o capacete atrasando um pouco no balanço do corpo

export type PertimRig = {
  respira?: number; quique?: number; piscada?: number; olhar?: [number, number]; centro?: boolean;
  braco?: { de: Pose; u: number }; aceno?: number; capacete?: number;
};
export type PertimProps = PertimBase & { altura?: number; rig?: PertimRig; style?: React.CSSProperties };

const T = COR;

// ---------------------------------------------------------------- peças repetidas
const Tenis: React.FC<{ transform: string }> = ({ transform }) => (
  <g transform={transform}>
    <path d="M-11,4 Q-12,-8 0,-8 Q11,-8 15,1 L15,4 Z" fill={T.coral} />
    <path d="M-13,3 H17 Q17,9 12,9 H-9 Q-13,9 -13,3 Z" fill={T.creme} stroke={T.tinta} strokeOpacity={0.2} strokeWidth={1.4} />
    <path d="M1,-5 L6,-0.5" stroke={T.verde} strokeWidth={2.6} strokeLinecap="round" />
  </g>
);
const Luva: React.FC<{ transform: string; dedo?: boolean }> = ({ transform, dedo }) => (
  <g transform={transform}>
    {dedo && <rect x={-3.2} y={4} width={6.4} height={17} rx={3.2} fill={T.coral} />}
    <circle r={10.5} fill={T.coral} />
    <circle cx={-8.5} cy={-1} r={4.6} fill={T.coral} />
    <path d="M7,-7 A10.5,10.5 0 0 1 -4,9.7 A13,13 0 0 0 7,-7 Z" fill={T.coralEscuro} />
    <rect x={-8} y={-15.5} width={16} height={7} rx={3.5} fill={T.creme} />
  </g>
);
const Braco: React.FC<{ d: string; w?: number }> = ({ d, w = 11 }) => <path d={d} stroke={T.laranja} strokeWidth={w} strokeLinecap="round" fill="none" />;
const MarcaPin: React.FC<{ transform: string }> = ({ transform }) => (
  // o pin da logo, pequeno (mochila e sacola)
  <g transform={transform}>
    <circle r={10} fill={T.coral} />
    <rect x={-6.5} y={-7.5} width={13} height={3} rx={1.5} fill={T.creme} />
    <path d="M-4.5,-2.5 V1.5 Q-4.5,6 0,6" stroke={T.creme} strokeWidth={3} fill="none" strokeLinecap="round" />
    <circle cx={3.2} cy={0.5} r={3.4} fill={T.amarelo} />
  </g>
);

// ---------------------------------------------------------------- camadas
export const Sombra: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.sombra ? <ellipse cx={x.sh.cx} cy={x.sh.cy} rx={x.sh.rx} ry={x.sh.ry} fill={T.tinta} opacity={0.13} /> : null;

export const EfeitosTras: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.fx.world ? (
    <g>
      {x.fx.speed && (
        <g stroke={T.tinta} strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round">
          <path d="M4,122 H28" /><path d="M10,146 H34" /><path d="M6,240 H30" />
        </g>
      )}
      {x.fx.runfx && (
        <g>
          <g stroke={T.tinta} strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round">
            <path d="M-14,128 H18" /><path d="M-8,158 H22" /><path d="M-16,196 H10" />
          </g>
          <circle cx={56} cy={262} r={9} fill={T.creme} stroke={T.tinta} strokeOpacity={0.18} strokeWidth={2} />
          <circle cx={38} cy={266} r={6} fill={T.creme} stroke={T.tinta} strokeOpacity={0.18} strokeWidth={2} />
          <circle cx={26} cy={258} r={4} fill={T.creme} stroke={T.tinta} strokeOpacity={0.18} strokeWidth={2} />
        </g>
      )}
    </g>
  ) : null;

export const MotoTras: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.moto ? (
    <g>
      <g stroke={T.tinta} strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round">
        <path d="M-18,156 H12" /><path d="M-22,186 H2" /><path d="M-14,214 H14" />
      </g>
      <circle cx={14} cy={246} r={8} fill={T.creme} stroke={T.tinta} strokeOpacity={0.18} strokeWidth={2} />
      <circle cx={0} cy={238} r={5} fill={T.creme} stroke={T.tinta} strokeOpacity={0.18} strokeWidth={2} />
      {[62, 236].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={256} r={24} fill={T.tinta} /><circle cx={cx} cy={256} r={10} fill={T.creme} /><circle cx={cx} cy={256} r={4} fill={T.tinta} />
        </g>
      ))}
      <path d="M70,204 Q70,190 86,190 L148,190 Q160,190 160,204 Z" fill={T.tinta} />
    </g>
  ) : null;

export const Pernas: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.pernas ? (
    <g>
      {x.g.v1 && (
        <g>
          <path d="M106,222 L103,258" stroke={T.laranja} strokeWidth={12} strokeLinecap="round" fill="none" />
          <path d="M134,222 L137,258" stroke={T.laranja} strokeWidth={12} strokeLinecap="round" fill="none" />
          <Tenis transform="translate(100 266) scale(-1 1)" />
          <Tenis transform="translate(140 266)" />
        </g>
      )}
      {x.g.run && (
        <g>
          <path d="M110,220 Q96,240 82,248" stroke={T.laranja} strokeWidth={12} strokeLinecap="round" fill="none" />
          <path d="M130,220 Q150,232 160,250" stroke={T.laranja} strokeWidth={12} strokeLinecap="round" fill="none" />
          <Tenis transform="translate(76 252) rotate(-24) scale(-1 1)" />
          <Tenis transform="translate(166 258) rotate(10)" />
        </g>
      )}
    </g>
  ) : null;

export const Mochila: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.pack ? (
    <g>
      <path d="M24,82 Q35,68 46,82" stroke={T.coral} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <rect x={8} y={80} width={88} height={134} rx={14} fill={T.creme} />
      <path d="M8,94 Q8,80 22,80 H82 Q96,80 96,94 V100 H8 Z" fill={T.coral} />
      <path d="M8,194 H96 V200 Q96,214 82,214 H22 Q8,214 8,200 Z" fill={T.laranja} fillOpacity={0.25} />
      <MarcaPin transform="translate(30 146) scale(1.15)" />
    </g>
  ) : null;

export const Corpo: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.corpo ? (
    <g>
      <path d="M120,252 C108,232 52,190 50,122 A70,70 0 1 1 190,122 C188,190 132,232 120,252 Z" fill={T.amarelo} stroke={T.amarelo} strokeWidth={8} strokeLinejoin="round" />
      <path d="M173.6,77 A70,70 0 0 1 190,122 C188,190 132,232 120,252 C146,214 170,180 172,122 C172.5,104 171,90 173.6,77 Z" fill={T.laranja} stroke={T.laranja} strokeWidth={8} strokeLinejoin="round" />
    </g>
  ) : null;

const Fivela: React.FC<{ x: number; r: number }> = ({ x, r }) => (
  <>
    <rect x={x - 6.5} y={188.5} width={13} height={10} rx={3} fill={T.creme} stroke={T.coralEscuro} strokeWidth={2.2} transform={`rotate(${r} ${x} 193.5)`} />
    <path d={`M${x - 3},193.5 H${x + 3}`} stroke={T.coralEscuro} strokeWidth={2} strokeLinecap="round" transform={`rotate(${r} ${x} 193.5)`} />
  </>
);
export const Alcas: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.alcas ? (
    <g>
      <g transform={x.strapT}>
        <path d="M56,124 Q60,160 68,190" stroke={T.coral} strokeWidth={8} strokeLinecap="round" fill="none" />
        <Fivela x={69} r={-12} />
      </g>
      {x.d.alcaR && (
        <g>
          <path d="M184,124 Q180,160 172,190" stroke={T.coral} strokeWidth={8} strokeLinecap="round" fill="none" />
          <Fivela x={171} r={12} />
        </g>
      )}
    </g>
  ) : null;

export const Capacete: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.capacete ? (
    <g>
      <path d="M44.3,108 A77,77 0 0 1 195.7,108 Z" fill={T.coral} />
      <path d="M168,62 A77,77 0 0 1 195.7,108 L178,108 C178,92 175,76 168,62 Z" fill={T.coralEscuro} />
      <path d="M84,60 Q102,52 124,51" stroke={T.brilhoCapacete} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M46,100 H194 L195.7,108 H44.3 Z" fill={T.coralEscuro} />
      <g transform={x.brimT}>
        <g fill={T.laranja} fillOpacity={0.5}>
          {[38, 70.8, 103.6, 136.4, 169.2].map((a) => <path key={a} d={`M${a},121 H${+(a + 32.8).toFixed(1)} A16.4,9 0 0 1 ${a},121 Z`} />)}
        </g>
        <path d="M46,104 H75.6 L70.8,116 H38 Z" fill={T.laranja} />
        <path d="M38,116 H70.8 A16.4,9 0 0 1 38,116 Z" fill={T.laranja} />
        <path d="M75.6,104 H105.2 L103.6,116 H70.8 Z" fill={T.branco} />
        <path d="M70.8,116 H103.6 A16.4,9 0 0 1 70.8,116 Z" fill={T.creme} />
        <path d="M105.2,104 H134.8 L136.4,116 H103.6 Z" fill={T.laranja} />
        <path d="M103.6,116 H136.4 A16.4,9 0 0 1 103.6,116 Z" fill={T.laranja} />
        <path d="M134.8,104 H164.4 L169.2,116 H136.4 Z" fill={T.branco} />
        <path d="M136.4,116 H169.2 A16.4,9 0 0 1 136.4,116 Z" fill={T.creme} />
        <path d="M164.4,104 H194 L202,116 H169.2 Z" fill={T.laranja} />
        <path d="M169.2,116 H202 A16.4,9 0 0 1 169.2,116 Z" fill={T.laranja} />
      </g>
    </g>
  ) : null;

export const Viseira: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.viseira ? (
    <g transform={x.visorT}>
      <path d="M56,98 Q60,66 120,62 Q180,66 184,98 Q120,84 56,98 Z" fill={T.branco} fillOpacity={0.42} stroke={T.branco} strokeOpacity={0.95} strokeWidth={2} strokeLinejoin="round" />
      <path d="M72,86 Q84,73 106,69" stroke={T.branco} strokeOpacity={0.9} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M116,67.5 Q124,67 131,67.5" stroke={T.branco} strokeOpacity={0.9} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {[57, 183].map((cx) => (
        <g key={cx}><circle cx={cx} cy={98} r={5.5} fill={T.coralEscuro} /><circle cx={cx} cy={98} r={2.2} fill={T.creme} /></g>
      ))}
    </g>
  ) : null;

// um olho, com a piscada (pálpebra amarela descendo) e o olhar (pupila deslocada) do rig por cima da expressão
const UmOlho: React.FC<{ e: OlhoFinal; piscada: number; olhar: [number, number]; centro?: boolean }> = ({ e, piscada, olhar, centro }) => {
  const px = (centro ? 0 : e.px) + olhar[0] * 4, py = (centro ? 0 : e.py) + olhar[1] * 4;
  // a pálpebra do rig: desce de −22 até cobrir o olho inteiro (+18); a da expressão (curioso, apressado) continua
  const yb = -22 + 41 * Math.max(0, Math.min(1, piscada));
  return (
    <g transform={e.t}>
      {e.open && (
        <g>
          <ellipse rx={15} ry={18} fill={T.branco} stroke={T.tinta} strokeWidth={3.5} />
          <ellipse cx={px} cy={py} rx={8.5} ry={10} fill={T.tinta} />
          <circle cx={px + 3.5} cy={py - 4.2} r={3.4} fill={T.branco} />
          <circle cx={px - 3} cy={py + 4.5} r={1.5} fill={T.branco} />
          {e.lid && (
            <g>
              <path d={e.lidD} fill={T.amarelo} />
              <path d={e.lineD} stroke={T.tinta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
            </g>
          )}
          {piscada > 0.02 && (
            <g>
              <path d={`M-20,-22 H20 V${yb} H-20 Z`} fill={T.amarelo} />
              <path d={`M-14.8,${Math.min(yb, 16)} H14.8`} stroke={T.tinta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>
      )}
      {e.happy && <path d="M-12,4 Q0,-13 12,4" stroke={T.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none" />}
      {e.wink && <path d="M-12,-1 Q0,8 12,-1" stroke={T.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none" />}
    </g>
  );
};

// as bocas: as 5 de fala (repouso, A, E, O, M/B/P) e as das expressões (sorriso, curioso, hmm, grit, smirk)
export const BocaSvg: React.FC<{ k: string }> = ({ k }) => (
  <g strokeLinejoin="round">
    {k === "repouso" && <path d="M108,186 Q120,195 132,186" stroke={T.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none" />}
    {k === "sorriso" && (
      <g>
        <path d="M103,182 Q120,184 137,182 Q135,204 120,204 Q105,204 103,182 Z" fill={T.tinta} stroke={T.tinta} strokeWidth={2} />
        <path d="M110,197 Q120,190 130,197 Q126,204 120,204 Q114,204 110,197 Z" fill={T.coral} />
      </g>
    )}
    {k === "A" && (
      <g>
        <path d="M106,180 Q120,177 134,180 Q137,208 120,209 Q103,208 106,180 Z" fill={T.tinta} stroke={T.tinta} strokeWidth={2} />
        <path d="M110,201 Q120,195 130,201 Q126,209 120,209 Q114,209 110,201 Z" fill={T.coral} />
      </g>
    )}
    {k === "E" && (
      <g>
        <path d="M101,183 Q120,180 139,183 Q136,198 120,198 Q104,198 101,183 Z" fill={T.tinta} stroke={T.tinta} strokeWidth={2} />
        <path d="M104,183.5 Q120,181 136,183.5 L135,188 Q120,186 105,188 Z" fill={T.branco} />
      </g>
    )}
    {k === "O" && (
      <g>
        <ellipse cx={120} cy={190} rx={9} ry={11} fill={T.tinta} />
        <ellipse cx={120} cy={196} rx={5} ry={3.5} fill={T.coral} />
      </g>
    )}
    {k === "MBP" && <path d="M106,189 Q120,186 134,189" stroke={T.tinta} strokeWidth={5} strokeLinecap="round" fill="none" />}
    {k === "curioso" && <ellipse cx={124} cy={189} rx={5} ry={6} fill={T.tinta} />}
    {k === "hmm" && <path d="M108,190 Q114,186 120,189 Q126,192 132,187" stroke={T.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none" />}
    {k === "grit" && (
      <g>
        <path d="M103,182 H137 Q137,198 120,198 Q103,198 103,182 Z" fill={T.tinta} stroke={T.tinta} strokeWidth={2} />
        <path d="M104.5,183 H135.5 V187.5 H104.5 Z" fill={T.branco} />
      </g>
    )}
    {k === "smirk" && <path d="M107,188 Q122,196 134,183" stroke={T.tinta} strokeWidth={4.5} strokeLinecap="round" fill="none" />}
  </g>
);

export const Rosto: React.FC<{ x: PertimVals; piscada?: number; olhar?: [number, number]; centro?: boolean }> = ({ x, piscada = 0, olhar = [0, 0], centro }) => (
  <g transform={x.faceT}>
    {x.d.olhos && (
      <g>
        <ellipse cx={82} cy={176} rx={9} ry={6.5} fill={T.coral} opacity={x.cheek} />
        <ellipse cx={158} cy={176} rx={9} ry={6.5} fill={T.coral} opacity={x.cheek} />
        <UmOlho e={x.eL} piscada={piscada} olhar={olhar} centro={centro} />
        <UmOlho e={x.eR} piscada={piscada} olhar={olhar} centro={centro} />
      </g>
    )}
    {x.d.boca && <BocaSvg k={x.boca} />}
  </g>
);

// os braços de cada pose (a mão do aceno pode balançar a partir do ombro: `aceno`, em graus)
export const Bracos: React.FC<{ x: PertimVals; aceno?: number }> = ({ x, aceno = 0 }) =>
  x.d.bracos ? (
    <g>
      {x.a.l1 && (<g><Braco d="M60,176 Q45,186 41,199" /><Luva transform="translate(39 207) rotate(18)" /></g>)}
      {x.a.lBag && (
        <g>
          <path d="M38,228 Q46,198 58,228" stroke={T.coralEscuro} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <path d="M26,226 H70 L66,268 Q66,272 62,272 H34 Q30,272 30,268 Z" fill={T.coral} />
          <path d="M56,226 H70 L66,268 Q66,272 62,272 H54 Z" fill={T.coralEscuro} />
          <rect x={26} y={223} width={44} height={7} rx={3.5} fill={T.coralEscuro} />
          <path d="M58,224 Q54,210 64,205 Q66,217 61,224 Z" fill={T.verde} />
          <circle cx={46} cy={250} r={11} fill={T.creme} />
          <MarcaPin transform="translate(46 250) scale(0.8)" />
          <Braco d="M60,176 Q50,190 48,204" />
          <Luva transform="translate(47 212) rotate(6)" />
        </g>
      )}
      {x.a.lUp && (<g><Braco d="M60,166 Q42,142 38,118" /><Luva transform="translate(37 109) rotate(172)" /></g>)}
      {x.a.lBack && (<g><Braco d="M60,176 Q44,184 34,176" /><Luva transform="translate(27 170) rotate(128)" /></g>)}
      {x.a.r1 && (<g><Braco d="M180,176 Q195,186 199,199" /><Luva transform="translate(201 207) scale(-1 1) rotate(18)" /></g>)}
      {x.a.rWave && (
        <g transform={`rotate(${aceno} 180 168)`}>
          <Braco d="M180,168 Q201,152 205,128" />
          <Luva transform="translate(207 118) rotate(-166)" />
          <g stroke={T.tinta} strokeOpacity={0.3} strokeWidth={3.5} strokeLinecap="round" fill="none">
            <path d="M224,102 Q231,114 226,126" /><path d="M234,96 Q243,114 236,132" />
          </g>
        </g>
      )}
      {x.a.rPoint && (<g transform={`rotate(${aceno} 180 172)`}><Braco d="M180,172 Q203,171 218,165" /><Luva transform="translate(227 162) rotate(-100)" dedo /></g>)}
      {x.a.rUp && (<g><Braco d="M180,166 Q198,142 202,118" /><Luva transform="translate(203 109) scale(-1 1) rotate(172)" /></g>)}
      {x.a.rFwd && (<g><Braco d="M180,172 Q198,174 207,161" /><Luva transform="translate(212 153) rotate(-146)" /></g>)}
      {x.a.v3 && (<g><Luva transform="translate(28 186) rotate(72)" /><Luva transform="translate(212 186) scale(-1 1) rotate(72)" /></g>)}
    </g>
  ) : null;

export const EfeitosRosto: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.fx.local ? (
    <g>
      {x.fx.dots && (<g fill={T.tinta} fillOpacity={0.22}><circle cx={46} cy={66} r={3.5} /><circle cx={35} cy={51} r={5.5} /><circle cx={26} cy={32} r={8} /></g>)}
      {x.fx.sweat && <path d="M200,130 Q209,142 205,149 Q200,154 195,149 Q191,142 200,130 Z" fill={T.branco} stroke={T.tinta} strokeWidth={2.5} strokeLinejoin="round" />}
      {x.fx.spark && <path d="M206,140 Q208,150 218,152 Q208,154 206,164 Q204,154 194,152 Q204,150 206,140 Z" fill={T.coral} />}
    </g>
  ) : null;

export const MotoFrente: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.d.moto ? (
    <g>
      <path d="M26,234 Q24,206 60,202 L150,202 Q168,202 174,218 L180,236 L196,236 L196,248 L40,248 Q26,248 26,234 Z" fill={T.coral} />
      <path d="M27,240 H196 V248 H40 Q30,248 27,240 Z" fill={T.coralEscuro} />
      <path d="M60,214 H140" stroke={T.creme} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
      <rect x={23} y={210} width={9} height={12} rx={3} fill={T.amarelo} />
      <path d="M134,192 Q164,194 178,228" stroke={T.laranja} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Tenis transform="translate(184 234)" />
      <path d="M188,248 L194,190 Q196,162 214,158 L222,158 Q232,192 248,230 Q252,248 236,248 Z" fill={T.coral} />
      <path d="M222,158 Q232,192 248,230 Q252,248 236,248 L230,248 Q240,238 236,224 Q224,192 216,160 Z" fill={T.coralEscuro} />
      <ellipse cx={226} cy={188} rx={5} ry={8} fill={T.amarelo} />
      <path d="M214,160 L208,140" stroke={T.tinta} strokeWidth={6} strokeLinecap="round" />
      <path d="M194,136 L222,140" stroke={T.tinta} strokeWidth={7} strokeLinecap="round" />
      <path d="M154,150 Q178,162 192,144" stroke={T.laranja} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Luva transform="translate(197 137) rotate(-143)" />
    </g>
  ) : null;

export const Confete: React.FC<{ x: PertimVals }> = ({ x }) =>
  x.fx.world && x.fx.confetti ? (
    <g>
      <rect x={14} y={44} width={8} height={15} rx={2.5} fill={T.coral} transform="rotate(-25 18 51)" />
      <rect x={214} y={38} width={8} height={15} rx={2.5} fill={T.verde} transform="rotate(28 218 45)" />
      <rect x={56} y={18} width={7} height={13} rx={2.5} fill={T.laranja} transform="rotate(14 59 24)" />
      <rect x={176} y={12} width={7} height={13} rx={2.5} fill={T.coral} transform="rotate(-18 179 18)" />
      <circle cx={0} cy={96} r={4.5} fill={T.verde} />
      <circle cx={240} cy={92} r={5} fill={T.laranja} />
      <circle cx={120} cy={12} r={4} fill={T.verde} />
    </g>
  ) : null;

// ---------------------------------------------------------------- o personagem montado
export const Pertim: React.FC<PertimProps> = ({ altura = 300, rig = {}, style, ...base }) => {
  const x = pertimVals(base);
  const [vx, vy, vw, vh] = x.vb;
  const largura = Math.round((altura * vw) / vh);
  const respira = rig.respira ?? 0;
  // a respiração: o pin estica/encolhe um tiquinho a partir do pé (120, 252); o capacete e o rosto vão junto
  const corpoT = respira ? `translate(120 252) scale(${1 - respira * 0.006} ${1 + respira * 0.014}) translate(-120 -252)` : "";
  const capT = rig.capacete ? `rotate(${rig.capacete} 120 108)` : "";
  const charT = `${x.charT} ${rig.quique ? `translate(0 ${rig.quique})` : ""}`.trim();
  // a troca de pose dos braços: os da pose anterior saem e os da atual entram (só os braços; o resto já é o da pose atual)
  const de = rig.braco && rig.braco.u < 1 ? pertimVals({ ...base, pose: rig.braco.de }) : null;
  const u = rig.braco ? Math.max(0, Math.min(1, rig.braco.u)) : 1;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${vx} ${vy} ${vw} ${vh}`} width={largura} height={altura} role="img" aria-label={x.label} style={{ display: "block", overflow: "visible", ...style }}>
      <Sombra x={x} />
      <g transform={charT}>
        <EfeitosTras x={x} />
        <MotoTras x={x} />
        <Pernas x={x} />
        <g transform={x.pinT}>
          <g transform={corpoT}>
            <Mochila x={x} />
            <Corpo x={x} />
            <Alcas x={x} />
            <g transform={capT}>
              <Capacete x={x} />
              <Viseira x={x} />
            </g>
            <Rosto x={x} piscada={rig.piscada} olhar={rig.olhar} centro={rig.centro} />
            {de && <g opacity={1 - u}><Bracos x={de} /></g>}
            <g opacity={u}><Bracos x={x} aceno={rig.aceno} /></g>
            <EfeitosRosto x={x} />
          </g>
        </g>
        <MotoFrente x={x} />
      </g>
      <Confete x={x} />
    </svg>
  );
};

export { BOCAS };
export type { Boca };
