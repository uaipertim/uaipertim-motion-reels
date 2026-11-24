import React from "react";
import { C, FONT, W } from "../config/theme";

// As ilustrações próprias do Reel "Seja entregador parceiro" (SVG, no traço das lojinhas e do Pertim): a rua do Glória
// (casinhas, igrejinha, placa), a bike e o carro com o entregador (pessoas sem rosto, como os avatares da marca), o
// interruptor "Ficar disponível", o relógio, a sacola, o balcão, a casinha do cliente, as fichas e o escudo.

const TINTA = C.tinta;

// ---------------------------------------------------------------- a rua do Glória
// casinha mineira (parede caiada, janelas e porta coloridas, telhado de telha), em coordenadas de 160 × 200
export const Casinha: React.FC<{ x: number; base: number; w: number; parede?: string; janela?: string; telhado?: string; andares?: 1 | 2 }> = ({
  x, base, w, parede = "#FFF7EA", janela = C.verde, telhado = "#D2693B", andares = 1,
}) => {
  const h = andares === 2 ? 200 : 140, k = w / 160;
  return (
    <g transform={`translate(${x} ${base - h * k}) scale(${k})`}>
      <rect x="6" y="34" width="148" height={h - 34} fill={parede} />
      <rect x="6" y={h - 12} width="148" height="12" fill="#E8D9C2" />
      <path d={`M-6 40 L80 4 L166 40 Z`} fill={telhado} />
      <path d="M-6 40 H166" stroke="#A9512B" strokeWidth="6" />
      {andares === 2 && [26, 70, 114].map((jx) => (
        <g key={jx}><rect x={jx} y="58" width="22" height="34" rx="3" fill={janela} /><rect x={jx - 3} y="92" width="28" height="5" fill="#E8D9C2" /></g>
      ))}
      <rect x="20" y={h - 78} width="30" height="40" rx="4" fill={janela} />
      <rect x="110" y={h - 78} width="30" height="40" rx="4" fill={janela} />
      <path d={`M20 ${h - 58} H50 M35 ${h - 78} V${h - 38} M110 ${h - 58} H140 M125 ${h - 78} V${h - 38}`} stroke={parede} strokeWidth="3" />
      <rect x="62" y={h - 82} width="36" height="70" rx="5" fill={janela} />
      <circle cx="90" cy={h - 46} r="3" fill={C.amarelo} />
    </g>
  );
};

// a igrejinha (torre com sino) ao fundo
export const Igrejinha: React.FC<{ x: number; base: number; w: number }> = ({ x, base, w }) => {
  const k = w / 180;
  return (
    <g transform={`translate(${x} ${base - 300 * k}) scale(${k})`}>
      <rect x="60" y="20" width="60" height="150" fill="#FFF7EA" />
      <path d="M52 26 L90 -14 L128 26 Z" fill="#3E7FB8" />
      <path d="M90 -14 V-46 M78 -32 H102" stroke="#8A6A3A" strokeWidth="6" strokeLinecap="round" />
      <path d="M78 74 Q90 52 102 74 V96 H78 Z" fill="#3E7FB8" />
      <circle cx="90" cy="84" r="7" fill={C.amarelo} />
      <rect x="0" y="130" width="180" height="170" fill="#FFF7EA" />
      <path d="M-8 136 L90 96 L188 136 Z" fill="#3E7FB8" />
      <path d="M68 300 V226 Q90 196 112 226 V300 Z" fill="#3E7FB8" />
      {[24, 136].map((jx) => <path key={jx} d={`M${jx} 210 Q${jx + 10} 194 ${jx + 20} 210 V246 H${jx} Z`} fill="#3E7FB8" />)}
      <rect x="0" y="288" width="180" height="12" fill="#E8D9C2" />
    </g>
  );
};

// a placa verde de rua com o nome da cidade
export const PlacaGloria: React.FC<{ w: number; pulo?: number }> = ({ w, pulo = 0 }) => {
  const k = w / 260;
  return (
    <svg width={w} height={330 * k} viewBox="0 0 260 330" style={{ overflow: "visible" }}>
      <rect x="122" y="120" width="16" height="210" rx="6" fill="#8C8C8C" />
      <g transform={`translate(130 120) rotate(${-4 * pulo}) scale(${1 + 0.1 * pulo}) translate(-130 -120)`}>
        <rect x="0" y="0" width="260" height="128" rx="18" fill={C.verdeDark} transform="translate(0 7)" />
        <rect x="0" y="0" width="260" height="128" rx="18" fill={C.verde} />
        <rect x="9" y="9" width="242" height="110" rx="12" fill="none" stroke="#fff" strokeWidth="5" />
        <text x="130" y="48" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize="22" fill="#fff" letterSpacing="0.5">São João Batista do</text>
        <text x="130" y="100" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="50" fill="#fff" letterSpacing="-1">Glória</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- os veículos (vão para a direita)
const Roda: React.FC<{ cx: number; cy: number; r: number; giro: number; aro?: string }> = ({ cx, cy, r, giro, aro = C.cremeDark }) => (
  <g transform={`rotate(${giro} ${cx} ${cy})`}>
    <circle cx={cx} cy={cy} r={r} fill={TINTA} />
    <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={aro} strokeWidth={r * 0.12} />
    <path d={`M${cx - r * 0.6} ${cy} H${cx + r * 0.6} M${cx} ${cy - r * 0.6} V${cy + r * 0.6}`} stroke={aro} strokeWidth={r * 0.09} />
    <circle cx={cx} cy={cy} r={r * 0.16} fill={aro} />
  </g>
);

// a bike com cestinha e o entregador (sem rosto, capacete verde); coordenadas de 250 × 250, base em y 246
export const Bike: React.FC<{ w: number; giro: number; pedal: number }> = ({ w, giro, pedal }) => {
  const k = w / 250;
  const px = 118 + 16 * Math.cos(pedal), py = 196 + 16 * Math.sin(pedal);
  const qx = 118 - 16 * Math.cos(pedal), qy = 196 - 16 * Math.sin(pedal);
  return (
    <svg width={w} height={250 * k} viewBox="0 0 250 250" style={{ overflow: "visible" }}>
      <ellipse cx="125" cy="246" rx="112" ry="7" fill="#000" opacity="0.14" />
      {/* a perna de trás */}
      <path d={`M104 128 L${qx - 6} ${qy - 30} L${qx} ${qy}`} stroke="#2F5E8A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Roda cx={52} cy={202} r={42} giro={giro} />
      <Roda cx={198} cy={202} r={42} giro={giro} />
      <path d="M52 202 L118 196 L176 132 L96 132 Z M96 132 L118 196 M176 132 L198 202 M88 118 H112" stroke={C.verde} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <path d="M176 132 L168 104 M160 104 H182" stroke={TINTA} strokeWidth="7" strokeLinecap="round" />
      {/* a cestinha com a caixinha da entrega */}
      <rect x="182" y="96" width="50" height="34" rx="6" fill={C.amarelo} />
      <path d="M182 108 H232" stroke={C.amareloDark} strokeWidth="4" />
      <circle cx="207" cy="118" r="6" fill={C.coral} />
      <path d="M180 130 H234 L228 150 H186 Z" fill="#C98A4B" />
      {/* o entregador */}
      <path d="M100 126 Q112 76 146 72" stroke="#3A9AD9" strokeWidth="30" strokeLinecap="round" fill="none" />
      <path d="M140 84 L168 104" stroke="#3A9AD9" strokeWidth="11" strokeLinecap="round" />
      <circle cx="170" cy="104" r="7" fill="#C98A5B" />
      <circle cx="152" cy="50" r="22" fill="#C98A5B" />
      <path d="M128 50 A24 24 0 0 1 176 46 L178 54 H128 Z" fill={C.verde} />
      <path d="M170 50 H186" stroke={C.verde} strokeWidth="6" strokeLinecap="round" />
      {/* a perna da frente */}
      <path d={`M104 128 L${px - 4} ${py - 32} L${px} ${py}`} stroke="#2F5E8A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="118" cy="196" r="7" fill={TINTA} />
    </svg>
  );
};

// o carrinho (hatch amarelo) com a motorista sem rosto e o pin da marca na porta; coordenadas de 320 × 200, base em y 196
export const Carro: React.FC<{ w: number; giro: number; balanco?: number }> = ({ w, giro, balanco = 0 }) => {
  const k = w / 320;
  return (
    <svg width={w} height={200 * k} viewBox="0 0 320 200" style={{ overflow: "visible" }}>
      <ellipse cx="160" cy="196" rx="150" ry="7" fill="#000" opacity="0.14" />
      <g transform={`translate(0 ${balanco})`}>
        <path d="M14 150 Q10 112 44 104 L92 96 L130 46 Q140 34 158 34 H232 Q252 34 262 52 L290 104 Q312 110 312 140 V156 Q312 166 302 166 H24 Q14 166 14 150 Z" fill={C.amarelo} />
        <path d="M14 140 H312 V156 Q312 166 302 166 H24 Q14 166 14 156 Z" fill={C.amareloDark} />
        <path d="M108 98 L140 54 Q146 46 156 46 H196 V98 Z" fill="#BFE3F2" />
        <path d="M206 46 H230 Q244 46 250 58 L272 98 H206 Z" fill="#BFE3F2" />
        {/* a motorista (de perfil, sem rosto) */}
        <circle cx="232" cy="72" r="15" fill="#8A5A3B" />
        <path d="M216 70 A16 16 0 0 1 248 66 Q246 56 232 54 Q214 56 216 70 Z" fill="#3A2A20" />
        <path d="M214 98 Q218 84 232 84 Q246 84 250 98 Z" fill={C.coral} />
        <path d="M200 46 V140" stroke={C.amareloDark} strokeWidth="4" />
        <circle cx="160" cy="118" r="17" fill="#fff" />
        <path d="M160 132 C160 132 150 121 150 115 A10 10 0 0 1 170 115 C170 121 160 132 160 132 Z" fill={C.coral} />
        <circle cx="160" cy="115" r="3.6" fill="#fff" />
        <rect x="292" y="112" width="18" height="12" rx="5" fill="#FFF3C4" />
        <rect x="14" y="116" width="12" height="14" rx="4" fill={C.coral} />
      </g>
      <Roda cx={78} cy={164} r={32} giro={giro} />
      <Roda cx={252} cy={164} r={32} giro={giro} />
    </svg>
  );
};

// ---------------------------------------------------------------- o interruptor "Ficar disponível"
export const Interruptor: React.FC<{ w: number; liga: number }> = ({ w, liga }) => {
  // liga 0..1: a bolinha corre e o trilho fica verde
  const h = w * 0.54, r = h / 2, u = Math.max(0, Math.min(1, liga));
  const cor = u > 0.5 ? C.verde : "#CFC4B6";
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: r, background: cor, boxShadow: `inset 0 ${h * 0.08}px 0 rgba(0,0,0,0.12), 0 ${h * 0.07}px 0 ${u > 0.5 ? C.verdeDark : "#B5A897"}` }} />
      <div style={{ position: "absolute", left: h * 0.08 + (w - h) * u, top: h * 0.08, width: h * 0.84, height: h * 0.84, borderRadius: "50%", background: "#fff",
        boxShadow: "0 6px 12px rgba(34,28,25,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {u > 0.5 && (
          <svg width={h * 0.5} height={h * 0.5} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke={C.verde} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        )}
      </div>
    </div>
  );
};

// o relógio (ponteiros girando) com o solzinho e a lua: a qualquer hora
export const Relogio: React.FC<{ s: number; giro: number }> = ({ s, giro }) => (
  <svg width={s} height={s} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
    <circle r="54" fill={C.coral} />
    <circle r="46" fill="#fff" />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d="M0 -40 V-34" stroke={TINTA} strokeWidth={i % 3 ? 2.5 : 4.5} strokeLinecap="round" transform={`rotate(${i * 30})`} />
    ))}
    <path d="M0 0 V-24" stroke={TINTA} strokeWidth="6" strokeLinecap="round" transform={`rotate(${giro / 12})`} />
    <path d="M0 0 V-34" stroke={C.coral} strokeWidth="4" strokeLinecap="round" transform={`rotate(${giro})`} />
    <circle r="5" fill={TINTA} />
  </svg>
);
export const Sol: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-30 -30 60 60">
    {Array.from({ length: 8 }).map((_, i) => <path key={i} d="M0 -27 V-19" stroke={C.amarelo} strokeWidth="5" strokeLinecap="round" transform={`rotate(${i * 45})`} />)}
    <circle r="14" fill={C.amarelo} />
  </svg>
);
export const Lua: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-30 -30 60 60">
    <path d="M8 -24 A24 24 0 1 0 22 10 A19 19 0 1 1 8 -24 Z" fill="#6A7BC4" />
    <circle cx="16" cy="-14" r="2.5" fill={C.amarelo} /><circle cx="22" cy="-2" r="1.8" fill={C.amarelo} />
  </svg>
);

// ---------------------------------------------------------------- a coleta
// a sacola de papel coral com o pin da marca (coordenadas de 100 × 120, base em y 118)
export const Sacola: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 1.2} viewBox="0 0 100 120" style={{ overflow: "visible" }}>
    <path d="M34 30 Q34 8 50 8 Q66 8 66 30" stroke={C.coralDark} strokeWidth="6" fill="none" />
    <path d="M14 30 H86 L80 112 Q79 118 72 118 H28 Q21 118 20 112 Z" fill={C.coral} />
    <path d="M14 30 H86 L84 44 H16 Z" fill={C.coralDark} opacity="0.5" />
    <circle cx="50" cy="76" r="17" fill="#fff" />
    <path d="M50 90 C50 90 40 79 40 73 A10 10 0 0 1 60 73 C60 79 50 90 50 90 Z" fill={C.coral} />
    <circle cx="50" cy="73" r="3.6" fill="#fff" />
  </svg>
);

// o balcão de madeira da lojinha (coordenadas de 300 × 120)
export const Balcao: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.4} viewBox="0 0 300 120">
    <rect x="0" y="0" width="300" height="22" rx="8" fill="#B87B44" />
    <rect x="12" y="20" width="276" height="100" fill="#D59A5E" />
    {[60, 150, 240].map((x) => <rect key={x} x={x - 34} y="38" width="68" height="64" rx="8" fill="#C2854B" />)}
  </svg>
);

// a casinha do cliente (porta que abre e coraçãozinho), coordenadas de 220 × 240, base em y 240
export const CasaCliente: React.FC<{ w: number; abre: number }> = ({ w, abre }) => (
  <svg width={w} height={w * 240 / 220} viewBox="0 0 220 240" style={{ overflow: "visible" }}>
    <ellipse cx="110" cy="238" rx="104" ry="6" fill="#000" opacity="0.1" />
    <rect x="20" y="92" width="180" height="146" fill="#FFE2B8" />
    <path d="M4 100 L110 20 L216 100 Z" fill={C.coral} />
    <path d="M4 100 H216" stroke={C.coralDark} strokeWidth="8" strokeLinecap="round" />
    <rect x="38" y="122" width="44" height="40" rx="5" fill="#BFE3F2" stroke="#fff" strokeWidth="5" />
    <rect x="138" y="122" width="44" height="40" rx="5" fill="#BFE3F2" stroke="#fff" strokeWidth="5" />
    <rect x="86" y="160" width="48" height="78" rx="5" fill="#5B3A22" />
    <g transform={`translate(86 160) scale(${1 - 0.75 * abre} 1)`}><rect x="0" y="0" width="48" height="78" rx="5" fill={C.verde} /><circle cx="38" cy="42" r="4" fill={C.amarelo} /></g>
    <rect x="96" y="52" width="28" height="22" rx="4" fill="#fff" />
    <text x="110" y="69" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="17" fill={C.coral}>12</text>
  </svg>
);

// ---------------------------------------------------------------- selos e ícones
export const Selo: React.FC<{ texto: string; cor?: string; size?: number }> = ({ texto, cor = C.verde, size = 46 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3, padding: `${size * 0.26}px ${size * 0.55}px ${size * 0.26}px ${size * 0.32}px`, borderRadius: 999,
    background: cor, boxShadow: `0 ${size * 0.14}px 0 ${cor === C.verde ? C.verdeDark : C.coralDark}, 0 16px 30px rgba(34,28,25,0.2)`, whiteSpace: "nowrap" }}>
    <div style={{ width: size * 1.1, height: size * 1.1, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.78} height={size * 0.78} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke={cor} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
    </div>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: 1, color: "#fff", letterSpacing: -0.5 }}>{texto}</span>
  </div>
);

export const IconeLoja: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x="16" y="44" width="68" height="44" rx="5" fill="#F2B35B" />
    {Array.from({ length: 5 }).map((_, i) => (
      <path key={i} d={`M${12 + i * 15.2} 26 H${27.2 + i * 15.2} V44 A7.6 7.6 0 0 1 ${12 + i * 15.2} 44 Z`} fill={i % 2 === 0 ? C.amarelo : "#fff"} />
    ))}
    <rect x="9" y="20" width="82" height="9" rx="4.5" fill="#D8923A" />
    <rect x="40" y="58" width="20" height="30" rx="3" fill="#8A4A1C" />
    <rect x="22" y="56" width="12" height="12" rx="2" fill="#FFE48A" /><rect x="66" y="56" width="12" height="12" rx="2" fill="#FFE48A" />
  </svg>
);
export const IconePin: React.FC<{ s: number; cor?: string }> = ({ s, cor = C.coral }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 22 C12 22 4 14 4 9 A8 8 0 0 1 20 9 C20 14 12 22 12 22 Z" fill={cor} /><circle cx="12" cy="9" r="3.2" fill="#fff" /></svg>
);
export const IconeNota: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" fill={C.verde} />
    <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="6" cy="12" r="1" fill="#fff" /><circle cx="18" cy="12" r="1" fill="#fff" />
  </svg>
);
export const IconeOlho: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M1.5 12 Q12 1.5 22.5 12 Q12 22.5 1.5 12 Z" fill="#fff" stroke={TINTA} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.4" fill={C.coral} /><circle cx="12" cy="12" r="2" fill={TINTA} /><circle cx="13.6" cy="10.4" r="1.1" fill="#fff" />
  </svg>
);
export const IconeEscudo: React.FC<{ s: number; brilho?: number }> = ({ s, brilho = 0 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    {brilho > 0 && <circle cx="50" cy="50" r={50 + 18 * brilho} fill={C.amarelo} opacity={0.35 * (1 - brilho * 0.5)} />}
    <path d="M50 6 L86 20 V46 Q86 78 50 94 Q14 78 14 46 V20 Z" fill={C.verdeDark} transform="translate(0 4)" />
    <path d="M50 6 L86 20 V46 Q86 78 50 94 Q14 78 14 46 V20 Z" fill={C.verde} />
    <path d="M50 14 L78 25 V46 Q78 72 50 86 Z" fill="#fff" opacity="0.14" />
    <path d="M32 50 L45 63 L69 37" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
// avatar da equipe: bolinha colorida com a silhueta (sem rosto), como os avatares dos comentários
export const Avatar: React.FC<{ s: number; cor: string; pele?: string }> = ({ s, cor, pele = "#C98A5B" }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill={cor} />
    <circle cx="50" cy="50" r="42" fill="#fff" opacity="0.25" />
    <circle cx="50" cy="40" r="17" fill={pele} />
    <path d="M20 86 Q24 60 50 60 Q76 60 80 86 A44 44 0 0 1 20 86 Z" fill={pele} />
  </svg>
);
// a prancheta da ficha de cadastro (linhas que se preenchem)
export const Prancheta: React.FC<{ w: number; enche: number; check: number }> = ({ w, enche, check }) => (
  <svg width={w} height={w * 1.3} viewBox="0 0 200 260" style={{ overflow: "visible" }}>
    <rect x="8" y="22" width="184" height="234" rx="18" fill="#B87B44" />
    <rect x="22" y="38" width="156" height="206" rx="10" fill="#fff" />
    <rect x="62" y="8" width="76" height="34" rx="10" fill="#8C8C8C" />
    <rect x="76" y="2" width="48" height="18" rx="9" fill="#8C8C8C" />
    <text x="100" y="74" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="22" fill={TINTA}>Cadastro</text>
    {[104, 140, 176, 212].map((y, i) => {
      const u = Math.max(0, Math.min(1, enche * 4 - i));
      return (
        <g key={y}>
          <rect x="40" y={y - 10} width="18" height="18" rx="5" fill="none" stroke={C.cremeDeep} strokeWidth="3" />
          {u > 0.6 && check > 0 && <path d={`M43 ${y} L48 ${y + 5} L56 ${y - 5}`} stroke={C.verde} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          <rect x="68" y={y - 5} width="94" height="9" rx="4.5" fill={C.cremeDark} />
          <rect x="68" y={y - 5} width={94 * u} height="9" rx="4.5" fill={C.coral} opacity="0.75" />
        </g>
      );
    })}
  </svg>
);
