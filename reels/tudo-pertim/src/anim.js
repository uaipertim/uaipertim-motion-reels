/*
 * TUDO PERTIM (UaiPertim · TikTok) — motor de vídeos em capítulos, 45–60 s. Nasceu do motor da EXPLICA, SÔ!
 * (reels/explica-so/src/anim.js), com a cara mais jovem e animada da série do TikTok.
 *
 * O episódio inteiro vem de episodios/<id>.json, já com o tempo da narração (audio/<id>/linha.json, de scripts/linha.py).
 * Cada capítulo é um "quadro" de 1080×1920 empilhado no mundo. A ESTRADA DE PROGRESSO — uma rua com tracejado coral —
 * liga os nós numerados 01…07; na troca de capítulo a MOTINHA AMARELA (o mascote, sempre com a sacola da marca) percorre
 * a rua até o próximo nó e a câmera vai junto. O rótulo e o título (2 linhas) entram com "soco" no tempo da batida
 * (linha.json → bpm), a linha de apoio muda a cada frase e a CENA cresce peça por peça no tempo da voz.
 *
 * O que é vivo: as lojinhas com olhinhos piscam, pulam na batida, sorriem e olham para o que acontece; figurinhas
 * (estrela, coração, brilho, "UAI!") pipocam; confete nos destaques; balões de fala; chips com ícones riscados.
 *
 * Cenas (CENAS): capa · quem · vitrine · pedido · aperto · minas · comenta · fecho. Nunca telas, celulares ou
 * interface de app; nunca nomes de lojas reais (só categorias).
 *
 * Regras de quadro: conteúdo entre x 80–940 e y 265–1456; nada (nem a rua) em x ≥ 940 entre y 1060 e 1560;
 * a marca (logo oficial + UaiPertim + @ do JSON) fica fixa no topo de todos os quadros; o quadro 0 é a capa;
 * no fecho a logo oficial grande fica parada nos 3 últimos segundos.
 */
(function () {
  'use strict';

  const W = 1080, H = 1920;
  const FONT = "'UP Poppins', 'Noto Color Emoji', sans-serif";
  const C = {
    coral: '#F2502B', coralBg: '#E7431C', coralDark: '#C63A17', coralLight: '#FF8A63',
    creme: '#F6EEE2', papel: '#FFF9F1', cremeDark: '#EADBC6', cremeDeep: '#E2CDB2',
    amarelo: '#F9B233', amareloLight: '#FFD27A', amareloDark: '#E3951A',
    verde: '#3E9E4E', verdeLight: '#7FC66E', verdeDark: '#2D7A3A',
    tinta: '#221C19', tinta2: '#4A3F39', cinza: '#8A7A6E', branco: '#FFFFFF', madeira: '#C98A4B', madeiraDark: '#A86B33',
  };
  // as variações quentes por capítulo (o brilho de fundo)
  const TONS = { creme: '#FFF1DA', pessego: '#FFC9A6', amarelo: '#FFE08A', verde: '#CDEBBE' };
  // o quadro de um capítulo (coordenadas locais)
  const L = { x0: 120, x1: 930, cx: 525, nodeX: 66, nodeY: 446, rotY: 457, tituloTopo: 488 };
  const BTN = { x: 940, y0: 1060, y1: 1560 };          // a coluna de botões do Reels
  const RAIL_X2 = 900;
  const STEP = 1400;                                    // a distância entre um capítulo e o próximo no mundo (perto: a troca nunca fica vazia)                                  // o lado direito da rua (a motinha inteira fica < 940 fora da faixa recortada)
  const PARK = 150;                                     // a motinha estaciona 150 px depois do nó (sem cobrir o número)

  // ---------------------------------------------------------------- utilitários
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outBack: (x, s = 1.70158) => (x <= 0 ? 0 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)),
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  };
  const DEG = Math.PI / 180, TAU = Math.PI * 2;
  const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const css = (h, a = 1) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixHex = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
  const hash = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function setFont(ctx, size, weight, ls = 0) { ctx.font = `${weight} ${size}px ${FONT}`; ctx.letterSpacing = `${ls}px`; }
  let M = null;                                         // contexto só para medir
  function tw(s, size, weight, ls = 0) { setFont(M, size, weight, ls); return M.measureText(s).width - (s.length ? ls : 0); }
  function txt(ctx, s, x, y, o = {}) {
    const size = o.size || 40, weight = o.weight || 800, ls = o.ls || 0;
    const w = tw(s, size, weight, ls);
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if ((o.alpha ?? 1) > 0.002) {
      ctx.save(); setFont(ctx, size, weight, ls); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha *= o.alpha ?? 1; ctx.fillStyle = o.color || C.tinta;
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 22; }
      ctx.fillText(s, x0, y); ctx.restore();
    }
    if (o.box) BOX(o.box, x0, y - size * 0.76, x0 + w, y + size * 0.22);
    return w;
  }
  function fitSize(lines, weight, maxW, maxS, lsK = 0) {
    let s = maxS;
    while (s > 20 && lines.some((l) => tw(l, s, weight, lsK * s) > maxW)) s -= 1;
    return s;
  }
  // o marcador amarelo atrás de uma palavra (revelado da esquerda para a direita)
  function marker(ctx, x0, base, w, size, e = 1, col = C.amarelo) {
    if (e <= 0.002) return;
    const h = size * 0.5, y = base - size * 0.36;
    ctx.save(); ctx.fillStyle = col;
    ctx.beginPath();
    const x1 = x0 - size * 0.1, x2 = x0 + (w + size * 0.2) * e;
    ctx.moveTo(x1 + 6, y + 3); ctx.lineTo(x2, y - 2); ctx.quadraticCurveTo(x2 + 8, y + h / 2, x2 - 2, y + h + 2);
    ctx.lineTo(x1 + 2, y + h + 5); ctx.quadraticCurveTo(x1 - 6, y + h / 2, x1 + 6, y + 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- texto de apoio: *marcador amarelo* e ~coral~ + quebra de linha
  function runs(line) {
    const out = []; let cur = '', mode = null;
    for (const ch of line) {
      if (ch === '*' || ch === '~') { if (cur) out.push({ s: cur, m: mode }); cur = ''; mode = mode === ch ? null : ch; continue; }
      cur += ch;
    }
    if (cur) out.push({ s: cur, m: mode });
    return out;
  }
  const plain = (s) => (s || '').replace(/[*~]/g, '');
  // trechos que nunca se separam numa quebra de linha
  const JUNTOS = [['pertim', 'de', 'voce'], ['do', 'gloria'], ['no', 'gloria']];
  const isEmoji = (s) => /\p{Extended_Pictographic}/u.test(s) && !/[\p{L}\p{N}]/u.test(s);
  // palavras (com estilo) -> unidades inquebráveis: as duas últimas palavras de cada frase, "pertim de você",
  // "do/no Glória" e o emoji grudado na palavra anterior
  function unidades(words) {
    const n = words.length, cola = new Array(n).fill(false);   // cola[i]: a palavra i fica junto da i+1
    const ns = words.map((w) => norm(w.s));
    for (const fr of JUNTOS) for (let i = 0; i + fr.length <= n; i++) if (fr.every((x, k) => ns[i + k] === x)) for (let k = 0; k < fr.length - 1; k++) cola[i + k] = true;
    for (let i = 1; i < n; i++) if (isEmoji(words[i].s)) cola[i - 1] = true;
    // as duas últimas palavras de cada frase (ignorando um emoji no fim)
    let ini = 0;
    for (let i = 0; i < n; i++) {
      const fim = /[.?!…]["”’)]*$/.test(words[i].s) || i === n - 1;
      if (!fim) continue;
      let j = i; while (j > ini && isEmoji(words[j].s)) j--;
      if (j - 1 >= ini) cola[j - 1] = true;
      ini = i + 1;
    }
    const out = []; let cur = [];
    words.forEach((w, i) => { cur.push(w); if (!cola[i]) { out.push(cur); cur = []; } });
    if (cur.length) out.push(cur);
    return out;
  }
  const AP = { size: 40, w: 500, wH: 800 };
  // uma palavra pode ter trechos de estilos diferentes ("*queijo*?"): cada trecho é medido e desenhado no seu peso
  function palavrasRich(line, size) {
    const words = []; let cur = null;
    runs(line).forEach((r) => r.s.split(/(\s+)/).forEach((pc) => {
      if (!pc) return;
      if (/^\s+$/.test(pc)) { cur = null; return; }
      if (!cur) { cur = { segs: [], s: '' }; words.push(cur); }
      cur.segs.push({ s: pc, m: r.m, w: tw(pc, size, r.m ? AP.wH : AP.w) }); cur.s += pc;
    }));
    words.forEach((w) => { w.w = w.segs.reduce((a, b) => a + b.w, 0); });
    return words;
  }
  function layoutRich(line, maxW, size = AP.size) {
    const words = palavrasRich(line, size);
    const sp = tw(' ', size, AP.w);
    const us = unidades(words).map((u) => ({ words: u, w: u.reduce((a, b) => a + b.w, 0) + sp * (u.length - 1) }));
    let rows = [[]]; let x = 0;
    us.forEach((u) => {
      if (rows[rows.length - 1].length && x + sp + u.w > maxW) { rows.push([]); x = 0; }
      x += (rows[rows.length - 1].length ? sp : 0) + u.w; rows[rows.length - 1].push(u);
    });
    if (rows.length === 2) {                              // duas linhas: a quebra mais equilibrada, de preferência depois de vírgula
      const wd = (a) => a.reduce((s_, u) => s_ + u.w, 0) + sp * (a.length - 1);
      let best = null;
      for (let i = 1; i < us.length; i++) {
        const a = us.slice(0, i), b = us.slice(i), wa = wd(a), wb = wd(b);
        if (wa > maxW || wb > maxW) continue;
        const fim = a[a.length - 1].words, ult = fim[fim.length - 1].s;
        const score = Math.abs(wa - wb) - (/[,;:]$/.test(ult) ? 0.35 * maxW : 0);
        if (!best || score < best.score) best = { score, rows: [a, b] };
      }
      if (best) rows = best.rows;
    }
    return rows.map((r) => { const ws = r.flatMap((u) => u.words); return { words: ws, w: ws.reduce((a, b) => a + b.w, 0) + sp * (ws.length - 1), sp }; });
  }

  // ---------------------------------------------------------------- ícones e peças desenhadas (estilo das lojinhas)
  let LOGO = null;
  function logo(ctx, x, y, d) { if (LOGO) ctx.drawImage(LOGO, x - d / 2, y - d / 2, d, d); }   // o arquivo oficial, nunca redesenhado
  function shadow(ctx, x, y, rx, ry, a = 0.12) { ctx.save(); ctx.fillStyle = `rgba(80,40,20,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore(); }

  // pílula com texto (e ícone opcional); devolve a largura
  function chip(ctx, s, x, y, o = {}) {
    const size = o.size || 26, weight = o.weight || 800, ls = o.ls ?? 2, h = o.h || Math.round(size * 2.2);
    const iw = o.icon ? size * 1.35 + 10 : 0, pad = o.pad ?? 24;
    const w = o.w || pad * 2 + iw + tw(s, size, weight, ls);
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    rr(ctx, x0, y - h / 2, w, h, h / 2);
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(120,60,30,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; }
    ctx.fillStyle = o.bg || C.papel; ctx.fill(); ctx.shadowColor = 'transparent';
    if (o.border !== 'none') { ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.border || C.coral; ctx.stroke(); }
    if (o.icon) ICONES[o.icon](ctx, x0 + pad + size * 0.66, y, size * 1.35, o.iconColor || o.color || C.coral);
    txt(ctx, s, x0 + pad + iw, y + size * 0.36, { size, weight, ls, color: o.color || C.tinta });
    ctx.restore();
    if (o.box) BOX(o.box, x0, y - h / 2, x0 + w, y + h / 2);
    return w;
  }
  // círculo com check que estoura
  function check(ctx, x, y, r, e, o = {}) {
    if (e <= 0.001) return;
    const k = E.outBack(clamp(e), 2.2);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = o.bg || C.verde; ctx.shadowColor = 'rgba(40,90,40,0.35)'; ctx.shadowBlur = 16; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 5; ctx.strokeStyle = C.branco; ctx.stroke();
    ctx.lineWidth = r * 0.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.branco;
    ctx.beginPath(); ctx.moveTo(-r * 0.42, r * 0.02); ctx.lineTo(-r * 0.1, r * 0.34); ctx.lineTo(r * 0.45, -r * 0.3); ctx.stroke();
    ctx.restore();
    if (o.box) BOX(o.box, x - r, y - r, x + r, y + r);
  }
  // entrada padrão de uma peça: sobe 28 px e aparece (0..1)
  const ent = (t, t0, d = 0.45) => (t0 === null || t0 === undefined ? 0 : E.outCubic(p(t, t0, t0 + d)));
  function enter(ctx, e, x, y, fn, o = {}) {
    if (e <= 0.002) return;
    ctx.save(); ctx.globalAlpha *= clamp(e * 1.4);
    const dy = (o.dy ?? 28) * (1 - e), k = lerp(o.k0 ?? 0.94, 1, e);
    ctx.translate(x, y + dy); ctx.scale(k, k); ctx.translate(-x, -y);
    fn(); ctx.restore();
  }
  // pula (escala com mola), ancorado num ponto (a base da peça)
  function pop(ctx, e, x, y, fn, s = 1.9) {
    if (e <= 0.002) return;
    const k = E.outBack(clamp(e), s);
    ctx.save(); ctx.globalAlpha *= clamp(e * 3); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); fn(); ctx.restore();
  }

  // ícones pequenos dos chips (desenho próprio, traço tinta/coral)
  const ICONES = {
    fila(ctx, x, y, s, col) {
      for (let i = 0; i < 3; i++) {
        const px = x - s * 0.34 + i * s * 0.34, k = 1 - i * 0.12;
        ctx.fillStyle = i === 0 ? col : css(col, 0.55);
        ctx.beginPath(); ctx.arc(px, y - s * 0.16, s * 0.13 * k, 0, TAU); ctx.fill();
        rr(ctx, px - s * 0.14 * k, y - s * 0.01, s * 0.28 * k, s * 0.34 * k, s * 0.1); ctx.fill();
      }
    },
    chuva(ctx, x, y, s, col) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x - s * 0.16, y - s * 0.06, s * 0.2, 0, TAU); ctx.arc(x + s * 0.08, y - s * 0.16, s * 0.24, 0, TAU); ctx.arc(x + s * 0.28, y - s * 0.02, s * 0.16, 0, TAU); ctx.fill();
      rr(ctx, x - s * 0.34, y - s * 0.06, s * 0.76, s * 0.18, s * 0.09); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const dx = x - s * 0.2 + i * s * 0.2; ctx.beginPath(); ctx.moveTo(dx, y + s * 0.2); ctx.lineTo(dx - s * 0.06, y + s * 0.38); ctx.stroke(); }
    },
    sol(ctx, x, y, s, col) {
      ctx.save(); ctx.translate(x, y);
      ctx.strokeStyle = C.amareloDark; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3); ctx.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46); ctx.stroke(); }
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(0, 0, s * 0.24, 0, TAU); ctx.fill();
      ctx.restore();
    },
    pijama(ctx, x, y, s, col) {                       // a blusa do pijama listrada, com a luazinha
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.36); ctx.lineTo(-s * 0.44, -s * 0.18); ctx.lineTo(-s * 0.32, s * 0.02); ctx.lineTo(-s * 0.24, -s * 0.04);
      ctx.lineTo(-s * 0.24, s * 0.4); ctx.lineTo(s * 0.24, s * 0.4); ctx.lineTo(s * 0.24, -s * 0.04); ctx.lineTo(s * 0.32, s * 0.02); ctx.lineTo(s * 0.44, -s * 0.18);
      ctx.lineTo(s * 0.16, -s * 0.36); ctx.quadraticCurveTo(0, -s * 0.22, -s * 0.16, -s * 0.36); ctx.closePath();
      ctx.fillStyle = css(col, 0.18); ctx.fill(); ctx.save(); ctx.clip();
      ctx.fillStyle = col; for (let i = -3; i < 4; i++) ctx.fillRect(i * s * 0.15 - s * 0.03, -s * 0.5, s * 0.06, s); ctx.restore();
      ctx.lineWidth = s * 0.05; ctx.strokeStyle = col; ctx.stroke();
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(s * 0.36, -s * 0.38, s * 0.13, 0, TAU); ctx.fill();
      ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.43, s * 0.11, 0, TAU); ctx.fill();
      ctx.restore();
    },
    chinelo(ctx, x, y, s, col) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-18 * DEG);
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.2, s * 0.42, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.17, s * 0.02); ctx.lineTo(0, -s * 0.24); ctx.lineTo(s * 0.17, s * 0.02); ctx.stroke();
      ctx.restore();
    },
  };

  // ---- a motinha amarela de entrega (vista de lado, virada para a direita; origem no chão, entre as rodas). s = largura
  function moto(ctx, x, y, s, o = {}) {
    const k = s / 100, dir = o.dir || 1, roll = o.roll || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(dir * k, k);
    ctx.globalAlpha *= o.alpha ?? 1;
    shadow(ctx, 0, 1, 52, 6, 0.16);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // a sacola da UaiPertim na garupa: papel creme, faixa coral e a logo oficial (o arquivo, nunca redesenhada)
    if (o.sacola !== false) {
      ctx.save(); ctx.translate(-38, -62); ctx.rotate(-0.06);
      ctx.strokeStyle = C.coralDark; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-9, -18); ctx.bezierCurveTo(-9, -32, 9, -32, 9, -18); ctx.stroke();
      ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(-19, -19); ctx.lineTo(19, -19); ctx.lineTo(21, 19); ctx.lineTo(-21, 19); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
      ctx.fillStyle = C.coral; ctx.fillRect(-19, -19, 38, 7);
      ctx.save(); ctx.scale(dir, 1); logo(ctx, 0, 3, 24); ctx.restore();   // a logo nunca espelhada
      ctx.restore();
    }
    // o entregador: perna, tronco, braço e capacete
    ctx.strokeStyle = C.tinta; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-14, -44); ctx.lineTo(4, -42); ctx.lineTo(6, -27); ctx.stroke();
    ctx.fillStyle = C.verde; rr(ctx, -22, -76, 18, 34, 8); ctx.fill();
    ctx.strokeStyle = C.verde; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-10, -68); ctx.lineTo(10, -58); ctx.lineTo(22, -62); ctx.stroke();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(-11, -86, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = C.tinta; rr(ctx, -6, -90, 13, 8, 4); ctx.fill();
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(-15, -91, 3, 0, TAU); ctx.fill();
    // o corpo da scooter
    ctx.fillStyle = C.amarelo; ctx.strokeStyle = C.amareloDark; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-46, -16); ctx.quadraticCurveTo(-48, -40, -30, -42); ctx.lineTo(-4, -42); ctx.quadraticCurveTo(0, -42, 0, -36);
    ctx.lineTo(0, -26); ctx.lineTo(16, -26); ctx.lineTo(24, -58); ctx.lineTo(32, -58); ctx.lineTo(34, -30);
    ctx.quadraticCurveTo(48, -26, 46, -14); ctx.lineTo(-46, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.tinta; rr(ctx, -34, -48, 30, 8, 4); ctx.fill();                       // o banco
    ctx.strokeStyle = C.tinta; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(28, -58); ctx.lineTo(24, -68); ctx.stroke();   // o guidão
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(37, -40, 4.5, 0, TAU); ctx.fill();    // o farol
    // as rodas (giram com a distância)
    for (const wx of [-30, 32]) {
      ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(wx, -11, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = C.cremeDark; ctx.beginPath(); ctx.arc(wx, -11, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.cremeDark; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const a = roll + i * TAU / 3; ctx.beginPath(); ctx.moveTo(wx, -11); ctx.lineTo(wx + Math.cos(a) * 9, -11 + Math.sin(a) * 9); ctx.stroke(); }
    }
    // riscos de velocidade
    if (o.speed > 0.05) {
      ctx.strokeStyle = css(C.coral, 0.55 * clamp(o.speed)); ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const yy = -24 - i * 18, l = 18 + 14 * clamp(o.speed); ctx.beginPath(); ctx.moveTo(-58 - i * 4, yy); ctx.lineTo(-58 - i * 4 - l, yy); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---- lojinha com olhinhos (porta de src/components/Town.tsx → ShopChar; viewBox 200×256). (cx, base) = o chão
  const LOOK = {
    padaria: { wall: '#F2B35B', wallDark: '#D8923A', a: C.amarelo, b: '#FFFFFF', door: '#8A4A1C' },
    mercado: { wall: '#E9944A', wallDark: '#C9752E', a: C.verde, b: '#FFFFFF', door: C.verdeDark },
    farmacia: { wall: '#FBF6EE', wallDark: '#E2D6C2', a: C.verde, b: '#FFFFFF', door: C.verdeDark },
    loja: { wall: '#F4A98A', wallDark: '#D9876A', a: C.amarelo, b: C.coral, door: '#7A3A18' },
    lanchonete: { wall: '#F7C873', wallDark: '#DDA54A', a: C.coral, b: '#FFFFFF', door: '#8A3A1C' },
    misterio: { wall: '#F4A98A', wallDark: '#D9876A', a: C.coral, b: C.amarelo, door: '#7A3A18' },
  };
  function face(ctx, blink, look, smile = 0) {        // os olhinhos do celular-personagem (Phone.tsx → PhoneFace, humor "happy"), viewBox 300×150
    ctx.fillStyle = css(C.coral, 0.28);
    ctx.beginPath(); ctx.ellipse(40, 112, 22, 12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(260, 112, 22, 12, 0, 0, TAU); ctx.fill();
    [70, 230].forEach((cx, i) => {
      const ry = Math.max(3, 40 * (1 - 0.92 * blink));
      ctx.beginPath(); ctx.ellipse(cx, 74, 34, ry, 0, 0, TAU); ctx.fillStyle = C.branco; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.tinta; ctx.stroke();
      if (blink < 0.7) {
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(cx + (i ? -4 : 4) + look[0] * 12, 78 + look[1] * 10, 17 * (1 - blink), 0, TAU); ctx.fill();
        ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(cx + (i ? -10 : -2) + look[0] * 12, 70 + look[1] * 10, 6 * (1 - blink), 0, TAU); ctx.fill();
      }
    });
    ctx.strokeStyle = C.tinta; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(44, 30); ctx.quadraticCurveTo(70, 14, 96, 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(204, 26); ctx.quadraticCurveTo(230, 14, 256, 30); ctx.stroke();
    // a boca: sorriso que abre (smile 0..1) e mostra a linguinha
    const mw = 38 + 14 * smile, md = 40 + 34 * smile;
    ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.moveTo(150 - mw, 114); ctx.quadraticCurveTo(150, 114 + md, 150 + mw, 114); ctx.closePath(); ctx.fill();
    if (smile > 0.15) { ctx.save(); ctx.clip(); ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.ellipse(150, 114 + md * 0.62, 20 * smile + 6, 12 * smile + 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  function shopIcon(ctx, kind) {           // o ícone da placa, centrado em (100, 23)
    ctx.save(); ctx.translate(100, 23); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'padaria') {
      ctx.fillStyle = '#E8A64A'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 15, -0.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#B9732A'; ctx.lineWidth = 3.5; for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(dx - 5, -4); ctx.lineTo(dx + 5, 8); ctx.stroke(); }
    } else if (kind === 'mercado') {
      ctx.strokeStyle = C.tinta; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(-30, -13); ctx.lineTo(-22, -13); ctx.lineTo(-14, 9); ctx.lineTo(20, 9); ctx.lineTo(26, -6); ctx.lineTo(-18, -6); ctx.stroke();
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(25, -5); ctx.lineTo(20, 7); ctx.lineTo(-13, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(-9, 17, 4, 0, TAU); ctx.arc(16, 17, 4, 0, TAU); ctx.fill();
    } else if (kind === 'farmacia') {
      ctx.fillStyle = C.verde; rr(ctx, -7, -20, 14, 40, 3); ctx.fill(); rr(ctx, -20, -7, 40, 14, 3); ctx.fill();
    } else if (kind === 'lanchonete') {                 // o lanche: pão, alface, carne e pão
      ctx.fillStyle = '#E8A64A'; ctx.beginPath(); ctx.ellipse(0, -6, 26, 12, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = C.verde; rr(ctx, -27, -6, 54, 6, 3); ctx.fill();
      ctx.fillStyle = '#7A3A18'; rr(ctx, -25, 0, 50, 9, 4); ctx.fill();
      ctx.fillStyle = '#E8A64A'; rr(ctx, -24, 9, 48, 8, 4); ctx.fill();
    } else if (kind === 'misterio') {                   // a loja que ainda não se sabe qual é
      txt(ctx, '?', 0, 16, { size: 46, weight: 900, align: 'center', color: C.coral });
    } else {
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function shop(ctx, kind, cx, base, w, o = {}) {
    const s = LOOK[kind] || LOOK.loja, k = w / 200;
    ctx.save(); ctx.translate(cx - 100 * k, base - 250 * k); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(80,40,20,0.12)'; ctx.beginPath(); ctx.ellipse(100, 250, 98, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = s.wall; rr(ctx, 16, 76, 168, 170, 10); ctx.fill();
    ctx.fillStyle = s.wallDark; rr(ctx, 16, 232, 168, 14, 4); ctx.fill();
    const win = mixHex('#6E5B52', '#FFE48A', clamp(o.lit ?? 1));
    for (const x of [26, 132]) { ctx.fillStyle = s.wallDark; rr(ctx, x, 194, 42, 38, 7); ctx.fill(); ctx.fillStyle = win; rr(ctx, x + 4, 198, 34, 30, 5); ctx.fill(); }
    ctx.fillStyle = s.door; rr(ctx, 80, 188, 40, 58, 7); ctx.fill();
    ctx.fillStyle = win; rr(ctx, 86, 195, 28, 18, 4); ctx.fill();
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(113, 226, 3.5, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(25, 106); ctx.scale(0.5, 0.5); face(ctx, o.blink || 0, o.look || [0, 0], o.smile || 0); ctx.restore();
    const st = 6, sw = 184 / st;                            // o toldo listrado
    for (let i = 0; i < st; i++) {
      const x = 8 + i * sw;
      ctx.beginPath(); ctx.moveTo(x, 76); ctx.lineTo(x + sw, 76); ctx.lineTo(x + sw, 100); ctx.ellipse(x + sw / 2, 100, sw / 2, sw / 2.4, 0, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? s.a : s.b; ctx.fill();
    }
    ctx.fillStyle = s.wallDark; rr(ctx, 4, 66, 192, 14, 7); ctx.fill();
    ctx.save(); ctx.translate(100, 66); ctx.rotate((o.swing || 0) * DEG); ctx.translate(-100, -66);   // a placa
    ctx.fillStyle = s.wallDark; rr(ctx, 66, 44, 8, 24, 3); ctx.fill(); rr(ctx, 126, 44, 8, 24, 3); ctx.fill();
    ctx.fillStyle = '#FFFDF6'; rr(ctx, 40, -4, 120, 54, 16); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = s.wallDark; ctx.stroke();
    shopIcon(ctx, kind);
    ctx.restore();
    ctx.restore();
  }
  const blinkAt = (t, seed) => { const ph = (t + hash(seed, 1) * 3) % 3.1; return ph < 0.14 ? Math.sin(Math.PI * ph / 0.14) : 0; };

  // ---- peças da casa
  function xicara(ctx, x, base, s, t, o = {}) {          // xícara com pires e fumacinha; (x, base) = o pé do pires
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    ctx.fillStyle = C.cremeDeep; ctx.beginPath(); ctx.ellipse(0, -6, 56, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.branco; ctx.beginPath(); ctx.ellipse(0, -10, 52, 10, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 9; ctx.strokeStyle = C.branco; ctx.beginPath(); ctx.arc(36, -42, 15, -1.2, 1.3); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.beginPath(); ctx.arc(36, -42, 15, -1.2, 1.3); ctx.stroke();
    ctx.fillStyle = C.branco; ctx.beginPath(); ctx.moveTo(-36, -66); ctx.lineTo(36, -66); ctx.quadraticCurveTo(34, -14, 0, -14); ctx.quadraticCurveTo(-34, -14, -36, -66); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-34.6, -52); ctx.lineTo(34.6, -52); ctx.lineTo(33, -42); ctx.lineTo(-33, -42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6B3A1E'; ctx.beginPath(); ctx.ellipse(0, -66, 36, 7, 0, 0, TAU); ctx.fill();
    if (o.steam !== false) {                              // a fumacinha do café passadim
      ctx.strokeStyle = css(C.cinza, 0.55); ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = ((t * 0.7 + i / 3) % 1), a = Math.sin(Math.PI * ph) * (o.steamA ?? 1);
        if (a <= 0.02) continue;
        ctx.globalAlpha = a; const sx = -16 + i * 16, y0 = -80 - ph * 50;
        ctx.beginPath(); ctx.moveTo(sx, y0); ctx.bezierCurveTo(sx - 12, y0 - 14, sx + 12, y0 - 24, sx, y0 - 38); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function prato(ctx, x, base, s, o = {}) {              // prato com garfo e faca (ou, vazio, só o tracejado)
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    if (o.vazio) {
      ctx.setLineDash([10, 9]); ctx.lineDashOffset = -(o.t || 0) * 20; ctx.lineWidth = 4; ctx.strokeStyle = C.coral;
      ctx.beginPath(); ctx.ellipse(0, -14, 60, 16, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -14, 36, 9, 0, 0, TAU); ctx.globalAlpha *= 0.6; ctx.stroke();
      ctx.restore(); return;
    }
    ctx.fillStyle = C.cremeDeep; ctx.beginPath(); ctx.ellipse(0, -10, 62, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.branco; ctx.beginPath(); ctx.ellipse(0, -14, 60, 15, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.cremeDark; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -14, 38, 9, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = C.cinza; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-76, -6); ctx.lineTo(-74, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-80, -30); ctx.lineTo(-80, -40); ctx.moveTo(-74, -30); ctx.lineTo(-74, -42); ctx.moveTo(-68, -30); ctx.lineTo(-68, -40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(76, -6); ctx.lineTo(78, -40); ctx.stroke();
    ctx.restore();
  }
  function interrog(ctx, x, y, r, e, t, t0) {             // o "?" num balão coral pulsando
    if (e <= 0.002) return;
    const k = E.outBack(e, 2.4) * (1 + 0.05 * Math.sin((t - t0) * 5));
    for (let i = 0; i < 2; i++) {
      const ph = ((t - t0) / 1.3 + i * 0.5) % 1;
      ctx.beginPath(); ctx.arc(x, y, r + 34 * ph, 0, TAU); ctx.strokeStyle = css(C.coral, 0.35 * (1 - ph) * e); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = C.coral; ctx.shadowColor = 'rgba(200,60,20,0.3)'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowColor = 'transparent';
    txt(ctx, '?', 0, r * 0.42, { size: r * 1.3, weight: 900, align: 'center', color: C.branco });
    ctx.restore();
  }
  function sofa(ctx, x, base, w) {                         // sofá com almofada (x = centro)
    const k = w / 300;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 150, 10);
    ctx.fillStyle = C.madeiraDark; rr(ctx, -128, -22, 14, 22, 4); ctx.fill(); rr(ctx, 114, -22, 14, 22, 4); ctx.fill();
    ctx.fillStyle = C.coral; rr(ctx, -130, -150, 260, 100, 34); ctx.fill();            // o encosto
    ctx.fillStyle = C.coralBg; rr(ctx, -140, -84, 280, 66, 22); ctx.fill();            // o assento
    ctx.fillStyle = C.coral; rr(ctx, -154, -110, 46, 96, 22); ctx.fill(); rr(ctx, 108, -110, 46, 96, 22); ctx.fill();   // os braços
    ctx.strokeStyle = css(C.coralDark, 0.5); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(0, -86); ctx.stroke();
    ctx.save(); ctx.translate(-62, -104); ctx.rotate(-0.18);                            // a almofada amarela
    ctx.fillStyle = C.amarelo; rr(ctx, -40, -30, 80, 60, 18); ctx.fill(); ctx.fillStyle = C.amareloDark; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function chinelos(ctx, x, base, s) {                     // o par de chinelos visto de cima
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    for (const [dx, rot] of [[-24, -0.22], [26, 0.12]]) {
      ctx.save(); ctx.translate(dx, -40); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(80,40,20,0.12)'; ctx.beginPath(); ctx.ellipse(3, 4, 22, 46, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.ellipse(0, 0, 21, 45, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.amareloDark; ctx.beginPath(); ctx.ellipse(0, 4, 15, 36, 0, 0, TAU); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.verde; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-18, 2); ctx.quadraticCurveTo(-6, -14, 0, -28); ctx.quadraticCurveTo(6, -14, 18, 2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- peças da praça
  function arvore(ctx, x, base, s, t) {
    const k = s / 100, sway = 2 * Math.sin(t * 1.3 + x);
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, -2, 30, 5);
    ctx.fillStyle = '#9A5B2E'; rr(ctx, -6, -52, 12, 50, 5); ctx.fill();
    ctx.rotate(sway * DEG);
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(0, -82, 34, 0, TAU); ctx.arc(-22, -64, 22, 0, TAU); ctx.arc(22, -64, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = css(C.verdeLight, 0.8); ctx.beginPath(); ctx.arc(-10, -92, 14, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function coreto(ctx, cx, base, w, t) {                    // o coreto da praça (w = largura do telhado)
    const k = w / 220;
    ctx.save(); ctx.translate(cx, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 110, 12, 0.14);
    ctx.fillStyle = C.cremeDeep; rr(ctx, -100, -26, 200, 26, 8); ctx.fill();          // a base com degraus
    ctx.fillStyle = C.papel; rr(ctx, -92, -38, 184, 16, 6); ctx.fill(); ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = C.cremeDark; rr(ctx, -30, -14, 60, 14, 3); ctx.fill();
    const top = -158;
    ctx.fillStyle = C.branco;                                                            // as colunas
    for (const x of [-84, -42, 0, 42, 84]) { rr(ctx, x - 5, top, 10, -38 - top, 3); ctx.fill(); }
    ctx.strokeStyle = C.branco; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-86, -70); ctx.lineTo(86, -70); ctx.stroke();   // o guarda-corpo
    ctx.lineWidth = 3; for (let x = -78; x <= 78; x += 12) { ctx.beginPath(); ctx.moveTo(x, -70); ctx.lineTo(x, -40); ctx.stroke(); }
    ctx.fillStyle = C.coral;                                                             // o telhado
    ctx.beginPath(); ctx.moveTo(-114, top + 4); ctx.quadraticCurveTo(-40, top - 30, 0, top - 92); ctx.quadraticCurveTo(40, top - 30, 114, top + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.coralBg; ctx.beginPath(); ctx.moveTo(0, top - 92); ctx.quadraticCurveTo(40, top - 30, 114, top + 4); ctx.lineTo(0, top + 4); ctx.closePath(); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.amarelo; for (let i = 0; i < 9; i++) { const x = -102 + i * 25.5; ctx.beginPath(); ctx.arc(x, top + 4, 12.7, 0, Math.PI); ctx.fill(); }   // os babados
    ctx.fillStyle = C.amarelo; rr(ctx, -116, top - 4, 232, 9, 4); ctx.fill();
    ctx.strokeStyle = C.tinta; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, top - 92); ctx.lineTo(0, top - 128); ctx.stroke();     // a bandeirinha
    const fl = 4 * Math.sin(t * 5);
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.moveTo(0, top - 128); ctx.quadraticCurveTo(18, top - 124 + fl, 34, top - 120); ctx.lineTo(0, top - 108); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function selo(ctx, x, y, r, linhas) {                     // o selo coral "do Glória", com borda de carimbo
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) { const a = i / 240 * TAU, rr_ = r + 6 * Math.cos(a * 22); i ? ctx.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_) : ctx.moveTo(rr_, 0); }
    ctx.closePath(); ctx.fillStyle = C.coral; ctx.shadowColor = 'rgba(200,60,20,0.3)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.setLineDash([7, 7]); ctx.lineWidth = 3; ctx.strokeStyle = css(C.papel, 0.8); ctx.beginPath(); ctx.arc(0, 0, r - 15, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    txt(ctx, linhas[0], 0, -r * 0.2, { size: r * 0.3, weight: 800, align: 'center', color: C.papel });
    const s2 = fitSize([linhas[1]], 900, r * 1.5, r * 0.5);
    txt(ctx, linhas[1], 0, r * 0.32, { size: s2, weight: 900, align: 'center', color: C.papel });
    ctx.restore();
  }

  // ---- peças da sacola
  function itemQueijo(ctx, x, y, s) {                       // queijo minas: a roda com uma fatia cortada
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#F3D98E'; rr(ctx, -46, -8, 92, 30, 12); ctx.fill();
    ctx.fillStyle = '#F3D98E'; ctx.beginPath(); ctx.ellipse(0, 22, 46, 14, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#FFF4D2'; ctx.beginPath(); ctx.ellipse(0, -8, 46, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F3D98E'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(46, -8); ctx.lineTo(30, 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#D9B562'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -8, 46, 14, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function itemPao(ctx, x, y, s) {                          // pão de sal (pãozinho francês)
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-0.12);
    ctx.fillStyle = '#D9913E'; ctx.beginPath(); ctx.ellipse(0, 4, 48, 24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#EDB463'; ctx.beginPath(); ctx.ellipse(0, -1, 44, 19, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#FFE2A8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-28, 4); ctx.quadraticCurveTo(0, -12, 28, -4); ctx.stroke();
    ctx.restore();
  }
  function itemDoce(ctx, x, y, s) {                         // docim: o pote de doce de leite com a tampa de pano xadrez
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = css('#FFFFFF', 0.7); rr(ctx, -30, -26, 60, 56, 12); ctx.fill();
    ctx.fillStyle = '#C98A4B'; rr(ctx, -26, -14, 52, 40, 10); ctx.fill();
    ctx.fillStyle = '#DDA463'; rr(ctx, -26, -14, 52, 10, 5); ctx.fill();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-38, -24); ctx.lineTo(38, -24); ctx.lineTo(30, -42); ctx.lineTo(-30, -42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.papel; for (let i = 0; i < 4; i++) ctx.fillRect(-30 + i * 16, -42, 7, 18);
    ctx.fillStyle = C.coralDark; rr(ctx, -34, -28, 68, 7, 3); ctx.fill();
    ctx.restore();
  }
  function itemCesta(ctx, x, y, s) {                       // a cestinha do mercadim, com frutas
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(-18, -10, 15, 0, TAU); ctx.fill();              // a maçã
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.ellipse(10, -14, 22, 11, -0.5, 0, TAU); ctx.fill(); // a banana
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(26, -6, 12, 0, TAU); ctx.fill();                 // o limão
    ctx.strokeStyle = C.madeiraDark; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -4, 34, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.fillStyle = C.madeira; ctx.beginPath(); ctx.moveTo(-44, -4); ctx.lineTo(44, -4); ctx.lineTo(34, 34); ctx.lineTo(-34, 34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.madeiraDark; ctx.lineWidth = 3; for (const yy of [8, 20]) { ctx.beginPath(); ctx.moveTo(-40, yy); ctx.lineTo(40, yy); ctx.stroke(); }
    ctx.restore();
  }
  function itemRemedio(ctx, x, y, s) {                     // o vidrinho da farmácia com a cruz
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.verdeDark; rr(ctx, -18, -44, 36, 14, 4); ctx.fill();
    ctx.fillStyle = C.papel; rr(ctx, -28, -32, 56, 70, 12); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    ctx.fillStyle = C.verde; rr(ctx, -5, -16, 10, 34, 2); ctx.fill(); rr(ctx, -17, -4, 34, 10, 2); ctx.fill();
    ctx.restore();
  }
  function itemLanche(ctx, x, y, s) {                      // o lanche da lanchonete
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#E8A64A'; ctx.beginPath(); ctx.ellipse(0, -12, 44, 26, 0, Math.PI, TAU); ctx.fill(); rr(ctx, -44, -14, 88, 6, 3); ctx.fill();
    ctx.fillStyle = C.papel; for (const [dx, dy] of [[-16, -26], [4, -32], [20, -22]]) { ctx.beginPath(); ctx.ellipse(dx, dy, 3, 2, 0.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = C.verde; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-46 + i * 11.5, -6 + (i % 2) * 7); ctx.lineTo(46, 0); ctx.lineTo(-46, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.amarelo; rr(ctx, -42, -2, 84, 7, 2); ctx.fill();
    ctx.fillStyle = '#7A3A18'; rr(ctx, -44, 4, 88, 16, 8); ctx.fill();
    ctx.fillStyle = '#E8A64A'; rr(ctx, -42, 20, 84, 14, 7); ctx.fill();
    ctx.restore();
  }
  const ITENS = { queijo: itemQueijo, pao: itemPao, doce: itemDoce, cesta: itemCesta, remedio: itemRemedio, lanche: itemLanche };

  // ---------------------------------------------------------------- o que é vivo: batida, figurinhas, confete, olhinhos
  let BT = 0.5;                                          // um tempo da batida (60 / bpm)
  const snapBeat = (t) => Math.round(t / BT) * BT;
  // o pulinho na batida: encosta no chão em cada tempo (0 = no chão, 1 = no alto); fase em tempos
  const hop = (t, fase = 0) => Math.abs(Math.sin(Math.PI * (t / BT + fase)));
  function heartPath(ctx, x, y, s) {                      // coração centrado em (x, y), largura ≈ s
    const k = s / 100;
    ctx.beginPath(); ctx.moveTo(x, y + 38 * k);
    ctx.bezierCurveTo(x - 62 * k, y - 2 * k, x - 44 * k, y - 52 * k, x, y - 24 * k);
    ctx.bezierCurveTo(x + 44 * k, y - 52 * k, x + 62 * k, y - 2 * k, x, y + 38 * k); ctx.closePath();
  }
  function starPath(ctx, x, y, r, pts = 5, inner = 0.48) {
    ctx.beginPath();
    for (let i = 0; i <= pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, rr_ = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); }
    ctx.closePath();
  }
  // figurinha (adesivo recortado, borda branca): estrela, coracao, brilho, uai. e = entrada 0..1
  function sticker(ctx, kind, x, y, s, e, t = 0) {
    if (e <= 0.002) return;
    const k = E.outBack(clamp(e), 2.6), rot = (kind === 'brilho' ? 0.25 * t : 0.12 * Math.sin(t * 3 + x * 0.01)) + 0.4 * (1 - clamp(e));
    ctx.save(); ctx.globalAlpha *= clamp(e * 3); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(120,60,30,0.22)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.14; ctx.strokeStyle = C.branco;
    if (kind === 'estrela') { starPath(ctx, 0, 0, s * 0.5); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C.amarelo; ctx.fill(); }
    else if (kind === 'coracao') { heartPath(ctx, 0, 0, s); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C.coral; ctx.fill(); }
    else if (kind === 'brilho') { starPath(ctx, 0, 0, s * 0.5, 4, 0.3); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C.amareloLight; ctx.fill(); }
    else {                                                  // "UAI!"
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C.coral; ctx.fill();
      txt(ctx, 'UAI!', 0, s * 0.12, { size: s * 0.3, weight: 900, align: 'center', color: C.branco });
    }
    ctx.restore();
  }
  // confete: estoura em (cx, cy) no instante t0, sobe, abre e cai girando; some sozinho em `dur` s
  function confete(ctx, t, t0, cx, cy, seed, o = {}) {
    const u = t - t0, dur = o.dur || 2.0;
    if (t0 === null || t0 === undefined || u < 0 || u > dur) return;
    const n = o.n || 40, cores = [C.coral, C.amarelo, C.verde, C.coralLight, C.amareloLight];
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (hash(i, seed) - 0.5) * (o.spread || 2.6), v = (o.v || 950) * (0.45 + 0.65 * hash(i, seed + 1));
      const kd = 2.6, fx = (1 - Math.exp(-kd * u)) / kd;
      const x = cx + Math.cos(a) * v * fx + 18 * Math.sin(u * 7 + i);
      const y = cy + Math.sin(a) * v * fx + 420 * u * u;
      const sz = 9 + 9 * hash(i, seed + 2), sp = 6 + 8 * hash(i, seed + 3);
      ctx.globalAlpha = clamp((dur - u) / 0.45) * clamp(u / 0.05);
      ctx.fillStyle = cores[i % cores.length];
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * sp + i);
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, sz * 0.45, 0, TAU); ctx.fill(); }
      else ctx.fillRect(-sz / 2, -sz * 0.28 * Math.abs(Math.cos(u * sp * 0.8 + i)) - 1, sz, sz * 0.56 * Math.abs(Math.cos(u * sp * 0.8 + i)) + 2);
      ctx.restore();
    }
    ctx.restore();
  }
  // os olhinhos 👀 desenhados (piscam e olham em volta); (x, base) = início e linha de base do texto; s = tamanho da fonte
  function olhos(ctx, x, base, s, blink, look) {
    const ry = s * 0.34, rx = s * 0.22, cy = base - s * 0.36;
    [x + rx, x + rx * 3.15].forEach((cx) => {
      const h = Math.max(s * 0.03, ry * (1 - 0.92 * blink));
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, h, 0, 0, TAU); ctx.fillStyle = C.branco; ctx.fill(); ctx.lineWidth = s * 0.045; ctx.strokeStyle = C.tinta; ctx.stroke();
      if (blink < 0.7) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, h, 0, 0, TAU); ctx.clip();
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(cx + look[0] * rx * 0.45, cy + look[1] * ry * 0.4, rx * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(cx + look[0] * rx * 0.45 - rx * 0.18, cy + look[1] * ry * 0.4 - rx * 0.2, rx * 0.18, 0, TAU); ctx.fill();
        ctx.restore();
      }
    });
    return rx * 4.2;                                         // a largura dos dois olhos
  }
  const OLHOS = '👀';
  const OLHOS_W = (s) => s * 0.22 * 4.2;

  // ---- a casinha (entrega): (cx, base) = o chão; aberta 0..1
  function casinha(ctx, cx, base, w, aberta, t) {
    const k = w / 220;
    ctx.save(); ctx.translate(cx, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 116, 10);
    ctx.fillStyle = C.cremeDeep; rr(ctx, 54, -228, 22, 50, 4); ctx.fill();                // a chaminé
    ctx.fillStyle = '#F7D08A'; rr(ctx, -96, -150, 192, 150, 8); ctx.fill();               // a parede
    ctx.fillStyle = '#E0AE5A'; rr(ctx, -96, -14, 192, 14, 4); ctx.fill();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-116, -144); ctx.lineTo(0, -246); ctx.lineTo(116, -144); ctx.closePath(); ctx.fill();   // o telhado
    ctx.fillStyle = C.coralDark; rr(ctx, -120, -150, 240, 14, 7); ctx.fill();
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(0, -188, 16, 0, TAU); ctx.fill();   // a janelinha redonda
    ctx.strokeStyle = C.coralDark; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#8A4A1C'; rr(ctx, -82, -112, 52, 46, 6); ctx.fill();                // a janela com luz
    ctx.fillStyle = '#FFE48A'; rr(ctx, -77, -107, 42, 36, 4); ctx.fill();
    ctx.strokeStyle = '#8A4A1C'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-56, -107); ctx.lineTo(-56, -71); ctx.moveTo(-77, -89); ctx.lineTo(-35, -89); ctx.stroke();
    // a porta: o vão iluminado e a folha que abre (dobradiça à esquerda)
    const dx = 8, dw = 64, dh = 108, dy = -dh;
    ctx.fillStyle = '#FFE9A8'; rr(ctx, dx, dy, dw, dh, 8); ctx.fill();
    if (aberta > 0) {
      const g = ctx.createRadialGradient(dx + dw / 2, -20, 4, dx + dw / 2, -20, 120);
      g.addColorStop(0, css('#FFE48A', 0.55 * aberta)); g.addColorStop(1, css('#FFE48A', 0));
      ctx.fillStyle = g; ctx.fillRect(dx - 80, -130, dw + 160, 140);
    }
    const fw = dw * (1 - 0.82 * E.outCubic(aberta));
    ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + fw, dy - 8 * aberta); ctx.lineTo(dx + fw, 0 + 4 * aberta); ctx.lineTo(dx, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(dx + fw - 10 * (1 - aberta) - 4, -50, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(86, -14, 12, 0, TAU); ctx.arc(76, -22, 10, 0, TAU); ctx.fill();   // o vasinho
    ctx.fillStyle = C.coralDark; rr(ctx, 72, -12, 26, 12, 3); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- estado
  let LN = null, DUR = 0, TR = 0.9, CAPS = [], CUES = [], RAIL = null, NC = 0;
  let BOXES = null, OFF = { dx: 0, dy: 0, n: 0 };
  function BOX(name, x0, y0, x1, y1) { if (BOXES) BOXES.push({ cap: OFF.n, nome: name, x0: x0 + OFF.dx, y0: y0 + OFF.dy, x1: x1 + OFF.dx, y1: y1 + OFF.dy }); }
  const FECHO = { ultima: 0, logo: null };              // a última mudança de texto do fecho (regra dos 3 s) e a logo
  const AVISOS = [];                                    // palavras que não dispararam peça

  // a palavra que dispara uma peça: "palavra", "palavra#2" (2ª vez), "+1.2" (s depois do começo do capítulo) ou "fim"
  function at(cap, spec, fb) {
    if (spec === undefined || spec === null) return fb;
    if (typeof spec === 'number') return cap.t0 + spec;
    if (spec[0] === '+') return cap.t0 + parseFloat(spec.slice(1));
    if (spec === 'fim') return cap.t1 - 0.9;
    const [w, k] = spec.split('#'), n = norm(w), occ = k ? parseInt(k, 10) : 1;
    let c = 0;
    for (const x of cap.palavras) if (x.n === n && ++c === occ) return x.t0;
    c = 0;
    for (const x of cap.palavras) if (x.n.startsWith(n) && ++c === occ) return x.t0;
    AVISOS.push({ cap: cap.n, palavra: spec });
    console.error(`capítulo ${cap.n}: a palavra "${spec}" não está na fala`);
    return fb;
  }
  const cue = (t, type, extra = {}) => CUES.push({ t, type, ...extra });

  // =====================================================================
  // A ROTA DA ENTREGA (a rua que liga os nós) e a MOTINHA
  // =====================================================================
  function buildRail() {
    const xs = [], ys = [];
    const push = (x, y) => { xs.push(x); ys.push(y); };
    const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4)); for (let i = 1; i <= n; i++) push(lerp(x0, x1, i / n), lerp(y0, y1, i / n)); };
    const quad = (x0, y0, x1, y1, x2, y2) => { for (let i = 1; i <= 24; i++) { const u = i / 24, v = 1 - u; push(v * v * x0 + 2 * v * u * x1 + u * u * x2, v * v * y0 + 2 * v * u * y1 + u * u * y2); } };
    const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => { for (let i = 1; i <= 140; i++) { const u = i / 140, v = 1 - u; push(v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3); } };
    const idx = { node: [], bottom: [] };
    const st = CAPS[0].railStart;                       // o começo, embaixo da capa
    push(st.x, st.y); idx.bottom[0] = 0;
    const X = L.nodeX;
    for (let k = 1; k < NC; k++) {
      const top = k * STEP, prev = (k - 1) * STEP;
      if (k === 1) {                                    // da capa: desce, vira à esquerda e desce até o nó 01
        const yv = top + 100;
        line(st.x, st.y, st.x, yv);
        quad(st.x, yv, st.x, yv + 60, st.x - 60, yv + 60);
        line(st.x - 60, yv + 60, X + 60, yv + 60);
        quad(X + 60, yv + 60, X, yv + 60, X, yv + 120);
      } else {                                          // de um capítulo ao outro: a rua faz um S (vai à direita e volta)
        cubic(X, prev + 1440, X, prev + 1560, RAIL_X2, prev + 1470, RAIL_X2, prev + 1600);
        cubic(RAIL_X2, prev + 1600, RAIL_X2, prev + 1730, X, prev + 1610, X, prev + 1720);
      }
      line(xs[xs.length - 1], ys[ys.length - 1], X, top + L.nodeY); idx.node[k] = xs.length - 1;
      line(X, top + L.nodeY, X, top + 1440); idx.bottom[k] = xs.length - 1;
    }
    const cum = new Float64Array(xs.length);
    for (let i = 1; i < xs.length; i++) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    // para que lado a motinha olha: o último trecho com andamento horizontal (começa olhando para a esquerda)
    const face = new Int8Array(xs.length); let f = -1;
    for (let i = 0; i < xs.length; i++) { const dx = i ? xs[i] - xs[i - 1] : 0, d = i ? Math.hypot(dx, ys[i] - ys[i - 1]) : 0; if (d > 0 && Math.abs(dx) / d > 0.35) f = dx > 0 ? 1 : -1; face[i] = f; }
    return { xs, ys, cum, face, sNode: idx.node.map((i) => (i === undefined ? 0 : cum[i])), sBottom: idx.bottom.map((i) => cum[i]), sEnd: cum[xs.length - 1] };
  }
  function railAt(s) {
    const { cum, xs, ys } = RAIL;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m; else hi = m; }
    const u = clamp((s - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]));
    return { i: lo, x: lerp(xs[lo], xs[hi], u), y: lerp(ys[lo], ys[hi], u), ang: Math.atan2(ys[hi] - ys[lo], xs[hi] - xs[lo]) };
  }
  // em que capítulo / troca estamos
  function where(t) {
    for (let k = 0; k < NC; k++) {
      const c = CAPS[k];
      if (t < c.t1 || k === NC - 1) return { k, trans: false, u: 0 };
      const nx = CAPS[k + 1];
      if (t < nx.t0) return { k, trans: true, u: p(t, c.t1, nx.t0) };
    }
    return { k: NC - 1, trans: false, u: 0 };
  }
  const parkS = (k) => (k === 0 ? 0 : RAIL.sNode[k] + PARK);
  // a rua pintada: no capítulo, do nó até o pé do quadro (progresso); na troca, até a motinha
  function litS(t) {
    const w = where(t), c = CAPS[w.k];
    if (w.trans) return Math.max(RAIL.sBottom[w.k], motoS(t));
    if (w.k === 0) return 0;
    return Math.max(parkS(w.k), lerp(RAIL.sNode[w.k], RAIL.sBottom[w.k], p(t, c.t0, c.t1)));
  }
  function motoS(t) {
    const w = where(t);
    if (!w.trans) return parkS(w.k);
    return lerp(parkS(w.k), parkS(w.k + 1), E.inOutCubic(w.u));
  }
  function camera(t) {
    const w = where(t);
    if (!w.trans) return { x: 0, y: w.k * STEP, w };
    const e = E.inOutCubic(w.u);
    return { x: -22 * Math.sin(Math.PI * w.u), y: lerp(w.k * STEP, (w.k + 1) * STEP, e), w };
  }
  function drawRail(ctx, t, cam, so) {
    const { xs, ys } = RAIL, y0 = cam.y - 120, y1 = cam.y + H + 120;
    const sl = litS(t), head = railAt(sl);
    const visible = (i) => ys[i] >= y0 && ys[i] <= y1;
    const startVis = t >= CAPS[0].t1 - 1.0;
    const path = (i0, i1) => { ctx.beginPath(); let on = false; for (let i = i0; i <= i1; i++) { if (!visible(i) || (!startVis && ys[i] < STEP + 400)) { on = false; continue; } if (!on) { ctx.moveTo(xs[i], ys[i]); on = true; } else ctx.lineTo(xs[i], ys[i]); } };
    if (so === 'moto') return drawMoto(ctx, t, cam, y0, y1, startVis);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // a rua inteira: o asfalto claro e o tracejado coral apagado
    path(0, xs.length - 1);
    ctx.strokeStyle = css(C.cremeDeep, 0.75); ctx.lineWidth = 34; ctx.stroke();
    ctx.strokeStyle = css(C.papel, 0.9); ctx.lineWidth = 24; ctx.stroke();
    ctx.setLineDash([18, 16]); ctx.lineDashOffset = 0; ctx.lineCap = 'butt';
    ctx.strokeStyle = css(C.coral, 0.25); ctx.lineWidth = 5; ctx.stroke();
    // o trecho já percorrido: tracejado coral forte
    if (sl > 0.5) { path(0, head.i); ctx.lineTo(head.x, head.y); ctx.strokeStyle = C.coral; ctx.lineWidth = 6; ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.restore();
    // os nós numerados
    for (let k = 1; k < NC; k++) {
      const nx = L.nodeX, ny = k * STEP + L.nodeY;
      if (ny < y0 - 60 || ny > y1 + 60 || (k === 1 && !startVis)) continue;
      const lit = clamp((t - (CAPS[k].t0 - 0.12)) / 0.25);
      ctx.save();
      if (lit > 0) {
        const fl = p(t, CAPS[k].t0 - 0.12, CAPS[k].t0 + 0.6);
        if (fl < 1) { ctx.beginPath(); ctx.arc(nx, ny, 28 + 50 * E.outCubic(fl), 0, TAU); ctx.strokeStyle = css(C.amarelo, 0.8 * (1 - fl)); ctx.lineWidth = 5; ctx.stroke(); }
      }
      ctx.beginPath(); ctx.arc(nx, ny, 28, 0, TAU);
      ctx.fillStyle = mixHex(C.papel, C.coral, lit); ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.lineWidth = 4; ctx.strokeStyle = lit > 0 ? mixHex(C.cremeDeep, C.coralDark, lit) : C.cremeDeep; ctx.stroke();
      txt(ctx, String(k).padStart(2, '0'), nx, ny + 8, { size: 22, weight: 800, align: 'center', color: lit > 0.5 ? C.branco : C.cinza });
      ctx.restore();
    }
    // o fim da rota: um pino coral
    const last = NC - 1, ex = L.nodeX, ey = last * STEP + 1440;
    if (sl >= RAIL.sBottom[last] - 2 && ey > y0 && ey < y1) {
      ctx.save(); ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(ex, ey, 12, 0, TAU); ctx.fill(); ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, TAU); ctx.fill(); ctx.restore();
    }
  }
  function drawMoto(ctx, t, cam, y0, y1, startVis) {
    if (startVis) {
      const w = where(t), s = motoS(t), at_ = railAt(s);
      if (w.k === 0 && !w.trans) return;                // na capa a motinha é da cena (grande); ela mesma sai pela rua na troca
      const a = 1;
      // saindo da capa: a motinha grande da cena vai encolhendo até o tamanho da rua
      const size = w.k === 0 ? lerp(CAPS[0].motoS || 80, 80, E.inOutCubic(clamp(w.u / 0.45))) : 80;
      if (at_.y > y0 && at_.y < y1) {
        const sp = w.trans ? Math.sin(Math.PI * w.u) : 0;
        const dir = RAIL.face[at_.i];
        let ang = at_.ang; if (dir < 0) ang = Math.PI - ang;
        while (ang > Math.PI) ang -= TAU; while (ang < -Math.PI) ang += TAU;
        const tilt = clamp(ang, -0.5, 0.5) * dir * sp;
        const bob = w.trans ? 0 : 1.5 * Math.sin(t * 9);
        moto(ctx, at_.x, at_.y + 14 + bob, size, { dir, tilt, roll: s / 12, speed: sp, alpha: a });
      }
    }
  }

  // =====================================================================
  // FUNDO, MARCA
  // =====================================================================
  function tint(camY) {
    const f = clamp(camY / STEP, 0, NC - 1), k = Math.floor(f), u = E.inOutSine(f - k);
    const a = TONS[CAPS[k].tom] || TONS.creme, b = TONS[(CAPS[k + 1] || CAPS[k]).tom] || a;
    return mixHex(a, b, u);
  }
  function background(ctx, t, cam) {
    const tn = tint(cam.y);
    let g = ctx.createRadialGradient(540, 730, 0, 540, 730, 1250);
    g.addColorStop(0, '#FFF8EE'); g.addColorStop(0.55, C.creme); g.addColorStop(1, '#F1E3D0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // o brilho quente do capítulo
    const g1x = 820 + 70 * Math.sin(t * 0.21), g1y = 660 + 60 * Math.cos(t * 0.17);
    g = ctx.createRadialGradient(g1x, g1y, 0, g1x, g1y, 900);
    g.addColorStop(0, css(tn, 0.75)); g.addColorStop(0.5, css(tn, 0.3)); g.addColorStop(1, css(tn, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const g2x = 180 + 50 * Math.cos(t * 0.13), g2y = 1480 + 60 * Math.sin(t * 0.15);
    g = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, 800);
    g.addColorStop(0, css(tn, 0.55)); g.addColorStop(1, css(tn, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // os raios de sol, girando devagar (Decor.tsx → Sunburst)
    ctx.save(); ctx.translate(540, 760 - ((cam.y * 0.12) % 400)); ctx.rotate(t * 0.06);
    ctx.fillStyle = css(C.amarelo, 0.06);
    const rays = 18;
    for (let i = 0; i < rays; i++) { const a0 = i / rays * TAU, a1 = a0 + Math.PI / rays; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 1900, Math.sin(a0) * 1900); ctx.lineTo(Math.cos(a1) * 1900, Math.sin(a1) * 1900); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // bolinhas de grade (assinatura das artes) e confete suave, em paralaxe
    const oy = -((cam.y * 0.5) % 1920);
    ctx.fillStyle = css(C.coral, 0.22);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) for (const base of [0, 1920]) {
      const s = 0.8 + 0.2 * Math.sin(t * 3.6 - (c + r) * 0.7);
      ctx.beginPath(); ctx.arc(60 + c * 34, 1610 + r * 34 + oy + base, 6 * s, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 22; i++) {
      const x = 20 + hash(i, 5) * 1040 + 10 * Math.sin(t * 0.6 + i);
      const y = ((hash(i, 6) * (H + 100) - cam.y * 0.7 - t * (8 + 14 * hash(i, 7))) % (H + 100) + H + 100) % (H + 100) - 50;
      ctx.fillStyle = css([C.coral, C.amarelo, C.verde][i % 3], 0.1 + 0.08 * hash(i, 8));
      ctx.beginPath(); ctx.arc(x, y, 2.5 + 3 * hash(i, 9), 0, TAU); ctx.fill();
    }
    // vinheta quente
    g = ctx.createRadialGradient(540, 900, 600, 540, 900, 1300);
    g.addColorStop(0, 'rgba(200,140,90,0)'); g.addColorStop(1, 'rgba(200,140,90,0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function brand(ctx) {
    // véu creme no topo (cobre o conteúdo que passa por baixo na troca de capítulo)
    const g = ctx.createLinearGradient(0, 230, 0, 410);
    g.addColorStop(0, css('#FBF3E8', 0.96)); g.addColorStop(1, css('#FBF3E8', 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 410); ctx.fillStyle = css('#FBF3E8', 0.96); ctx.fillRect(0, 0, W, 230);
    const d = 58, nameW = tw('UaiPertim', 28, 900), handleW = tw(LN.marca, 20, 500, 0.3);
    const gw = d + 14 + Math.max(nameW, handleW), x0 = 540 - gw / 2, cy = 334;
    logo(ctx, x0 + d / 2, cy, d);
    const tx = x0 + d + 14;
    const w1 = txt(ctx, 'Uai', tx, cy - 2, { size: 28, weight: 900, color: C.tinta });
    txt(ctx, 'Pertim', tx + w1, cy - 2, { size: 28, weight: 900, color: C.coral });
    txt(ctx, LN.marca, tx, cy + 23, { size: 20, weight: 500, color: C.cinza, ls: 0.3 });
    BOX('marca', x0, cy - d / 2, x0 + gw, cy + d / 2);
  }

  // =====================================================================
  // CABEÇALHO DO CAPÍTULO (rótulo + título fixo) e LINHA DE APOIO
  // =====================================================================
  function layoutTitulo(cap) {
    const s = fitSize(cap.titulo, 900, L.x1 - L.x0, 94, -0.02);
    cap.ts = s;
    cap.tb = [L.tituloTopo + 0.78 * s, L.tituloTopo + 0.78 * s + 1.04 * s];
    cap.apY = cap.tb[1] + 0.25 * s + 62;
    cap.apX = L.x0; cap.apAlign = 'left';
  }
  const ANTES = 0.55;                                   // o rótulo e o título já entram durante a troca (a tela nunca fica vazia)
  const SOCO = 0.3;                                     // o "soco": zoom rápido (de 1,45×) com leve overshoot, em 0,3 s
  // o tempo de cada linha do título: a 1ª no tempo da batida mais perto de (t0 − ANTES), a 2ª meio tempo depois
  const tituloT = (cap) => { const b = snapBeat(cap.t0 - ANTES); return [b, b + BT / 2]; };
  function header(ctx, cap, t) {
    const t0 = cap.t0 - (cap.n > 0 ? ANTES : 0);
    const n = cap.rotulo.length, k = Math.round(n * p(t, t0 - 0.1, t0 + 0.32));
    if (k > 0) {
      const s = cap.rotulo.slice(0, k);
      const w = txt(ctx, s, L.x0, L.rotY, { size: 26, weight: 800, color: C.coral, ls: 4, box: k === n ? 'rótulo' : null });
      if (k < n || (t - t0) < 0.7) { const blink = k < n || Math.floor((t - t0) * 4) % 2 === 0; if (blink) { ctx.fillStyle = C.coral; ctx.fillRect(L.x0 + w + 8, L.rotY - 21, 13, 24); } }
    }
    const s = cap.ts, tl = tituloT(cap);
    cap.titulo.forEach((ln, i) => {
      const u = p(t, tl[i], tl[i] + SOCO);
      if (t < tl[i]) return;
      const k = u >= 1 ? 1 : lerp(1.45, 1, E.outBack(u, 2.8));
      const w = tw(ln, s, 900, -0.02 * s), cx = L.x0 + w / 2, cy = cap.tb[i] - 0.3 * s;
      ctx.save(); ctx.globalAlpha = clamp(u * 5); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
      txt(ctx, ln, L.x0, cap.tb[i], { size: s, weight: 900, color: i === 1 ? C.coral : C.tinta, ls: -0.02 * s, box: u > 0.5 ? `título, linha ${i + 1}` : null });
      ctx.restore();
    });
  }
  function apoioRows(cap, a) {
    if (!a._rows) a._rows = layoutRich(a.texto, cap.apAlign === 'center' ? 840 : L.x1 - L.x0);
    return a._rows;
  }
  function drawApoio(ctx, cap, t) {
    cap.apoios.forEach((a, i) => {
      const nx = cap.apoios[i + 1];
      const ein = E.outCubic(p(t, a.t + 0.12, a.t + 0.34)), eout = nx ? p(t, nx.t, nx.t + 0.13) : 0;
      const al = ein * (1 - eout);
      if (al <= 0.002) return;
      const rows = apoioRows(cap, a);
      const mk = E.outCubic(p(t, a.t + 0.25, a.t + 0.6));
      rows.forEach((r, j) => {
        const y = cap.apY + j * 52 + 12 * (1 - ein) - 8 * eout;
        let x = cap.apAlign === 'center' ? cap.apX - r.w / 2 : cap.apX;
        const x0 = x;
        ctx.save(); ctx.globalAlpha *= al;
        // o marcador amarelo atrás de cada trecho marcado (contínuo entre palavras marcadas vizinhas)
        let mx = null, mw = 0;
        const fecha = () => { if (mx !== null) marker(ctx, mx, y, mw, AP.size, mk, css(C.amarelo, 0.9)); mx = null; mw = 0; };
        r.words.forEach((wd, k) => {
          wd.segs.forEach((sg) => { if (sg.m === '*') { if (mx === null) mx = x; mw = x + sg.w - mx; } else fecha(); x += sg.w; });
          if (!(wd.segs[wd.segs.length - 1].m === '*' && r.words[k + 1] && r.words[k + 1].segs[0].m === '*')) fecha();
          x += r.sp;
        });
        fecha();
        x = x0;
        r.words.forEach((wd) => {
          wd.segs.forEach((sg) => { txt(ctx, sg.s, x, y, { size: AP.size, weight: sg.m ? AP.wH : AP.w, color: sg.m === '~' ? C.coral : C.tinta }); x += sg.w; });
          x += r.sp;
        });
        ctx.restore();
        if (al > 0.99) BOX(`apoio ${i + 1}, linha ${j + 1}`, x0, y - 32, x0 + r.w, y + 12);
      });
    });
  }

  // =====================================================================
  // CENAS
  // =====================================================================
  const CENAS = {};
  const diaTop = (cap) => cap.apY + 70;                  // onde a cena pode começar (abaixo do apoio)
  // a lojinha viva: brota (e 0..1), pisca, pula na batida, olha para `alvo` e sorri (smile 0..1)
  function lojinha(ctx, kind, x, base, w, t, o = {}) {
    const e = o.e ?? 1;
    if (e <= 0.002) return;
    const k = E.outBack(clamp(e), 2.2);
    const pulo = o.pula === false ? 0 : (o.altura ?? 9) * hop(t, o.fase || 0) * clamp(e * 2 - 1);
    const look = o.alvo ? [clamp((o.alvo[0] - x) / 420, -1, 1), clamp((o.alvo[1] - (base - w * 0.75)) / 420, -1, 1)] : (o.look || [0, 0.2]);
    ctx.save(); ctx.translate(x, base); ctx.scale(lerp(0.6, 1, k), k); ctx.translate(-x, -base - pulo);
    shop(ctx, kind, x, base, w, { blink: o.blink ?? blinkAt(t, o.seed || 0), look, smile: o.smile || 0, lit: o.lit ?? 1, swing: o.swing || 0 });
    ctx.restore();
    if (o.box) BOX(o.box, x - w * 0.5, base - w * 1.27, x + w * 0.5, base);
  }
  const ALTURA_LOJA = 1.27;                             // a lojinha (com a placa) tem 1,27 × a largura de altura

  // ---- capa (capítulo 00 = quadro 0): chip, "Tá chegando / no Glória 👀" com os olhinhos piscando, a motinha que
  //      chega freando e derrapando (no quadro 0 ela já está na derrapada, inteira na tela) e confete
  CENAS.capa = {
    setup(cap) {
      const d = cap.diagrama;
      const ls = (S) => -0.03 * S;
      // a largura de uma linha do título (o 👀 vira os olhinhos desenhados)
      cap.linhaW = (ln, S) => { const temOlhos = ln.includes(OLHOS); const tx = ln.replace(OLHOS, '').trimEnd(); return tw(tx, S, 900, ls(S)) + (temOlhos ? tw(' ', S, 900) + OLHOS_W(S) : 0); };
      let S = 176;
      while (S > 40 && cap.titulo.some((l) => cap.linhaW(l, S) > 760)) S -= 1;   // nenhuma linha passa de 72% da largura (778 px)
      const MS = 250;                                       // a motinha da capa
      const chipH = 64, ilH = MS * 1.02;
      const titleH = 0.78 * S + 1.0 * S + 0.2 * S;
      const total = chipH + 50 + titleH + 60 + ilH;
      const top = 960 - total / 2;                          // o bloco centrado no recorte 3:4 (y 240–1680)
      const Ly = {};
      Ly.chipY = top + chipH / 2;
      Ly.b1 = top + chipH + 50 + 0.78 * S; Ly.b2 = Ly.b1 + 1.0 * S;
      Ly.moto = { x: 600, base: top + total };
      Ly.top = top; Ly.bottom = top + total;
      Object.assign(cap, { capaS: S, Ly, motoS: MS });
      cap.apY = Ly.bottom + 80; cap.apX = 540; cap.apAlign = 'center';
      cap.railStart = { x: Ly.moto.x, y: Ly.moto.base - 14 };   // a rua começa debaixo da motinha da capa
      cap.ev.olhos = at(cap, d.olhos && d.olhos.em, cap.t0 + 0.6);
      cap.ev.confete = at(cap, d.confete && d.confete.em, cap.t0 + 1.2);
      cap.ev.buzina = at(cap, d.buzina && d.buzina.em, cap.t1 - 1.4);
      cue(0.0, 'skid'); cue(0.5, 'jump');
      cue(cap.ev.olhos, 'blink'); cue(cap.ev.confete, 'confete'); cue(cap.ev.buzina, 'horn');
      cue(cap.t1 - 1.0, 'railstart');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, Ly = cap.Ly, S = cap.capaS, ev = cap.ev;
      chip(ctx, cap.rotulo, 540, Ly.chipY, { size: 24, align: 'center', ls: 3, h: 64, color: C.coral, box: 'chip' });
      // o confete do "novidade" sai de trás do título
      confete(ctx, t, ev.confete, 540, Ly.b1 - S * 0.3, 7, { n: 46, v: 1000, spread: 3.0 });
      cap.titulo.forEach((ln, i) => {
        const y = i ? Ly.b2 : Ly.b1, col = i ? C.coral : C.tinta, ls = -0.03 * S;
        const w = cap.linhaW(ln, S), x0 = 540 - w / 2;
        const temOlhos = ln.includes(OLHOS), tx = ln.replace(OLHOS, '').trimEnd();
        // o marcador amarelo atrás da palavra-chave
        const mi = d.marcador ? tx.toLowerCase().indexOf(d.marcador.toLowerCase()) : -1;
        if (mi >= 0) {
          const pre = tx.slice(0, mi), mw = tw(tx.slice(mi, mi + d.marcador.length), S, 900, ls), mx = x0 + (pre ? tw(pre, S, 900, ls) + ls : 0);
          marker(ctx, mx, y, mw, S, 1, C.amarelo);
          BOX('palavra-chave', mx, y - S * 0.76, mx + mw, y + S * 0.22);
        }
        // um pulinho do título em cada tempo forte (de leve; no quadro 0 está parado)
        const pulso = 1 + 0.025 * Math.pow(hop(t), 8) * clamp(t / 0.6);
        ctx.save(); ctx.translate(540, y - S * 0.3); ctx.scale(pulso, pulso); ctx.translate(-540, -(y - S * 0.3));
        const wt = txt(ctx, tx, x0, y, { size: S, weight: 900, color: col, ls });
        if (temOlhos) {
          // os olhinhos: no quadro 0 olham para a motinha; depois piscam e olham em volta
          const fase = t - ev.olhos, look = fase < 0 ? [0.5, 0.7] : [0.9 * Math.sin(fase * 2.4), 0.3 * Math.cos(fase * 1.7)];
          const pisca = fase < 0 ? 0 : Math.max(blinkAt(t, 3), fase < 0.18 ? Math.sin(Math.PI * fase / 0.18) : 0);
          olhos(ctx, x0 + wt + tw(' ', S, 900), y, S, pisca, look);
        }
        ctx.restore();
        BOX(`título, linha ${i + 1}`, x0, y - S * 0.76, x0 + w, y + S * 0.22);
      });
      // a motinha (o mascote) chegando da direita: no quadro 0 está freando, inclinada, com fumaça e a marca do pneu
      if (t < cap.t1) {
        const M = Ly.moto, MS = cap.motoS, u = p(t, 0, 0.75);
        const x = M.x + 34 * (1 - E.outCubic(u));
        const tilt = -0.16 * Math.exp(-u * 3.2) * Math.cos(u * 10);
        const buz = p(t, ev.buzina, ev.buzina + 0.4), pulo = 22 * Math.sin(Math.PI * buz) + 3 * hop(t) * clamp(t - 0.8);
        // as marcas do pneu (ficam) e a fumacinha (some)
        ctx.save(); ctx.lineCap = 'round';
        for (const [dy, a] of [[-2, 0.32], [6, 0.18]]) {
          ctx.strokeStyle = css(C.tinta, a); ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(x + MS * 0.22, M.base + dy); ctx.lineTo(Math.min(900, x + MS * 0.22 + 230), M.base + dy); ctx.stroke();
        }
        const fu = clamp(1 - t / 1.1);
        for (let i = 0; i < 5; i++) {
          const ph = clamp(t / 1.1 + i * 0.08), r = 22 + 30 * ph + 6 * i;
          ctx.fillStyle = css(C.cremeDeep, 0.85 * fu); ctx.beginPath(); ctx.arc(x + MS * 0.38 + i * 34 + 40 * ph, M.base - 18 - i * 6 - 30 * ph, r, 0, TAU); ctx.fill();
        }
        ctx.restore();
        moto(ctx, x, M.base - pulo, MS, { dir: -1, tilt, roll: -x / 30, speed: 0.6 * (1 - u) });
        BOX('motinha', x - MS * 0.6, M.base - MS * 0.98, x + MS * 0.55, M.base);
      }
      // figurinhas: brilho e "UAI!" pipocando junto do confete
      sticker(ctx, 'uai', 225, Ly.chipY, 92, p(t, ev.confete + 0.15, ev.confete + 0.5), t);
      sticker(ctx, 'brilho', 855, Ly.chipY, 60, p(t, ev.confete + 0.05, ev.confete + 0.4), t);
    },
  };

  // ---- quem: a logo oficial entra com mola no meio; as lojinhas brotam em volta e formam a praça (com o coreto)
  CENAS.quem = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.logo = at(cap, d.logo.em, cap.t0 + 0.3);
      let prev = ev.logo;
      ev.lojas = d.lojas.map((l) => (prev = Math.max(at(cap, l.em, prev + 0.4), prev + 0.22)));
      ev.confete = Math.max(at(cap, d.confete && d.confete.em, cap.t1 - 0.8), ev.lojas[ev.lojas.length - 1] + 0.3);
      cue(ev.logo, 'logo'); cue(ev.logo + 0.45, 'jump');
      ev.lojas.forEach((x, i) => cue(x, 'sprout', { i }));
      cue(ev.confete, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      const Lg = { x: L.cx, y: top + 205, D: 250 };
      const pos = [{ x: 210, base: top + 300 }, { x: 840, base: top + 300 }, { x: 290, base: top + 565 }, { x: 760, base: top + 565 }];
      const eg = p(t, ev.logo, ev.logo + 0.5);
      // o gramado da praça e o coreto (entram com a logo)
      pop(ctx, eg, Lg.x, top + 520, () => {
        ctx.fillStyle = css(C.verdeLight, 0.55); ctx.beginPath(); ctx.ellipse(Lg.x, top + 520, 400, 70, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = css(C.papel, 0.95); ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(Lg.x, top + 520, 330, 46, 0, 0, TAU); ctx.stroke();
        coreto(ctx, Lg.x, top + 560, 150, t);
        BOX('praça', Lg.x - 75, top + 360, Lg.x + 75, top + 560);
      }, 1.4);
      // as lojinhas brotando em volta, olhando para a logo, piscando e pulando na batida
      d.lojas.forEach((l, i) => {
        const q = pos[i]; if (!q) return;
        const e = p(t, ev.lojas[i], ev.lojas[i] + 0.55);
        lojinha(ctx, l.tipo, q.x, q.base, 150, t, { e, alvo: [Lg.x, Lg.y], seed: i, fase: i * 0.5, smile: clamp((t - ev.confete) * 3), box: e >= 1 ? `lojinha ${l.tipo}` : null });
      });
      // a logo oficial: entra com mola (o arquivo, nunca redesenhada) e respira na batida
      if (eg > 0) {
        const u = p(t, ev.logo, ev.logo + 0.9);
        const k = (1 - Math.exp(-6 * u) * Math.cos(11 * u)) * (1 + 0.02 * Math.pow(hop(t), 6) * u);
        ctx.save(); ctx.globalAlpha *= clamp(u * 6); ctx.translate(Lg.x, Lg.y); ctx.scale(k, k);
        ctx.shadowColor = 'rgba(200,70,30,0.28)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12;
        ctx.beginPath(); ctx.arc(0, 0, Lg.D / 2 - 2, 0, TAU); ctx.fillStyle = C.coral; ctx.fill(); ctx.shadowColor = 'transparent';
        logo(ctx, 0, 0, Lg.D);
        ctx.restore();
        if (u >= 1) BOX('logo oficial', Lg.x - Lg.D / 2, Lg.y - Lg.D / 2, Lg.x + Lg.D / 2, Lg.y + Lg.D / 2);
      }
      sticker(ctx, 'estrela', Lg.x + 150, Lg.y - 110, 66, p(t, ev.logo + 0.4, ev.logo + 0.75), t);
      sticker(ctx, 'coracao', Lg.x - 155, Lg.y + 95, 62, p(t, ev.confete, ev.confete + 0.35), t);
      confete(ctx, t, ev.confete, Lg.x, Lg.y, 11, { n: 44 });
    },
  };

  // ---- vitrine: 4 lojinhas (dormindo) acendem uma a uma, a placa balança e o item de cada uma pula; o docim no fim
  CENAS.vitrine = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      let prev = cap.t0;
      ev.lojas = d.lojas.map((l) => (prev = Math.max(at(cap, l.em, prev + 0.6), prev + 0.25)));
      ev.docim = Math.max(at(cap, d.docim && d.docim.em, cap.t1 - 1), ev.lojas[ev.lojas.length - 1] + 0.4);
      cue(cap.t0 + 0.1, 'pop', { f: 420 });
      ev.lojas.forEach((x, i) => { cue(x, 'light', { i }); cue(x + 0.25, 'jump'); });
      cue(ev.docim, 'heart'); cue(ev.docim + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      const B = top + 380, W_ = 168, xs = [221, 423, 625, 827];
      d.lojas.forEach((l, i) => {
        const x = xs[i], tl = ev.lojas[i], aceso = p(t, tl, tl + 0.3);
        const e = p(t, cap.t0 + 0.05 + i * 0.07, cap.t0 + 0.5 + i * 0.07);
        // o brilho quando acende
        if (aceso > 0) {
          const g = ctx.createRadialGradient(x, B - 110, 10, x, B - 110, 170);
          g.addColorStop(0, css(C.amareloLight, 0.55 * aceso)); g.addColorStop(1, css(C.amareloLight, 0));
          ctx.fillStyle = g; ctx.fillRect(x - 170, B - 280, 340, 300);
        }
        const dorme = 1 - aceso;                          // antes de acender: olhinhos fechados
        lojinha(ctx, l.tipo, x, B, W_, t, { e, lit: 0.12 + 0.88 * aceso, blink: Math.max(0.95 * dorme, blinkAt(t, i + 4)), pula: aceso > 0.5, fase: i * 0.25,
          smile: aceso, alvo: [x, B - 400], swing: 7 * Math.sin((t - tl) * 7) * Math.exp(-Math.max(0, t - tl) * 2.4) * (t > tl ? 1 : 0), box: e >= 1 ? `lojinha ${l.t}` : null });
        // o item da lojinha pula em cima da placa
        if (t >= tl && ITENS[l.item]) {
          const ei = p(t, tl + 0.1, tl + 0.45), y = B - W_ * ALTURA_LOJA - 62 - 26 * hop(t, 0.5 + i * 0.25) * clamp((t - tl - 0.45) * 3);
          pop(ctx, ei, x, y + 30, () => ITENS[l.item](ctx, x, y, 92), 2.4);
          if (ei >= 1) BOX(`item ${l.item}`, x - 48, y - 46, x + 48, y + 40);
        }
        // o nome embaixo
        const ec = E.outCubic(p(t, tl + 0.15, tl + 0.45));
        if (ec > 0) chip(ctx, l.t, x, B + 32, { size: 18, align: 'center', h: 40, pad: 14, ls: 1.5, alpha: ec, border: 'none', bg: C.tinta, color: C.papel, shadow: false, box: ec > 0.99 ? `placa ${l.t}` : null });
      });
      // o docim da sobremesa: o pote pula no meio, com coraçõezinhos e confete
      const ed = p(t, ev.docim, ev.docim + 0.45);
      if (ed > 0) {
        const y = B + 145 - 10 * hop(t) * clamp((t - ev.docim - 0.45) * 3);
        pop(ctx, ed, L.cx, y + 40, () => ITENS.doce(ctx, L.cx, y, 130), 2.6);
        if (ed >= 1) BOX('docim', L.cx - 52, y - 58, L.cx + 52, y + 42);
      }
      sticker(ctx, 'coracao', L.cx - 120, B + 140, 56, p(t, ev.docim + 0.12, ev.docim + 0.45), t);
      sticker(ctx, 'coracao', L.cx + 125, B + 120, 46, p(t, ev.docim + 0.2, ev.docim + 0.55), t);
      confete(ctx, t, ev.docim + 0.05, L.cx, B + 120, 13, { n: 36, v: 850 });
    },
  };

  // ---- pedido: a sacola enche (escolheu), o check (pediu), a motinha cruza, pega a sacola e para na porta (chegou)
  CENAS.pedido = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.sacola = at(cap, d.sacola.em, cap.t0 + 0.3);
      ev.itens = (d.itens || []).map((_, i) => ev.sacola + 0.12 + i * 0.22);
      ev.pedido = Math.max(at(cap, d.pedido.em, ev.sacola + 1), ev.itens[ev.itens.length - 1] + 0.45);
      ev.moto = Math.max(at(cap, d.moto.em, ev.pedido + 0.6), ev.pedido + 0.3);
      ev.pega = ev.moto + 0.42;
      ev.chega = ev.moto + 1.15;
      ev.porta = Math.max(at(cap, d.porta.em, ev.chega), ev.chega - 0.05);
      ev.passos = [ev.sacola + 0.2, ev.pedido, ev.porta + 0.1];
      cue(cap.t0 + 0.15, 'pop', { f: 420 }); cue(ev.sacola, 'pop', { f: 460 });
      ev.itens.forEach((x) => { cue(x, 'drop'); cue(x + 0.28, 'plop'); });
      cue(ev.pedido, 'check'); cue(ev.moto, 'moto', { d: 1.15 }); cue(ev.pega, 'jump'); cue(ev.chega, 'horn'); cue(ev.porta, 'door');
      ev.passos.forEach((x) => cue(x, 'chip'));
      cue(ev.porta + 0.15, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      const rua = top + 400;
      const HX = 792, HW = 236, HK = HW / 220;             // a casinha (cabe inteira antes de x 940)
      const S = { x: 300, bot: rua - 64, w: 170, h: 150 };
      const MS = 200, MX = 520;
      const ec = ent(t, cap.t0 + 0.15, 0.5);
      enter(ctx, ec, L.cx, rua, () => {
        ctx.fillStyle = C.cremeDeep; rr(ctx, L.x0, rua - 52, L.x1 - L.x0, 20, 7); ctx.fill();
        ctx.fillStyle = css('#D9C2A6', 0.8); rr(ctx, L.x0, rua - 32, L.x1 - L.x0, 66, 12); ctx.fill();
        ctx.save(); ctx.setLineDash([32, 24]); ctx.lineWidth = 7; ctx.strokeStyle = C.coral; ctx.beginPath(); ctx.moveTo(L.x0 + 24, rua + 2); ctx.lineTo(L.x1 - 24, rua + 2); ctx.stroke(); ctx.restore();
        casinha(ctx, HX, rua - 46, HW, p(t, ev.porta, ev.porta + 0.45), t);
        BOX('casinha', HX - 120 * HK, rua - 46 - 246 * HK, HX + 120 * HK, rua - 46);
      });
      // a motinha: entra pela esquerda, passa debaixo da sacola (que pula na garupa) e para na porta
      const um = p(t, ev.moto, ev.chega), xm = lerp(L.x0 + 70, MX, E.inOutCubic(um));
      const pegou = t >= ev.pega + 0.25;
      // a sacola: aparece, os itens caem dentro, ganha o check e, quando a motinha passa, pula para a garupa
      const es = ent(t, ev.sacola, 0.45);
      if (es > 0 && !pegou) {
        const uj = p(t, ev.pega, ev.pega + 0.25);
        const k = lerp(1, 0.22, E.inCubic(uj)), jx = lerp(S.x, xm - 0.38 * MS, uj), jy = lerp(S.bot, rua + 20 - 0.45 * MS, uj) - 60 * Math.sin(Math.PI * uj);
        let sq = 0; ev.itens.forEach((x) => { const v = p(t, x + 0.28, x + 0.5); if (v > 0 && v < 1) sq = Math.max(sq, Math.sin(Math.PI * v)); });
        ctx.save(); ctx.translate(jx, jy); ctx.scale(k * (1 + 0.04 * sq), k * (1 - 0.05 * sq)); ctx.translate(-S.x, -S.bot);
        enter(ctx, es, S.x, S.bot, () => {
          const tp = S.bot - S.h;
          ctx.strokeStyle = C.coralDark; ctx.lineWidth = 10; ctx.lineCap = 'round';
          for (const dx of [-38, 38]) { ctx.beginPath(); ctx.moveTo(S.x + dx - 22, tp + 4); ctx.bezierCurveTo(S.x + dx - 22, tp - 56, S.x + dx + 22, tp - 56, S.x + dx + 22, tp + 4); ctx.stroke(); }
          // os itens caindo (por trás da frente da sacola)
          (d.itens || []).forEach((it, i) => {
            const t0 = ev.itens[i]; if (t < t0 || !ITENS[it]) return;
            const v = p(t, t0, t0 + 0.3), y = lerp(top + 40, tp - 18, E.inCubic(v)), x = S.x + (i - 1) * 40;
            ctx.save(); ctx.translate(x, y); ctx.rotate((i - 1) * 0.25 * v); ITENS[it](ctx, 0, 0, 84); ctx.restore();
          });
          ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(S.x - S.w / 2, tp); ctx.lineTo(S.x + S.w / 2, tp); ctx.lineTo(S.x + S.w / 2 + 10, S.bot); ctx.lineTo(S.x - S.w / 2 - 10, S.bot); ctx.closePath();
          ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
          ctx.fillStyle = C.coral; ctx.fillRect(S.x - S.w / 2, tp, S.w, 22);
          logo(ctx, S.x, tp + 22 + (S.h - 22) / 2, Math.min(100, S.h - 36));
        });
        ctx.restore();
        if (uj === 0 && es >= 1) BOX('sacola', S.x - S.w / 2 - 10, S.bot - S.h - 56, S.x + S.w / 2 + 10, S.bot);
        check(ctx, S.x + S.w / 2 + 2, S.bot - S.h + 6, 34, p(t, ev.pedido, ev.pedido + 0.4) * (1 - uj), { box: uj === 0 && t >= ev.pedido + 0.4 ? 'check' : null });
      }
      if (t >= ev.moto - 0.05) {
        const sp = Math.sin(Math.PI * um);
        const bob = um >= 1 ? 3 * hop(t) : -3 * Math.abs(Math.sin(t * 22)) * sp;
        ctx.save(); ctx.globalAlpha *= clamp((t - ev.moto + 0.05) / 0.2);
        if (sp > 0.1) for (let i = 0; i < 4; i++) { const ph = (t * 3 + i / 4) % 1; ctx.fillStyle = css(C.cremeDeep, 0.6 * (1 - ph) * sp); ctx.beginPath(); ctx.arc(xm - 120 - ph * 70, rua + 10 - ph * 25, 10 + 12 * ph, 0, TAU); ctx.fill(); }
        moto(ctx, xm, rua + 20 + bob, MS, { dir: 1, tilt: -0.04 * sp, roll: xm / 18, speed: sp });
        ctx.restore();
        if (um >= 1) BOX('motinha', MX - MS * 0.55, rua + 20 - MS * 0.98, MX + MS * 0.6, rua + 20);
      }
      // os 3 passos: ESCOLHEU · PEDIU · CHEGOU, cada um com o check quando acontece
      const passos = d.passos || [], sz = 24, gap = 18;
      const ws = passos.map((s) => 2 * 18 + 34 + 10 + tw(s, sz, 800, 2));
      let x = L.cx - (ws.reduce((a, b) => a + b, 0) + gap * (passos.length - 1)) / 2;
      const y = rua + 112;
      passos.forEach((s, i) => {
        const e = p(t, ev.passos[i], ev.passos[i] + 0.35);
        if (e > 0) {
          const xx = x;
          pop(ctx, e, xx + ws[i] / 2, y, () => {
            chip(ctx, s, xx, y, { size: sz, h: 60, pad: 18, ls: 2, w: ws[i], bg: C.verde, color: C.branco, border: 'none', box: e >= 1 ? `passo ${s}` : null });
            check(ctx, xx + ws[i] - 18 - 17, y, 17, clamp(e * 1.5 - 0.3), { bg: C.verdeDark });
          }, 2.2);
        }
        x += ws[i] + gap;
      });
      sticker(ctx, 'coracao', HX + 18, rua - 330, 58, p(t, ev.porta + 0.15, ev.porta + 0.5), t);
      confete(ctx, t, ev.porta + 0.15, HX, rua - 200, 17, { n: 30, v: 800 });
    },
  };

  // ---- aperto: 3 chips com ícone (fila, sol, pijama) pulam com "boing" e são riscados um a um; embaixo, a entrega em casa
  CENAS.aperto = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      let prev = cap.t0 + 0.1;
      ev.chips = d.chips.map((c) => (prev = Math.max(at(cap, c.em, prev + 0.5), prev + 0.35)));
      ev.casa = ev.chips[ev.chips.length - 1] + 0.55;
      ev.chips.forEach((x) => { cue(x, 'jump'); cue(x + 0.32, 'strike'); });
      cue(ev.casa, 'pop', { f: 520 }); cue(ev.casa + 0.3, 'door');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      d.chips.forEach((c, i) => {
        const t0 = ev.chips[i], e = p(t, t0, t0 + 0.4);
        if (e <= 0) return;
        const y = top + 60 + i * 108, sz = 38;
        const w = 2 * 30 + sz * 1.35 + 10 + tw(c.t, sz, 800, 2), x = L.cx - w / 2;
        const rk = E.outCubic(p(t, t0 + 0.32, t0 + 0.55));
        const tremida = 4 * Math.sin((t - t0 - 0.32) * 40) * Math.exp(-Math.max(0, t - t0 - 0.32) * 8) * (t > t0 + 0.32 ? 1 : 0);
        ctx.save(); ctx.translate(tremida, 0);
        pop(ctx, e, L.cx, y, () => {
          chip(ctx, c.t, x, y, { size: sz, h: 88, pad: 30, ls: 2, w, icon: c.icone, color: mixHex(C.tinta, C.cinza, 0.4 * rk), iconColor: C.coral, box: e >= 1 ? `chip ${c.t}` : null });
          if (rk > 0) {
            ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 8; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x + 14, y + 6); ctx.lineTo(x + 14 + (w - 28) * rk, y - 6); ctx.stroke(); ctx.restore();
          }
        }, 2.3);
        ctx.restore();
      });
      // a entrega em casa: a casinha abre, a motinha está na porta e a lojinha comemora
      const base = Math.min(1436, top + 570), ea = p(t, ev.casa, ev.casa + 0.5);
      if (ea > 0) {
        pop(ctx, ea, 690, base, () => { casinha(ctx, 690, base, 210, p(t, ev.casa + 0.3, ev.casa + 0.7), t); }, 1.8);
        lojinha(ctx, 'padaria', 250, base, 130, t, { e: p(t, ev.casa + 0.1, ev.casa + 0.6), alvo: [690, base - 120], smile: 1, seed: 7 });
        const xm = lerp(330, 470, E.outCubic(p(t, ev.casa + 0.05, ev.casa + 0.7)));
        ctx.save(); ctx.globalAlpha *= clamp(ea * 3); moto(ctx, xm, base - 3 * hop(t), 150, { dir: 1, roll: xm / 14 }); ctx.restore();
        if (ea >= 1) BOX('entrega em casa', 185, base - 230, 805, base);
      }
      sticker(ctx, 'brilho', 845, base - 250, 52, p(t, ev.casa + 0.45, ev.casa + 0.8), t);
    },
  };

  // ---- minas: os morros de Minas sobem, as lojinhas brotam juntas e sorriem, o selo "do Glória" é carimbado e o coração bate
  CENAS.minas = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.morros = at(cap, d.montanhas.em, cap.t0 + 0.3);
      ev.lojas = Math.max(at(cap, d.lojas.em, ev.morros + 0.6), ev.morros + 0.3);
      ev.selo = Math.max(at(cap, d.selo.em, ev.lojas + 0.6), ev.lojas + 0.35);
      ev.coracao = Math.max(at(cap, d.coracao.em, cap.t1 - 1), ev.selo + 0.45);
      cue(ev.morros, 'grow', { d: 0.5 }); [0, 1, 2].forEach((i) => cue(ev.lojas + i * 0.1, 'sprout', { i }));
      cue(ev.selo, 'stamp'); cue(ev.coracao, 'heart'); cue(ev.coracao + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      const chao = Math.min(1436, top + 570);
      // os morros (três camadas de verde) sobem do chão
      const em = E.outBack(p(t, ev.morros, ev.morros + 0.7), 1.4);
      if (em > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(L.x0 - 40, top, L.x1 - L.x0 + 80, chao - top - 60); ctx.clip();
        const camadas = [[C.verdeLight, 0.75, [[L.x0 - 40, 170], [330, 300], [560, 210], [800, 330], [L.x1 + 40, 230]]],
          [C.verde, 0.9, [[L.x0 - 40, 120], [250, 230], [470, 140], [690, 250], [L.x1 + 40, 150]]],
          [C.verdeDark, 0.85, [[L.x0 - 40, 60], [380, 120], [620, 70], [L.x1 + 40, 110]]]];
        camadas.forEach(([cor, a, pts], j) => {
          const base = chao - 60, h = em * (1 - j * 0.04);
          ctx.fillStyle = css(cor, a); ctx.beginPath(); ctx.moveTo(pts[0][0], base);
          pts.forEach(([x, hh], i) => { const nx = pts[i + 1]; if (!nx) { ctx.lineTo(x, base - hh * h); return; } const mx = (x + nx[0]) / 2; ctx.quadraticCurveTo(x, base - hh * h, mx, base - (hh + nx[1]) / 2 * h); });
          ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = css(C.verdeLight, 0.6 * clamp(em)); rr(ctx, L.x0, chao - 64, L.x1 - L.x0, 30, 15); ctx.fill();
        if (em >= 1) BOX('morros', L.x0, chao - 400, L.x1, chao - 34);
      }
      // as lojinhas juntas, pulando na mesma batida e sorrindo
      ['padaria', 'mercado', 'farmacia'].forEach((k, i) => {
        const e = p(t, ev.lojas + i * 0.1, ev.lojas + i * 0.1 + 0.55), x = [255, 525, 795][i];
        lojinha(ctx, k, x, chao - 40, 160, t, { e, alvo: [430, top + 150], smile: clamp((t - ev.lojas - 0.3) * 2), seed: i + 9, altura: 12 });
        if (e >= 1) BOX(`lojinha ${k}`, x - 80, chao - 40 - 160 * ALTURA_LOJA, x + 80, chao - 40);
      });
      // o selo "do Glória" carimbado
      const es = p(t, ev.selo, ev.selo + 0.4), sx = 790, sy = top + 115, sr = 80;
      if (es > 0) {
        const k = lerp(1.7, 1, E.outCubic(es)), r = -10 * DEG + 18 * DEG * (1 - E.outCubic(es));
        ctx.save(); ctx.globalAlpha *= clamp(es * 2.5); ctx.translate(sx, sy); ctx.rotate(r); ctx.scale(k, k); selo(ctx, 0, 0, sr, d.selo.t); ctx.restore();
        if (es >= 1) BOX('selo', sx - sr - 6, sy - sr - 6, sx + sr + 6, sy + sr + 6);
      }
      // o coração que bate na batida
      const ec = p(t, ev.coracao, ev.coracao + 0.45);
      if (ec > 0) {
        const cx = 400, cy = top + 125, bate = 1 + 0.08 * Math.pow(hop(t), 10) * clamp((t - ev.coracao - 0.45) * 3);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(bate, bate); ctx.translate(-cx, -cy);
        sticker(ctx, 'coracao', cx, cy, 150, ec, 0);
        ctx.restore();
        if (ec >= 1) BOX('coração', cx - 80, cy - 70, cx + 80, cy + 70);
      }
      confete(ctx, t, ev.coracao + 0.05, 400, top + 125, 19, { n: 36, v: 850 });
      sticker(ctx, 'estrela', 590, top + 60, 50, p(t, ev.coracao + 0.2, ev.coracao + 0.5), t);
    },
  };

  // ---- comenta: a lojinha-mistério ("?") olha para cima e os balões de comentário brotam, com emoji e figurinha
  CENAS.comenta = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.loja = at(cap, d.loja && d.loja.em, cap.t0 + 0.3);
      let prev = cap.t0;
      ev.baloes = d.baloes.map((b) => (prev = Math.max(at(cap, b.em, prev + 0.6), prev + 0.4)));
      ev.loja = Math.min(ev.loja, ev.baloes[0] + 0.2);
      cue(ev.loja, 'sprout', { i: 1 }); cue(ev.loja + 0.3, 'jump');
      ev.baloes.forEach((x, i) => { cue(x, 'pop', { f: 640 + 90 * i }); cue(x + 0.25, 'tick'); });
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, top = Math.max(diaTop(cap), 860);
      const base = Math.min(1436, top + 570);
      const pos = [{ x: 300, y: top + 70, dir: 1 }, { x: 735, y: top + 175, dir: -1 }, { x: 290, y: top + 285, dir: 1 }];
      // os balões
      d.baloes.forEach((b, i) => {
        const q = pos[i]; if (!q) return;
        const e = p(t, ev.baloes[i], ev.baloes[i] + 0.4);
        if (e <= 0) return;
        const fl = 5 * Math.sin((t - ev.baloes[i]) * 2.4 + i);
        const sz = 38, ew = 48, w = 34 + ew + 12 + tw(b.t, sz, 800, 0) + 30, h = 88;
        const x0 = q.x - w / 2, y0 = q.y - h / 2 + fl;
        pop(ctx, e, q.x, q.y + h / 2, () => {
          ctx.save();
          ctx.shadowColor = 'rgba(120,60,30,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
          rr(ctx, x0, y0, w, h, h / 2); ctx.fillStyle = C.papel; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 4; ctx.strokeStyle = C.coral; ctx.stroke();
          // o biquinho aponta para a lojinha (embaixo, no meio)
          const bx = q.x + q.dir * w * 0.18;
          ctx.beginPath(); ctx.moveTo(bx - 16, y0 + h - 2); ctx.lineTo(bx + q.dir * 26, y0 + h + 26); ctx.lineTo(bx + 16, y0 + h - 2); ctx.closePath();
          ctx.fillStyle = C.papel; ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 16, y0 + h); ctx.lineTo(bx + q.dir * 26, y0 + h + 26); ctx.lineTo(bx + 16, y0 + h); ctx.stroke();
          txt(ctx, b.emoji || '', x0 + 34, y0 + h / 2 + 15, { size: 40, weight: 500 });
          txt(ctx, b.t, x0 + 34 + ew + 12, y0 + h / 2 + 13, { size: sz, weight: 800, color: C.tinta });
          ctx.restore();
        }, 2.4);
        if (e >= 1) BOX(`balão ${b.t}`, x0, q.y - h / 2 - 6, x0 + w, q.y + h / 2 + 32);
        sticker(ctx, ['coracao', 'estrela', 'brilho'][i % 3], q.dir > 0 ? x0 + w + 6 : x0 - 6, y0 + 4, 44, p(t, ev.baloes[i] + 0.2, ev.baloes[i] + 0.5), t);
      });
      // a lojinha-mistério: a placa com "?", olha para os balões
      const el = p(t, ev.loja, ev.loja + 0.55), alvo = ev.baloes.reduce((a, x, i) => (t >= x ? [pos[i].x, pos[i].y] : a), [525, top]);
      lojinha(ctx, 'misterio', 640, base, 190, t, { e: el, alvo, seed: 12, smile: 0.5, swing: 5 * Math.sin(t * 4), box: el >= 1 ? 'lojinha ?' : null });
    },
  };

  // ---- fecho: título "Em breve / no Glória.", a LOGO OFICIAL grande e fixa, a assinatura "Tudo pertim de você.",
  //      o chip "Segue @uaipertim" com seta e o confete final (que termina antes dos 3 últimos segundos)
  CENAS.fecho = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.logo = Math.min(at(cap, d.logo && d.logo.em, cap.t0 + 0.4), DUR - 3.0 - 0.9);
      ev.ass = Math.min(Math.max(at(cap, d.assinatura && d.assinatura.em, ev.logo + 0.8), ev.logo + 0.5), DUR - 3.0 - 0.5);
      ev.chip = Math.min(Math.max(at(cap, d.chip && d.chip.em, cap.t0 + 3), ev.ass + 0.4), DUR - 3.0 - 0.75);
      ev.seta = ev.chip + 0.15;
      ev.confete = Math.min(at(cap, d.confete && d.confete.em, ev.logo + 0.9), DUR - 3.0 - 2.0);
      FECHO.logo = { entra: ev.logo, parada: ev.logo + 0.9 };
      FECHO.ultima = Math.max(cap.t0 + 0.7, ev.logo + 0.9, ev.ass + 0.45, ev.chip + 0.45, ev.seta + 0.55, ev.confete + 2.0, ...cap.apoios.map((a) => a.t + 0.34));
      cue(ev.logo, 'logo'); cue(ev.ass, 'tick'); cue(ev.chip, 'pop', { f: 700 }); cue(ev.seta, 'whoosh'); cue(ev.confete, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev;
      const top = Math.max(cap.tb[1] + 0.25 * cap.ts + 40, 790);
      const D = 360, ly = top + D / 2 + 10;
      confete(ctx, t, ev.confete, L.cx, ly - 40, 23, { n: 60, v: 1100, dur: 2.0, spread: 3.2 });
      // a logo oficial: entra com mola e PARA (fica fixa até o fim)
      const e = p(t, ev.logo, ev.logo + 0.9);
      if (e > 0) {
        const k = e >= 1 ? 1 : E.outBack(clamp(e / 0.75), 1.8);
        ctx.save(); ctx.globalAlpha *= clamp(e * 4);
        ctx.translate(L.cx, ly); ctx.scale(k, k);
        ctx.shadowColor = 'rgba(200,70,30,0.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
        ctx.beginPath(); ctx.arc(0, 0, D / 2 - 2, 0, TAU); ctx.fillStyle = C.coral; ctx.fill(); ctx.shadowColor = 'transparent';
        logo(ctx, 0, 0, D);
        ctx.restore();
        if (e >= 1) BOX('logo oficial', L.cx - D / 2, ly - D / 2, L.cx + D / 2, ly + D / 2);
      }
      // a assinatura: "Tudo pertim de você."
      const ea = E.outCubic(p(t, ev.ass, ev.ass + 0.45));
      const ay = ly + D / 2 + 72;
      if (ea > 0 && d.assinatura) {
        const s1 = 'Tudo ', s2 = d.assinatura.t.replace(/^Tudo\s+/, ''), sz = 46;
        const w1 = tw(s1, sz, 900, -0.5), w2 = tw(s2, sz, 900, -0.5), x0 = L.cx - (w1 + w2) / 2;
        ctx.save(); ctx.globalAlpha *= ea; ctx.translate(0, 14 * (1 - ea));
        marker(ctx, x0 + w1, ay, w2 - sz * 0.25, sz, E.outCubic(p(t, ev.ass + 0.15, ev.ass + 0.5)), css(C.amarelo, 0.9));
        txt(ctx, s1, x0, ay, { size: sz, weight: 900, color: C.tinta, ls: -0.5 });
        txt(ctx, s2, x0 + w1, ay, { size: sz, weight: 900, color: C.coral, ls: -0.5 });
        ctx.restore();
        if (ea >= 1) BOX('assinatura', x0, ay - sz * 0.76, x0 + w1 + w2, ay + sz * 0.22);
      }
      // o chip "Segue @uaipertim" e a seta
      const cy = ay + 100, ec = p(t, ev.chip, ev.chip + 0.45);
      if (ec > 0) {
        const s = d.chip.t, w = 2 * 30 + tw(s, 38, 800, 0);
        pop(ctx, ec, L.cx, cy, () => chip(ctx, s, L.cx, cy, { size: 38, weight: 800, ls: 0, h: 88, pad: 30, align: 'center', bg: C.coral, color: C.branco, border: 'none', box: ec >= 1 ? 'chip Segue' : null }), 2);
        const es = E.outCubic(p(t, ev.seta, ev.seta + 0.55));
        if (es > 0) {
          const x1 = L.cx - w / 2 - 18, y1 = cy, x0 = L.x0 + 10, y0 = cy - 150;
          const cxp = x0 - 10, cyp = cy + 10;
          ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(x0, y0);
          for (let u = 0.02; u <= es + 1e-6; u += 0.02) { const v = 1 - u; ctx.lineTo(v * v * x0 + 2 * v * u * cxp + u * u * x1, v * v * y0 + 2 * v * u * cyp + u * u * y1); }
          ctx.stroke();
          if (es > 0.95) { ctx.beginPath(); ctx.moveTo(x1 - 22, y1 - 16); ctx.lineTo(x1, y1); ctx.lineTo(x1 - 24, y1 + 14); ctx.stroke(); }
          ctx.restore();
          if (es >= 1) BOX('seta', x0 - 10, y0, x1 + 4, cy + 20);
        }
      }
    },
  };

  // =====================================================================
  // O QUADRO
  // =====================================================================
  function drawChap(ctx, cap, t) {
    const tipo = cap.diagrama.tipo;
    if (tipo !== 'capa') header(ctx, cap, t);
    CENAS[tipo].draw(ctx, cap, t);
    drawApoio(ctx, cap, t);
  }
  function frame(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = 'transparent';
    const cam = camera(t);
    background(ctx, t, cam);
    ctx.save();
    // nada passa pela coluna de botões do Reels
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(BTN.x, BTN.y0, W - BTN.x, BTN.y1 - BTN.y0); ctx.clip('evenodd');
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    drawRail(ctx, t, cam, 'rua');                     // a rua por baixo das cenas
    ctx.restore();
    for (let k = 0; k < NC; k++) {
      const top = k * STEP - cam.y, c = CAPS[k];
      if (top >= H || top <= -H) continue;
      if (t < c.t0 - TR - 0.02 || t > c.t1 + TR + 0.02) continue;   // só o capítulo atual (e o vizinho, durante a troca)
      ctx.save(); ctx.translate(-cam.x, top);
      OFF = { dx: -cam.x, dy: top, n: k };
      drawChap(ctx, CAPS[k], t);
      ctx.restore();
    }
    OFF = { dx: 0, dy: 0, n: -1 };
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    drawRail(ctx, t, cam, 'moto');                    // a motinha passa na frente das cenas
    ctx.restore();
    ctx.restore();
    brand(ctx);
  }
  let bufS = null, bufA = null;
  function renderAt(ctx, t, o = {}) {
    if (ctx.canvas.width !== W || ctx.canvas.height !== H) { ctx.canvas.width = W; ctx.canvas.height = H; }
    t = clamp(t, 0, DUR - 1e-4);
    const w = where(t);
    const blur = !o.noBlur && w.trans && w.u > 0.08 && w.u < 0.92;
    if (!blur) { frame(ctx, t); return; }
    if (!bufS) { const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }; bufS = mk(); bufA = mk(); }
    const sctx = bufS.getContext('2d'), actx = bufA.getContext('2d'), n = 4;
    for (let k = 0; k < n; k++) {
      frame(sctx, clamp(t + (k / (n - 1) - 0.5) / 110, 0, DUR - 1e-4));
      actx.globalAlpha = 1 / (k + 1); actx.drawImage(bufS, 0, 0);
    }
    actx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(bufA, 0, 0);
  }

  // =====================================================================
  // INÍCIO
  // =====================================================================
  function init(img, linha) {
    LOGO = img; LN = linha; DUR = linha.duracao; TR = linha.tr; CUES = []; AVISOS.length = 0; BT = 60 / (linha.bpm || 120);
    M = document.createElement('canvas').getContext('2d');
    CAPS = linha.capitulos.map((c) => ({ ...c, ev: {} }));
    NC = CAPS.length;
    CAPS.forEach((cap, k) => {
      if (!CENAS[cap.diagrama.tipo]) throw new Error('tipo de cena desconhecido: ' + cap.diagrama.tipo);
      if (cap.diagrama.tipo !== 'capa') layoutTitulo(cap);
      CENAS[cap.diagrama.tipo].setup(cap, k);
      if (k > 0) { cue(CAPS[k - 1].t1, 'trans', { d: TR, k }); cue(cap.t0 - 0.1, 'node', { k }); tituloT(cap).forEach((x, i) => cue(x, 'punch', { i })); }
      cap.apoios.forEach((a, i) => { if (k > 0 || i > 0) cue(a.t, 'apoio'); });
    });
    RAIL = buildRail();
    CUES.sort((a, b) => a.t - b.t);
  }

  function caixas(ctx, t) {
    BOXES = [];
    frame(ctx, t);
    const out = BOXES; BOXES = null;
    return out;
  }

  window.TUDO = {
    init, renderAt, W, H,
    get DURATION() { return DUR; },
    cues: () => ({ duration: DUR, capitulos: CAPS.map((c) => ({ n: c.n, rotulo: c.rotulo, tipo: c.diagrama.tipo, t0: c.t0, t1: c.t1, voz_t0: c.voz_t0, voz_t1: c.voz_t1, ev: c.ev })), cues: CUES.map((c) => ({ ...c, t: Math.round(c.t * 1e4) / 1e4 })) }),
    apoios: () => CAPS.flatMap((c) => c.apoios.map((a, i) => ({ cap: c.n, i: i + 1, texto: plain(a.texto), entra: a.t, inteira_de: a.t + 0.34, ate: c.apoios[i + 1] ? c.apoios[i + 1].t : a.ate,
      linhas: apoioRows(c, a).map((r) => r.words.map((w) => w.s).join(' ')) }))),
    fecho: () => ({ ultima_mudanca_de_texto: FECHO.ultima, duracao: DUR, logo: FECHO.logo, t0: CAPS[NC - 1].t0, t1: CAPS[NC - 1].t1 }),
    trocas: () => CAPS.slice(0, -1).map((c, k) => ({ de: k, para: k + 1, t0: c.t1, t1: CAPS[k + 1].t0 })),
    avisos: () => AVISOS.slice(),
    capa: () => { const c = CAPS[0]; return { tamanho: c.capaS, linhas: c.titulo.map((l) => tw(l, c.capaS, 900, -0.03 * c.capaS)) }; },
    caixas,
    montagens: () => CAPS.map((c) => {
      const ts = Object.values(c.ev).flat().flatMap((v) => (typeof v === 'number' ? [v] : typeof v === 'object' && v ? Object.values(v).filter((x) => typeof x === 'number') : [])).filter((x) => x >= c.t0 - 0.5 && x <= c.t1 + 0.5);
      return { n: c.n, t0: c.t0, t1: c.t1, primeira: ts.length ? Math.min(...ts) : c.t0, ultima: ts.length ? Math.max(...ts) : c.t1 };
    }),
  };
})();
