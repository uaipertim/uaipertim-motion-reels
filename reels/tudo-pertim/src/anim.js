/*
 * TUDO PERTIM (UaiPertim · TikTok) — motor de vídeos em capítulos, 45–60 s. Nasceu do motor da EXPLICA, SÔ!
 * (reels/explica-so/src/anim.js), com a cara mais jovem e animada da série do TikTok.
 *
 * O episódio inteiro vem de episodios/<id>.json, já com o tempo da narração (audio/<id>/linha.json, de scripts/linha.py).
 * Cada capítulo é um quadro de 1080×1920, sempre no mesmo lugar (sem câmera nem estrada). Na troca, a MOTINHA AMARELA
 * (o mascote, sempre com a sacola da marca) atravessa a tela na horizontal e a passagem dela varre o capítulo atual e
 * revela o próximo (wipe). Uma barra de progresso estilo stories fica abaixo da marca do topo. O rótulo (adesivo
 * inclinado) faz "plop" e o título (2 linhas, centralizado) entra com "soco" no tempo da batida
 * (linha.json → bpm), a linha de apoio muda a cada frase e a CENA cresce peça por peça no tempo da voz.
 *
 * O que é vivo: as lojinhas com olhinhos piscam, pulam na batida, sorriem e olham para o que acontece; figurinhas
 * (estrela, coração, brilho, "UAI!") pipocam; confete nos destaques; balões de fala; chips com ícones riscados.
 *
 * Cenas (CENAS): capa · quem · vitrine · pedido · aperto · minas · comenta · fecho (e as de cada episódio, abaixo). Nunca telas, celulares ou
 * interface de app; nunca nomes de lojas reais (só categorias).
 *
 * Regras de quadro: conteúdo entre x 80–940 e y 265–1456; nada (nem a motinha da troca) em x ≥ 940 entre y 1060 e 1560;
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
  // o quadro de um capítulo: título e apoio centrados em x 540 (até 780 px de largura); cena entre x 90 e 930
  const L = { x0: 90, x1: 930, cx: 510, tx: 540, tw: 780, rotY: 452, tituloTopo: 505, progY: 392 };
  const BTN = { x: 940, y0: 1060, y1: 1560 };          // a coluna de botões (nada passa por ali)
  const STEP = 1400;                                    // só para a mistura do tom de fundo entre capítulos

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
  const CURTAS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'de', 'da', 'do', 'das', 'dos', 'no', 'na', 'nos', 'nas', 'em', 'ao', 'pra', 'pro', 'que', 'se']);
  const isEmoji = (s) => /\p{Extended_Pictographic}/u.test(s) && !/[\p{L}\p{N}]/u.test(s);
  // palavras (com estilo) -> unidades inquebráveis: as duas últimas palavras de cada frase, "pertim de você",
  // "do/no Glória" e o emoji grudado na palavra anterior
  function unidades(words) {
    const n = words.length, cola = new Array(n).fill(false);   // cola[i]: a palavra i fica junto da i+1
    const ns = words.map((w) => norm(w.s));
    for (const fr of JUNTOS) for (let i = 0; i + fr.length <= n; i++) if (fr.every((x, k) => ns[i + k] === x)) for (let k = 0; k < fr.length - 1; k++) cola[i + k] = true;
    for (let i = 1; i < n; i++) if (isEmoji(words[i].s)) cola[i - 1] = true;
    // artigo ou palavra curta (o, a, e, de, do, no, pra…) fica junto da palavra seguinte: nunca sozinha no fim da linha
    for (let i = 0; i + 1 < n; i++) if (CURTAS.has(ns[i]) && !/[.?!…,;:]["”’)]*$/.test(words[i].s)) cola[i] = true;
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
        const score = Math.abs(wa - wb) - (/[,;:]$/.test(ult) ? 0.35 * maxW : 0) - (/[.?!…]["”’)]*$/.test(ult) ? 0.45 * maxW : 0);   // depois de ? ! . … é a melhor quebra
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
    sorveteria: { wall: '#FBD9CB', wallDark: '#E9A890', a: C.coral, b: '#FFFFFF', door: C.coralDark },
    acougue: { wall: '#FBF6EE', wallDark: '#E2D6C2', a: '#D8402A', b: '#FFFFFF', door: C.coralDark },
    hortifruti: { wall: '#A9D48C', wallDark: '#7DB35E', a: C.coral, b: '#FFFFFF', door: C.verdeDark },
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
    } else if (kind === 'acougue') {                   // a carne com o ossinho
      ctx.fillStyle = '#B8473A'; ctx.beginPath(); ctx.ellipse(-4, 2, 26, 17, -0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = C.papel; ctx.beginPath(); ctx.ellipse(-8, 0, 9, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.papel; rr(ctx, 16, -6, 18, 8, 4); ctx.fill(); ctx.beginPath(); ctx.arc(34, -6, 5, 0, TAU); ctx.arc(34, 2, 5, 0, TAU); ctx.fill();
    } else if (kind === 'hortifruti') {                // a maçã com a folhinha e a cenoura
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(-11, 3, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = C.verde; ctx.beginPath(); ctx.ellipse(-6, -15, 8, 4, -0.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F08A2C'; ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(30, -2); ctx.lineTo(12, 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.verde; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(6, -16); ctx.moveTo(12, -6); ctx.lineTo(16, -17); ctx.stroke();
    } else if (kind === 'sorveteria') {                // a casquinha
      ctx.fillStyle = C.madeira; ctx.beginPath(); ctx.moveTo(-13, -2); ctx.lineTo(13, -2); ctx.lineTo(0, 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.arc(0, -8, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(-5, -13, 4, 0, TAU); ctx.fill();
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
    const enrola = o.toldo !== undefined && o.toldo < 1;   // o toldo abrindo (o.toldo 0..1): desce a partir da barra
    if (enrola) { ctx.save(); ctx.translate(0, 76); ctx.scale(1, Math.max(0.001, o.toldo)); ctx.translate(0, -76); }
    for (let i = 0; i < st; i++) {
      const x = 8 + i * sw;
      ctx.beginPath(); ctx.moveTo(x, 76); ctx.lineTo(x + sw, 76); ctx.lineTo(x + sw, 100); ctx.ellipse(x + sw / 2, 100, sw / 2, sw / 2.4, 0, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? s.a : s.b; ctx.fill();
    }
    if (enrola) ctx.restore();
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
  function itemPaoQueijo(ctx, x, y, s) {                    // o pão de queijo: bolinha dourada, com a casquinha rachada
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#E8B04F'; ctx.beginPath(); ctx.ellipse(0, 4, 40, 34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F6CF73'; ctx.beginPath(); ctx.ellipse(-4, -2, 32, 26, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#D18F35'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16, -8); ctx.quadraticCurveTo(-2, -16, 12, -6); ctx.stroke();
    ctx.fillStyle = css(C.papel, 0.7); ctx.beginPath(); ctx.ellipse(-14, -12, 7, 4, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function itemTomate(ctx, x, y, s) {
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.ellipse(0, 4, 42, 36, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.ellipse(10, 10, 26, 22, 0, 0, TAU); ctx.globalAlpha *= 0.35; ctx.fill(); ctx.globalAlpha /= 0.35;
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.ellipse(-16, -8, 9, 6, -0.5, 0, TAU); ctx.globalAlpha *= 0.7; ctx.fill(); ctx.globalAlpha /= 0.7;
    ctx.fillStyle = C.verde; starPath(ctx, 0, -30, 18, 5, 0.4); ctx.fill(); rr(ctx, -3, -44, 6, 14, 3); ctx.fill();
    ctx.restore();
  }
  function itemPicole(ctx, x, y, s, cor = C.coral) {         // o picolé com a mordidinha
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.madeira; rr(ctx, -6, 20, 12, 36, 5); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(-60, -80, 120, 160); ctx.moveTo(35, -42); ctx.arc(24, -42, 11, 0, TAU); ctx.clip('evenodd');   // a mordidinha
    ctx.fillStyle = cor; rr(ctx, -26, -46, 52, 72, 22); ctx.fill();
    ctx.fillStyle = css(C.papel, 0.55); rr(ctx, -16, -36, 9, 44, 4); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function itemCasquinha(ctx, x, y, s) {
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.madeira; ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(26, -6); ctx.lineTo(0, 52); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.madeiraDark; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-16, 4); ctx.lineTo(8, 34); ctx.moveTo(14, 2); ctx.lineTo(-8, 30); ctx.stroke();
    ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.arc(-12, -16, 20, 0, TAU); ctx.arc(12, -16, 20, 0, TAU); ctx.arc(0, -32, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(0, -52, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function itemEspeto(ctx, x, y, s) {                       // o espetinho: palito com carne, pimentão e cebola
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-0.5);
    ctx.fillStyle = C.madeira; rr(ctx, -4, -64, 8, 132, 4); ctx.fill();
    [['#8A4A1C', -44], [C.verde, -22], ['#8A4A1C', 0], [C.coral, 22], ['#8A4A1C', 44]].forEach(([cor, yy]) => { ctx.fillStyle = cor; rr(ctx, -17, yy - 10, 34, 20, 7); ctx.fill(); });
    ctx.restore();
  }
  const ITENS = { queijo: itemQueijo, pao: itemPao, doce: itemDoce, cesta: itemCesta, remedio: itemRemedio, lanche: itemLanche,
    paoQueijo: itemPaoQueijo, tomate: itemTomate, picole: itemPicole, casquinha: itemCasquinha, espeto: itemEspeto };

  // o relógio despertador (ícone, sem texto): (x, y) = o centro do mostrador, r = o raio; hora em horas (7.5 = 7h30)
  function relogio(ctx, x, y, r, hora, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
    ctx.lineCap = 'round';
    // os sininhos, o martelinho e as perninhas
    ctx.fillStyle = C.amarelo; ctx.strokeStyle = C.amareloDark; ctx.lineWidth = r * 0.05;
    for (const sx of [-1, 1]) { ctx.save(); ctx.rotate(sx * 0.62); ctx.beginPath(); ctx.arc(0, -r * 1.02, r * 0.3, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = C.tinta; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.moveTo(0, -r * 1.0); ctx.lineTo(0, -r * 1.16); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * r * 0.55, r * 0.78); ctx.lineTo(sx * r * 0.78, r * 1.08); ctx.stroke(); }
    // o corpo e o mostrador
    ctx.shadowColor = 'rgba(120,60,30,0.25)'; ctx.shadowBlur = r * 0.25; ctx.shadowOffsetY = r * 0.08;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = C.coral; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, TAU); ctx.fillStyle = C.papel; ctx.fill();
    ctx.strokeStyle = C.tinta;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, l = i % 3 === 0 ? 0.16 : 0.08;
      ctx.lineWidth = r * (i % 3 === 0 ? 0.06 : 0.035);
      ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * 0.72, -Math.cos(a) * r * 0.72); ctx.lineTo(Math.sin(a) * r * (0.72 - l), -Math.cos(a) * r * (0.72 - l)); ctx.stroke();
    }
    // os ponteiros: hora (curto) e minuto (longo)
    const ah = ((hora % 12) / 12) * TAU, am = ((hora % 1) * 60 / 60) * TAU;
    ctx.lineWidth = r * 0.11; ctx.strokeStyle = C.tinta;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ah) * r * 0.42, -Math.cos(ah) * r * 0.42); ctx.stroke();
    ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(am) * r * 0.62, -Math.cos(am) * r * 0.62); ctx.stroke();
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- peças do ep03 ("Visita sem avisar")
  // a galinha caipira (de lado, virada para a direita; origem no chão, entre os pés). s = largura do corpo
  // o.contorno (px na escala da peça): contorno escuro na cor tinta, como o das lojinhas (usado na transição). As formas são
  // desenhadas duas vezes: primeiro a silhueta engrossada em tinta, depois as cores por cima
  function duasPassadas(ctx, c, desenha) {
    if (c > 0) {
      const F = (cor) => { ctx.fillStyle = C.tinta; ctx.fill(); ctx.lineWidth = 2 * c; ctx.strokeStyle = C.tinta; ctx.stroke(); };
      const S = (cor, lw) => { ctx.strokeStyle = C.tinta; ctx.lineWidth = lw + 2 * c; ctx.stroke(); };
      desenha(F, S, true);
    }
    desenha((cor) => { ctx.fillStyle = cor; ctx.fill(); }, (cor, lw) => { ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.stroke(); }, false);
  }
  function galinha(ctx, x, base, s, o = {}) {
    const k = s / 100, dir = o.dir || 1, asa = o.asa || 0, passo = o.passo || 0;
    ctx.save(); ctx.translate(x, base); ctx.rotate(o.tilt || 0); ctx.scale(dir * k, k);
    ctx.globalAlpha *= o.alpha ?? 1;
    shadow(ctx, 0, 1, 44, 6, 0.16);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    duasPassadas(ctx, o.contorno || 0, (F, S, silhueta) => {
      // as pernas correndo
      [0, Math.PI].forEach((ph) => {
        const a = Math.sin(passo + ph) * 0.7, hx = Math.sin(a) * 18, hy = -Math.cos(a) * 26;
        ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(-4 + hx * 0.5, -34 - hy * 0.5 - 14); ctx.lineTo(-4 + hx, -4 - Math.max(0, Math.sin(passo + ph)) * 10); S(C.amareloDark, 5);
        ctx.beginPath(); ctx.moveTo(-4 + hx, -4 - Math.max(0, Math.sin(passo + ph)) * 10); ctx.lineTo(-4 + hx + 9, -2 - Math.max(0, Math.sin(passo + ph)) * 10); S(C.amareloDark, 5);
      });
      // o rabo
      ctx.beginPath(); ctx.moveTo(-36, -62); ctx.quadraticCurveTo(-70, -110, -54, -120); ctx.quadraticCurveTo(-44, -90, -24, -70); ctx.closePath(); F('#7A3A18');
      ctx.beginPath(); ctx.moveTo(-34, -58); ctx.quadraticCurveTo(-78, -86, -70, -100); ctx.quadraticCurveTo(-52, -78, -22, -64); ctx.closePath(); F(C.madeiraDark);
      // o corpo (caipira: marrom com pintinhas), o pescoço e a cabeça
      ctx.beginPath(); ctx.ellipse(0, -60, 42, 30, -0.12, 0, TAU); F(C.madeira);
      ctx.beginPath(); ctx.moveTo(18, -78); ctx.quadraticCurveTo(28, -112, 38, -118); ctx.lineTo(52, -104); ctx.quadraticCurveTo(44, -80, 36, -62); ctx.closePath(); F(C.madeira);
      ctx.beginPath(); ctx.arc(46, -116, 15, 0, TAU); F(C.madeira);
      // a crista, a barbela e o bico
      ctx.beginPath(); ctx.arc(40, -132, 6, 0, TAU); ctx.arc(48, -134, 6.5, 0, TAU); ctx.arc(56, -130, 6, 0, TAU); F(C.coral);
      ctx.beginPath(); ctx.ellipse(58, -102, 4.5, 7, 0, 0, TAU); F(C.coral);
      ctx.beginPath(); ctx.moveTo(58, -120); ctx.lineTo(72, -114); ctx.lineTo(58, -109); ctx.closePath(); F(C.amarelo);
      if (silhueta) return;
      ctx.fillStyle = C.madeiraDark; for (const [px, py] of [[-14, -66], [2, -52], [-24, -50], [12, -70], [-6, -78]]) { ctx.beginPath(); ctx.ellipse(px, py, 4, 3, 0.4, 0, TAU); ctx.fill(); }
      if (o.olhar) {                                         // os dois olhos de frente: olhando para a câmera
        for (const ex of [42, 54]) { ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(ex, -118, 5, 0, TAU); ctx.fill(); ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(ex, -117, 2.8, 0, TAU); ctx.fill(); }
      } else {
        ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(50, -119, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(51.5, -119, 2.8, 0, TAU); ctx.fill();
      }
    });
    // a asa batendo (com o seu próprio contorno, por cima do corpo)
    ctx.save(); ctx.translate(-2, -66); ctx.rotate(-0.25 - 0.9 * asa);
    duasPassadas(ctx, o.contorno || 0, (F, S, silhueta) => {
      ctx.beginPath(); ctx.ellipse(-10, 0, 30, 15, 0.2, 0, TAU); F(C.madeiraDark);
      if (silhueta) return;
      for (const d of [-14, -4, 6]) { ctx.beginPath(); ctx.moveTo(d, -6); ctx.lineTo(d - 14, 8); S('#7A3A18', 2.5); }
    });
    ctx.restore();
    ctx.restore();
  }
  function pintinho(ctx, x, base, s, o = {}) {              // o pintinho amarelo correndo (origem no chão)
    const k = s / 100, dir = o.dir || 1, passo = o.passo || 0;
    ctx.save(); ctx.translate(x, base); ctx.scale(dir * k, k);
    shadow(ctx, 0, 1, 34, 5, 0.14);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    duasPassadas(ctx, o.contorno || 0, (F, S, silhueta) => {
      [0, Math.PI].forEach((ph) => { const hx = Math.sin(passo + ph) * 10; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(hx, -2); S(C.amareloDark, 5); });
      ctx.beginPath(); ctx.ellipse(0, -46, 30, 26, 0, 0, TAU); F(C.amarelo);
      ctx.beginPath(); ctx.arc(22, -74, 18, 0, TAU); F(C.amarelo);
      ctx.beginPath(); ctx.moveTo(38, -76); ctx.lineTo(48, -72); ctx.lineTo(38, -68); ctx.closePath(); F(C.coral);
      if (silhueta) return;
      ctx.fillStyle = C.amareloDark; ctx.beginPath(); ctx.ellipse(-8, -46, 14, 9, 0.3 + 0.5 * Math.sin(passo * 2), 0, TAU); ctx.fill();
      ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(28, -78, 3.5, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function pena(ctx, x, y, s, rot, cor) {                   // uma pena voando (folhinha com a haste)
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.5, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s * 0.5, -s * 0.2, 0, -s); ctx.fill();
    ctx.strokeStyle = css(C.papel, 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 1.15); ctx.stroke();
    ctx.restore();
  }
  // os bonequinhos da visita: corpo de pílula, cabeça redonda, olhos de pontinho como os das lojinhas (sem cara infantil)
  const VISITAS = [
    { corpo: C.coral, pele: '#E8B48C', cabelo: '#5E2C12', tipo: 'coque', h: 250 },
    { corpo: C.verde, pele: '#C98A5E', cabelo: C.tinta, tipo: 'rabo', h: 236 },
    { corpo: C.amarelo, pele: '#F2C9A0', cabelo: '#7A3A18', tipo: 'curto', h: 222 },
    { corpo: C.coralLight, pele: '#B9805A', cabelo: C.tinta, tipo: 'bone', h: 230 },
    { corpo: C.madeira, pele: '#E0A97E', cabelo: '#A86B33', tipo: 'curto', h: 214 },
  ];
  function pessoa(ctx, v, x, base, t, o = {}) {
    const h = v.h * (o.k || 1), cab = h * 0.2, by = base - h + cab * 2;
    ctx.save();
    shadow(ctx, x, base, h * 0.28, 7, 0.14);
    // o corpo e os braços (um braço acena quando o.acena)
    ctx.fillStyle = v.corpo; rr(ctx, x - h * 0.2, by, h * 0.4, base - by, h * 0.18); ctx.fill();
    ctx.strokeStyle = v.corpo; ctx.lineWidth = h * 0.07; ctx.lineCap = 'round';
    const ac = o.acena ? Math.sin(t * 10) * 0.5 : 0;
    ctx.beginPath(); ctx.moveTo(x - h * 0.19, by + h * 0.1); ctx.lineTo(x - h * 0.28, by + h * 0.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + h * 0.19, by + h * 0.1); ctx.lineTo(x + h * 0.3 + Math.sin(0.9 + ac) * h * 0.06, by + (o.acena ? -h * 0.05 : h * 0.32)); ctx.stroke();
    // a cabeça
    const cx = x, cy = by - cab * 0.85;
    if (v.tipo === 'coque') { ctx.fillStyle = v.cabelo; ctx.beginPath(); ctx.arc(cx, cy - cab * 0.95, cab * 0.42, 0, TAU); ctx.fill(); }
    if (v.tipo === 'rabo') { ctx.fillStyle = v.cabelo; ctx.beginPath(); ctx.ellipse(cx - cab * 0.95, cy + cab * 0.2, cab * 0.28, cab * 0.6, 0.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = v.pele; ctx.beginPath(); ctx.arc(cx, cy, cab, 0, TAU); ctx.fill();
    ctx.fillStyle = v.cabelo;
    if (v.tipo === 'bone') { ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.arc(cx, cy - cab * 0.15, cab * 1.02, Math.PI, TAU); ctx.fill(); rr(ctx, cx, cy - cab * 0.3, cab * 1.3, cab * 0.22, cab * 0.1); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(cx, cy - cab * 0.1, cab * 1.03, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    // o rosto: olhos de pontinho, bochechas e o sorriso (piscadinha quando o.pisca)
    const lk = o.look || [0, 0], ex = cab * 0.36;
    ctx.fillStyle = css(C.coral, 0.3); ctx.beginPath(); ctx.ellipse(cx - cab * 0.55, cy + cab * 0.32, cab * 0.18, cab * 0.11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + cab * 0.55, cy + cab * 0.32, cab * 0.18, cab * 0.11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.tinta; ctx.strokeStyle = C.tinta; ctx.lineWidth = cab * 0.09;
    const bl = o.blink || 0;
    [[-1, false], [1, !!o.pisca]].forEach(([sx, fecha]) => {
      const exx = cx + sx * ex + lk[0] * cab * 0.12, eyy = cy - cab * 0.05 + lk[1] * cab * 0.08;
      if (fecha) { ctx.beginPath(); ctx.arc(exx, eyy + cab * 0.05, cab * 0.14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(exx, eyy, cab * 0.1, cab * 0.13 * (1 - 0.9 * bl), 0, 0, TAU); ctx.fill(); }
    });
    ctx.beginPath(); ctx.arc(cx, cy + cab * 0.22, cab * (0.28 + 0.1 * (o.sorriso || 0)), 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
    if (o.box) BOX(o.box, x - h * 0.3, base - h - cab * 0.4, x + h * 0.3, base);
  }
  // a porta (com o batente): (x, base) = o chão no meio; aberta 0..1; treme = deslocamento
  function porta(ctx, x, base, w, h, aberta, treme = 0) {
    ctx.save(); ctx.translate(x + treme, base);
    ctx.fillStyle = C.cremeDeep; rr(ctx, -w / 2 - 18, -h - 18, w + 36, h + 18, 10); ctx.fill();
    ctx.fillStyle = '#FFE9A8'; rr(ctx, -w / 2, -h, w, h, 6); ctx.fill();         // o vão com luz
    if (aberta > 0) {
      const g = ctx.createRadialGradient(0, -h * 0.4, 10, 0, -h * 0.4, w * 1.4);
      g.addColorStop(0, css('#FFE48A', 0.5 * aberta)); g.addColorStop(1, css('#FFE48A', 0));
      ctx.fillStyle = g; ctx.fillRect(-w * 1.5, -h * 1.2, w * 3, h * 1.3);
    }
    const fw = w * (1 - 0.82 * E.outCubic(aberta));
    ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.lineTo(-w / 2 + fw, -h - 14 * aberta); ctx.lineTo(-w / 2 + fw, 6 * aberta); ctx.lineTo(-w / 2, 0); ctx.closePath(); ctx.fill();
    if (aberta < 0.6) {
      ctx.strokeStyle = css(C.tinta, 0.18); ctx.lineWidth = 5;
      rr(ctx, -w / 2 + fw * 0.14, -h * 0.9, fw * 0.72, h * 0.34, 8); ctx.stroke(); rr(ctx, -w / 2 + fw * 0.14, -h * 0.48, fw * 0.72, h * 0.38, 8); ctx.stroke();
    }
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(-w / 2 + fw - 18, -h * 0.47, 8, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // a lata de biscoito (vazia): (x, base) = o chão; virada 0..1 (deita de lado), tampa: 0 no lugar, 1 caída do lado
  function lata(ctx, x, base, s, o = {}) {
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 52, 6, 0.14);
    ctx.save(); ctx.translate(40, 0); ctx.rotate(-Math.PI / 2 * (o.virada || 0)); ctx.translate(-40, 0);
    ctx.fillStyle = '#E2CDB2'; rr(ctx, -40, -88, 80, 88, 10); ctx.fill();
    ctx.fillStyle = C.coral; ctx.fillRect(-40, -64, 80, 30);
    ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.arc(0, -49, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#A9967F'; ctx.beginPath(); ctx.ellipse(0, -88, 40, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6E5B52'; ctx.beginPath(); ctx.ellipse(0, -88, 33, 6, 0, 0, TAU); ctx.fill();   // o fundo vazio
    ctx.restore();
    const tp = o.tampa || 0;                                  // a tampa
    ctx.save(); ctx.translate(lerp(0, -78, tp), lerp(-94, -8, tp)); ctx.rotate(lerp(0, -1.2, tp));
    ctx.fillStyle = '#C9B597'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.coralDark; rr(ctx, -8, -8, 16, 6, 3); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function mosquinha(ctx, x, y, t, s = 1) {                   // a mosquinha voando em oito em volta de (x, y)
    const mx = x + 46 * s * Math.sin(t * 3.1), my = y + 22 * s * Math.sin(t * 6.2);
    ctx.save(); ctx.translate(mx, my);
    ctx.fillStyle = css(C.papel, 0.8); const bat = 0.5 + 0.5 * Math.sin(t * 90);
    ctx.beginPath(); ctx.ellipse(-4 * s, -6 * s, 7 * s, 4 * s * bat + 1, -0.6, 0, TAU); ctx.ellipse(4 * s, -6 * s, 7 * s, 4 * s * bat + 1, 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.ellipse(0, 0, 6 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(C.tinta, 0.35); ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-46 * s * Math.cos(t * 3.1) * 0.5, -22 * s * Math.cos(t * 6.2) * 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  function bule(ctx, x, base, s, t, vapor = 1) {            // o bule esmaltado fumegando
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 56, 7, 0.14);
    ctx.fillStyle = C.coral;
    ctx.beginPath(); ctx.moveTo(42, -46); ctx.quadraticCurveTo(76, -54, 80, -88); ctx.lineTo(70, -90); ctx.quadraticCurveTo(64, -62, 40, -62); ctx.closePath(); ctx.fill();   // o bico
    ctx.lineWidth = 9; ctx.strokeStyle = C.coralDark; ctx.beginPath(); ctx.arc(-50, -50, 22, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();                     // a alça
    ctx.beginPath(); ctx.ellipse(0, -44, 50, 44, 0, 0, TAU); ctx.fillStyle = C.coral; ctx.fill();
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.arc(-14, -56, 9, 0, TAU); ctx.arc(10, -38, 7, 0, TAU); ctx.arc(22, -60, 5, 0, TAU); ctx.fill();                  // as bolinhas brancas
    ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.ellipse(0, -86, 30, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -96, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(C.cinza, 0.55); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.7 + i / 3) % 1), a = Math.sin(Math.PI * ph) * vapor;
      if (a <= 0.02) continue;
      ctx.globalAlpha = a; const sx = 76 + i * 10, y0 = -96 - ph * 50;
      ctx.beginPath(); ctx.moveTo(sx, y0); ctx.bezierCurveTo(sx - 12, y0 - 14, sx + 12, y0 - 24, sx, y0 - 38); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function itemRosca(ctx, x, y, s) {                        // a rosca com açúcar
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#D9913E'; ctx.beginPath(); ctx.ellipse(0, 4, 48, 32, 0, 0, TAU); ctx.ellipse(0, 4, 18, 11, 0, 0, TAU); ctx.fill('evenodd');
    ctx.fillStyle = '#EDB463'; ctx.beginPath(); ctx.ellipse(0, -2, 44, 27, 0, 0, TAU); ctx.ellipse(0, -2, 17, 10, 0, 0, TAU); ctx.fill('evenodd');
    ctx.fillStyle = C.papel; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 31, -2 + Math.sin(a) * 18, 2.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function itemBolo(ctx, x, y, s) {                         // o bolo de fubá (redondo, com furo)
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#E8B04F'; rr(ctx, -48, -20, 96, 46, 14); ctx.fill();
    ctx.fillStyle = '#F6CF73'; ctx.beginPath(); ctx.ellipse(0, -20, 48, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#D18F35'; ctx.beginPath(); ctx.ellipse(0, -20, 12, 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = css('#D18F35', 0.5); for (const [px, py] of [[-30, 2], [-10, 10], [14, 4], [32, 12]]) { ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function itemRequeijao(ctx, x, y, s) {                    // o copo de requeijão (tampa coral, rótulo creme)
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = css(C.papel, 0.95); rr(ctx, -28, -30, 56, 66, 10); ctx.fill(); ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = C.coral; rr(ctx, -31, -40, 62, 14, 6); ctx.fill();
    ctx.fillStyle = C.verde; rr(ctx, -22, -6, 44, 22, 5); ctx.fill();
    ctx.fillStyle = C.papel; rr(ctx, -14, 1, 28, 7, 3); ctx.fill();
    ctx.restore();
  }
  ITENS.rosca = itemRosca; ITENS.bolo = itemBolo; ITENS.requeijao = itemRequeijao;
  // a mesa com a toalha xadrez (x0..x1, tampo em y); toalha 0..1 desenrola da esquerda para a direita
  function mesaXadrez(ctx, x0, x1, y, chao, toalha = 1) {
    ctx.fillStyle = C.madeiraDark; rr(ctx, x0 + 30, y + 30, 22, chao - y - 30, 6); ctx.fill(); rr(ctx, x1 - 52, y + 30, 22, chao - y - 30, 6); ctx.fill();
    ctx.fillStyle = C.madeira; rr(ctx, x0, y, x1 - x0, 28, 10); ctx.fill();
    if (toalha > 0) {
      const xt = lerp(x0 + 10, x1 - 10, E.outCubic(toalha));
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 10, y + 4, xt - x0 - 10, 84); ctx.clip();
      for (let i = 0; i < 60; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i + j) % 2 ? css(C.coral, 0.9) : C.papel; ctx.fillRect(x0 + 10 + i * 21, y + 4 + j * 21, 21, 21); }
      ctx.restore();
      if (toalha < 1) { ctx.fillStyle = C.coral; ctx.beginPath(); ctx.ellipse(xt, y + 46, 16, 44, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.coralDark; ctx.beginPath(); ctx.ellipse(xt, y + 46, 7, 22, 0, 0, TAU); ctx.fill(); }
    }
  }

  // ---------------------------------------------------------------- peças do ep05 ("Churrasco de domingo")
  const CARAMELO = '#E0A050', CARAMELO_ESC = '#B9732A', CARAMELO_CLARO = '#F6E3C8';
  // o vira-lata caramelo (virado para a direita; origem no chão). s = largura (≈150 unidades de desenho)
  //   o.pose: 'corre' (galopando, com a linguiça na boca) ou 'sentado'; o.olhar: cara de frente para a câmera;
  //   o.pidao: olhos grandes e sobrancelha de pidão; o.linguica: a linguiça na boca; o.rabo: abano (rad)
  function viralata(ctx, x, base, s, o = {}) {
    const k = s / 100, dir = o.dir || 1, passo = o.passo || 0, pose = o.pose || 'corre';
    ctx.save(); ctx.translate(x, base); ctx.rotate(o.tilt || 0); ctx.scale(dir * k, k);
    ctx.globalAlpha *= o.alpha ?? 1;
    shadow(ctx, 0, 1, 50, 6, 0.16);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const sentado = pose === 'sentado', rabo = o.rabo || 0;
    const cab = sentado ? { x: 10, y: -118 } : { x: 60, y: -92 }, pd = o.pidao ? 1 : 0;
    duasPassadas(ctx, o.contorno || 0, (F, S, silhueta) => {
      // o rabo abanando
      ctx.beginPath();
      if (sentado) { ctx.moveTo(-34, -12); ctx.quadraticCurveTo(-72, -6 + 12 * Math.sin(rabo), -86, -38 + 20 * Math.sin(rabo)); S(CARAMELO_ESC, 13); }
      else { ctx.moveTo(-46, -70); ctx.quadraticCurveTo(-70, -84 + 10 * Math.sin(rabo), -78, -108 + 14 * Math.sin(rabo)); S(CARAMELO_ESC, 11); }
      if (sentado) {
        // sentado (de três quartos): a anca no chão com a pata de trás, o peito alto e as duas patas da frente retas
        ctx.beginPath(); ctx.ellipse(-18, -30, 36, 30, -0.1, 0, TAU); F(CARAMELO);
        ctx.beginPath(); ctx.ellipse(-34, -6, 17, 7, 0, 0, TAU); F(CARAMELO_ESC);
        ctx.beginPath(); ctx.ellipse(8, -62, 30, 48, -0.12, 0, TAU); F(CARAMELO);
        for (const lx of [0, 26]) { ctx.beginPath(); ctx.moveTo(lx, -60); ctx.lineTo(lx + 1, -10); S(CARAMELO, 16); }
        for (const lx of [1, 27]) { ctx.beginPath(); ctx.ellipse(lx + 3, -6, 13, 7.5, 0, 0, TAU); F(CARAMELO_CLARO); }
      } else {
        // correndo: quatro patas em galope e o corpo comprido
        [[-30, 0], [-22, 1.2], [30, 2.4], [38, 3.4]].forEach(([lx, ph]) => {
          const a = Math.sin(passo + ph) * 0.75, fx = lx + Math.sin(a) * 26, fy = -4 - Math.max(0, Math.sin(passo + ph + 1.4)) * 14;
          ctx.beginPath(); ctx.moveTo(lx, -58); ctx.lineTo((lx + fx) / 2 + 4, -30); ctx.lineTo(fx, fy); S(lx < 0 ? CARAMELO_ESC : CARAMELO, 11);
        });
        ctx.beginPath(); ctx.ellipse(0, -64, 52, 25, -0.05, 0, TAU); F(CARAMELO);
        ctx.beginPath(); ctx.moveTo(30, -76); ctx.quadraticCurveTo(44, -98, 54, -104); ctx.lineTo(70, -84); ctx.quadraticCurveTo(58, -72, 48, -58); ctx.closePath(); F(CARAMELO);
      }
      if (o.olhar) {
        // a cabeça olhando para a câmera, DE FRENTE e simétrica: crânio grande, focinho claro no meio, uma orelha caída de
        // cada lado e a língua de fora no centro
        if (!o.linguica) { ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 30, 8, 12, 0, 0, TAU); F('#E9767A'); }
        ctx.beginPath(); ctx.ellipse(cab.x, cab.y, 32, 29, 0, 0, TAU); F(CARAMELO);
        ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 13, 20, 14, 0, 0, TAU); F(CARAMELO_CLARO);
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cab.x + sx * 30, cab.y + 3 + 4 * pd, 11, 24, -sx * (0.3 + 0.2 * pd), 0, TAU); F(CARAMELO_ESC); }
      } else {
        // a cabeça de lado
        ctx.beginPath(); ctx.arc(cab.x, cab.y, 23, 0, TAU); F(CARAMELO);
        ctx.beginPath(); ctx.ellipse(cab.x + 19, cab.y + 6, 17, 11, 0.1, 0, TAU); F(CARAMELO_CLARO);
        ctx.beginPath(); ctx.ellipse(cab.x - 8, cab.y - 2 + (o.pidao ? 6 : 0), 9, 19, -0.3 + (o.pidao ? -0.25 : 0), 0, TAU); F(CARAMELO_ESC);
      }
      if (silhueta) return;
      // a barriguinha / o peito claro
      if (!sentado) { ctx.fillStyle = CARAMELO_CLARO; ctx.beginPath(); ctx.ellipse(6, -52, 34, 11, 0, 0, TAU); ctx.fill(); }
      else {
        ctx.fillStyle = CARAMELO_CLARO; ctx.beginPath(); ctx.ellipse(14, -74, 15, 22, -0.15, 0, TAU); ctx.fill();
        // o risco das patas da frente e da coxa (para as patas lerem separadas do peito)
        ctx.strokeStyle = CARAMELO_ESC; ctx.lineWidth = 3;
        for (const lx of [-7, 13]) { ctx.beginPath(); ctx.moveTo(lx, -46); ctx.lineTo(lx + 0.5, -13); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(-18, -30, 24, 2.3, 4.0); ctx.stroke();
      }
      if (o.olhar) {
        // de frente: o nariz escuro no centro do focinho, a boca em "w", os dois olhos iguais na mesma altura (com brilho)
        // e as sobrancelhas de pidão simétricas. A língua vem de novo aqui, por cima da mancha clara do peito e por trás do focinho
        if (!o.linguica) {
          ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 30, 8, 12, 0, 0, TAU); ctx.fillStyle = '#E9767A'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.tinta; ctx.stroke();
          ctx.strokeStyle = css('#B84A50', 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cab.x, cab.y + 28); ctx.lineTo(cab.x, cab.y + 37); ctx.stroke();
          ctx.fillStyle = CARAMELO_CLARO; ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 13, 20, 14, 0, 0, TAU); ctx.fill();
          ctx.lineWidth = 2.2; ctx.strokeStyle = C.tinta; ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 13, 20, 14, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        }
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.ellipse(cab.x, cab.y + 6, 8, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(cab.x - 2.5, cab.y + 3.5, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = C.tinta; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cab.x, cab.y + 12); ctx.lineTo(cab.x, cab.y + 17);
        ctx.quadraticCurveTo(cab.x - 5, cab.y + 22, cab.x - 11, cab.y + 18); ctx.moveTo(cab.x, cab.y + 17); ctx.quadraticCurveTo(cab.x + 5, cab.y + 22, cab.x + 11, cab.y + 18); ctx.stroke();
        const re = o.pidao ? 7.5 : 5;
        for (const sx of [-1, 1]) {
          const ex = cab.x + sx * 13, ey = cab.y - 8;
          ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(ex, ey, re, 0, TAU); ctx.fill();
          ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(ex - re * 0.35, ey - re * 0.35, re * 0.38, 0, TAU); ctx.fill();
        }
        if (o.pidao) {
          ctx.strokeStyle = CARAMELO_ESC; ctx.lineWidth = 3.5; ctx.beginPath();
          ctx.moveTo(cab.x - 22, cab.y - 15); ctx.lineTo(cab.x - 8, cab.y - 20); ctx.moveTo(cab.x + 22, cab.y - 15); ctx.lineTo(cab.x + 8, cab.y - 20); ctx.stroke();
        }
      } else {
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(cab.x + 34, cab.y + 2, 5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(cab.x + 6, cab.y - 6, o.pidao ? 5.5 : 3.8, 0, TAU); ctx.fill();
        ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(cab.x + 4.5, cab.y - 7.5, 1.6, 0, TAU); ctx.fill();
      }
    });
    // a linguiça na boca, balançando (3 gomos)
    if (o.linguica) {
      let lx = o.olhar ? cab.x : cab.x + 28, ly = o.olhar ? cab.y + 20 : cab.y + 12; const bal = Math.sin(o.balanco || 0);
      for (let i = 0; i < 3; i++) {
        const a = (o.olhar ? 1.57 : 1.2) + 0.5 * bal * (i + 1) / 2, nx = lx + Math.cos(a) * 16, ny = ly + Math.sin(a) * 16;
        ctx.save(); ctx.translate((lx + nx) / 2, (ly + ny) / 2); ctx.rotate(a);
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.ellipse(0, 0, 11.5, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#A8452A'; ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 6, 0, 0, TAU); ctx.fill();
        ctx.restore(); lx = nx; ly = ny;
      }
    }
    ctx.restore();
  }
  // o tio da churrasqueira: um bonequinho (como a visita) de avental e pegador
  const TIO = { corpo: C.verde, pele: '#D9A27A', cabelo: '#4A3F39', tipo: 'curto', h: 250, avental: true, pegador: true };
  function avental(ctx, v, x, base, t, o = {}) {           // o avental e o pegador por cima do bonequinho
    const h = v.h * (o.k || 1), cab = h * 0.2, by = base - h + cab * 2;
    ctx.save();
    ctx.fillStyle = C.papel; rr(ctx, x - h * 0.15, by + h * 0.08, h * 0.3, (base - by) * 0.82, h * 0.06); ctx.fill();
    ctx.strokeStyle = C.coral; ctx.lineWidth = 3; rr(ctx, x - h * 0.15, by + h * 0.08, h * 0.3, (base - by) * 0.82, h * 0.06); ctx.stroke();
    ctx.fillStyle = C.coral; rr(ctx, x - h * 0.08, by + h * 0.3, h * 0.16, h * 0.1, 4); ctx.fill();          // o bolso
    // o pegador na mão (abre e fecha)
    const pg = 0.12 + 0.1 * Math.abs(Math.sin((o.pegaT ?? t) * 8)), hx = x + h * 0.32, hy = by + h * 0.3;
    ctx.strokeStyle = '#8A7A6E'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(-0.5 - pg) * h * 0.32, hy + Math.sin(-0.5 - pg) * h * 0.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(-0.5 + pg) * h * 0.32, hy + Math.sin(-0.5 + pg) * h * 0.32); ctx.stroke();
    ctx.restore();
  }
  // a churrasqueira de tijolinho: (x, base) = o chão no meio; acesa 0..1 (brasa); carnes: lista de tipos na grelha
  function churrasqueira(ctx, x, base, w, t, o = {}) {
    const h = w * 0.78, topo = base - h;
    ctx.save();
    shadow(ctx, x, base, w * 0.55, 9, 0.14);
    ctx.fillStyle = '#C9623E'; rr(ctx, x - w / 2, topo + h * 0.18, w, h * 0.82, 10); ctx.fill();
    ctx.strokeStyle = css(C.papel, 0.55); ctx.lineWidth = 3;
    for (let r = 0; r < 5; r++) { const y = topo + h * 0.18 + r * h * 0.164; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke();
      for (let c = 0; c < 4; c++) { const bx = x - w / 2 + (c + (r % 2) * 0.5) * w / 4; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + h * 0.164); ctx.stroke(); } }
    // a caixa da brasa e a grelha
    ctx.fillStyle = '#4A3F39'; rr(ctx, x - w * 0.46, topo + h * 0.06, w * 0.92, h * 0.18, 6); ctx.fill();
    const ac = o.acesa || 0;
    if (ac > 0) {
      const g = ctx.createRadialGradient(x, topo + h * 0.12, 4, x, topo + h * 0.12, w * 0.55);
      g.addColorStop(0, css(C.amarelo, 0.7 * ac)); g.addColorStop(0.5, css(C.coral, 0.45 * ac)); g.addColorStop(1, css(C.coral, 0));
      ctx.fillStyle = g; ctx.fillRect(x - w * 0.6, topo - h * 0.3, w * 1.2, h * 0.6);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = css(i % 2 ? C.coral : C.amarelo, 0.9 * ac * (0.6 + 0.4 * Math.sin(t * 7 + i * 1.7))); ctx.beginPath(); ctx.arc(x - w * 0.4 + i * w * 0.1, topo + h * 0.16, 7, 0, TAU); ctx.fill(); }
    } else {
      ctx.fillStyle = '#6E5B52'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x - w * 0.4 + i * w * 0.1, topo + h * 0.16, 7, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = '#8A7A6E'; ctx.lineWidth = 4;
    for (let i = 0; i <= 10; i++) { const gx = x - w * 0.46 + i * w * 0.092; ctx.beginPath(); ctx.moveTo(gx, topo + h * 0.04); ctx.lineTo(gx, topo + h * 0.08); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - w * 0.48, topo + h * 0.06); ctx.lineTo(x + w * 0.48, topo + h * 0.06); ctx.stroke();
    // as carnes na grelha
    (o.carnes || []).forEach((c, i) => { const e = c.e ?? 1; if (e <= 0) return; const cx = x - w * 0.3 + i * w * 0.2; pop(ctx, e, cx, topo + h * 0.06, () => ITENS[c.tipo](ctx, cx, topo + h * 0.06 - 16, w * 0.22), 2.2); });
    ctx.restore();
  }
  // a fumacinha: a triste (um fio que sobe e cai) ou os puffs que formam um coração
  function fumacaTriste(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = css(C.cinza, 0.55); ctx.lineWidth = 9; ctx.lineCap = 'round';
    const ph = (t * 0.6) % 1;
    ctx.globalAlpha *= Math.sin(Math.PI * ph);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 16, y - 40 - 30 * ph, x + 22, y - 70 - 30 * ph, x + 40, y - 60 - 10 * ph); ctx.quadraticCurveTo(x + 56, y - 50, x + 50, y - 30); ctx.stroke();
    ctx.restore();
  }
  function fumacaCoracao(ctx, cx, cy, e, t, s = 1) {
    if (e <= 0) return;
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      const u = clamp(e * 1.6 - i * 0.03), r = (14 + 5 * Math.sin(t * 3 + i)) * s;
      ctx.fillStyle = css('#A99C92', 0.8 * u); ctx.beginPath(); ctx.arc(cx + hx * 7 * s * u, cy + hy * 7 * s * u + (1 - u) * 80, r, 0, TAU); ctx.fill();
    }
  }
  // o saco de carvão (vazio e virado, ou cheio em pé)
  function sacoCarvao(ctx, x, base, s, o = {}) {
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 56, 6, 0.14);
    if (o.virado) {
      ctx.rotate(-Math.PI / 2 * 0.92); ctx.translate(-44, -6);
      ctx.fillStyle = '#4A3F39'; ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(38, 0); ctx.lineTo(30, -96); ctx.quadraticCurveTo(10, -104, -4, -92); ctx.quadraticCurveTo(-20, -102, -30, -96); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-14, -48, 0, -66); ctx.quadraticCurveTo(14, -48, 0, -30); ctx.fill();
      ctx.fillStyle = '#2E2420'; for (const [px, py] of [[-50, 20], [-62, 4], [-44, 34]]) { ctx.beginPath(); ctx.arc(px + 40, py - 120, 3.5, 0, TAU); ctx.fill(); }
    } else {
      ctx.fillStyle = '#4A3F39'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(34, -100); ctx.lineTo(-34, -100); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2E2420'; rr(ctx, -36, -108, 72, 14, 5); ctx.fill();
      ctx.fillStyle = C.amarelo; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-16, -52, 0, -74); ctx.quadraticCurveTo(16, -52, 0, -30); ctx.fill();
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(0, -36); ctx.quadraticCurveTo(-8, -48, 0, -60); ctx.quadraticCurveTo(8, -48, 0, -36); ctx.fill();
    }
    ctx.restore();
  }
  // os itens do churrasco (desenho próprio, sem marca nenhuma)
  function itemPicanha(ctx, x, y, s) {
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#B8473A'; ctx.beginPath(); ctx.moveTo(-46, 18); ctx.quadraticCurveTo(-30, -26, 24, -24); ctx.quadraticCurveTo(48, -20, 46, 0); ctx.quadraticCurveTo(30, 26, -46, 18); ctx.fill();
    ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(-40, 8); ctx.quadraticCurveTo(-26, -20, 24, -18); ctx.quadraticCurveTo(40, -16, 42, -6); ctx.quadraticCurveTo(-4, -16, -40, 8); ctx.fill();   // a capa de gordura
    ctx.strokeStyle = '#7A2A20'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(-6, -4); ctx.moveTo(4, 12); ctx.lineTo(18, -4); ctx.stroke();
    ctx.restore();
  }
  function itemLinguica(ctx, x, y, s) {
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-30 + i * 30, 2 * Math.sin(i * 2)); ctx.rotate(0.25 * Math.sin(i * 1.7));
      ctx.fillStyle = '#A8452A'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = css(C.papel, 0.35); ctx.beginPath(); ctx.ellipse(-4, -4, 7, 3, -0.2, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function itemCostela(ctx, x, y, s) {
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#B8473A'; rr(ctx, -46, -22, 92, 40, 16); ctx.fill();
    ctx.fillStyle = C.papel; for (const bx of [-30, -10, 10, 30]) { rr(ctx, bx - 5, -30, 10, 56, 5); ctx.fill(); }
    ctx.restore();
  }
  function itemSal(ctx, x, y, s) {                           // o pacote de sal grosso com os cristais brilhando
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.papel; rr(ctx, -30, -40, 60, 78, 8); ctx.fill(); ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = C.verde; rr(ctx, -30, -40, 60, 16, 6); ctx.fill();
    ctx.fillStyle = '#DDE7EA'; for (const [px, py] of [[-14, 0], [0, 10], [14, -2], [-6, 22], [10, 24]]) { ctx.beginPath(); ctx.moveTo(px, py - 7); ctx.lineTo(px + 6, py); ctx.lineTo(px, py + 7); ctx.lineTo(px - 6, py); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function itemFarofa(ctx, x, y, s) {                        // a tigela de farofa
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#F6CF73'; ctx.beginPath(); ctx.ellipse(0, -8, 42, 18, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#D18F35'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-30 + i * 5.5, -12 - 8 * Math.sin(i), 2.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(-46, -8); ctx.lineTo(46, -8); ctx.quadraticCurveTo(40, 30, 0, 30); ctx.quadraticCurveTo(-40, 30, -46, -8); ctx.fill();
    ctx.fillStyle = C.papel; for (const bx of [-24, 0, 24]) { ctx.beginPath(); ctx.arc(bx, 8, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function itemPaoAlho(ctx, x, y, s) {                       // o pão de alho (bisnaguinha com ervas)
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-0.15);
    ctx.fillStyle = '#D9913E'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 20, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F2DCA0'; for (const bx of [-30, -10, 10, 30]) { ctx.beginPath(); ctx.ellipse(bx, -6, 7, 13, 0.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = C.verde; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-34 + i * 10, -8 + 4 * Math.sin(i * 2), 2.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function itemRefri(ctx, x, y, s, cor = C.coral) {          // a garrafa de refri gelada, com gotinhas (sem marca)
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(-9, -58); ctx.lineTo(9, -58); ctx.quadraticCurveTo(10, -40, 22, -26); ctx.lineTo(22, 44); ctx.quadraticCurveTo(22, 52, 14, 52); ctx.lineTo(-14, 52); ctx.quadraticCurveTo(-22, 52, -22, 44); ctx.lineTo(-22, -26); ctx.quadraticCurveTo(-10, -40, -9, -58); ctx.fill();
    ctx.fillStyle = C.papel; rr(ctx, -22, -6, 44, 24, 3); ctx.fill();                              // o rótulo liso
    ctx.fillStyle = C.tinta; rr(ctx, -10, -66, 20, 10, 3); ctx.fill();                             // a tampinha
    ctx.fillStyle = css(C.papel, 0.8); for (const [px, py, r] of [[-12, -18, 3], [10, 28, 2.6], [-8, 34, 2.2], [14, -14, 2]]) { ctx.beginPath(); ctx.ellipse(px, py, r * 0.8, r * 1.2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = css(C.papel, 0.4); rr(ctx, -16, -24, 6, 64, 3); ctx.fill();
    ctx.restore();
  }
  function itemGelo(ctx, x, y, s) {                          // o cubo de gelo
    const k = s / 100; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#E4F1F4'; rr(ctx, -26, -26, 52, 52, 10); ctx.fill(); ctx.strokeStyle = '#B9D3DA'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = C.branco; rr(ctx, -16, -16, 14, 10, 4); ctx.fill();
    ctx.restore();
  }
  function itemCarvao(ctx, x, y, s) { sacoCarvao(ctx, x, y + s * 0.5, s * 0.9); }
  ITENS.picanha = itemPicanha; ITENS.linguica = itemLinguica; ITENS.costela = itemCostela; ITENS.sal = itemSal;
  ITENS.farofa = itemFarofa; ITENS.paoAlho = itemPaoAlho; ITENS.refri = itemRefri; ITENS.gelo = itemGelo; ITENS.carvao = itemCarvao;

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
  const RELOGIO = '⏰';                                  // no título da capa, vira o relógio desenhado girando
  const RELOGIO_W = (s) => s * 0.9;

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
  let LN = null, DUR = 0, TR = 0.75, CAPS = [], CUES = [], NC = 0;
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
  // A TROCA DE CAPÍTULO: a motinha atravessa a tela na horizontal e a passagem dela varre o capítulo atual e
  // revela o próximo (wipe), com rastro de poeira e confete. Dura TR (1,5 tempo da batida) e começa num meio tempo.
  // =====================================================================
  function where(t) {
    for (let k = 0; k < NC; k++) {
      const c = CAPS[k];
      if (t < c.t1 || k === NC - 1) return { k, trans: false, u: 0 };
      const nx = CAPS[k + 1];
      if (t < nx.t0) return { k, trans: true, u: p(t, c.t1, nx.t0) };
    }
    return { k: NC - 1, trans: false, u: 0 };
  }
  // cada troca varia um pouco: o sentido alterna (capa → 01 da direita para a esquerda), a altura, um pulinho, uma empinada
  const VARIA = [
    { base: 1000, pulo: 0, empina: 0 }, { base: 880, pulo: 70, empina: 0 }, { base: 1020, pulo: 0, empina: 0.12 },
    { base: 900, pulo: 50, empina: 0 }, { base: 970, pulo: 0, empina: 0.1 }, { base: 860, pulo: 80, empina: 0 }, { base: 990, pulo: 30, empina: 0.08 },
  ];
  const MOTO_TR = 300;                                   // a motinha da troca: a base fica sempre acima de y 1060 (nunca na coluna de botões)
  function travessia(k, u) {
    if (TRANS === 'galinha') return travessiaGalinha(k, u);
    if (TRANS === 'viralata') return travessiaViralata(k, u);
    if (TRANS === 'sacola') return travessiaSacola(k, u);
    const v = VARIA[k % VARIA.length], dir = k % 2 === 0 ? -1 : 1;
    const e = 0.75 * u + 0.25 * E.inOutSine(u);
    const x = lerp(dir > 0 ? -260 : W + 260, dir > 0 ? W + 260 : -260, e);
    return { dir, x, base: v.base - v.pulo * Math.sin(Math.PI * u), borda: x - dir * 60, tilt: -dir * v.empina * Math.sin(Math.PI * u) };
  }
  // ---- a transição da galinha (episódio com "transicao": "galinha"): a galinha caipira atravessa em disparada,
  //      batendo as asas; as penas que voam varrem o capítulo. Cada troca varia: (0) tropeça no meio, (1) com o pintinho
  //      correndo atrás, (2) freia no meio e olha para a câmera, (3) dá um pulão; o sentido alterna e a altura muda.
  //      A base fica sempre acima de y 1060 (nunca na coluna de botões).
  let TRANS = 'moto';
  const VARIA_G = [{ base: 1000 }, { base: 900 }, { base: 1020 }, { base: 880 }, { base: 960 }, { base: 1010 }, { base: 920 }];
  const GALINHA_S = 255;                                 // 50% maior que no 1º corte (era 170), com contorno tinta
  function travessiaGalinha(k, u) {
    const v = VARIA_G[k % VARIA_G.length], jeito = k % 4, dir = k % 2 === 0 ? -1 : 1;
    const xa = dir > 0 ? -330 : W + 330, xb = dir > 0 ? W + 330 : -330;   // entra e sai inteira fora da tela (com o pintinho)
    let e = 0.8 * u + 0.2 * E.inOutSine(u), olhar = false, tilt = 0, base = v.base, freio = 0;
    if (jeito === 2) {                                       // freia no meio, olha para a câmera e dispara de novo
      if (u < 0.36) e = 0.5 * E.outCubic(u / 0.36);
      else if (u < 0.62) { e = 0.5 + 0.015 * Math.sin((u - 0.36) * 40) * (1 - (u - 0.36) / 0.26); olhar = true; freio = 1; }
      else e = 0.5 + 0.5 * E.inCubic((u - 0.62) / 0.38);
      tilt = u < 0.36 ? 0 : u < 0.62 ? -dir * 0.12 * Math.sin(Math.PI * (u - 0.36) / 0.26) : 0;
    }
    const x = lerp(xa, xb, e);                               // e = 0,5 é o meio da tela (onde ela freia)
    if (jeito === 0) {                                       // tropeça: cai para a frente e se apruma
      const s = p(u, 0.38, 0.62);
      tilt = dir * 0.55 * Math.sin(Math.PI * s); base += 14 * Math.sin(Math.PI * s);
    }
    if (jeito === 3) base -= 95 * Math.sin(Math.PI * p(u, 0.25, 0.75));   // o pulão
    return { dir, x, base, borda: x - dir * 40, tilt, olhar, freio, pinto: jeito === 1, jeito };
  }
  function drawWipeGalinha(ctx, t, k, u) {
    const T = travessiaGalinha(k, u);
    const g = ctx.createLinearGradient(T.borda - 80, 0, T.borda + 80, 0);
    g.addColorStop(0, css(C.papel, 0)); g.addColorStop(0.5, css(C.papel, 0.9)); g.addColorStop(1, css(C.papel, 0));
    ctx.fillStyle = g; ctx.fillRect(T.borda - 80, 0, 160, H);
    // as penas voando ao longo da borda (elas é que varrem o capítulo)
    const cores = [C.madeira, C.madeiraDark, C.papel, '#7A3A18'];
    for (let i = 0; i < 34; i++) {
      const x = T.borda - T.dir * (12 + 170 * hash(i, k + 11)), y = (hash(i, k + 13) * (H - 260) + 230 + 200 * u * hash(i, k + 15)) % H;
      pena(ctx, x + 10 * Math.sin(u * 9 + i), y, 10 + 8 * hash(i, k + 17), u * 6 * (hash(i, k + 19) - 0.5) + i, cores[i % 4]);
    }
    // a poeirinha nos pés
    for (let i = 0; i < 5; i++) { ctx.fillStyle = css(C.cremeDeep, 0.55 - 0.08 * i); ctx.beginPath(); ctx.arc(T.x - T.dir * (135 + i * 60), T.base - 14 - i * 4, 18 + 7 * i, 0, TAU); ctx.fill(); }
    const asa = T.freio ? 0.2 : 0.5 + 0.5 * Math.sin(t * 42);
    if (T.pinto) pintinho(ctx, T.x - T.dir * 285, T.base, 105, { dir: T.dir, passo: T.x / 9, contorno: 2.6 });
    galinha(ctx, T.x, T.base, GALINHA_S, { dir: T.dir, asa, passo: T.freio ? 0 : T.x / 14, tilt: T.tilt, olhar: T.olhar, contorno: 2.2 });
  }

  // ---- a transição do vira-lata (episódio com "transicao": "viralata"): o vira-lata caramelo atravessa correndo com a
  //      linguiça na boca; o rastro de poeira e fumacinha varre o capítulo. Cada troca varia (ciclo de 4): (0) correndo
  //      feliz, a linguiça balançando; (1) derrapa no meio e volta um passo; (2) com o tio da churrasqueira correndo atrás;
  //      (3) para no meio, olha para a câmera e sai em disparada. O sentido alterna e a altura muda; a base fica sempre
  //      acima de y 1060 (nunca na coluna de botões).
  const VARIA_V = [{ base: 1000 }, { base: 920 }, { base: 1010 }, { base: 900 }, { base: 980 }, { base: 1020 }, { base: 940 }];
  const CAO_S = 260;                                       // ≈ 400 px de largura, tamanho de protagonista
  function travessiaViralata(k, u) {
    const v = VARIA_V[k % VARIA_V.length], jeito = k % 4, dir = k % 2 === 0 ? -1 : 1;
    const xa = dir > 0 ? -400 : W + 400, xb = dir > 0 ? W + 400 : -400;
    let e = 0.8 * u + 0.2 * E.inOutSine(u), olhar = false, tilt = 0, base = v.base, parado = 0, derrapa = 0;
    if (jeito === 1) {                                       // derrapa no meio e volta um passo
      if (u < 0.4) e = 0.53 * E.outCubic(u / 0.4);
      else if (u < 0.62) { const s = p(u, 0.4, 0.62); e = 0.53 - 0.04 * E.inOutSine(s); derrapa = Math.sin(Math.PI * s); tilt = -dir * 0.16 * derrapa; }
      else e = 0.49 + 0.51 * E.inCubic((u - 0.62) / 0.38);
    }
    if (jeito === 3) {                                       // para no meio, olha para a câmera e dispara
      if (u < 0.36) e = 0.5 * E.outCubic(u / 0.36);
      else if (u < 0.62) { e = 0.5; olhar = true; parado = 1; }
      else e = 0.5 + 0.5 * E.inCubic((u - 0.62) / 0.38);
    }
    const x = lerp(xa, xb, e);
    if (jeito === 0) base -= 18 * Math.abs(Math.sin(u * 14));          // correndo feliz: aos pulinhos
    return { dir, x, base, borda: x - dir * 50, tilt, olhar, parado, derrapa, tio: jeito === 2, jeito };
  }
  function drawWipeViralata(ctx, t, k, u) {
    const T = travessiaViralata(k, u);
    const g = ctx.createLinearGradient(T.borda - 80, 0, T.borda + 80, 0);
    g.addColorStop(0, css(C.papel, 0)); g.addColorStop(0.5, css(C.papel, 0.9)); g.addColorStop(1, css(C.papel, 0));
    ctx.fillStyle = g; ctx.fillRect(T.borda - 80, 0, 160, H);
    // a poeira e a fumacinha ao longo da borda (elas é que varrem o capítulo)
    for (let i = 0; i < 30; i++) {
      const x = T.borda - T.dir * (10 + 170 * hash(i, k + 21)), y = (hash(i, k + 23) * (H - 260) + 230 - 160 * u * hash(i, k + 25)) % H;
      const r = 10 + 18 * hash(i, k + 27) + 10 * u;
      ctx.fillStyle = css(i % 3 ? C.cremeDeep : '#D9CFC6', 0.75 - 0.35 * hash(i, k + 29));
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    // a poeirada nos pés (maior na derrapada)
    for (let i = 0; i < 6; i++) { ctx.fillStyle = css(C.cremeDeep, 0.6 - 0.08 * i); ctx.beginPath(); ctx.arc(T.x - T.dir * (150 + i * 62), T.base - 14 - i * 5, (20 + 8 * i) * (1 + 0.8 * T.derrapa), 0, TAU); ctx.fill(); }
    if (T.tio) {                                             // o tio da churrasqueira correndo atrás, de pegador na mão
      const tx = T.x - T.dir * 330, tb = T.base - 22 * Math.abs(Math.sin(u * 16));
      ctx.save(); ctx.translate(tx, tb); ctx.rotate(T.dir * 0.12); ctx.translate(-tx, -tb);
      pessoa(ctx, TIO, tx, tb, t, { k: 0.9, look: [T.dir * 0.8, 0], sorriso: 0.3, acena: true });
      avental(ctx, TIO, tx, tb, t, { k: 0.9 });
      ctx.restore();
    }
    viralata(ctx, T.x, T.base, CAO_S, { dir: T.dir, passo: T.parado || T.derrapa > 0.2 ? 0 : T.x / 16, tilt: T.tilt, olhar: T.olhar, linguica: true,
      balanco: t * 14, rabo: t * 18, contorno: 2.2 });
  }

  // ---- a transição da sacola (episódio com "transicao": "sacola"; desde o ep04): a sacola comilona da UaiPertim pula
  //      na tela no tempo da batida (um pulo a cada meio tempo), abre a boca ABAIXO da logo e "engole" o capítulo com
  //      um NHAC! no tempo cheio; atrás dela já está o próximo ("ploc"). 4 jeitos em ciclo: (0) pulo e nhac direto;
  //      (1) bochechas cheias, mastigando; (2) palitando os dentes; (3) para, suspira satisfeita ("ahh") com
  //      coraçõezinhos e segue. O sentido alterna e a altura muda; a base fica sempre acima de y 1060 (nunca na coluna
  //      de botões) e nada (boca, migalha, "NHAC!", figurinha) fica por cima da logo da sacola.
  const VARIA_S = [{ base: 1010 }, { base: 960 }, { base: 1030 }, { base: 940 }, { base: 990 }, { base: 1020 }, { base: 970 }];
  const SACOLA_S = 330;                                   // o corpo; com as alças, ~400 px de altura (tamanho de protagonista)
  // o NHAC! cai no primeiro tempo cheio da batida dentro da troca (a troca começa num meio tempo)
  function nhacU(k) {
    const t1 = CAPS[k].t1, b = Math.ceil(t1 / BT - 1e-6) * BT;
    let u = (b - t1) / TR;
    if (u < 0.2) u += BT / TR;
    if (k % 4 === 3 && u > 0.5) u -= BT / 2 / TR;          // o suspiro precisa de espaço depois da mordida: o nhac vai no meio tempo anterior
    return u;
  }
  function travessiaSacola(k, u) {
    const v = VARIA_S[k % VARIA_S.length], jeito = k % 4, dir = k % 2 === 0 ? -1 : 1, un = nhacU(k);
    const xa = dir > 0 ? -240 : W + 240, xb = dir > 0 ? W + 240 : -240;
    let e = u, parada = 0;
    const a = un + 0.06, b = a + 0.24;
    if (jeito === 3) {                                       // chega no meio, para, suspira e segue
      if (u < a) e = 0.5 * u / a;
      else if (u < b) { e = 0.5; parada = 1; }
      else e = 0.5 + 0.5 * (u - b) / (1 - b);
    }
    const x = lerp(xa, xb, e);
    const h = (u * 3) % 1, voa = parada ? 0 : 1;
    const pulo = voa * 110 * Math.sin(Math.PI * h);
    const pouso = clamp(1 - Math.min(h, 1 - h) / 0.1);
    const sq = parada ? 1 + 0.03 * Math.sin(u * 40) : 1 - 0.18 * pouso + 0.07 * Math.sin(Math.PI * h);
    const boca = E.outCubic(p(u, un - 0.24, un - 0.03)) * (1 - p(u, un - 0.01, un + 0.05));
    return {
      dir, x, base: v.base - pulo, chao: v.base, borda: x, sq, tilt: -dir * 0.09 * Math.sin(Math.PI * h) * voa, jeito, un,
      boca, mastiga: jeito === 1 ? p(u, un + 0.02, un + 0.1) : 0, palito: jeito === 2 ? p(u, un + 0.06, un + 0.2) : 0,
      suspiro: jeito === 3 ? p(u, a, a + 0.06) * (1 - p(u, b - 0.05, b)) : 0, parada, a, b,
    };
  }
  // o "NHAC!" num estouro amarelo (fica sempre ao lado da sacola, nunca em cima da logo)
  function nhac(ctx, x, y, e, t) {
    if (e <= 0.002) return;
    const k = E.outBack(clamp(e), 2.6);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-9 * DEG); ctx.scale(k, k);
    ctx.beginPath(); for (let j = 0; j <= 24; j++) { const a = j / 24 * TAU, r2 = j % 2 ? 40 : 56; ctx.lineTo(Math.cos(a) * r2 * 1.7, Math.sin(a) * r2 * 0.85); }
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.fillStyle = C.amarelo; ctx.fill();
    txt(ctx, 'NHAC!', 0, 15, { size: 44, weight: 900, align: 'center', color: C.coral });
    ctx.restore();
  }
  const MIGALHA = ['#C98A4B', '#A86B33', '#E2CDB2', '#E8B04F'];
  function drawWipeSacola(ctx, t, k, u) {
    const T = travessiaSacola(k, u), kk = SACOLA_S / SAC.Hb;
    const g = ctx.createLinearGradient(T.borda - 80, 0, T.borda + 80, 0);
    g.addColorStop(0, css(C.papel, 0)); g.addColorStop(0.5, css(C.papel, 0.9)); g.addColorStop(1, css(C.papel, 0));
    ctx.fillStyle = g; ctx.fillRect(T.borda - 80, 0, 160, H);
    // as migalhas que ficam para trás, ao longo da borda (atrás da sacola)
    for (let i = 0; i < 30; i++) {
      const x = T.borda - T.dir * (16 + 160 * hash(i, k + 31)), y = (hash(i, k + 33) * (H - 300) + 240 + 220 * u * hash(i, k + 35)) % H;
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * 8 + i); ctx.globalAlpha = 0.85 * (1 - 0.5 * hash(i, k + 37));
      ctx.fillStyle = MIGALHA[i % 4]; rr(ctx, -7, -5, 14, 10, 4); ctx.fill(); ctx.restore();
    }
    // a mordida: as migalhas espirrando da boca (para trás e para cima, atrás da sacola)
    const ub = (u - T.un) / 0.3;
    if (ub > 0 && ub < 1) {
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 - T.dir * (0.3 + 1.1 * hash(i, k + 41)), v = 260 + 260 * hash(i, k + 43);
        const x = T.x + Math.cos(a) * v * ub, y = T.base + SAC.mouthY * kk + Math.sin(a) * v * ub + 500 * ub * ub;
        ctx.save(); ctx.globalAlpha = 1 - ub; ctx.translate(x, y); ctx.rotate(ub * 9 + i); ctx.fillStyle = MIGALHA[i % 4]; rr(ctx, -6, -4, 12, 8, 3); ctx.fill(); ctx.restore();
      }
    }
    // a poeirinha do pouso
    for (let i = 0; i < 4; i++) { ctx.fillStyle = css(C.cremeDeep, 0.45 - 0.08 * i); ctx.beginPath(); ctx.arc(T.x - T.dir * (150 + i * 50), T.chao - 12 - i * 4, 16 + 7 * i, 0, TAU); ctx.fill(); }
    sacolaComilona(ctx, T.x, T.base, SACOLA_S, t, { dir: T.dir, sq: T.sq, tilt: T.tilt, boca: T.boca, mastiga: T.mastiga, palito: T.palito, suspiro: T.suspiro,
      look: [T.dir * 0.7, T.boca > 0.3 ? 0.4 : 0.1], blink: blinkAt(t, k + 17), contorno: 2.4 });
    // o NHAC! na frente da boca, do lado de onde ela vai (fora da sacola)
    nhac(ctx, T.x + T.dir * 250, T.base - 150 * kk, p(u, T.un - 0.02, T.un + 0.07) * (1 - p(u, T.un + 0.3, T.un + 0.4)), t);
    // o suspiro satisfeito: "ahh…" em cima das alças e os coraçõezinhos dos lados (longe da logo)
    if (T.suspiro > 0.01) {
      const top = T.base - (SAC.Hb + 90) * kk;
      txt(ctx, 'ahh…', T.x, top - 18, { size: 50, weight: 900, align: 'center', color: css(C.coral, T.suspiro) });
      for (let i = 0; i < 4; i++) {
        const ph = clamp((u - T.a) / 0.3 - i * 0.18), sx = i % 2 ? 1 : -1;
        if (ph > 0 && ph < 1) sticker(ctx, 'coracao', T.x + sx * (178 + 18 * i), T.base - 260 * kk - 150 * ph, 40, Math.min(1, ph * 4) * (1 - p(ph, 0.75, 1)), t);
      }
    }
  }
  function drawWipe(ctx, t, k, u) {
    if (TRANS === 'galinha') return drawWipeGalinha(ctx, t, k, u);
    if (TRANS === 'viralata') return drawWipeViralata(ctx, t, k, u);
    if (TRANS === 'sacola') return drawWipeSacola(ctx, t, k, u);
    const T = travessia(k, u);
    // a cortina: uma faixa creme macia ao longo da borda da varredura
    const g = ctx.createLinearGradient(T.borda - 80, 0, T.borda + 80, 0);
    g.addColorStop(0, css(C.papel, 0)); g.addColorStop(0.5, css(C.papel, 0.9)); g.addColorStop(1, css(C.papel, 0));
    ctx.fillStyle = g; ctx.fillRect(T.borda - 80, 0, 160, H);
    // o confete que fica para trás, ao longo da borda
    const cores = [C.coral, C.amarelo, C.verde, C.coralLight];
    for (let i = 0; i < 36; i++) {
      const x = T.borda - T.dir * (14 + 150 * hash(i, k + 1)), y = (hash(i, k + 3) * (H - 300) + 240 + 260 * u * hash(i, k + 5)) % H;
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * 9 + i); ctx.globalAlpha = 0.85 * (1 - 0.6 * hash(i, k + 2));
      ctx.fillStyle = cores[i % 4]; ctx.fillRect(-7, -3, 14, 6); ctx.restore();
    }
    // a poeira atrás da motinha
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = css(C.cremeDeep, 0.6 - 0.08 * i);
      ctx.beginPath(); ctx.arc(T.x - T.dir * (150 + i * 58), T.base - 22 - i * 5 + 6 * Math.sin(u * 12 + i), 26 + 9 * i, 0, TAU); ctx.fill();
    }
    // a motinha, com a sacola da marca na garupa
    moto(ctx, T.x, T.base, MOTO_TR, { dir: T.dir, tilt: T.tilt, roll: T.x / 30, speed: 1 });
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
  // ---------------------------------------------------------------- o céu do dia (opcional: "ceu" em cada capítulo do JSON, ep02 em diante)
  // Cada estado tem um degradê vertical (posição 0–1 da tela → cor, sempre da paleta ou de misturas dela), a posição do sol
  // e da lua no arco (s 0..1 da esquerda para a direita; [s, opacidade]) e se o topo pede a marca clara. A faixa da coluna
  // de botões (y 1060–1560 ≈ 0,55–0,81) fica quase lisa em todos os degradês.
  let CEU = false;
  const CEUS = {
    amanhecer: { a: 0.85, cores: [[0, '#FFB98F'], [0.32, '#FFD9B8'], [0.6, '#FBEBDD'], [1, '#F6EEE2']], sol: [0.06, 1], lua: [-0.25, 0], corSol: '#FFD27A', clara: 0 },
    meiodia: { a: 0.8, cores: [[0, '#FFE08A'], [0.35, '#FFF2C8'], [0.7, '#FFF8EE'], [1, '#F6EEE2']], sol: [0.5, 1], lua: [-0.25, 0], corSol: '#F9B233', clara: 0 },
    tarde: { a: 0.9, cores: [[0, '#F9B233'], [0.3, '#FFD27A'], [0.62, '#FFE9C2'], [1, '#FCE3CB']], sol: [0.8, 1], lua: [-0.25, 0], corSol: '#F9B233', clara: 0 },
    porDoSol: { a: 0.95, cores: [[0, '#E7431C'], [0.12, '#F2502B'], [0.24, '#FFD27A'], [0.4, '#FFE6C9'], [0.82, '#FFD9B8'], [1, '#FF8A63']], sol: [0.9, 1], lua: [-0.25, 0], corSol: '#FF8A63', clara: 1 },
    noite: { a: 1, cores: [[0, '#221C19'], [0.55, '#2E2420'], [0.82, '#3A2B24'], [1, '#4A3226']], sol: [1.18, 0], lua: [0.24, 1], corSol: '#FF8A63', clara: 1, escuro: 1 },
    creme: { a: 0, cores: [], sol: [1.3, 0], lua: [0.45, 0], corSol: '#F9B233', clara: 0 },
  };
  const ceuDe = (cap) => CEUS[cap.ceu] || CEUS.creme;
  const noturno = (cap) => !!ceuDe(cap).escuro;            // título e apoio em creme/amarelo sobre o fundo escuro
  function ceuFundo(ctx, t, cap) {
    const c = ceuDe(cap);
    if (c.a <= 0) return;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    c.cores.forEach(([pos, cor]) => g.addColorStop(pos, cor));
    ctx.save(); ctx.globalAlpha *= c.a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    if (!c.escuro) {                                        // as nuvens passando devagar (o céu nunca fica parado)
      for (let i = 0; i < 5; i++) {
        const sz = 0.7 + 0.6 * hash(i, 41), y = [470, 620, 760, 900, 1000][i];
        const x = ((hash(i, 42) * 1500 + t * (14 + 12 * hash(i, 43))) % 1500) - 210;
        ctx.fillStyle = css(C.papel, 0.5 * c.a);
        ctx.beginPath(); ctx.arc(x, y, 34 * sz, 0, TAU); ctx.arc(x + 46 * sz, y - 16 * sz, 44 * sz, 0, TAU); ctx.arc(x + 96 * sz, y, 32 * sz, 0, TAU); ctx.fill();
        rr(ctx, x - 30 * sz, y - 4 * sz, 156 * sz, 38 * sz, 19 * sz); ctx.fill();
      }
    }
    if (c.escuro) {                                         // as estrelas (nunca na faixa da coluna de botões)
      for (let i = 0; i < 70; i++) {
        const x = 20 + hash(i, 31) * 1040, y = 20 + hash(i, 32) * 1500;
        if (x > 900 && y > 1020) continue;
        const tw_ = 0.45 + 0.55 * Math.abs(Math.sin(t * (1.2 + hash(i, 33) * 2) + i)), r = 1.6 + 2.6 * hash(i, 34);
        ctx.fillStyle = css(i % 7 === 0 ? C.amareloLight : C.papel, 0.8 * tw_);
        if (i % 9 === 0) { starPath(ctx, x, y, r * 2.4, 4, 0.35); ctx.fill(); } else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      }
    }
  }
  // o estado do céu agora (o sol e a lua andam no arco junto com a troca; na capa o sol vai nascendo)
  function ceuAgora(t) {
    const w = where(t), A = ceuDe(CAPS[w.k]), B = w.trans ? ceuDe(CAPS[w.k + 1]) : A, e = w.trans ? E.inOutSine(w.u) : 0;
    const mix2 = (a, b) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
    const est = { sol: mix2(A.sol, B.sol), lua: mix2(A.lua, B.lua), corSol: mixHex(A.corSol, B.corSol, e), clara: lerp(A.clara, B.clara, e) };
    if (w.k === 0 && !w.trans) est.sol[0] = lerp(0.0, A.sol[0], E.outCubic(p(t, 0, CAPS[0].t1)));
    return est;
  }
  function arco(s) {
    const sc = clamp(s, 0, 1);
    // o arco: nasce à esquerda (perto do título, mas fora dele), passa alto atrás da marca ao meio-dia e se põe à direita,
    // aberto para fora da tela no fim (o sol do poente nunca fica atrás do título)
    return { x: 120 + 840 * s + (s > 0.8 ? 300 * (s - 0.8) : 0), y: 640 - 470 * Math.sin(Math.PI * sc) + (s > 1 ? 1100 * (s - 1) : 0) + (s < 0 ? -1100 * s : 0) };
  }
  function astros(ctx, t) {
    const est = ceuAgora(t);
    if (est.sol[1] > 0.01) {
      const { x, y } = arco(est.sol[0]), r = 78, a = est.sol[1];
      let g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3);
      g.addColorStop(0, css(est.corSol, 0.45 * a)); g.addColorStop(1, css(est.corSol, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3); ctx.globalAlpha *= a;
      ctx.strokeStyle = est.corSol; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const an = i / 12 * TAU, l = r + 22 + 10 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.moveTo(Math.cos(an) * (r + 12), Math.sin(an) * (r + 12)); ctx.lineTo(Math.cos(an) * l, Math.sin(an) * l); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = est.corSol; ctx.fill();
      ctx.fillStyle = css(C.papel, 0.35); ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (est.lua[1] > 0.01) {
      const { x, y } = arco(est.lua[0]), r = 62, a = est.lua[1];
      const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6);
      g.addColorStop(0, css(C.papel, 0.3 * a)); g.addColorStop(1, css(C.papel, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C.papel; ctx.fill();
      ctx.fillStyle = C.cremeDark; [[-0.3, -0.2, 0.2], [0.25, 0.15, 0.14], [-0.05, 0.4, 0.1], [0.35, -0.35, 0.09]].forEach(([dx, dy, rr2]) => { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr2 * r, 0, TAU); ctx.fill(); });
      ctx.restore();
    }
  }

  function brand(ctx, t) {
    // véu creme no topo, atrás da marca e da barra de progresso (com o céu do dia, o céu fica à mostra)
    const clara = CEU ? ceuAgora(t).clara : 0;            // topo escuro/coral: a marca fica clara
    if (!CEU) {
      const g = ctx.createLinearGradient(0, 230, 0, 412);
      g.addColorStop(0, css('#FBF3E8', 0.96)); g.addColorStop(1, css('#FBF3E8', 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 412); ctx.fillStyle = css('#FBF3E8', 0.96); ctx.fillRect(0, 0, W, 230);
    }
    const d = 58, nameW = tw('UaiPertim', 28, 900), handleW = tw(LN.marca, 20, 500, 0.3);
    const gw = d + 14 + Math.max(nameW, handleW), x0 = 540 - gw / 2, cy = 334;
    if (CEU) {
      // com o céu do dia: uma pílula creme translúcida atrás da marca, em todos os céus (mais opaca no pôr do sol e à noite),
      // e a marca nas cores de sempre — "Uai" tinta e "Pertim" coral nunca somem sobre o laranja nem sobre o escuro
      ctx.save(); rr(ctx, x0 - 16, cy - d / 2 - 9, gw + 36, d + 18, (d + 18) / 2);
      ctx.shadowColor = 'rgba(60,30,15,0.18)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
      ctx.fillStyle = css(C.papel, 0.6 + 0.32 * clara); ctx.fill(); ctx.restore();
    }
    logo(ctx, x0 + d / 2, cy, d);
    const tx = x0 + d + 14;
    const w1 = txt(ctx, 'Uai', tx, cy - 2, { size: 28, weight: 900, color: C.tinta });
    txt(ctx, 'Pertim', tx + w1, cy - 2, { size: 28, weight: 900, color: C.coral });
    txt(ctx, LN.marca, tx, cy + 23, { size: 20, weight: 500, color: C.cinza, ls: 0.3 });
    BOX('marca', x0, cy - d / 2, x0 + gw, cy + d / 2);
    // a barra de progresso (estilo stories): um segmento por capítulo, sem a capa, preenchendo em coral.
    // Aparece na 1ª troca; o segmento do fecho termina de encher 3 s antes do fim (o fecho fica parado)
    const a = clamp((t - CAPS[0].t1) / TR);
    if (a > 0 && NC > 1) {
      const n = NC - 1, gap = 10, w0 = 560, sw = (w0 - gap * (n - 1)) / n, bx = 540 - w0 / 2, y = L.progY, h = 10;
      ctx.save(); ctx.globalAlpha *= a;
      for (let i = 0; i < n; i++) {
        const c = CAPS[i + 1], fim = i === n - 1 ? DUR - 3 : c.t1;
        const f = clamp((t - c.t0) / Math.max(0.1, fim - c.t0)), x = bx + i * (sw + gap);
        rr(ctx, x, y - h / 2, sw, h, h / 2); ctx.fillStyle = clara ? css(C.papel, 0.16 + 0.2 * clara) : css(C.coral, 0.16); ctx.fill();
        if (f > 0) { rr(ctx, x, y - h / 2, Math.max(h, sw * f), h, h / 2); ctx.fillStyle = clara ? mixHex(C.coral, C.papel, clara) : C.coral; ctx.fill(); }
      }
      ctx.restore();
      if (a >= 1) BOX('progresso', bx, y - h / 2, bx + w0, y + h / 2);
    }
  }

  // =====================================================================
  // CABEÇALHO DO CAPÍTULO (rótulo em adesivo + título centralizado) e LINHA DE APOIO
  // =====================================================================
  // o adesivo inclinado (rótulo dos capítulos e o chip da capa): fundo amarelo ou coral, borda branca, entra com "plop"
  function adesivo(ctx, s, x, y, e, o = {}) {
    if (e <= 0.002) return null;
    const size = o.size || 26, h = o.h || 58, coral = !!o.coral, rot = (o.rot ?? (coral ? 3 : -4)) * DEG;
    const w = 2 * 26 + tw(s, size, 900, 3), k = E.outBack(clamp(e), 3.2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * (1 + 0.8 * (1 - clamp(e)))); ctx.scale(k, k); ctx.globalAlpha *= clamp(e * 4);
    rr(ctx, -w / 2, -h / 2, w, h, 14);
    ctx.shadowColor = 'rgba(120,60,30,0.22)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    ctx.lineWidth = 9; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = coral ? C.coral : C.amarelo; ctx.fill();
    txt(ctx, s, -w / 2 + 26, size * 0.36, { size, weight: 900, ls: 3, color: coral ? C.branco : C.tinta });
    ctx.restore();
    const hw = (w / 2) * Math.cos(rot) + (h / 2) * Math.abs(Math.sin(rot)) + 5, hh = (h / 2) * Math.cos(rot) + (w / 2) * Math.abs(Math.sin(rot)) + 5;
    if (o.box && e >= 1) BOX(o.box, x - hw, y - hh, x + hw, y + hh);
    return { w, h, hw, hh };
  }
  function layoutTitulo(cap) {
    const s = fitSize(cap.titulo, 900, L.tw, 100, -0.02);
    cap.ts = s;
    cap.tb = [L.tituloTopo + 0.78 * s, L.tituloTopo + 0.78 * s + 1.04 * s];
    cap.apY = cap.tb[1] + 0.25 * s + 54;
    cap.apX = L.tx; cap.apAlign = 'center';
    const rows = Math.max(0, ...cap.apoios.map((a) => apoioRows(cap, a).length));
    // a cena começa logo abaixo da última linha de apoio (ou do título, se o capítulo não tem apoio)
    cap.cenaTop = rows ? cap.apY + 52 * (rows - 1) + 46 : cap.tb[1] + 0.25 * s + 30;
  }
  const SOCO = 0.3;                                     // o "soco": zoom rápido (de 1,45×) com leve overshoot, em 0,3 s
  // o título bate no tempo da batida: a 1ª linha no 1º tempo cheio depois de a varredura passar do meio, a 2ª meio tempo depois;
  // o rótulo faz "plop" meio tempo antes da 1ª linha
  const tituloT = (cap) => { const b = Math.ceil((cap.t0 - 0.4 * TR) / BT - 1e-6) * BT; return [b, b + BT / 2]; };
  const rotuloT = (cap) => Math.max(tituloT(cap)[0] - BT / 2, cap.t0 - 0.45 * TR);
  function header(ctx, cap, t) {
    const tr = rotuloT(cap);
    adesivo(ctx, cap.rotulo, L.tx, L.rotY, p(t, tr, tr + 0.35), { coral: cap.n % 2 === 0, box: 'rótulo' });
    const s = cap.ts, tl = tituloT(cap);
    cap.titulo.forEach((ln, i) => {
      if (t < tl[i]) return;
      const u = p(t, tl[i], tl[i] + SOCO);
      const k = u >= 1 ? 1 : lerp(1.45, 1, E.outBack(u, 2.8));
      const w = tw(ln, s, 900, -0.02 * s), x0 = L.tx - w / 2, cy = cap.tb[i] - 0.3 * s;
      ctx.save(); ctx.globalAlpha = clamp(u * 5); ctx.translate(L.tx, cy); ctx.scale(k, k); ctx.translate(-L.tx, -cy);
      const cores = noturno(cap) ? [C.papel, C.amarelo] : [C.tinta, C.coral];   // à noite: creme e amarelo sobre o fundo escuro
      txt(ctx, ln, x0, cap.tb[i], { size: s, weight: 900, color: cores[i === 1 ? 1 : 0], ls: -0.02 * s, box: u > 0.5 ? `título, linha ${i + 1}` : null });
      ctx.restore();
    });
  }
  function apoioRows(cap, a) {
    if (!a._rows) a._rows = layoutRich(a.texto, L.tw);
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
        const noite = noturno(cap);                     // à noite: texto creme, marcador coral (o creme não some sobre o amarelo)
        const fecha = () => { if (mx !== null) marker(ctx, mx, y, mw, AP.size, mk, noite ? css(C.coral, 0.95) : css(C.amarelo, 0.9)); mx = null; mw = 0; };
        r.words.forEach((wd, k) => {
          wd.segs.forEach((sg) => { if (sg.m === '*') { if (mx === null) mx = x; mw = x + sg.w - mx; } else fecha(); x += sg.w; });
          if (!(wd.segs[wd.segs.length - 1].m === '*' && r.words[k + 1] && r.words[k + 1].segs[0].m === '*')) fecha();
          x += r.sp;
        });
        fecha();
        x = x0;
        r.words.forEach((wd) => {
          wd.segs.forEach((sg) => { txt(ctx, sg.s, x, y, { size: AP.size, weight: sg.m ? AP.wH : AP.w, color: sg.m === '~' ? (noite ? C.amarelo : C.coral) : (noite ? C.papel : C.tinta) }); x += sg.w; });
          x += r.sp;
        });
        ctx.restore();
        if (al > 0.99) BOX(`apoio ${i + 1}, linha ${j + 1}`, x0, y - 32, x0 + r.w, y + 12);
      });
    });
  }

  // =====================================================================
  // CENAS (a área da cena vai de cap.cenaTop, logo abaixo do apoio, até PE = y 1450, e de x 90 a 930)
  // =====================================================================
  const CENAS = {};
  const PE = 1450;                                      // o pé da cena (a zona segura vai até y 1456)
  // a lojinha viva: brota (e 0..1), pisca, pula na batida, olha para `alvo` e sorri (smile 0..1)
  function lojinha(ctx, kind, x, base, w, t, o = {}) {
    const e = o.e ?? 1;
    if (e <= 0.002) return;
    const k = E.outBack(clamp(e), 2.2);
    const pulo = o.pula === false ? 0 : (o.altura ?? 11) * hop(t, o.fase || 0) * clamp(e * 2 - 1);
    const look = o.alvo ? [clamp((o.alvo[0] - x) / 420, -1, 1), clamp((o.alvo[1] - (base - w * 0.75)) / 420, -1, 1)] : (o.look || [0, 0.2]);
    ctx.save(); ctx.translate(x, base); ctx.scale(lerp(0.6, 1, k), k); ctx.translate(-x, -base - pulo);
    shop(ctx, kind, x, base, w, { blink: o.blink ?? blinkAt(t, o.seed || 0), look, smile: o.smile || 0, lit: o.lit ?? 1, swing: o.swing || 0, toldo: o.toldo });
    ctx.restore();
    if (o.box) BOX(o.box, x - w * 0.5, base - w * ALTURA_LOJA, x + w * 0.5, base);
  }
  const ALTURA_LOJA = 1.27;                             // a lojinha (com a placa) tem 1,27 × a largura de altura

  // ---- capa (capítulo 00 = quadro 0): o adesivo "TUDO PERTIM · EP. NN", "Tá chegando / no Glória 👀" com os olhinhos
  //      piscando e a motinha grande chegando freando e derrapando (no quadro 0 ela já está na derrapada, inteira na
  //      tela); confete; no fim ela arranca para a esquerda e a troca vem pela direita
  CENAS.capa = {
    setup(cap) {
      const d = cap.diagrama;
      const ls = (S) => -0.03 * S;
      // a largura de uma linha do título (o 👀 vira os olhinhos desenhados)
      cap.linhaW = (ln, S) => {
        const temOlhos = ln.includes(OLHOS), temRel = ln.includes(RELOGIO), tx = ln.replace(OLHOS, '').replace(RELOGIO, '').trimEnd();
        return tw(tx, S, 900, ls(S)) + (temOlhos ? tw(' ', S, 900) + OLHOS_W(S) : 0) + (temRel ? tw(' ', S, 900) + RELOGIO_W(S) : 0);
      };
      let S = 176;
      while (S > 40 && cap.titulo.some((l) => cap.linhaW(l, S) > 760)) S -= 1;   // nenhuma linha passa de 72% da largura (778 px)
      const MS = 320;                                       // a motinha da capa
      // a altura do adesivo inclinado (a mesma conta de adesivo(): h 64, −4°, mais a folga da borda)
      const aw = 2 * 26 + tw(cap.rotulo, 26, 900, 3), rot = 4 * DEG;
      const chipH = 2 * (32 * Math.cos(rot) + (aw / 2) * Math.sin(rot) + 5), ilH = d.cena === 'porta' || d.cena === 'churrasco' || d.cena === 'segunda' ? 330 : MS * 1.0;
      const titleH = 0.78 * S + 1.0 * S + 0.2 * S;
      const total = chipH + 44 + titleH + 56 + ilH;
      const top = 960 - total / 2;                          // o bloco centrado no recorte 3:4 (y 240–1680)
      const Ly = {};
      Ly.chipY = top + chipH / 2;
      Ly.b1 = top + chipH + 44 + 0.78 * S; Ly.b2 = Ly.b1 + 1.0 * S;
      Ly.moto = { x: 600, base: top + total };
      Ly.top = top; Ly.bottom = top + total;
      Object.assign(cap, { capaS: S, Ly, motoS: MS });
      cap.apY = Ly.bottom + 80; cap.apX = 540; cap.apAlign = 'center';
      cap.ev.olhos = at(cap, d.olhos && d.olhos.em, cap.t0 + 0.6);
      cap.ev.confete = at(cap, d.confete && d.confete.em, cap.t0 + 1.2);
      cap.ev.buzina = Math.min(at(cap, d.buzina && d.buzina.em, cap.t1 - 1.4), cap.t1 - 0.95);
      cap.ev.sai = cap.t1 - 0.5;                            // a motinha arranca e sai pela esquerda
      if (d.cena === 'segunda') {
        // o calendário com o "SEG" caindo, o bonequinho bocejando no cobertor e a geladeira entreaberta
        cap.ev.cal = at(cap, d.calendario && d.calendario.em, cap.t0 + 0.2);
        cap.ev.geladeira = at(cap, d.geladeira && d.geladeira.em, cap.t0 + 1.0);
        cap.ev.bocejo = at(cap, d.bocejo && d.bocejo.em, cap.t0 + 2.0);
        cap.ev.bocejos = [];
        for (let tb = cap.ev.bocejo + 2.6; tb < cap.t1 - 1.0; tb += 2.6) cap.ev.bocejos.push(tb);
        cap.ev.confete = null;
        cue(cap.ev.cal, 'flop'); cue(cap.ev.geladeira, 'door'); cue(cap.ev.bocejo, 'zzz');
        return;
      }
      if (d.cena === 'churrasco') {
        // a churrasqueira apagada com a fumacinha triste, o saco de carvão vazio e o vira-lata pidão espiando
        cap.ev.cao = at(cap, d.cao && d.cao.em, cap.t0 + 1.5);
        cap.ev.confete = null;
        cue(cap.ev.cao, 'pidao');
        return;
      }
      if (d.cena === 'porta') {
        // a porta tremendo com o TOC TOC (duas batidas, de tempos em tempos) e a lata vazia com a mosquinha
        cap.ev.lata = at(cap, d.lata && d.lata.em, cap.t0 + 1.5);
        cap.ev.confete = null;                              // nesta capa não tem confete
        cap.ev.tocs = [];
        for (let tk = 0.35; tk < cap.t1 - 0.4; tk += 1.5) cap.ev.tocs.push(tk, tk + 0.3);
        cap.ev.tocs.forEach((x) => cue(x, 'toc')); cue(0.05, 'mosca', { d: cap.t1 - 0.1 }); cue(cap.ev.lata, 'jump');
        return;
      }
      cue(0.0, 'skid'); cue(0.5, 'jump');
      cue(cap.ev.olhos, 'blink'); cue(cap.ev.confete, 'confete'); cue(cap.ev.buzina, 'horn'); cue(cap.ev.sai, 'moto', { d: 0.5 });
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, Ly = cap.Ly, S = cap.capaS, ev = cap.ev;
      adesivo(ctx, cap.rotulo, 540, Ly.chipY, 1, { coral: false, rot: -4, h: 64, size: 26, box: 'chip' });
      confete(ctx, t, ev.confete, 540, Ly.b1 - S * 0.3, 7, { n: 50, v: 1050, spread: 3.0 });
      cap.titulo.forEach((ln, i) => {
        const y = i ? Ly.b2 : Ly.b1, col = i ? C.coral : C.tinta, ls = -0.03 * S;
        const w = cap.linhaW(ln, S), x0 = 540 - w / 2;
        const temOlhos = ln.includes(OLHOS), temRel = ln.includes(RELOGIO), tx = ln.replace(OLHOS, '').replace(RELOGIO, '').trimEnd();
        const mi = d.marcador ? tx.toLowerCase().indexOf(d.marcador.toLowerCase()) : -1;
        if (mi >= 0) {
          const pre = tx.slice(0, mi), mw = tw(tx.slice(mi, mi + d.marcador.length), S, 900, ls), mx = x0 + (pre ? tw(pre, S, 900, ls) + ls : 0);
          marker(ctx, mx, y, mw, S, 1, C.amarelo);
          BOX('palavra-chave', mx, y - S * 0.76, mx + mw, y + S * 0.22);
        }
        const pulso = 1 + 0.025 * Math.pow(hop(t), 8) * clamp(t / 0.6);   // um pulinho nos tempos fortes (no quadro 0, parado)
        ctx.save(); ctx.translate(540, y - S * 0.3); ctx.scale(pulso, pulso); ctx.translate(-540, -(y - S * 0.3));
        const wt = txt(ctx, tx, x0, y, { size: S, weight: 900, color: col, ls });
        if (temOlhos) {
          const fase = t - ev.olhos, look = fase < 0 ? [0.5, 0.7] : [0.9 * Math.sin(fase * 2.4), 0.3 * Math.cos(fase * 1.7)];
          const pisca = fase < 0 ? 0 : Math.max(blinkAt(t, 3), fase < 0.18 ? Math.sin(Math.PI * fase / 0.18) : 0);
          olhos(ctx, x0 + wt + tw(' ', S, 900), y, S, pisca, look);
        }
        if (temRel) {
          // o relógio girando rápido (no quadro 0, parado em 10h10), tremendo como despertador
          const rr_ = RELOGIO_W(S) * 0.42, cx = x0 + wt + tw(' ', S, 900) + RELOGIO_W(S) / 2, cy = y - S * 0.36;
          relogio(ctx, cx, cy, rr_, 10.17 + 2.5 * t * clamp(t / 0.4), { rot: 0.08 * Math.sin(t * 38) * clamp(t / 0.3) });
        }
        ctx.restore();
        BOX(`título, linha ${i + 1}`, x0, y - S * 0.76, x0 + w, y + S * 0.22);
      });
      if (d.cena === 'porta') return CENAS.capa.porta(ctx, cap, t);
      if (d.cena === 'churrasco') return CENAS.capa.churrasco(ctx, cap, t);
      if (d.cena === 'segunda') return CENAS.capa.segunda(ctx, cap, t);
      // a motinha (o mascote) chegando da direita: no quadro 0 está freando, inclinada, com fumaça e a marca do pneu
      const M = Ly.moto, MS = cap.motoS, u = p(t, 0, 0.75), us = p(t, ev.sai, cap.t1);
      const x = M.x + 34 * (1 - E.outCubic(u)) - 1000 * E.inCubic(us);
      const tilt = -0.16 * Math.exp(-u * 3.2) * Math.cos(u * 10) + 0.1 * Math.sin(Math.PI * us);
      const buz = p(t, ev.buzina, ev.buzina + 0.4), pulo = 26 * Math.sin(Math.PI * buz) + 4 * hop(t) * clamp(t - 0.8) * (1 - us);
      ctx.save(); ctx.lineCap = 'round';
      for (const [dy, a] of [[-2, 0.32], [7, 0.18]]) {
        ctx.strokeStyle = css(C.tinta, a); ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(M.x + 34 + MS * 0.22, M.base + dy); ctx.lineTo(Math.min(915, M.x + MS * 0.22 + 300), M.base + dy); ctx.stroke();
      }
      const fu = clamp(1 - t / 1.1);
      for (let i = 0; i < 5; i++) {
        const ph = clamp(t / 1.1 + i * 0.08), r = 26 + 34 * ph + 6 * i;
        ctx.fillStyle = css(C.cremeDeep, 0.85 * fu); ctx.beginPath(); ctx.arc(Math.min(860, x + MS * 0.36 + i * 34 + 30 * ph), M.base - 20 - i * 6 - 30 * ph, r, 0, TAU); ctx.fill();
      }
      ctx.restore();
      moto(ctx, x, M.base - pulo, MS, { dir: -1, tilt, roll: -x / 30, speed: Math.max(0.6 * (1 - u), us) });
      if (us === 0) BOX('motinha', x - MS * 0.6, M.base - MS * 0.98, x + MS * 0.55, M.base);
      sticker(ctx, 'uai', 200, Ly.chipY + 10, 96, p(t, ev.confete + 0.15, ev.confete + 0.5), t);
      sticker(ctx, 'brilho', 880, Ly.chipY, 62, p(t, ev.confete + 0.05, ev.confete + 0.4), t);
    },
  };

  // a capa com a porta (ep03): no quadro 0 a porta, o "TOC TOC" e a lata vazia com a mosquinha já estão na tela
  CENAS.capa.porta = function (ctx, cap, t) {
    const Ly = cap.Ly, ev = cap.ev, B = Ly.bottom;
    const treme = ev.tocs.reduce((a, x) => a + 6 * Math.sin((t - x) * 70) * Math.exp(-Math.max(0, t - x) * 14) * (t > x ? 1 : 0), 0);
    porta(ctx, 390, B, 200, 300, 0, treme);
    BOX('porta', 390 - 118, B - 318, 390 + 118, B);
    // o "TOC TOC" (sempre na tela; pula a cada batida)
    const pulo = ev.tocs.reduce((a, x) => Math.max(a, Math.sin(Math.PI * p(t, x, x + 0.25))), 0);
    ctx.save(); ctx.translate(640, B - 262); ctx.rotate(-8 * DEG); ctx.scale(1 + 0.12 * pulo, 1 + 0.12 * pulo);
    ctx.beginPath(); for (let j = 0; j <= 24; j++) { const a = j / 24 * TAU, r2 = j % 2 ? 48 : 66; ctx.lineTo(Math.cos(a) * r2 * 1.6, Math.sin(a) * r2 * 0.8); }
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.fillStyle = C.amarelo; ctx.fill();
    txt(ctx, 'TOC TOC', 0, 14, { size: 40, weight: 900, align: 'center', color: C.coral });
    ctx.restore();
    BOX('toc toc', 640 - 106, B - 262 - 53, 640 + 106, B - 262 + 53);
    // a lata vazia (sem tampa) com a mosquinha rodando
    const pl = Math.sin(Math.PI * p(t, ev.lata, ev.lata + 0.4));
    lata(ctx, 700, B - 24 * pl, 160, { tampa: 1 });
    BOX('lata', 700 - 135, B - 160, 700 + 76, B);
    mosquinha(ctx, 820, B - 150, t, 1.3);
  };

  // a capa da churrasqueira (ep05): no quadro 0 a churrasqueira apagada, o saco de carvão vazio e o vira-lata pidão já estão na tela
  CENAS.capa.churrasco = function (ctx, cap, t) {
    const Ly = cap.Ly, ev = cap.ev, B = Ly.bottom;
    churrasqueira(ctx, 325, B, 250, t, { acesa: 0 });
    BOX('churrasqueira', 325 - 125, B - 195, 325 + 125, B);
    fumacaTriste(ctx, 315, B - 202, t);
    sacoCarvao(ctx, 600, B, 120, { virado: true });
    BOX('saco de carvão', 600 - 130, B - 70, 600 + 60, B);
    // o vira-lata pidão (as orelhas murcham e ele choraminga na palavra)
    const ch = Math.sin(Math.PI * p(t, ev.cao, ev.cao + 0.6));
    viralata(ctx, 808, B - 6 * ch, 195, { pose: 'sentado', olhar: true, pidao: true, rabo: t * 3, contorno: 1.8 });
    BOX('vira-lata', 808 - 138, B - 300, 808 + 120, B);
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
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const Lg = { x: L.cx, y: T + 160, D: 300 };
      const pos = [{ x: 185, base: T + 310 }, { x: 835, base: T + 310 }, { x: 300, base: PE - 12 }, { x: 720, base: PE - 12 }];
      const eg = p(t, ev.logo, ev.logo + 0.5);
      pop(ctx, eg, Lg.x, PE - 40, () => {
        ctx.fillStyle = css(C.verdeLight, 0.55); ctx.beginPath(); ctx.ellipse(Lg.x, PE - 40, 420, 62, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = css(C.papel, 0.95); ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(Lg.x, PE - 40, 345, 42, 0, 0, TAU); ctx.stroke();
        coreto(ctx, Lg.x, PE - 12, 200, t);
        BOX('praça', Lg.x - 100, PE - 270, Lg.x + 100, PE - 12);
      }, 1.4);
      d.lojas.forEach((l, i) => {
        const q = pos[i]; if (!q) return;
        const e = p(t, ev.lojas[i], ev.lojas[i] + 0.55);
        lojinha(ctx, l.tipo, q.x, q.base, 190, t, { e, alvo: [Lg.x, Lg.y], seed: i, fase: i * 0.5, smile: clamp((t - ev.confete) * 3), box: e >= 1 ? `lojinha ${l.tipo}` : null });
      });
      // o confete fica atrás da logo oficial (nunca passa por cima dela)
      confete(ctx, t, ev.confete, Lg.x, Lg.y, 11, { n: 50, v: 1100 });
      if (eg > 0) {
        const u = p(t, ev.logo, ev.logo + 0.9);
        const k = (1 - Math.exp(-6 * u) * Math.cos(11 * u)) * (1 + 0.02 * Math.pow(hop(t), 6) * u);
        ctx.save(); ctx.globalAlpha *= clamp(u * 6); ctx.translate(Lg.x, Lg.y); ctx.scale(k, k);
        ctx.shadowColor = 'rgba(200,70,30,0.28)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 14;
        ctx.beginPath(); ctx.arc(0, 0, Lg.D / 2 - 2, 0, TAU); ctx.fillStyle = C.coral; ctx.fill(); ctx.shadowColor = 'transparent';
        logo(ctx, 0, 0, Lg.D);
        ctx.restore();
        if (u >= 1) BOX('logo oficial', Lg.x - Lg.D / 2, Lg.y - Lg.D / 2, Lg.x + Lg.D / 2, Lg.y + Lg.D / 2);
      }
      sticker(ctx, 'estrela', Lg.x + 175, Lg.y - 120, 84, p(t, ev.logo + 0.4, ev.logo + 0.75), t);
      sticker(ctx, 'coracao', Lg.x - 175, Lg.y + 110, 80, p(t, ev.confete, ev.confete + 0.35), t);
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
      const d = cap.diagrama, ev = cap.ev;
      const B = PE - 200, W_ = 196, xs = [190, 405, 620, 835];
      d.lojas.forEach((l, i) => {
        const x = xs[i], tl = ev.lojas[i], aceso = p(t, tl, tl + 0.3);
        const e = p(t, cap.t0 + 0.05 + i * 0.07, cap.t0 + 0.5 + i * 0.07);
        if (aceso > 0) {
          const g = ctx.createRadialGradient(x, B - 130, 10, x, B - 130, 200);
          g.addColorStop(0, css(C.amareloLight, 0.55 * aceso)); g.addColorStop(1, css(C.amareloLight, 0));
          ctx.fillStyle = g; ctx.fillRect(x - 200, B - 330, 400, 350);
        }
        const dorme = 1 - aceso;                          // antes de acender: olhinhos fechados
        lojinha(ctx, l.tipo, x, B, W_, t, { e, lit: 0.12 + 0.88 * aceso, blink: Math.max(0.95 * dorme, blinkAt(t, i + 4)), pula: aceso > 0.5, fase: i * 0.25,
          smile: aceso, alvo: [x, B - 450], swing: 7 * Math.sin((t - tl) * 7) * Math.exp(-Math.max(0, t - tl) * 2.4) * (t > tl ? 1 : 0), box: e >= 1 ? `lojinha ${l.t}` : null });
        if (t >= tl && ITENS[l.item]) {
          const ei = p(t, tl + 0.1, tl + 0.45), y = B - W_ * ALTURA_LOJA - 80 - 30 * hop(t, 0.5 + i * 0.25) * clamp((t - tl - 0.45) * 3);
          pop(ctx, ei, x, y + 36, () => ITENS[l.item](ctx, x, y, 115), 2.4);
          if (ei >= 1) BOX(`item ${l.item}`, x - 58, y - 58, x + 58, y + 48);
        }
        const ec = E.outCubic(p(t, tl + 0.15, tl + 0.45));
        if (ec > 0) chip(ctx, l.t, x, B + 40, { size: 20, align: 'center', h: 46, pad: 14, ls: 1.5, alpha: ec, border: 'none', bg: C.tinta, color: C.papel, shadow: false, box: ec > 0.99 ? `placa ${l.t}` : null });
      });
      const ed = p(t, ev.docim, ev.docim + 0.45);
      if (ed > 0) {
        const y = PE - 52 - 12 * hop(t) * clamp((t - ev.docim - 0.45) * 3);
        pop(ctx, ed, L.cx, y + 44, () => ITENS.doce(ctx, L.cx, y, 140), 2.6);
        if (ed >= 1) BOX('docim', L.cx - 56, y - 62, L.cx + 56, y + 44);
      }
      sticker(ctx, 'coracao', L.cx - 140, PE - 70, 70, p(t, ev.docim + 0.12, ev.docim + 0.45), t);
      sticker(ctx, 'coracao', L.cx + 145, PE - 90, 58, p(t, ev.docim + 0.2, ev.docim + 0.55), t);
      confete(ctx, t, ev.docim + 0.05, L.cx, PE - 80, 13, { n: 44, v: 1000 });
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
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const rua = PE - 150;
      const HX = 765, HW = 290, HK = HW / 220;             // a casinha (cabe inteira antes de x 940)
      const S = { x: 250, bot: rua - 70, w: 220, h: 195 };
      const MS = 260, MX = 455;
      const ec = ent(t, cap.t0 + 0.15, 0.5);
      enter(ctx, ec, L.cx, rua, () => {
        ctx.fillStyle = C.cremeDeep; rr(ctx, 90, rua - 58, 840, 22, 8); ctx.fill();
        ctx.fillStyle = css('#D9C2A6', 0.8); rr(ctx, 90, rua - 36, 840, 76, 14); ctx.fill();
        ctx.save(); ctx.setLineDash([36, 26]); ctx.lineWidth = 8; ctx.strokeStyle = C.coral; ctx.beginPath(); ctx.moveTo(114, rua + 2); ctx.lineTo(906, rua + 2); ctx.stroke(); ctx.restore();
        casinha(ctx, HX, rua - 46, HW, p(t, ev.porta, ev.porta + 0.45), t);
        BOX('casinha', HX - 120 * HK, rua - 46 - 246 * HK, HX + 120 * HK, rua - 46);
      });
      // o confete fica atrás da sacola e da motinha (a logo oficial nunca fica por baixo dele)
      confete(ctx, t, ev.porta + 0.15, HX, rua - 240, 17, { n: 40, v: 950 });
      const um = p(t, ev.moto, ev.chega), xm = lerp(60, MX, E.inOutCubic(um));
      const pegou = t >= ev.pega + 0.25;
      const es = ent(t, ev.sacola, 0.45);
      if (es > 0 && !pegou) {
        const uj = p(t, ev.pega, ev.pega + 0.25);
        const k = lerp(1, 0.2, E.inCubic(uj)), jx = lerp(S.x, xm - 0.38 * MS, uj), jy = lerp(S.bot, rua + 22 - 0.45 * MS, uj) - 70 * Math.sin(Math.PI * uj);
        let sq = 0; ev.itens.forEach((x) => { const v = p(t, x + 0.28, x + 0.5); if (v > 0 && v < 1) sq = Math.max(sq, Math.sin(Math.PI * v)); });
        ctx.save(); ctx.translate(jx, jy); ctx.scale(k * (1 + 0.04 * sq), k * (1 - 0.05 * sq)); ctx.translate(-S.x, -S.bot);
        enter(ctx, es, S.x, S.bot, () => {
          const tp = S.bot - S.h;
          ctx.strokeStyle = C.coralDark; ctx.lineWidth = 13; ctx.lineCap = 'round';
          for (const dx of [-50, 50]) { ctx.beginPath(); ctx.moveTo(S.x + dx - 28, tp + 4); ctx.bezierCurveTo(S.x + dx - 28, tp - 72, S.x + dx + 28, tp - 72, S.x + dx + 28, tp + 4); ctx.stroke(); }
          (d.itens || []).forEach((it, i) => {
            const t0 = ev.itens[i]; if (t < t0 || !ITENS[it]) return;
            const v = p(t, t0, t0 + 0.3), y = lerp(T + 30, tp - 22, E.inCubic(v)), x = S.x + (i - 1) * 52;
            ctx.save(); ctx.translate(x, y); ctx.rotate((i - 1) * 0.25 * v); ITENS[it](ctx, 0, 0, 110); ctx.restore();
          });
          ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(S.x - S.w / 2, tp); ctx.lineTo(S.x + S.w / 2, tp); ctx.lineTo(S.x + S.w / 2 + 12, S.bot); ctx.lineTo(S.x - S.w / 2 - 12, S.bot); ctx.closePath();
          ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
          ctx.fillStyle = C.coral; ctx.fillRect(S.x - S.w / 2, tp, S.w, 28);
          logo(ctx, S.x, tp + 28 + (S.h - 28) / 2, Math.min(130, S.h - 44));
        });
        ctx.restore();
        if (uj === 0 && es >= 1) BOX('sacola', S.x - S.w / 2 - 12, S.bot - S.h - 70, S.x + S.w / 2 + 12, S.bot);
        check(ctx, S.x + S.w / 2 + 4, S.bot - S.h + 8, 42, p(t, ev.pedido, ev.pedido + 0.4) * (1 - uj), { box: uj === 0 && t >= ev.pedido + 0.4 ? 'check' : null });
      }
      if (t >= ev.moto - 0.05) {
        const sp = Math.sin(Math.PI * um);
        const bob = um >= 1 ? 4 * hop(t) : -4 * Math.abs(Math.sin(t * 22)) * sp;
        ctx.save(); ctx.globalAlpha *= clamp((t - ev.moto + 0.05) / 0.2);
        if (sp > 0.1) for (let i = 0; i < 4; i++) { const ph = (t * 3 + i / 4) % 1; ctx.fillStyle = css(C.cremeDeep, 0.6 * (1 - ph) * sp); ctx.beginPath(); ctx.arc(xm - 150 - ph * 80, rua + 10 - ph * 30, 13 + 15 * ph, 0, TAU); ctx.fill(); }
        moto(ctx, xm, rua + 22 + bob, MS, { dir: 1, tilt: -0.04 * sp, roll: xm / 18, speed: sp });
        ctx.restore();
        if (um >= 1) BOX('motinha', MX - MS * 0.55, rua + 22 - MS * 0.98, MX + MS * 0.55, rua + 22);
      }
      // os 3 passos: ESCOLHEU · PEDIU · CHEGOU, cada um com o check quando acontece
      const passos = d.passos || [], sz = 28, gap = 20;
      const ws = passos.map((s) => 2 * 20 + 40 + 10 + tw(s, sz, 800, 2));
      let x = L.cx - (ws.reduce((a, b) => a + b, 0) + gap * (passos.length - 1)) / 2;
      const y = rua + 104;
      passos.forEach((s, i) => {
        const e = p(t, ev.passos[i], ev.passos[i] + 0.35);
        if (e > 0) {
          const xx = x;
          pop(ctx, e, xx + ws[i] / 2, y, () => {
            chip(ctx, s, xx, y, { size: sz, h: 66, pad: 20, ls: 2, w: ws[i], bg: C.verde, color: C.branco, border: 'none', box: e >= 1 ? `passo ${s}` : null });
            check(ctx, xx + ws[i] - 20 - 20, y, 20, clamp(e * 1.5 - 0.3), { bg: C.verdeDark });
          }, 2.2);
        }
        x += ws[i] + gap;
      });
      sticker(ctx, 'coracao', HX + 20, rua - 410, 76, p(t, ev.porta + 0.15, ev.porta + 0.5), t);
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
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      d.chips.forEach((c, i) => {
        const t0 = ev.chips[i], e = p(t, t0, t0 + 0.4);
        if (e <= 0) return;
        const y = T + 62 + i * 118, sz = 46;
        const w = 2 * 34 + sz * 1.35 + 10 + tw(c.t, sz, 800, 2), x = L.cx - w / 2;
        const rk = E.outCubic(p(t, t0 + 0.32, t0 + 0.55));
        const tremida = 5 * Math.sin((t - t0 - 0.32) * 40) * Math.exp(-Math.max(0, t - t0 - 0.32) * 8) * (t > t0 + 0.32 ? 1 : 0);
        ctx.save(); ctx.translate(tremida, 0);
        pop(ctx, e, L.cx, y, () => {
          chip(ctx, c.t, x, y, { size: sz, h: 104, pad: 34, ls: 2, w, icon: c.icone, color: mixHex(C.tinta, C.cinza, 0.4 * rk), iconColor: C.coral, box: e >= 1 ? `chip ${c.t}` : null });
          if (rk > 0) {
            ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 10; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x + 16, y + 7); ctx.lineTo(x + 16 + (w - 32) * rk, y - 7); ctx.stroke(); ctx.restore();
          }
        }, 2.3);
        ctx.restore();
      });
      const base = PE - 10, ea = p(t, ev.casa, ev.casa + 0.5);
      if (ea > 0) {
        pop(ctx, ea, 700, base, () => { casinha(ctx, 700, base, 240, p(t, ev.casa + 0.3, ev.casa + 0.7), t); }, 1.8);
        lojinha(ctx, 'padaria', 195, base, 170, t, { e: p(t, ev.casa + 0.1, ev.casa + 0.6), alvo: [700, base - 140], smile: 1, seed: 7 });
        const xm = lerp(320, 450, E.outCubic(p(t, ev.casa + 0.05, ev.casa + 0.7)));
        ctx.save(); ctx.globalAlpha *= clamp(ea * 3); moto(ctx, xm, base - 4 * hop(t), 200, { dir: 1, roll: xm / 14 }); ctx.restore();
        if (ea >= 1) BOX('entrega em casa', 110, base - 268, 831, base);
      }
      sticker(ctx, 'brilho', 880, base - 300, 64, p(t, ev.casa + 0.45, ev.casa + 0.8), t);
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
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const chao = PE;
      const em = E.outBack(p(t, ev.morros, ev.morros + 0.7), 1.4);
      if (em > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(90, T, 840, chao - T - 70); ctx.clip();
        const camadas = [[C.verdeLight, 0.75, [[50, 200], [330, 360], [560, 250], [800, 400], [970, 280]]],
          [C.verde, 0.9, [[50, 140], [250, 270], [470, 170], [690, 300], [970, 180]]],
          [C.verdeDark, 0.85, [[50, 70], [380, 140], [620, 80], [970, 130]]]];
        camadas.forEach(([cor, a, pts], j) => {
          const base = chao - 70, h = em * (1 - j * 0.04);
          ctx.fillStyle = css(cor, a); ctx.beginPath(); ctx.moveTo(pts[0][0], base);
          pts.forEach(([x, hh], i) => { const nx = pts[i + 1]; if (!nx) { ctx.lineTo(x, base - hh * h); return; } const mx = (x + nx[0]) / 2; ctx.quadraticCurveTo(x, base - hh * h, mx, base - (hh + nx[1]) / 2 * h); });
          ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = css(C.verdeLight, 0.6 * clamp(em)); rr(ctx, 90, chao - 74, 840, 34, 17); ctx.fill();
        if (em >= 1) BOX('morros', 90, chao - 470, 930, chao - 40);
      }
      ['padaria', 'mercado', 'farmacia'].forEach((k, i) => {
        const e = p(t, ev.lojas + i * 0.1, ev.lojas + i * 0.1 + 0.55), x = [200, 510, 820][i];
        lojinha(ctx, k, x, chao - 40, 210, t, { e, alvo: [330, T + 130], smile: clamp((t - ev.lojas - 0.3) * 2), seed: i + 9, altura: 14 });
        if (e >= 1) BOX(`lojinha ${k}`, x - 105, chao - 40 - 210 * ALTURA_LOJA, x + 105, chao - 40);
      });
      const es = p(t, ev.selo, ev.selo + 0.4), sx = 805, sy = T + 120, sr = 96;
      if (es > 0) {
        const k = lerp(1.7, 1, E.outCubic(es)), r = -10 * DEG + 18 * DEG * (1 - E.outCubic(es));
        ctx.save(); ctx.globalAlpha *= clamp(es * 2.5); ctx.translate(sx, sy); ctx.rotate(r); ctx.scale(k, k); selo(ctx, 0, 0, sr, d.selo.t); ctx.restore();
        if (es >= 1) BOX('selo', sx - sr - 6, sy - sr - 6, sx + sr + 6, sy + sr + 6);
      }
      const ec = p(t, ev.coracao, ev.coracao + 0.45);
      if (ec > 0) {
        const cx = 330, cy = T + 130, bate = 1 + 0.08 * Math.pow(hop(t), 10) * clamp((t - ev.coracao - 0.45) * 3);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(bate, bate); ctx.translate(-cx, -cy);
        sticker(ctx, 'coracao', cx, cy, 190, ec, 0);
        ctx.restore();
        if (ec >= 1) BOX('coração', cx - 100, cy - 90, cx + 100, cy + 90);
      }
      confete(ctx, t, ev.coracao + 0.05, 330, T + 130, 19, { n: 44, v: 1000 });
      sticker(ctx, 'estrela', 575, T + 60, 64, p(t, ev.coracao + 0.2, ev.coracao + 0.5), t);
    },
  };

  // ---- comenta: a lojinha-mistério ("?"), grande e no centro, olha para os balões de comentário que brotam em volta,
  //      em ondas (emoji + texto + "pop"), com figurinhas de coração e estrela pipocando entre eles
  CENAS.comenta = {
    // onde cada balão brota (até 6): três linhas, dos dois lados; a última fica ao lado do telhado da lojinha
    POS: [{ x: 260, y: 55, dir: 1 }, { x: 720, y: 40, dir: -1 }, { x: 300, y: 190, dir: 1 }, { x: 700, y: 205, dir: -1 }, { x: 760, y: 345, dir: -1 }, { x: 245, y: 345, dir: 1 }],
    FIG: [{ x: 510, y: 120, k: 'coracao' }, { x: 880, y: 140, k: 'estrela' }, { x: 505, y: 265, k: 'estrela' }, { x: 140, y: 268, k: 'coracao' }, { x: 900, y: 270, k: 'brilho' }, { x: 130, y: 150, k: 'brilho' }],
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      let prev = cap.t0;
      ev.baloes = d.baloes.map((b) => (prev = Math.max(at(cap, b.em, prev + 0.6), prev + 0.18)));
      ev.loja = Math.min(at(cap, d.loja && d.loja.em, cap.t0 + 0.3), ev.baloes[0] + 0.1);
      cue(ev.loja, 'sprout', { i: 1 }); cue(ev.loja + 0.3, 'jump');
      ev.baloes.forEach((x, i) => { cue(x, 'pop', { f: 600 + 70 * i }); if (i % 2) cue(x + 0.2, 'tick'); });
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop, POS = CENAS.comenta.POS, FIG = CENAS.comenta.FIG;
      const base = PE - 8, sz = 32, ew = 44, h = 82;
      // a lojinha-mistério, grande e no centro: a placa com "?", olha para o último balão que brotou
      const el = p(t, ev.loja, ev.loja + 0.55);
      const alvo = ev.baloes.reduce((a, x, i) => (t >= x && POS[i] ? [POS[i].x, T + POS[i].y] : a), [510, T]);
      lojinha(ctx, 'misterio', 510, base, 260, t, { e: el, alvo, seed: 12, smile: 0.6, swing: 6 * Math.sin(t * 4), altura: 12, box: el >= 1 ? 'lojinha ?' : null });
      // os balões (em ondas)
      d.baloes.forEach((b, i) => {
        const q = POS[i]; if (!q) return;
        const e = p(t, ev.baloes[i], ev.baloes[i] + 0.4);
        if (e <= 0) return;
        const fl = 5 * Math.sin((t - ev.baloes[i]) * 2.4 + i);
        const w = 28 + ew + 10 + tw(b.t, sz, 800, 0) + 26, qy = T + q.y;
        const x0 = q.x - w / 2, y0 = qy - h / 2 + fl;
        pop(ctx, e, q.x, qy + h / 2, () => {
          ctx.save();
          ctx.shadowColor = 'rgba(120,60,30,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
          rr(ctx, x0, y0, w, h, h / 2); ctx.fillStyle = C.papel; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 4; ctx.strokeStyle = C.coral; ctx.stroke();
          const bx = q.x + q.dir * w * 0.2;                 // o biquinho aponta para a lojinha
          ctx.beginPath(); ctx.moveTo(bx - 15, y0 + h - 2); ctx.lineTo(bx + q.dir * 24, y0 + h + 24); ctx.lineTo(bx + 15, y0 + h - 2); ctx.closePath();
          ctx.fillStyle = C.papel; ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 15, y0 + h); ctx.lineTo(bx + q.dir * 24, y0 + h + 24); ctx.lineTo(bx + 15, y0 + h); ctx.stroke();
          txt(ctx, b.emoji || '', x0 + 28, y0 + h / 2 + 14, { size: 38, weight: 500 });
          txt(ctx, b.t, x0 + 28 + ew + 10, y0 + h / 2 + 11, { size: sz, weight: 800, color: C.tinta });
          ctx.restore();
        }, 2.4);
        if (e >= 1) BOX(`balão ${b.t}`, x0, qy - h / 2 - 6, x0 + w, qy + h / 2 + 30);
      });
      // as figurinhas pipocando entre os balões, junto de cada um
      FIG.forEach((f, i) => { if (ev.baloes[i] !== undefined) sticker(ctx, f.k, f.x, T + f.y, 54, p(t, ev.baloes[i] + 0.15, ev.baloes[i] + 0.45), t); });
    },
  };

  // ===================== cenas do ep02 ("Um dia no Glória"): o canto de cima à direita da cena fica para o relógio
  // (x ≥ 770 e y até cenaTop + 160)

  // ---- manha: a xícara fumegando na mesinha, o "?" do pão de queijo que acabou, a padaria abrindo o toldo e os
  //      pães de queijo pulando para fora
  CENAS.manha = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.xicara = at(cap, d.xicara.em, cap.t0 + 0.3);
      ev.acabou = Math.max(at(cap, d.acabou.em, ev.xicara + 1), ev.xicara + 0.3);
      ev.padaria = Math.max(at(cap, d.padaria.em, ev.acabou + 0.8), ev.acabou + 0.4);
      ev.paes = Math.max(at(cap, d.paes.em, ev.padaria + 0.6), ev.padaria + 0.45);
      cue(cap.t0 + 0.15, 'pop', { f: 420 }); cue(ev.xicara, 'clink'); cue(ev.acabou, 'question');
      cue(ev.padaria, 'slide'); cue(ev.padaria + 0.2, 'light', { i: 1 });
      [0, 1, 2, 3, 4].forEach((i) => cue(ev.paes + i * 0.11, 'pop', { f: 700 + 60 * i }));
      cue(ev.paes + 0.7, 'confete');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const TB = PE - 170;                                   // o tampo da mesinha
      enter(ctx, ent(t, cap.t0 + 0.1, 0.45), 250, TB, () => {
        ctx.fillStyle = C.madeiraDark; rr(ctx, 140, TB + 18, 18, PE - TB - 26, 6); ctx.fill(); rr(ctx, 342, TB + 18, 18, PE - TB - 26, 6); ctx.fill();
        ctx.fillStyle = C.madeira; rr(ctx, 110, TB, 280, 24, 10); ctx.fill();
        BOX('mesinha', 110, TB, 390, PE - 8);
      });
      pop(ctx, ent(t, ev.xicara, 0.4), 250, TB, () => { xicara(ctx, 250, TB + 2, 190, t); BOX('xícara', 145, TB - 250, 355, TB); }, 2);
      // o "?" (acabou o pão de queijo), que some quando a padaria abre
      const eq = ent(t, ev.acabou, 0.35) * (1 - p(t, ev.padaria, ev.padaria + 0.3));
      if (eq > 0.01) { interrog(ctx, 430, T + 110, 52, eq, t, ev.acabou); if (eq > 0.99) BOX('?', 378, T + 58, 482, T + 162); }
      // a padaria: dormindo com o toldo enrolado; na palavra, o toldo desce, a luz acende e ela sorri
      const ab = p(t, ev.padaria, ev.padaria + 0.45), PX = 640, PW = 300;
      if (ab > 0) {
        const g = ctx.createRadialGradient(PX, PE - 200, 20, PX, PE - 200, 300);
        g.addColorStop(0, css(C.amareloLight, 0.5 * ab)); g.addColorStop(1, css(C.amareloLight, 0));
        ctx.fillStyle = g; ctx.fillRect(PX - 300, PE - 500, 600, 520);
      }
      lojinha(ctx, 'padaria', PX, PE - 10, PW, t, { e: p(t, cap.t0 + 0.1, cap.t0 + 0.6), lit: 0.15 + 0.85 * ab, toldo: 0.06 + 0.94 * E.outBack(ab, 1.4), blink: Math.max(0.95 * (1 - ab), blinkAt(t, 21)), pula: ab >= 1,
        smile: ab, alvo: [430, PE - 60], swing: 8 * Math.sin((t - ev.padaria) * 7) * Math.exp(-Math.max(0, t - ev.padaria) * 2.4) * (t > ev.padaria ? 1 : 0), box: t > cap.t0 + 0.6 ? 'padaria' : null });
      // enquanto dorme: o "z z z" saindo da padaria
      if (t < ev.padaria + 0.2) {
        const zz = t - cap.t0, fz = 1 - p(t, ev.padaria, ev.padaria + 0.2);
        for (let i = 0; i < 3; i++) {
          const ph = (zz * 0.55 + i / 3) % 1;
          txt(ctx, 'z', PX + 120 + 26 * i + 10 * Math.sin(ph * 6), PE - 400 - 80 * ph, { size: 34 + 10 * i, weight: 900, color: C.coral, alpha: Math.sin(Math.PI * ph) * clamp(zz * 2) * fz });
        }
      }
      // os pães de queijo pulando da porta para a frente da mesinha, em pirâmide
      const alvos = [[395, PE - 30], [440, PE - 30], [485, PE - 30], [417, PE - 72], [462, PE - 72]];
      alvos.forEach(([ax, ay], i) => {
        const t0 = ev.paes + i * 0.11; if (t < t0) return;
        const u = p(t, t0, t0 + 0.45), x = lerp(PX, ax, u), y = lerp(PE - 70, ay, u) - 170 * Math.sin(Math.PI * u) - 8 * hop(t, i * 0.2) * clamp((t - t0 - 0.45) * 3);
        ctx.save(); ctx.translate(x, y); ctx.rotate((1 - u) * 3 * (i % 2 ? 1 : -1)); itemPaoQueijo(ctx, 0, 0, 62); ctx.restore();
        if (u >= 1) BOX(`pão de queijo ${i + 1}`, ax - 26, ay - 24, ax + 26, ay + 24);
      });
      sticker(ctx, 'estrela', 820, PE - 420, 64, p(t, ev.padaria + 0.2, ev.padaria + 0.5), t);
      sticker(ctx, 'brilho', 520, PE - 200, 50, p(t, ev.paes + 0.5, ev.paes + 0.8), t);
      confete(ctx, t, ev.paes + 0.7, 440, PE - 90, 41, { n: 30, v: 800 });
    },
  };

  // ---- almoco: o "RONC!" em letreiro, o prato feito com vapor e o garfo e a faca dançando na batida
  CENAS.almoco = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.ronc = at(cap, d.ronc.em, cap.t0 + 0.6);
      ev.prato = Math.max(at(cap, d.prato.em, ev.ronc + 1), ev.ronc + 0.4);
      ev.talheres = Math.max(at(cap, d.talheres.em, ev.prato + 0.6), ev.prato + 0.3);
      ev.rapidim = Math.max(at(cap, d.rapidim.em, cap.t1 - 1), ev.talheres + 0.3);
      cue(ev.ronc, 'ronc'); cue(ev.prato, 'pop', { f: 460 }); cue(ev.prato + 0.1, 'clink');
      cue(ev.talheres, 'jump'); cue(ev.talheres + 0.1, 'clink'); cue(ev.rapidim, 'shine'); cue(ev.rapidim + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      // o letreiro "RONC!": estouro amarelo com borda branca, tremendo
      const er = p(t, ev.ronc, ev.ronc + 0.35);
      if (er > 0) {
        const cx = 300, cy = T + 115, tre = Math.exp(-Math.max(0, t - ev.ronc - 0.3) * 3);
        const dx = 5 * Math.sin(t * 61) * tre, dy = 4 * Math.cos(t * 47) * tre, rot = -0.08 + 0.04 * Math.sin(t * 9);
        pop(ctx, er, cx, cy, () => {
          ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.rotate(rot);
          ctx.beginPath();
          for (let i = 0; i <= 32; i++) { const a = i / 32 * TAU, rr2 = i % 2 ? 108 : 150; ctx.lineTo(Math.cos(a) * rr2 * 1.15, Math.sin(a) * rr2 * 0.72); }
          ctx.closePath(); ctx.lineJoin = 'round';
          ctx.shadowColor = 'rgba(120,60,30,0.22)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
          ctx.lineWidth = 12; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.shadowColor = 'transparent';
          ctx.fillStyle = C.amarelo; ctx.fill();
          txt(ctx, 'RONC!', 3, 34, { size: 86, weight: 900, align: 'center', color: C.coralDark });
          txt(ctx, 'RONC!', 0, 30, { size: 86, weight: 900, align: 'center', color: C.coral });
          ctx.restore();
        }, 2.6);
        if (er >= 1) BOX('RONC!', cx - 182, cy - 116, cx + 182, cy + 116);
      }
      // o prato feito: arroz, feijão, bife e salada, com vapor
      const ep = p(t, ev.prato, ev.prato + 0.45), PX = 510, PB = PE - 110;
      if (ep > 0) {
        pop(ctx, ep, PX, PB, () => {
          prato(ctx, PX, PB, 300);
          ctx.save(); ctx.translate(PX, PB - 46);
          ctx.fillStyle = C.papel; ctx.beginPath(); ctx.ellipse(-70, 0, 78, 38, 0, Math.PI, TAU); ctx.ellipse(-70, 0, 78, 12, 0, 0, Math.PI); ctx.fill();   // o arroz
          ctx.strokeStyle = C.cremeDark; ctx.lineWidth = 3; for (const [x, y] of [[-100, -14], [-70, -24], [-44, -10]]) { ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0.3, 0, TAU); ctx.stroke(); }
          ctx.fillStyle = '#7A3A18'; ctx.beginPath(); ctx.ellipse(56, 2, 62, 28, 0, 0, TAU); ctx.fill();                                                     // o feijão
          ctx.fillStyle = '#5E2C12'; for (const [x, y] of [[36, -4], [62, 6], [80, -6], [48, 10]]) { ctx.beginPath(); ctx.ellipse(x, y, 7, 4, 0.4, 0, TAU); ctx.fill(); }
          ctx.fillStyle = C.madeiraDark; rr(ctx, -40, -46, 110, 48, 20); ctx.fill(); ctx.strokeStyle = '#7A3A18'; ctx.lineWidth = 4;   // o bife
          ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(52, -30); ctx.moveTo(-20, -16); ctx.lineTo(46, -16); ctx.stroke();
          ctx.fillStyle = C.verde; for (const [x, y] of [[112, -22], [128, -8], [104, -4]]) { ctx.beginPath(); ctx.ellipse(x, y, 20, 12, 0.6, 0, TAU); ctx.fill(); }   // a salada
          ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(126, -26, 12, 0, TAU); ctx.fill();
          ctx.restore();
          // o vapor
          ctx.strokeStyle = css(C.cinza, 0.5); ctx.lineWidth = 7; ctx.lineCap = 'round';
          for (let i = 0; i < 4; i++) {
            const ph = ((t * 0.7 + i / 4) % 1), a = Math.sin(Math.PI * ph);
            ctx.save(); ctx.globalAlpha *= a; const sx = PX - 90 + i * 60, y0 = PB - 110 - ph * 90;
            ctx.beginPath(); ctx.moveTo(sx, y0); ctx.bezierCurveTo(sx - 22, y0 - 26, sx + 22, y0 - 46, sx, y0 - 72); ctx.stroke(); ctx.restore();
          }
        }, 1.8);
        if (ep >= 1) BOX('prato feito', PX - 190, PB - 160, PX + 190, PB);
      }
      // o garfo e a faca dançando (giram de um lado para o outro e pulam na batida)
      const et = p(t, ev.talheres, ev.talheres + 0.4);
      [['garfo', 205, 1], ['faca', 815, -1]].forEach(([k, x, sx], i) => {
        if (et <= 0) return;
        const base = PE - 30, dança = (t > ev.talheres + 0.4 ? 1 : 0) * Math.sin(Math.PI * (t / BT) + i * Math.PI) * 0.28;
        pop(ctx, et, x, base, () => {
          ctx.save(); ctx.translate(x, base - 14 * hop(t, i * 0.5)); ctx.rotate(dança * sx);
          ctx.fillStyle = C.cinza; ctx.strokeStyle = '#6E5F55'; ctx.lineWidth = 3;
          rr(ctx, -11, -150, 22, 150, 10); ctx.fill();                               // o cabo
          if (k === 'garfo') {
            rr(ctx, -30, -240, 60, 96, 18); ctx.fill();
            for (const dx of [-20, -7, 7, 20]) { rr(ctx, dx - 4, -300, 8, 70, 4); ctx.fill(); }
          } else {
            ctx.beginPath(); ctx.moveTo(-14, -150); ctx.lineTo(-14, -300); ctx.quadraticCurveTo(30, -260, 16, -150); ctx.closePath(); ctx.fill();
          }
          ctx.fillStyle = C.coral; rr(ctx, -13, -100, 26, 40, 8); ctx.fill();          // a faixinha coral do cabo
          ctx.restore();
        }, 2.2);
        if (et >= 1) BOX(k, x - 40, PE - 340, x + 40, PE - 30);
      });
      sticker(ctx, 'estrela', 680, T + 70, 62, p(t, ev.rapidim, ev.rapidim + 0.35), t);
      sticker(ctx, 'brilho', 330, PE - 330, 52, p(t, ev.rapidim + 0.1, ev.rapidim + 0.45), t);
      confete(ctx, t, ev.rapidim + 0.05, PX, PB - 120, 43, { n: 36, v: 900 });
    },
  };

  // ---- calor: o sol forte com ondas de calor, o termômetro subindo e a sorveteria soltando picolés e casquinha
  CENAS.calor = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.termo = at(cap, d.termometro.em, cap.t0 + 0.6);
      ev.sorv = Math.max(at(cap, d.sorveteria.em, ev.termo + 1), ev.termo + 0.4);
      ev.picoles = Math.max(at(cap, d.picoles.em, ev.sorv + 0.5), ev.sorv + 0.35);
      ev.gelado = Math.max(at(cap, d.geladim.em, cap.t1 - 1), ev.picoles + 0.6);
      cue(cap.t0 + 0.15, 'pop', { f: 420 }); cue(ev.termo, 'rise'); cue(ev.sorv, 'sprout', { i: 2 });
      [0, 1, 2, 3].forEach((i) => cue(ev.picoles + i * 0.15, 'pop', { f: 640 + 80 * i }));
      cue(ev.gelado, 'shine');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      // o sol forte (com raios girando e ondas de calor)
      const es = ent(t, cap.t0 + 0.1, 0.45), SX = 215, SY = T + 105;
      pop(ctx, es, SX, SY, () => {
        ctx.save(); ctx.translate(SX, SY); ctx.rotate(t * 0.8);
        ctx.strokeStyle = C.amareloDark; ctx.lineWidth = 10; ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, l = 92 + 12 * Math.sin(t * 6 + i); ctx.beginPath(); ctx.moveTo(Math.cos(a) * 74, Math.sin(a) * 74); ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l); ctx.stroke(); }
        ctx.restore();
        ctx.beginPath(); ctx.arc(SX, SY, 62 * (1 + 0.04 * Math.pow(hop(t), 6)), 0, TAU); ctx.fillStyle = C.amarelo; ctx.fill();
        ctx.fillStyle = css(C.papel, 0.4); ctx.beginPath(); ctx.arc(SX - 20, SY - 20, 18, 0, TAU); ctx.fill();
      }, 2);
      if (es >= 1) BOX('sol', SX - 100, SY - 100, SX + 100, SY + 100);
      // o termômetro: o mercúrio coral sobe na palavra e treme no alto
      const TX = 215, TT = T + 250, TBb = PE - 70, et = ent(t, cap.t0 + 0.25, 0.45);
      enter(ctx, et, TX, TBb, () => {
        ctx.fillStyle = C.papel; ctx.strokeStyle = C.coral; ctx.lineWidth = 6;
        rr(ctx, TX - 24, TT, 48, TBb - TT, 24); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(TX, TBb, 46, 0, TAU); ctx.fill(); ctx.stroke();
        const nivel = lerp(0.22, 0.95, E.outBack(p(t, ev.termo, ev.termo + 1.0), 1.6)) + 0.012 * Math.sin(t * 20) * (t > ev.termo + 1 ? 1 : 0);
        const topo = TBb - (TBb - TT - 20) * clamp(nivel, 0, 1.02);
        ctx.fillStyle = C.coral; rr(ctx, TX - 13, topo, 26, TBb - topo, 13); ctx.fill(); ctx.beginPath(); ctx.arc(TX, TBb, 34, 0, TAU); ctx.fill();
        ctx.strokeStyle = C.coralDark; ctx.lineWidth = 4; for (let i = 1; i < 8; i++) { const y = TBb - 40 - i * (TBb - TT - 60) / 8; ctx.beginPath(); ctx.moveTo(TX + 30, y); ctx.lineTo(TX + (i % 2 ? 44 : 52), y); ctx.stroke(); }
        BOX('termômetro', TX - 46, TT, TX + 52, TBb + 46);
      });
      // a sorveteria, que solta os picolés e a casquinha pela porta
      const PX = 650, PW = 290;
      lojinha(ctx, 'sorveteria', PX, PE - 10, PW, t, { e: p(t, ev.sorv, ev.sorv + 0.55), smile: clamp((t - ev.picoles) * 2), alvo: [520, T + 200], seed: 22, box: t > ev.sorv + 0.55 ? 'sorveteria' : null });
      const alvos = [[430, T + 210, 'picole', C.coral], [565, T + 120, 'casquinha'], [700, T + 210, 'picole', C.amarelo], [420, T + 360, 'picole', C.verde]];
      alvos.forEach(([ax, ay, k, cor], i) => {
        const t0 = ev.picoles + i * 0.15; if (t < t0) return;
        const u = p(t, t0, t0 + 0.5), x = lerp(PX, ax, E.outCubic(u)), y = lerp(PE - 80, ay, E.outCubic(u)) - 120 * Math.sin(Math.PI * u) + 6 * Math.sin((t - t0) * 3 + i);
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.25 * Math.sin((t - t0) * 2 + i) + (1 - u) * 4);
        if (k === 'picole') itemPicole(ctx, 0, 0, 110, cor); else itemCasquinha(ctx, 0, 0, 115);
        ctx.restore();
        if (u >= 1) BOX(`${k} ${i + 1}`, ax - 36, ay - 66, ax + 36, ay + 66);
      });
      sticker(ctx, 'brilho', 495, T + 90, 50, p(t, ev.gelado, ev.gelado + 0.35), t);
      sticker(ctx, 'brilho', 760, T + 330, 44, p(t, ev.gelado + 0.12, ev.gelado + 0.45), t);
    },
  };

  // ---- janta: o pôr do sol, o mercadim e o tomate que sai quicando até cair na sacola da marca (check: resolvido)
  CENAS.janta = {
    QUIQUES: [[245, PE - 70], [395, PE - 28], [540, PE - 28], [760, PE - 210]],
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.merc = at(cap, d.mercadim.em, cap.t0 + 0.3);
      ev.tomate = Math.max(at(cap, d.tomate.em, ev.merc + 1), ev.merc + 0.5);
      ev.quiques = [0, 1, 2].map((i) => ev.tomate + i * 0.36);
      ev.caiu = ev.tomate + 3 * 0.36;
      ev.check = Math.max(at(cap, d.resolve.em, ev.caiu + 0.2), ev.caiu + 0.1);
      cue(ev.merc, 'sprout', { i: 0 }); cue(ev.merc + 0.4, 'pop', { f: 460 });
      ev.quiques.forEach((x) => cue(x, 'jump')); cue(ev.caiu, 'plop'); cue(ev.check, 'check'); cue(ev.check + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop, Q = CENAS.janta.QUIQUES;
      const S = { x: 760, bot: PE - 20, w: 230, h: 200 };
      // o mercadim, olhando para o tomate
      const tq = t >= ev.tomate && t < ev.caiu;
      let tomXY = null;
      if (tq) {
        const i = Math.min(2, Math.floor((t - ev.tomate) / 0.36)), u = p(t, ev.quiques[i], ev.quiques[i] + 0.36);
        const [x0, y0] = Q[i], [x1, y1] = Q[i + 1], hgt = [230, 180, 200][i];
        tomXY = [lerp(x0, x1, u), lerp(y0, y1, u) - hgt * Math.sin(Math.PI * u), u, i];
      }
      lojinha(ctx, 'mercado', 245, PE - 10, 290, t, { e: p(t, ev.merc, ev.merc + 0.55), smile: clamp((t - ev.check) * 3), alvo: tomXY ? [tomXY[0], tomXY[1]] : [760, PE - 200], seed: 31, box: t > ev.merc + 0.55 ? 'mercadim' : null });
      // as figurinhas e o confete ficam atrás da sacola com a logo
      sticker(ctx, 'coracao', 560, T + 150, 70, p(t, ev.check, ev.check + 0.35), t);
      sticker(ctx, 'estrela', 640, PE - 380, 52, p(t, ev.check + 0.12, ev.check + 0.45), t);
      confete(ctx, t, ev.check + 0.05, S.x, S.bot - 220, 47, { n: 34, v: 900 });
      // a sacola da marca: as alças e o fundo, o tomate caindo dentro, e a frente com a logo oficial
      const es = ent(t, ev.merc + 0.4, 0.45);
      enter(ctx, es, S.x, S.bot, () => {
        const tp = S.bot - S.h;
        ctx.strokeStyle = C.coralDark; ctx.lineWidth = 13; ctx.lineCap = 'round';
        for (const dx of [-52, 52]) { ctx.beginPath(); ctx.moveTo(S.x + dx - 28, tp + 4); ctx.bezierCurveTo(S.x + dx - 28, tp - 72, S.x + dx + 28, tp - 72, S.x + dx + 28, tp + 4); ctx.stroke(); }
        if (t >= ev.caiu) { const v = p(t, ev.caiu, ev.caiu + 0.2); itemTomate(ctx, S.x, lerp(tp - 10, tp + 24, v), 90); }
        ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(S.x - S.w / 2, tp); ctx.lineTo(S.x + S.w / 2, tp); ctx.lineTo(S.x + S.w / 2 + 12, S.bot); ctx.lineTo(S.x - S.w / 2 - 12, S.bot); ctx.closePath();
        ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
        ctx.fillStyle = C.coral; ctx.fillRect(S.x - S.w / 2, tp, S.w, 28);
        logo(ctx, S.x, tp + 28 + (S.h - 28) / 2, Math.min(130, S.h - 44));
        if (es >= 1) BOX('sacola', S.x - S.w / 2 - 12, tp - 72, S.x + S.w / 2 + 12, S.bot);
      });
      // o tomate quicando (na frente de tudo, até cair na boca da sacola)
      if (tomXY) { ctx.save(); ctx.translate(tomXY[0], tomXY[1]); ctx.rotate((t - ev.tomate) * 7); const sq = tomXY[2] < 0.08 && tomXY[3] > 0 ? 0.8 : 1; ctx.scale(1 / sq, sq); itemTomate(ctx, 0, 0, 90); ctx.restore(); }
      check(ctx, S.x + S.w / 2 - 4, S.bot - S.h + 6, 42, p(t, ev.check, ev.check + 0.4), { box: t >= ev.check + 0.4 ? 'check' : null });
    },
  };

  // ---- noite: lua e estrelas (o céu), a pizza girando, o lanche e o espetinho pipocando e a motinha chegando
  CENAS.noite = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.pizza = at(cap, d.pizza.em, cap.t0 + 0.6);
      ev.lanche = Math.max(at(cap, d.lanche.em, ev.pizza + 0.5), ev.pizza + 0.3);
      ev.espeto = Math.max(at(cap, d.espeto.em, ev.lanche + 0.5), ev.lanche + 0.3);
      ev.moto = Math.max(at(cap, d.moto.em, ev.espeto + 0.6), ev.espeto + 0.3);
      ev.chega = ev.moto + 1.0;
      cue(ev.pizza, 'pop', { f: 480 }); cue(ev.pizza + 0.05, 'whoosh'); cue(ev.lanche, 'jump'); cue(ev.espeto, 'jump');
      cue(ev.moto, 'moto', { d: 1.0 }); cue(ev.chega, 'horn');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      // as figurinhas (atrás da motinha com a sacola)
      sticker(ctx, 'estrela', 360, T + 70, 56, p(t, ev.pizza + 0.2, ev.pizza + 0.5), t);
      sticker(ctx, 'estrela', 660, T + 470, 46, p(t, ev.espeto + 0.15, ev.espeto + 0.45), t);
      sticker(ctx, 'brilho', 120, T + 470, 46, p(t, ev.lanche + 0.15, ev.lanche + 0.45), t);
      // a pizza girando
      const ep = p(t, ev.pizza, ev.pizza + 0.5), PX = 510, PY = T + 270, R = 140;
      if (ep > 0) {
        pop(ctx, ep, PX, PY, () => {
          ctx.save(); ctx.translate(PX, PY); ctx.rotate(t * 0.9);
          ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = C.madeira; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, TAU); ctx.fillStyle = C.coral; ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, TAU); ctx.fillStyle = C.amarelo; ctx.fill();
          ctx.fillStyle = C.coralDark; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, rr2 = R * (i % 3 === 0 ? 0.25 : 0.55); ctx.beginPath(); ctx.arc(Math.cos(a) * rr2, Math.sin(a) * rr2, R * 0.1, 0, TAU); ctx.fill(); }
          ctx.fillStyle = C.verde; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, rr2 = R * 0.4; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr2, Math.sin(a) * rr2, 9, 5, a, 0, TAU); ctx.fill(); }
          ctx.strokeStyle = css(C.madeiraDark, 0.7); ctx.lineWidth = 4; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); ctx.lineTo(-Math.cos(a) * R * 0.86, -Math.sin(a) * R * 0.86); ctx.stroke(); }
          ctx.restore();
        }, 2);
        if (ep >= 1) BOX('pizza', PX - R, PY - R, PX + R, PY + R);
      }
      // o lanche e o espetinho pipocando e pulando na batida
      const el = p(t, ev.lanche, ev.lanche + 0.4), ee = p(t, ev.espeto, ev.espeto + 0.4);
      const LY = T + 280 - 12 * hop(t) * clamp((t - ev.lanche - 0.4) * 3), EY = T + 330 - 12 * hop(t, 0.5) * clamp((t - ev.espeto - 0.4) * 3);
      pop(ctx, el, 205, LY + 40, () => itemLanche(ctx, 205, LY, 175), 2.4);
      if (el >= 1) BOX('lanche', 205 - 82, LY - 62, 205 + 82, LY + 62);
      pop(ctx, ee, 810, EY + 60, () => itemEspeto(ctx, 810, EY, 190), 2.4);
      if (ee >= 1) BOX('espetinho', 810 - 82, EY - 120, 810 + 82, EY + 120);
      // a motinha chega com a sacola e para (escolhe e só espera)
      if (t >= ev.moto - 0.05) {
        const um = p(t, ev.moto, ev.chega), x = lerp(60, 700, E.inOutCubic(um)), sp = Math.sin(Math.PI * um), MS = 175;
        ctx.save(); ctx.globalAlpha *= clamp((t - ev.moto + 0.05) / 0.2);
        moto(ctx, x, PE - 10 - (um >= 1 ? 3 * hop(t) : 0), MS, { dir: 1, roll: x / 16, speed: sp, tilt: -0.04 * sp });
        ctx.restore();
        if (um >= 1) BOX('motinha', 700 - MS * 0.55, PE - 10 - MS * 0.98, 700 + MS * 0.55, PE - 10);
      }
    },
  };

  // ---- enquete: 4 balões estilo enquete (emoji + texto + bolinha de marcar) entram um a um com "pop"; corações e
  //      estrelas pipocam dos lados
  CENAS.enquete = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      let prev = cap.t0;
      ev.opcoes = d.opcoes.map((o) => (prev = Math.max(at(cap, o.em, prev + 0.6), prev + 0.3)));
      ev.opcoes.forEach((x, i) => { cue(x, 'pop', { f: 620 + 90 * i }); cue(x + 0.18, 'tick'); });
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const compacta = d.opcoes.length > 4;                // 5 ou 6 respostas: balões mais baixos, em ondas
      const Hh = compacta ? 82 : 104, X = 510, fs = compacta ? 38 : 46, passo = compacta ? 94 : 128, y00 = compacta ? 56 : 70;
      d.opcoes.forEach((o, i) => {
        const e = p(t, ev.opcoes[i], ev.opcoes[i] + 0.4);
        const ew = o.emoji ? 72 : 0, W_ = 44 + ew + tw(o.t, fs, 900) + 64;   // cada balão do tamanho da resposta
        const dx = [-90, 70, -40, 95, -75, 60][i % 6], y = T + y00 + i * passo, x0 = X + dx - W_ / 2;   // desalinhados, para ficar vivo
        sticker(ctx, i % 2 ? 'estrela' : 'coracao', i % 2 ? 150 : 870, y + (i % 2 ? -10 : 10), 54, p(t, ev.opcoes[i] + 0.15, ev.opcoes[i] + 0.45), t);
        if (e <= 0) return;
        const rot = [-3, 2.5, -1.5, 3.2][i % 4] * DEG + 0.012 * Math.sin((t - ev.opcoes[i]) * 2.2 + i) * clamp(e * 2 - 1);
        pop(ctx, e, X + dx, y, () => {
          ctx.save(); ctx.translate(X + dx, y); ctx.rotate(rot); ctx.translate(-(X + dx), -y);
          ctx.shadowColor = 'rgba(120,60,30,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
          rr(ctx, x0, y - Hh / 2, W_, Hh, Hh / 2); ctx.fillStyle = C.papel; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 5; ctx.strokeStyle = C.coral; ctx.stroke();
          if (o.emoji) txt(ctx, o.emoji, x0 + 44, y + 18, { size: 50, weight: 500 });
          txt(ctx, o.t, x0 + 44 + ew, y + (compacta ? 13 : 16), { size: fs, weight: 900, color: C.tinta });
          // o biquinho de balão de fala, alternando de lado
          const bq = i % 2 ? x0 + W_ - 110 : x0 + 110, sd = i % 2 ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(bq - 16, y + Hh / 2 - 3); ctx.lineTo(bq + sd * 22, y + Hh / 2 + 24); ctx.lineTo(bq + 16, y + Hh / 2 - 3); ctx.closePath();
          ctx.fillStyle = C.papel; ctx.fill(); ctx.beginPath(); ctx.moveTo(bq - 16, y + Hh / 2 - 1); ctx.lineTo(bq + sd * 22, y + Hh / 2 + 24); ctx.lineTo(bq + 16, y + Hh / 2 - 1); ctx.lineWidth = 5; ctx.strokeStyle = C.coral; ctx.stroke();
          ctx.restore();
        }, 2.4);
        if (e >= 1) BOX(`opção ${o.t}`, x0 - 4, y - Hh / 2 - 18, x0 + W_ + 4, y + Hh / 2 + 26);
      });
    },
  };

  // ===================== cenas do ep03 ("Visita sem avisar")

  // ---- visita: a porta tremendo com o TOC TOC, abrindo, e os bonequinhos da visita brotando um a um com "Ô de casa!"
  CENAS.visita = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.toc = at(cap, d.toc.em, cap.t0 + 0.3);
      ev.tocs = [ev.toc, ev.toc + 0.32];
      ev.abre = Math.max(at(cap, d.abre.em, ev.toc + 1), ev.toc + 0.7);
      let prev = ev.abre;
      ev.pessoas = d.pessoas.map((x) => (prev = Math.max(at(cap, x.em, prev + 0.4), prev + 0.25)));
      ev.tocs.forEach((x) => cue(x, 'toc')); cue(ev.abre, 'door'); cue(ev.abre + 0.15, 'pop', { f: 760 });
      ev.pessoas.forEach((x, i) => cue(x, 'sprout', { i }));
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const PX = 215, PB = PE - 10, PW = 220, PH = 330;
      const treme = ev.tocs.reduce((a, x) => a + 7 * Math.sin((t - x) * 70) * Math.exp(-Math.max(0, t - x) * 14) * (t > x ? 1 : 0), 0);
      enter(ctx, ent(t, cap.t0 + 0.05, 0.4), PX, PB, () => porta(ctx, PX, PB, PW, PH, p(t, ev.abre, ev.abre + 0.45), treme));
      BOX('porta', PX - PW / 2 - 18, PB - PH - 18, PX + PW / 2 + 18, PB);
      // o "TOC" de cada batida
      ev.tocs.forEach((x, i) => {
        const e = p(t, x, x + 0.25) * (1 - p(t, ev.abre, ev.abre + 0.3));
        if (e <= 0.01) return;
        const cx = PX + 40 + i * 120, cy = PB - PH - 70 - i * 40;
        pop(ctx, e, cx, cy, () => {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate((i ? 8 : -8) * DEG);
          ctx.beginPath(); for (let j = 0; j <= 24; j++) { const a = j / 24 * TAU, r2 = j % 2 ? 46 : 64; ctx.lineTo(Math.cos(a) * r2 * 1.3, Math.sin(a) * r2 * 0.75); }
          ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.fillStyle = C.amarelo; ctx.fill();
          txt(ctx, 'TOC!', 0, 15, { size: 42, weight: 900, align: 'center', color: C.coral });
          ctx.restore();
        }, 2.6);
      });
      // a visita brotando da porta, um a um, e indo para o seu lugar
      const xs = [395, 510, 625, 740, 855];
      ev.pessoas.forEach((t0, i) => {
        if (t < t0 || !VISITAS[i]) return;
        const u = E.outCubic(p(t, t0, t0 + 0.45)), x = lerp(PX + 30, xs[i], u), hop_ = 22 * Math.sin(Math.PI * p(t, t0, t0 + 0.45));
        ctx.save(); ctx.globalAlpha *= clamp(u * 3);
        pessoa(ctx, VISITAS[i], x, PB - hop_ - 6 * hop(t, i * 0.3) * clamp((t - t0 - 0.45) * 3), t, { k: 0.92, look: [i < 2 ? 0.6 : -0.3, 0], acena: i === 0 && t > t0 + 0.4, sorriso: 0.6, blink: blinkAt(t, i + 30), box: u >= 1 ? `visita ${i + 1}` : null });
        ctx.restore();
      });
      // os balões "Ô de casa!"
      [[ev.abre + 0.1, 470, T + 90, -1], [ev.pessoas[2] + 0.1, 760, T + 210, 1]].forEach(([t0, bx, by, sd], i) => {
        const e = p(t, t0, t0 + 0.35);
        if (e <= 0) return;
        const s = 'Ô de casa!', w = 2 * 30 + tw(s, 40, 900), h = 84, fl = 4 * Math.sin((t - t0) * 2.4 + i);
        pop(ctx, e, bx, by + h / 2, () => {
          ctx.save(); ctx.translate(0, fl);
          ctx.shadowColor = 'rgba(120,60,30,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
          rr(ctx, bx - w / 2, by - h / 2, w, h, h / 2); ctx.fillStyle = C.papel; ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.lineWidth = 4; ctx.strokeStyle = C.coral; ctx.stroke();
          const tx = bx + sd * w * 0.22;
          ctx.beginPath(); ctx.moveTo(tx - 15, by + h / 2 - 2); ctx.lineTo(tx + sd * 24, by + h / 2 + 26); ctx.lineTo(tx + 15, by + h / 2 - 2); ctx.closePath(); ctx.fillStyle = C.papel; ctx.fill();
          ctx.beginPath(); ctx.moveTo(tx - 15, by + h / 2); ctx.lineTo(tx + sd * 24, by + h / 2 + 26); ctx.lineTo(tx + 15, by + h / 2); ctx.stroke();
          txt(ctx, s, bx, by + 14, { size: 40, weight: 900, align: 'center', color: C.tinta });
          ctx.restore();
        }, 2.4);
        if (e >= 1) BOX(`balão ${i + 1}`, bx - w / 2, by - h / 2 - 6, bx + w / 2, by + h / 2 + 30);
      });
    },
  };

  // ---- cozinha: o bule fumegando na mesinha; o armário que abre vazio, com teia de aranha; a lata que tomba vazia
  CENAS.cozinha = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.bule = at(cap, d.bule.em, cap.t0 + 0.3);
      ev.armario = Math.max(at(cap, d.armario.em, ev.bule + 1), ev.bule + 0.4);
      ev.lata = Math.max(at(cap, d.lata.em, ev.armario + 0.8), ev.armario + 0.4);
      cue(cap.t0 + 0.12, 'pop', { f: 420 }); cue(ev.bule, 'clink'); cue(ev.armario, 'door'); cue(ev.armario + 0.35, 'question');
      cue(ev.lata, 'flop'); cue(ev.lata + 0.3, 'clink');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const TB = PE - 170;
      enter(ctx, ent(t, cap.t0 + 0.1, 0.45), 255, TB, () => {
        ctx.fillStyle = C.madeiraDark; rr(ctx, 140, TB + 18, 18, PE - TB - 26, 6); ctx.fill(); rr(ctx, 352, TB + 18, 18, PE - TB - 26, 6); ctx.fill();
        ctx.fillStyle = C.madeira; rr(ctx, 110, TB, 290, 24, 10); ctx.fill();
        BOX('mesinha', 110, TB, 400, PE - 8);
      });
      pop(ctx, ent(t, ev.bule, 0.4), 250, TB, () => { bule(ctx, 250, TB + 2, 165, t); BOX('bule', 160, TB - 240, 390, TB); }, 2);
      // o armário de parede: as portas abrem e não tem nada (só a teia de aranha e a aranhinha descendo)
      const AX0 = 500, AX1 = 900, AY0 = T + 40, AY1 = PE - 200, ea = p(t, ev.armario, ev.armario + 0.45);
      enter(ctx, ent(t, cap.t0 + 0.15, 0.45), (AX0 + AX1) / 2, AY1, () => {
        ctx.fillStyle = C.madeiraDark; rr(ctx, AX0 - 12, AY0 - 12, AX1 - AX0 + 24, AY1 - AY0 + 24, 14); ctx.fill();
        ctx.fillStyle = '#6E5B52'; rr(ctx, AX0, AY0, AX1 - AX0, AY1 - AY0, 8); ctx.fill();
        ctx.fillStyle = C.madeira; for (let j = 1; j < 3; j++) rr(ctx, AX0, AY0 + j * (AY1 - AY0) / 3 - 6, AX1 - AX0, 12, 4), ctx.fill();
        // a teia no canto e a aranhinha
        ctx.strokeStyle = css(C.papel, 0.75); ctx.lineWidth = 2;
        for (let r2 = 20; r2 <= 80; r2 += 20) { ctx.beginPath(); ctx.arc(AX1, AY0, r2, Math.PI * 0.5, Math.PI); ctx.stroke(); }
        for (let a = 0; a <= 4; a++) { const an = Math.PI * 0.5 + a * Math.PI / 8; ctx.beginPath(); ctx.moveTo(AX1, AY0); ctx.lineTo(AX1 + Math.cos(an) * 90, AY0 + Math.sin(an) * 90); ctx.stroke(); }
        const ay = AY0 + 70 + 40 * Math.sin(t * 1.6) * ea;
        ctx.beginPath(); ctx.moveTo(AX1 - 60, AY0); ctx.lineTo(AX1 - 60, ay); ctx.stroke();
        ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(AX1 - 60, ay + 8, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = C.tinta; ctx.lineWidth = 2.5; for (const sx of [-1, 1]) for (const dy of [-3, 3, 9]) { ctx.beginPath(); ctx.moveTo(AX1 - 60, ay + 8); ctx.lineTo(AX1 - 60 + sx * 16, ay + 8 + dy + sx * 0); ctx.stroke(); }
        // as duas portas (abrem para os lados)
        const fw = (AX1 - AX0) / 2 * (1 - 0.85 * E.outBack(ea, 1.4));
        ctx.fillStyle = C.coral; rr(ctx, AX0 - 6, AY0 - 6, fw + 6, AY1 - AY0 + 12, 8); ctx.fill(); rr(ctx, AX1 - fw, AY0 - 6, fw + 6, AY1 - AY0 + 12, 8); ctx.fill();
        ctx.fillStyle = C.amarelo; if (fw > 30) { ctx.beginPath(); ctx.arc(AX0 + fw - 22, (AY0 + AY1) / 2, 9, 0, TAU); ctx.arc(AX1 - fw + 22, (AY0 + AY1) / 2, 9, 0, TAU); ctx.fill(); }
        BOX('armário', AX0 - 12, AY0 - 12, AX1 + 12, AY1 + 12);
      });
      // o "?" em cima do armário vazio
      const eq = ent(t, ev.armario + 0.35, 0.35);
      if (eq > 0) interrog(ctx, 700, AY1 + 75, 46, eq, t, ev.armario + 0.35);
      // a lata de biscoito, no chão: tomba vazia e a tampa rola
      const el = ent(t, cap.t0 + 0.2, 0.4), vl = E.outBack(p(t, ev.lata, ev.lata + 0.4), 1.6), tp = p(t, ev.lata + 0.1, ev.lata + 0.5);
      pop(ctx, el, 560, PE - 10, () => { lata(ctx, 560, PE - 10, 120, { virada: vl, tampa: tp }); }, 2);
      if (el >= 1) BOX('lata', 480, PE - 130, 640, PE - 10);
    },
  };

  // ---- socorro: a padaria pula de alegria e os itens voam da porta para a sacola com a logo oficial
  CENAS.socorro = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.padaria = at(cap, (d.lojinha || d.padaria).em, cap.t0 + 0.6);   // a lojinha pula de alegria nessa palavra
      let prev = ev.padaria;
      ev.itens = d.itens.map((it) => (prev = Math.max(at(cap, it.em, prev + 0.5), prev + 0.3)));
      ev.sacola = Math.min(ev.padaria, ev.itens[0] - 0.3);
      ev.fim = ev.itens[ev.itens.length - 1] + 0.75;
      cue(cap.t0 + 0.15, 'sprout', { i: 0 }); cue(ev.padaria, 'jump'); cue(ev.sacola, 'pop', { f: 460 });
      ev.itens.forEach((x, i) => { cue(x, 'whoosh'); cue(x + 0.55, d.itens[i].som || 'plop'); });
      cue(ev.fim, 'check'); cue(ev.fim + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const PX = 245, PW = 280, S = { x: 735, bot: PE - 20, w: 240, h: 205 };
      const alegre = clamp((t - ev.padaria) * 3);
      lojinha(ctx, d.loja || 'padaria', PX, PE - 10, PW, t, { e: p(t, cap.t0 + 0.1, cap.t0 + 0.6), smile: alegre, altura: 11 + 34 * alegre, alvo: [S.x, S.bot - 120], seed: 41,
        swing: 6 * Math.sin((t - ev.padaria) * 8) * Math.exp(-Math.max(0, t - ev.padaria) * 2) * (t > ev.padaria ? 1 : 0), box: t > cap.t0 + 0.6 ? 'padaria' : null });
      // as figurinhas e o confete ficam atrás da sacola com a logo
      sticker(ctx, 'estrela', 480, T + 110, 62, p(t, ev.padaria + 0.1, ev.padaria + 0.45), t);
      sticker(ctx, 'coracao', 640, T + 200, 58, p(t, ev.fim, ev.fim + 0.35), t);
      confete(ctx, t, ev.fim + 0.05, S.x, S.bot - 230, 53, { n: 34, v: 900 });
      const es = ent(t, ev.sacola, 0.45), tp = S.bot - S.h;
      enter(ctx, es, S.x, S.bot, () => {
        ctx.strokeStyle = C.coralDark; ctx.lineWidth = 13; ctx.lineCap = 'round';
        for (const dx of [-54, 54]) { ctx.beginPath(); ctx.moveTo(S.x + dx - 28, tp + 4); ctx.bezierCurveTo(S.x + dx - 28, tp - 72, S.x + dx + 28, tp - 72, S.x + dx + 28, tp + 4); ctx.stroke(); }
        // os itens que já entraram, saindo pela boca
        const dxi = (i) => (i - (d.itens.length - 1) / 2) * (d.itens.length > 3 ? 50 : 62);   // a posição de cada item na boca da sacola
        d.itens.forEach((it, i) => { if (t >= ev.itens[i] + 0.55 && ITENS[it.tipo]) ITENS[it.tipo](ctx, S.x + dxi(i), tp - 6, 96); });
        ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(S.x - S.w / 2, tp); ctx.lineTo(S.x + S.w / 2, tp); ctx.lineTo(S.x + S.w / 2 + 12, S.bot); ctx.lineTo(S.x - S.w / 2 - 12, S.bot); ctx.closePath();
        ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
        ctx.fillStyle = C.coral; ctx.fillRect(S.x - S.w / 2, tp, S.w, 28);
        logo(ctx, S.x, tp + 28 + (S.h - 28) / 2, Math.min(130, S.h - 44));
        if (es >= 1) BOX('sacola', S.x - S.w / 2 - 12, tp - 72, S.x + S.w / 2 + 12, S.bot);
      });
      // os itens voando da porta da padaria até a sacola (por cima)
      d.itens.forEach((it, i) => {
        const t0 = ev.itens[i]; if (t < t0 || t >= t0 + 0.55 || !ITENS[it.tipo]) return;
        const u = p(t, t0, t0 + 0.55), x = lerp(PX, S.x + (i - (d.itens.length - 1) / 2) * (d.itens.length > 3 ? 50 : 62), u), y = lerp(PE - 80, tp - 6, u) - 300 * Math.sin(Math.PI * u);
        ctx.save(); ctx.translate(x, y); ctx.rotate(u * 6); ITENS[it.tipo](ctx, 0, 0, 110); ctx.restore();
      });
      check(ctx, S.x + S.w / 2 - 4, tp + 6, 42, p(t, ev.fim, ev.fim + 0.4), { box: t >= ev.fim + 0.4 ? 'check' : null });
    },
  };

  // ---- capricho: o mercadim; a toalha xadrez desenrola na mesa e os itens chegam e pousam um a um
  CENAS.capricho = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.toalha = at(cap, d.toalha.em, cap.t0 + 0.4);
      let prev = ev.toalha;
      ev.itens = d.itens.map((it) => (prev = Math.max(at(cap, it.em, prev + 0.5), prev + 0.3)));
      cue(cap.t0 + 0.15, 'sprout', { i: 1 }); cue(ev.toalha, 'slide');
      ev.itens.forEach((x, i) => { cue(x, 'pop', { f: 600 + 90 * i }); cue(x + 0.45, 'plop'); });
      cue(ev.itens[ev.itens.length - 1] + 0.55, 'shine');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const MX = 215, MB = T + 330, Y = PE - 200;
      // o mercadim, num gramadinho
      const em = p(t, cap.t0 + 0.1, cap.t0 + 0.6);
      if (em > 0) { ctx.fillStyle = css(C.verdeLight, 0.55 * clamp(em * 2)); ctx.beginPath(); ctx.ellipse(MX, MB, 150, 26, 0, 0, TAU); ctx.fill(); }
      lojinha(ctx, 'mercado', MX, MB, 210, t, { e: em, smile: clamp((t - ev.itens[0]) * 2), alvo: [600, Y - 60], seed: 51, box: em >= 1 ? 'mercadim' : null });
      sticker(ctx, 'brilho', 560, T + 90, 54, p(t, ev.itens[ev.itens.length - 1] + 0.55, ev.itens[ev.itens.length - 1] + 0.85), t);
      sticker(ctx, 'estrela', 830, T + 170, 60, p(t, ev.itens[ev.itens.length - 1] + 0.65, ev.itens[ev.itens.length - 1] + 0.95), t);
      // a mesa com a toalha desenrolando
      enter(ctx, ent(t, cap.t0 + 0.2, 0.45), 510, Y, () => { mesaXadrez(ctx, 120, 900, Y, PE - 8, p(t, ev.toalha, ev.toalha + 0.7)); BOX('mesa', 120, Y, 900, PE - 8); });
      // os itens: saem do mercadim e pousam na mesa
      const lugares = [400, 590, 780];
      d.itens.forEach((it, i) => {
        const t0 = ev.itens[i]; if (t < t0 || !ITENS[it.tipo]) return;
        const u = p(t, t0, t0 + 0.45), x = lerp(MX, lugares[i], E.outCubic(u)), y = lerp(MB - 120, Y - 48, u) - 200 * Math.sin(Math.PI * u);
        const sq = u >= 1 ? 1 - 0.1 * Math.sin(Math.PI * p(t, t0 + 0.45, t0 + 0.65)) : 1;
        ctx.save(); ctx.translate(x, y + 40); ctx.scale(1 / sq, sq); ctx.translate(0, -40); ITENS[it.tipo](ctx, 0, 0, 130); ctx.restore();
        if (u >= 1) BOX(`${it.tipo}`, lugares[i] - 62, Y - 105, lugares[i] + 62, Y - 4);
      });
    },
  };

  // ---- chegou: a motinha chega com a sacola, a mesa fica farta, a visita com coraçõezinhos e a piscadinha para a câmera
  CENAS.chegou = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.moto = at(cap, d.moto.em, cap.t0 + 0.3);
      ev.chega = ev.moto + 1.0;
      ev.mesa = Math.max(at(cap, d.mesa.em, ev.chega), ev.moto + 0.5);
      ev.visita = Math.max(at(cap, d.visita.em, ev.mesa + 1), ev.mesa + 0.6);
      ev.pisca = Math.max(at(cap, d.piscadinha.em, ev.visita + 0.6), ev.visita + 0.4);
      cue(ev.moto, 'moto', { d: 1.0 }); cue(ev.chega, 'horn');
      [0, 1, 2, 3, 4].forEach((i) => cue(ev.mesa + i * 0.1, 'pop', { f: 560 + 70 * i }));
      cue(ev.visita, 'heart'); cue(ev.pisca, 'blink'); cue(ev.pisca + 0.05, 'shine');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const Y = PE - 230;                                    // o tampo da mesa farta
      // a visita atrás da mesa (com coraçõezinhos subindo) — a do meio pisca para a câmera
      [[430, 0], [610, 1], [790, 3]].forEach(([x, vi], i) => {
        const e = ent(t, cap.t0 + 0.1 + i * 0.08, 0.4);
        if (e <= 0) return;
        const pisca = i === 1 && t >= ev.pisca && t < ev.pisca + 0.6;
        ctx.save(); ctx.globalAlpha *= clamp(e * 2);
        pessoa(ctx, VISITAS[vi], x, Y + 40 - 5 * hop(t, i * 0.4), t, { k: 0.95, look: pisca || t >= ev.pisca ? [0, 0] : [-0.7, 0.2], pisca, sorriso: 1, blink: pisca ? 0 : blinkAt(t, i + 60), box: e >= 1 ? `visita ${i + 1}` : null });
        ctx.restore();
        for (let j = 0; j < 2; j++) {
          const t0 = ev.visita + i * 0.12 + j * 0.5, u = p(t, t0, t0 + 1.4);
          if (u > 0 && u < 1) sticker(ctx, 'coracao', x + (j ? 40 : -34), Y - 200 - 120 * u, 38, Math.min(1, u * 5) * (1 - p(u, 0.8, 1)), t);
        }
      });
      if (t >= ev.pisca) sticker(ctx, 'brilho', 680, Y - 250, 46, p(t, ev.pisca, ev.pisca + 0.3) * (1 - p(t, ev.pisca + 0.9, ev.pisca + 1.2)), t);
      // a mesa farta
      enter(ctx, ent(t, cap.t0 + 0.15, 0.45), 600, Y, () => { mesaXadrez(ctx, 340, 900, Y, PE - 8, 1); BOX('mesa', 340, Y, 900, PE - 8); });
      const farta = [['bule', 400], ['paoQueijo', 500], ['rosca', 610], ['bolo', 720], ['queijo', 830]];
      farta.forEach(([k, x], i) => {
        const e = p(t, ev.mesa + i * 0.1, ev.mesa + i * 0.1 + 0.35);
        if (e <= 0) return;
        if (k === 'bule') pop(ctx, e, x, Y + 2, () => bule(ctx, x, Y + 2, 90, t), 2.2);
        else pop(ctx, e, x, Y + 2, () => ITENS[k](ctx, x, Y - 34, k === 'paoQueijo' ? 80 : 100), 2.2);
      });
      // a motinha chegando com a sacola (para na frente, à esquerda da mesa)
      if (t >= ev.moto - 0.05) {
        const um = p(t, ev.moto, ev.chega), x = lerp(-120, 205, E.outCubic(um)), sp = Math.sin(Math.PI * um), MS = 210;
        moto(ctx, x, PE - 10 - (um >= 1 ? 3 * hop(t) : 0), MS, { dir: 1, roll: x / 16, speed: sp, tilt: -0.04 * sp });
        if (um >= 1) BOX('motinha', 205 - MS * 0.55, PE - 10 - MS * 0.98, 205 + MS * 0.55, PE - 10);
      }
    },
  };

  // ===================== cenas do ep05 ("Churrasco de domingo")

  // ---- causo: a família brotando, o tio de avental e pegador na churrasqueira e a grelha vazia (com o "?")
  CENAS.causo = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.familia = at(cap, d.familia.em, cap.t0 + 0.3);
      ev.pessoas = [0, 1, 2].map((i) => ev.familia + i * 0.25);
      ev.tio = Math.max(at(cap, d.tio.em, ev.familia + 1), ev.pessoas[2] + 0.2);
      ev.grelha = Math.max(at(cap, d.grelha.em, ev.tio + 1), ev.tio + 0.4);
      cue(cap.t0 + 0.12, 'pop', { f: 420 }); ev.pessoas.forEach((x, i) => cue(x, 'sprout', { i }));
      cue(ev.tio, 'jump'); cue(ev.tio + 0.3, 'clink'); cue(ev.grelha, 'question');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev;
      const GX = 620, GW = 300;
      enter(ctx, ent(t, cap.t0 + 0.1, 0.45), GX, PE - 10, () => churrasqueira(ctx, GX, PE - 10, GW, t, { acesa: 0 }));
      BOX('churrasqueira', GX - GW / 2, PE - 10 - GW * 0.78, GX + GW / 2, PE - 10);
      // o "?" em cima da grelha vazia
      const eq = ent(t, ev.grelha, 0.35);
      if (eq > 0) { interrog(ctx, GX, PE - 10 - GW * 0.78 - 80, 48, eq, t, ev.grelha); if (eq >= 1) BOX('?', GX - 48, PE - GW * 0.78 - 138, GX + 48, PE - GW * 0.78 - 42); }
      // a família brotando (olhando para a grelha)
      [160, 280, 400].forEach((x, i) => {
        const e = p(t, ev.pessoas[i], ev.pessoas[i] + 0.45);
        if (e <= 0) return;
        const k = E.outBack(e, 2), b = PE - 10 - 5 * hop(t, i * 0.4) * clamp(e * 2 - 1);
        ctx.save(); ctx.translate(x, b); ctx.scale(lerp(0.6, 1, k), k); ctx.translate(-x, -b);
        pessoa(ctx, VISITAS[i], x, b, t, { k: 0.9, look: [0.7, 0.1], acena: i === 0, sorriso: 0.6, blink: blinkAt(t, i + 70), box: e >= 1 ? `família ${i + 1}` : null });
        ctx.restore();
      });
      // o tio, de avental e pegador
      const et = p(t, ev.tio, ev.tio + 0.45);
      if (et > 0) {
        const x = 830, k = E.outBack(et, 2), b = PE - 10;
        ctx.save(); ctx.translate(x, b); ctx.scale(lerp(0.6, 1, k), k); ctx.translate(-x, -b);
        pessoa(ctx, TIO, x, b, t, { k: 0.95, look: [-0.7, 0.3], sorriso: t > ev.grelha ? 0 : 0.5, blink: blinkAt(t, 77), box: et >= 1 ? 'tio' : null });
        avental(ctx, TIO, x, b, t, { k: 0.95 });
        ctx.restore();
      }
    },
  };

  // ---- acougue: a lojinha do açougue (toldo vermelho e branco), a picanha e a costelinha pulando na tábua, a linguiça
  //      pendurada balançando
  CENAS.acougue = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.picanha = at(cap, d.picanha.em, cap.t0 + 0.3);
      ev.linguica = Math.max(at(cap, d.linguica.em, ev.picanha + 0.6), ev.picanha + 0.3);
      ev.costela = Math.max(at(cap, d.costelinha.em, ev.linguica + 0.6), ev.linguica + 0.3);
      ev.manda = Math.max(at(cap, d.manda.em, cap.t1 - 1), ev.costela + 0.4);
      cue(cap.t0 + 0.12, 'sprout', { i: 1 }); cue(ev.picanha, 'jump'); cue(ev.linguica, 'whoosh'); cue(ev.costela, 'jump');
      cue(ev.manda, 'shine'); cue(ev.manda + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const ea = p(t, cap.t0 + 0.1, cap.t0 + 0.6);
      lojinha(ctx, 'acougue', 245, PE - 10, 290, t, { e: ea, smile: clamp((t - ev.manda) * 3) * 0.6 + 0.4, alvo: [700, PE - 150], seed: 81,
        swing: 6 * Math.sin((t - ev.manda) * 8) * Math.exp(-Math.max(0, t - ev.manda) * 2) * (t > ev.manda ? 1 : 0), box: ea >= 1 ? 'açougue' : null });
      sticker(ctx, 'coracao', 450, T + 110, 62, p(t, ev.manda, ev.manda + 0.35), t);
      sticker(ctx, 'estrela', 500, PE - 420, 52, p(t, ev.manda + 0.12, ev.manda + 0.45), t);
      confete(ctx, t, ev.manda + 0.05, 245, PE - 300, 83, { n: 32, v: 900 });
      // a linguiça pendurada no gancho, balançando (entra caindo de cima)
      const el = p(t, ev.linguica, ev.linguica + 0.45);
      if (el > 0) {
        const hx = 760, hy = T + 30 - 120 * (1 - E.outBack(el, 1.6));
        const ang = 0.4 * Math.sin((t - ev.linguica) * 4.2) * Math.exp(-Math.max(0, t - ev.linguica) * 0.35);
        ctx.save(); ctx.globalAlpha *= clamp(el * 3);
        ctx.strokeStyle = C.cinza; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx - 50, hy); ctx.lineTo(hx + 50, hy); ctx.stroke();
        ctx.beginPath(); ctx.arc(hx, hy + 14, 12, Math.PI * 1.5, Math.PI * 0.6); ctx.stroke();
        ctx.translate(hx, hy + 26); ctx.rotate(ang);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = '#A8452A'; ctx.beginPath(); ctx.ellipse(0, 22 + i * 36, 13, 18, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = css(C.papel, 0.35); ctx.beginPath(); ctx.ellipse(-4, 16 + i * 36, 3.5, 7, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#7A2A20'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, 40 + i * 36); ctx.lineTo(5, 40 + i * 36); ctx.stroke();
        }
        ctx.restore();
        if (el >= 1) BOX('linguiça', hx - 60, T + 20, hx + 60, T + 30 + 26 + 5 * 36 + 20);
      }
      // a tábua com a picanha e a costelinha pulando
      enter(ctx, ent(t, cap.t0 + 0.2, 0.4), 715, PE - 40, () => { ctx.fillStyle = C.madeira; rr(ctx, 520, PE - 62, 390, 34, 14); ctx.fill(); ctx.fillStyle = C.madeiraDark; rr(ctx, 530, PE - 34, 370, 10, 5); ctx.fill(); });
      [['picanha', 615, ev.picanha, 150], ['costela', 810, ev.costela, 140]].forEach(([k, x, t0, sz], i) => {
        const e = p(t, t0, t0 + 0.4);
        if (e <= 0) return;
        const y = PE - 100 - 16 * hop(t, i * 0.5) * clamp((t - t0 - 0.4) * 3);
        pop(ctx, e, x, y + 30, () => ITENS[k](ctx, x, y, sz), 2.4);
        if (e >= 1) BOX(k, x - sz * 0.48, PE - 150, x + sz * 0.48, PE - 62);
      });
    },
  };

  // ---- geladim: o isopor abre, as garrafas de refri (sem marca) sobem geladas, o gelo tilinta e o saco de gelo cai
  CENAS.geladim = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.isopor = at(cap, d.isopor.em, cap.t0 + 0.25);
      ev.refri = Math.max(at(cap, d.refri.em, ev.isopor + 0.5), ev.isopor + 0.3);
      ev.tampa = ev.refri - 0.15;
      ev.trinca = Math.max(at(cap, d.trincando.em, ev.refri + 0.6), ev.refri + 0.45);
      ev.gelo = Math.max(at(cap, d.gelo.em, ev.trinca + 1), ev.trinca + 0.4);
      cue(ev.isopor, 'pop', { f: 440 }); cue(ev.tampa, 'door'); [0, 1, 2].forEach((i) => cue(ev.refri + i * 0.15, 'pop', { f: 680 + 90 * i }));
      cue(ev.trinca, 'shine'); cue(ev.gelo, 'flop'); [0, 1, 2, 3].forEach((i) => cue(ev.gelo + 0.2 + i * 0.09, 'clink'));
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const IX = 500, IW = 380, IH = 200, IB = PE - 20, IT = IB - IH;
      const ei = ent(t, ev.isopor, 0.45);
      // a tampa, do mesmo isopor, presa na dobradiça da borda de trás: fechada é a placa por cima; aberta, fica em pé
      //      atrás da boca do isopor (por trás das garrafas e do gelo que saem de dentro)
      enter(ctx, ei, IX, IB, () => {
        const ab = E.outBack(p(t, ev.tampa, ev.tampa + 0.45), 1.6), hl = lerp(26, 124, ab), enc = 26 * clamp(ab);
        const yb = IT + 6, yt = yb - hl, xl = IX - IW / 2 - 6, xr = IX + IW / 2 + 6;
        ctx.beginPath(); ctx.moveTo(xl, yb); ctx.lineTo(xl + enc, yt + 14); ctx.quadraticCurveTo(xl + enc, yt, xl + enc + 14, yt);
        ctx.lineTo(xr - enc - 14, yt); ctx.quadraticCurveTo(xr - enc, yt, xr - enc, yt + 14); ctx.lineTo(xr, yb); ctx.closePath();
        ctx.fillStyle = C.papel; ctx.fill(); ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 5; ctx.stroke();
        if (ab > 0.15) {                                         // o lado de dentro da tampa (o rebaixo)
          ctx.globalAlpha *= clamp((ab - 0.15) * 3); ctx.strokeStyle = css(C.cremeDeep, 0.8); ctx.lineWidth = 4;
          rr(ctx, xl + enc + 26, yt + 18, xr - xl - 2 * enc - 52, hl - 34, 12); ctx.stroke();
        }
      });
      // as garrafas subindo de dentro do isopor (atrás da frente dele)
      const cores = [C.coral, C.verde, C.amarelo], alvos = [[400, IT - 120], [500, IT - 160], [600, IT - 120]];
      alvos.forEach(([ax, ay], i) => {
        const t0 = ev.refri + i * 0.15; if (t < t0) return;
        const u = E.outBack(p(t, t0, t0 + 0.5), 1.4), y = lerp(IT + 60, ay, u) - 6 * Math.sin((t - t0) * 2.6 + i) * clamp((t - t0 - 0.5) * 2);
        ctx.save(); ctx.translate(ax, y); ctx.rotate((i - 1) * 0.12 * u); itemRefri(ctx, 0, 0, 160, cores[i]); ctx.restore();
        if (u >= 1) BOX(`refri ${i + 1}`, ax - 40, ay - 110, ax + 40, ay + 86);
      });
      // o gelo aparecendo na boca do isopor quando a tampa abre
      const eg0 = E.outBack(p(t, ev.tampa + 0.1, ev.tampa + 0.45), 1.6);
      if (eg0 > 0) [[330, 0.2], [380, 1.1], [450, 2.3], [560, 0.7], [640, 1.9], [680, 2.8]].forEach(([x, r], i) => {
        ctx.save(); ctx.translate(x, IT + 4 - 16 * eg0 - 4 * (i % 2)); ctx.rotate(r); ctx.scale(eg0, eg0); itemGelo(ctx, 0, 0, 58); ctx.restore();
      });
      enter(ctx, ei, IX, IB, () => {
        shadow(ctx, IX, IB, IW * 0.55, 10, 0.14);
        ctx.fillStyle = C.papel; rr(ctx, IX - IW / 2, IT, IW, IH, 22); ctx.fill(); ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = C.coral; rr(ctx, IX - IW / 2, IT + IH * 0.42, IW, 30, 6); ctx.fill();
        ctx.fillStyle = C.cremeDeep; rr(ctx, IX - 60, IT + 34, 120, 22, 11); ctx.fill();                           // a alça
        BOX('isopor', IX - IW / 2, IT - 30, IX + IW / 2, IB);
      });
      // trincando: os brilhos de gelado nas garrafas
      [[350, IT - 210], [650, IT - 230], [500, IT - 300]].forEach(([x, y], i) => sticker(ctx, 'brilho', x, y, 50, p(t, ev.trinca + i * 0.1, ev.trinca + 0.35 + i * 0.1), t));
      // o gelo: os cubos pulando e o saco de gelo caindo do lado
      [[220, PE - 40], [290, PE - 60], [760, PE - 40]].forEach(([x, y], i) => {
        const t0 = ev.gelo + 0.2 + i * 0.09; if (t < t0) return;
        const u = p(t, t0, t0 + 0.45), xx = lerp(IX, x, u), yy = lerp(IT, y, u) - 150 * Math.sin(Math.PI * u);
        ctx.save(); ctx.translate(xx, yy); ctx.rotate(u * 5 + i); itemGelo(ctx, 0, 0, 70); ctx.restore();
      });
      const eg = p(t, ev.gelo, ev.gelo + 0.35);
      if (eg > 0) {
        const SX = 840, SB = PE - 10, y = lerp(T, SB, E.inCubic(Math.min(1, eg))), sq = eg >= 1 ? 1 - 0.12 * Math.sin(Math.PI * p(t, ev.gelo + 0.35, ev.gelo + 0.55)) : 1;
        ctx.save(); ctx.translate(SX, y); ctx.scale(1 / sq, sq);
        ctx.fillStyle = css('#E4F1F4', 0.9); ctx.beginPath(); ctx.moveTo(-64, 0); ctx.quadraticCurveTo(-74, -110, -30, -150); ctx.lineTo(30, -150); ctx.quadraticCurveTo(74, -110, 64, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#B9D3DA'; ctx.lineWidth = 4; ctx.stroke();
        for (const [cx, cy] of [[-30, -40], [12, -30], [-6, -84], [30, -76], [-34, -100]]) itemGelo(ctx, cx, cy, 44);
        ctx.fillStyle = C.coral; rr(ctx, -14, -168, 28, 22, 6); ctx.fill();
        ctx.restore();
        if (eg >= 1) BOX('saco de gelo', SX - 74, SB - 170, SX + 74, SB);
      }
    },
  };

  // ---- churrasco ("CHEGOU"): a motinha chegando, a grelha cheia com a brasa, a fumaça que vira coração, a família
  //      comemorando e o vira-lata ganhando um pedacinho do tio
  CENAS.churrasco = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.moto = at(cap, d.moto.em, cap.t0 + 0.3);
      ev.chega = ev.moto + 1.0;
      ev.grelha = Math.max(at(cap, d.grelha.em, ev.moto + 0.8), ev.moto + 0.4);
      ev.fumaca = Math.max(at(cap, d.fumaca.em, ev.grelha + 0.5) + 0.15, ev.grelha + 0.4);
      ev.familia = Math.max(at(cap, d.familia.em, ev.fumaca + 0.6), ev.fumaca + 0.3);
      ev.pedaco = Math.max(at(cap, d.pedacinho.em, ev.familia + 1), ev.familia + 0.5);
      ev.pega = ev.pedaco + 0.55;
      cue(ev.moto, 'moto', { d: 1.0 }); cue(ev.chega, 'horn');
      [0, 1, 2].forEach((i) => cue(ev.grelha + i * 0.12, 'pop', { f: 560 + 80 * i })); cue(ev.grelha + 0.1, 'flop');
      cue(ev.fumaca, 'heart'); cue(ev.familia, 'confete'); cue(ev.pedaco, 'whoosh'); cue(ev.pega, 'cachorro', { d: 0.3, dir: 1, so_latido: 1 });
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const GX = 560, GW = 290, GT = PE - 10 - GW * 0.78;
      // a família comemorando, lá atrás (com coraçõezinhos)
      [[150, 0], [290, 1]].forEach(([x, vi], i) => {
        const e = ent(t, cap.t0 + 0.1 + i * 0.08, 0.4); if (e <= 0) return;
        const fest = t > ev.familia;
        ctx.save(); ctx.globalAlpha *= clamp(e * 2);
        pessoa(ctx, VISITAS[vi], x, PE - 150 - (fest ? 14 * hop(t, i * 0.5) : 0), t, { k: 0.8, look: fest ? [0, 0] : [0.7, 0.2], acena: fest, sorriso: 1, blink: blinkAt(t, i + 90) });
        ctx.restore();
        for (let j = 0; j < 2; j++) { const t0 = ev.familia + i * 0.15 + j * 0.45, u = p(t, t0, t0 + 1.3); if (u > 0 && u < 1) sticker(ctx, 'coracao', x + (j ? 34 : -30), PE - 380 - 110 * u, 36, Math.min(1, u * 5) * (1 - p(u, 0.8, 1)), t); }
      });
      // o tio ao lado da churrasqueira (atrás dela)
      pessoa(ctx, TIO, 755, PE - 40, t, { k: 0.95, look: t > ev.pedaco ? [0.8, 0.3] : [-0.5, 0.3], sorriso: 1, blink: blinkAt(t, 95) });
      avental(ctx, TIO, 755, PE - 40, t, { k: 0.95 });
      // a churrasqueira acesa, com a grelha enchendo
      const acesa = p(t, ev.grelha - 0.2, ev.grelha + 0.6);
      churrasqueira(ctx, GX, PE - 10, GW, t, { acesa, carnes: ['linguica', 'picanha', 'costela', 'linguica'].map((k, i) => ({ tipo: k, e: p(t, ev.grelha + i * 0.12, ev.grelha + i * 0.12 + 0.35) })) });
      BOX('churrasqueira', GX - GW / 2, GT - 30, GX + GW / 2, PE - 10);
      // a fumaça subindo e formando o coração
      if (acesa > 0) for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i / 4) % 1; ctx.fillStyle = css('#A99C92', 0.55 * Math.sin(Math.PI * ph) * acesa * (1 - p(t, ev.fumaca, ev.fumaca + 0.4))); ctx.beginPath(); ctx.arc(GX - 30 + 20 * Math.sin(ph * 6 + i), GT - 30 - ph * 260, 16 + 14 * ph, 0, TAU); ctx.fill(); }
      fumacaCoracao(ctx, GX, T + 150, p(t, ev.fumaca, ev.fumaca + 1.0), t, 1.15);
      // o vira-lata pidão, sentado, que ganha o pedacinho e abana o rabo
      const ganhou = t >= ev.pega;
      viralata(ctx, 855, PE - 10, 130, { pose: 'sentado', olhar: true, pidao: !ganhou, rabo: t * (ganhou ? 22 : 5), contorno: 1.6 });
      BOX('vira-lata', 855 - 92, PE - 10 - 200, 855 + 80, PE - 10);
      if (t >= ev.pedaco && t < ev.pega) {
        const u = p(t, ev.pedaco, ev.pega), x = lerp(830, 855, u), y = lerp(PE - 300, PE - 10 - 140, u) - 120 * Math.sin(Math.PI * u);
        ctx.save(); ctx.translate(x, y); ctx.rotate(u * 7); ctx.fillStyle = '#A8452A'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      if (ganhou) sticker(ctx, 'coracao', 880, PE - 260, 46, p(t, ev.pega, ev.pega + 0.3) * (1 - p(t, ev.pega + 1.2, ev.pega + 1.5)), t);
      // a motinha chegando com a sacola da marca (na frente de tudo)
      if (t >= ev.moto - 0.05) {
        const um = p(t, ev.moto, ev.chega), x = lerp(-120, 230, E.outCubic(um)), sp = Math.sin(Math.PI * um), MS = 200;
        moto(ctx, x, PE - 10 - (um >= 1 ? 3 * hop(t) : 0), MS, { dir: 1, roll: x / 16, speed: sp, tilt: -0.04 * sp });
        if (um >= 1) BOX('motinha', 230 - MS * 0.55, PE - 10 - MS * 0.98, 230 + MS * 0.55, PE - 10);
      }
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
      if (d.galinha) ev.galinha = Math.min(at(cap, d.galinha.em, cap.t0 + 1.6), DUR - 3.0 - 1.3);   // termina antes dos 3 s finais
      FECHO.ultima = Math.max(cap.t0 + 0.7, ev.logo + 0.9, ev.ass + 0.45, ev.chip + 0.45, ev.seta + 0.55, ev.confete + 2.0, ...cap.apoios.map((a) => a.t + 0.34), ev.galinha !== undefined ? ev.galinha + 1.15 : 0);
      if (d.galinha) cue(ev.galinha, 'galinha', { d: 1.1, dir: 1 });
      if (d.cachorro) {
        ev.cachorro = Math.min(at(cap, d.cachorro.em, cap.t0 + 1.6), DUR - 3.0 - 1.3);   // termina antes dos 3 s finais
        FECHO.ultima = Math.max(FECHO.ultima, ev.cachorro + 1.15);
        cue(ev.cachorro, 'cachorro', { d: 1.1, dir: 1 });
      }
      if (d.sacola) {
        ev.sacola = Math.min(at(cap, d.sacola.em, cap.t0 + 1.6), DUR - 3.0 - 1.3);   // termina antes dos 3 s finais
        FECHO.ultima = Math.max(FECHO.ultima, ev.sacola + 1.15);
        cue(ev.sacola, 'sacola', { d: 1.1, dir: 1, nhac: 0.55, jeito: 0 });
      }
      cue(ev.logo, 'logo'); cue(ev.ass, 'tick'); cue(ev.chip, 'pop', { f: 700 }); cue(ev.seta, 'whoosh'); cue(ev.confete, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const D = 400, ly = T + 20 + D / 2;
      confete(ctx, t, ev.confete, L.cx, ly - 40, 23, { n: 64, v: 1150, dur: 2.0, spread: 3.2 });
      if (ev.galinha !== undefined) {
        // a galinha cruzando ao fundo (atrás da logo e do texto), com penas
        const ug = p(t, ev.galinha, ev.galinha + 1.1);
        if (ug > 0 && ug < 1) {
          const gx = lerp(-160, W + 160, ug);
          for (let i = 0; i < 10; i++) pena(ctx, gx - 120 - 50 * i + 8 * Math.sin(t * 9 + i), 900 + 40 * Math.sin(i * 2.3) + 60 * ug * (i % 3), 10, t * 4 + i, [C.madeira, C.madeiraDark, C.papel][i % 3]);
          galinha(ctx, gx, 1000, 130, { dir: 1, asa: 0.5 + 0.5 * Math.sin(t * 42), passo: gx / 12 });
        }
      }
      if (ev.cachorro !== undefined) {
        // o vira-lata cruzando ao fundo com a linguiça (atrás da logo e do texto), com poeirinha
        const uc = p(t, ev.cachorro, ev.cachorro + 1.1);
        if (uc > 0 && uc < 1) {
          const cx = lerp(-200, W + 200, uc);
          for (let i = 0; i < 4; i++) { ctx.fillStyle = css(C.cremeDeep, 0.5 - 0.1 * i); ctx.beginPath(); ctx.arc(cx - 110 - i * 40, 990 - i * 4, 14 + 6 * i, 0, TAU); ctx.fill(); }
          viralata(ctx, cx, 1000, 160, { dir: 1, passo: cx / 14, linguica: true, balanco: t * 14, rabo: t * 18 });
        }
      }
      if (ev.sacola !== undefined) {
        // a sacola comilona passando ao fundo aos pulos (atrás da logo e do texto), com um nhac no meio
        const us = p(t, ev.sacola, ev.sacola + 1.1);
        if (us > 0 && us < 1) {
          const sx = lerp(-180, W + 180, us), hh = (us * 3) % 1, nh = Math.sin(Math.PI * p(us, 0.38, 0.55));
          for (let i = 0; i < 3; i++) { ctx.fillStyle = css(C.cremeDeep, 0.45 - 0.1 * i); ctx.beginPath(); ctx.arc(sx - 100 - i * 36, 994 - i * 4, 12 + 5 * i, 0, TAU); ctx.fill(); }
          sacolaComilona(ctx, sx, 1000 - 70 * Math.sin(Math.PI * hh), 190, t, { dir: 1, sq: 1 - 0.15 * clamp(1 - Math.min(hh, 1 - hh) / 0.1), boca: nh, look: [0.7, 0.1], contorno: 2 });
        }
      }
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
      const ea = E.outCubic(p(t, ev.ass, ev.ass + 0.45));
      const ay = ly + D / 2 + 80;
      if (ea > 0 && d.assinatura) {
        const s1 = 'Tudo ', s2 = d.assinatura.t.replace(/^Tudo\s+/, ''), sz = 54;
        const w1 = tw(s1, sz, 900, -0.5), w2 = tw(s2, sz, 900, -0.5), x0 = L.tx - (w1 + w2) / 2;
        ctx.save(); ctx.globalAlpha *= ea; ctx.translate(0, 14 * (1 - ea));
        marker(ctx, x0 + w1, ay, w2 - sz * 0.25, sz, E.outCubic(p(t, ev.ass + 0.15, ev.ass + 0.5)), css(C.amarelo, 0.9));
        txt(ctx, s1, x0, ay, { size: sz, weight: 900, color: C.tinta, ls: -0.5 });
        txt(ctx, s2, x0 + w1, ay, { size: sz, weight: 900, color: C.coral, ls: -0.5 });
        ctx.restore();
        if (ea >= 1) BOX('assinatura', x0, ay - sz * 0.76, x0 + w1 + w2, ay + sz * 0.22);
      }
      const cy = ay + 108, ec = p(t, ev.chip, ev.chip + 0.45);
      if (ec > 0) {
        const s = d.chip.t, w = 2 * 32 + tw(s, 42, 800, 0);
        pop(ctx, ec, L.tx, cy, () => chip(ctx, s, L.tx, cy, { size: 42, weight: 800, ls: 0, h: 96, pad: 32, align: 'center', bg: C.coral, color: C.branco, border: 'none', box: ec >= 1 ? 'chip Segue' : null }), 2);
        const es = E.outCubic(p(t, ev.seta, ev.seta + 0.55));
        if (es > 0) {
          const x1 = L.tx - w / 2 - 18, y1 = cy, x0 = 110, y0 = cy - 160;
          const cxp = x0 - 10, cyp = cy + 10;
          ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(x0, y0);
          for (let u = 0.02; u <= es + 1e-6; u += 0.02) { const v = 1 - u; ctx.lineTo(v * v * x0 + 2 * v * u * cxp + u * u * x1, v * v * y0 + 2 * v * u * cyp + u * u * y1); }
          ctx.stroke();
          if (es > 0.95) { ctx.beginPath(); ctx.moveTo(x1 - 24, y1 - 17); ctx.lineTo(x1, y1); ctx.lineTo(x1 - 26, y1 + 15); ctx.stroke(); }
          ctx.restore();
          if (es >= 1) BOX('seta', x0 - 10, y0, x1 + 4, cy + 20);
        }
      }
    },
  };

  // ===================== peças do ep04 ("Segunda sem coragem")

  // ---- a sacola comilona (transição "sacola" e o fecho do ep04): a sacola da UaiPertim viva — papel creme, faixa
  //      coral, alças, a logo oficial (o arquivo; nunca redesenhada, deformada, espelhada nem coberta), olhinhos no estilo
  //      das lojinhas e a boca ABAIXO da logo. Contorno tinta. (x, base) = o chão no meio; s = altura do corpo (sem as
  //      alças, que somam ~21%). o: boca 0..1 (aberta), mastiga 0..1 (bochechas cheias, mastigando), palito 0..1,
  //      suspiro 0..1 (olhos fechados felizes e a boquinha do "ahh"), sq (1 = normal; < 1 amassa no pouso, > 1 estica
  //      no ar: só o papel; a logo nunca), tilt, look [-1..1, -1..1], dir (o lado do palito), contorno.
  const SAC = { Hb: 340, Wt: 236, Wb: 262, band: 30, eyeY: -276, logoY: -186, logoD: 118, mouthY: -70 };
  function sacolaComilona(ctx, x, base, s, t, o = {}) {
    const k = s / SAC.Hb, sq = o.sq ?? 1, dir = o.dir || 1, m = clamp(o.mastiga || 0), sus = clamp(o.suspiro || 0);
    const bo = clamp(o.boca || 0), lk = o.look || [0, 0];
    ctx.save(); ctx.translate(x, base); ctx.rotate(o.tilt || 0);
    ctx.globalAlpha *= o.alpha ?? 1;
    shadow(ctx, 0, 2, 132 * k * (1.1 - 0.1 * sq), 9 * k, 0.16);
    ctx.save(); ctx.scale(k * (1 + (1 - sq) * 0.6), k * sq);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const { Hb, Wt, Wb } = SAC, inch = 26 * m;               // as bochechas cheias estufam os lados de baixo
    const corpo = () => {
      ctx.beginPath(); ctx.moveTo(-Wt / 2, -Hb); ctx.lineTo(Wt / 2, -Hb);
      ctx.bezierCurveTo(Wt / 2 + 4, -Hb * 0.55, Wb / 2 + inch * 1.3, -Hb * 0.32, Wb / 2, 0);
      ctx.lineTo(-Wb / 2, 0);
      ctx.bezierCurveTo(-Wb / 2 - inch * 1.3, -Hb * 0.32, -Wt / 2 - 4, -Hb * 0.55, -Wt / 2, -Hb); ctx.closePath();
    };
    duasPassadas(ctx, o.contorno ?? 2.4, (F, S, silhueta) => {
      for (const dx of [-56, 56]) { ctx.beginPath(); ctx.moveTo(dx - 30, -Hb + 6); ctx.bezierCurveTo(dx - 30, -Hb - 80, dx + 30, -Hb - 80, dx + 30, -Hb + 6); S(C.coralDark, 14); }
      corpo(); F(C.papel);
      if (silhueta) return;
      // a faixa coral (no papel) e as dobrinhas do papel
      ctx.save(); corpo(); ctx.clip();
      ctx.fillStyle = C.coral; ctx.fillRect(-Wb, -Hb, 2 * Wb, SAC.band);
      ctx.strokeStyle = css(C.cremeDeep, 0.7); ctx.lineWidth = 3;
      for (const dx of [-0.36, 0.36]) { ctx.beginPath(); ctx.moveTo(dx * Wt, -Hb + SAC.band); ctx.lineTo(dx * Wb * 1.04, -6); ctx.stroke(); }
      ctx.restore();
      // as bochechas
      const bc = 0.3 + 0.5 * m + 0.2 * sus;
      ctx.fillStyle = css(C.coral, bc); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * (84 + 10 * m), SAC.mouthY - 18, 22 + 8 * m, 13 + 5 * m, 0, 0, TAU); ctx.fill(); }
      // os olhinhos (como os das lojinhas: branco, contorno tinta, pupila com brilho); no suspiro, fechados e felizes
      const bl = Math.max(o.blink || 0, sus > 0.5 ? 1 : 0), fel = sus > 0.5 || m > 0.5;
      [-46, 46].forEach((ex, i) => {
        const cy = SAC.eyeY + 2;
        if (fel) {
          ctx.strokeStyle = C.tinta; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(ex, cy + 8, 18, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
          return;
        }
        const ry = Math.max(3, 25 * (1 - 0.92 * bl));
        ctx.beginPath(); ctx.ellipse(ex, cy, 25, ry, 0, 0, TAU); ctx.fillStyle = C.branco; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.tinta; ctx.stroke();
        if (bl < 0.7) {
          ctx.save(); ctx.beginPath(); ctx.ellipse(ex, cy, 25, ry, 0, 0, TAU); ctx.clip();
          ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(ex + (i ? -3 : 3) + lk[0] * 9, cy + 3 + lk[1] * 7, 12, 0, TAU); ctx.fill();
          ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(ex + (i ? -7 : -1) + lk[0] * 9, cy - 3 + lk[1] * 7, 4.5, 0, TAU); ctx.fill();
          ctx.restore();
        }
      });
      // as sobrancelhas (na faixa coral)
      ctx.strokeStyle = C.tinta; ctx.lineWidth = 6;
      const sob = -8 * bo;                                  // sobem quando a boca abre
      ctx.beginPath(); ctx.moveTo(-66, SAC.eyeY - 32 + sob); ctx.quadraticCurveTo(-46, SAC.eyeY - 44 + sob, -26, SAC.eyeY - 36 + sob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, SAC.eyeY - 36 + sob); ctx.quadraticCurveTo(46, SAC.eyeY - 44 + sob, 66, SAC.eyeY - 32 + sob); ctx.stroke();
      // a boca (sempre ABAIXO da logo)
      const my = SAC.mouthY;
      if (bo > 0.04) {
        const mw = 34 + 54 * bo, mh = 8 + 50 * bo, y0 = my - 6 - 14 * bo;
        ctx.beginPath(); ctx.moveTo(-mw, y0); ctx.quadraticCurveTo(0, y0 - 10 * bo, mw, y0); ctx.quadraticCurveTo(mw * 0.9, y0 + mh * 1.25, 0, y0 + mh * 1.3); ctx.quadraticCurveTo(-mw * 0.9, y0 + mh * 1.25, -mw, y0); ctx.closePath();
        ctx.fillStyle = '#3A1F17'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.tinta; ctx.stroke();
        ctx.save(); ctx.clip();
        ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.ellipse(0, y0 + mh * 1.2, mw * 0.5, mh * 0.45, 0, 0, TAU); ctx.fill();   // a linguinha
        ctx.fillStyle = C.branco; for (const tx of [-mw * 0.32, mw * 0.32]) { rr(ctx, tx - 11, y0 - 8, 22, 12 + 10 * bo, 4); ctx.fill(); }   // os dentinhos
        ctx.restore();
      } else if (m > 0.05) {
        // mastigando: a boca fechada que mexe de um lado pro outro
        const mv = Math.sin(t * 22) * 8 * m;
        ctx.strokeStyle = C.tinta; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-30 + mv, my); ctx.quadraticCurveTo(-10 + mv, my + 12 + 6 * Math.sin(t * 22 + 1), 8 + mv, my + 2); ctx.quadraticCurveTo(22 + mv, my + 12, 32 + mv, my - 2); ctx.stroke();
      } else if (sus > 0.05) {
        ctx.fillStyle = '#3A1F17'; ctx.beginPath(); ctx.ellipse(0, my + 2, 13 * sus + 4, 16 * sus + 4, 0, 0, TAU); ctx.fill();
      } else {
        ctx.strokeStyle = C.tinta; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-36, my - 4); ctx.quadraticCurveTo(0, my + 24, 36, my - 4); ctx.stroke();
      }
      // o palito de dente no canto da boca, balançando
      const pl = clamp(o.palito || 0);
      if (pl > 0.02) {
        const ang = -0.45 + 0.22 * Math.sin(t * 9), cx0 = dir * 30, L_ = 74 * pl;
        ctx.strokeStyle = C.madeira; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx0, my + 2); ctx.lineTo(cx0 + dir * Math.cos(ang) * L_, my + 2 + Math.sin(ang) * L_); ctx.stroke();
      }
    });
    ctx.restore();
    // a logo oficial: só translada e acompanha a inclinação, com escala uniforme (nunca achatada nem espelhada)
    logo(ctx, 0, SAC.logoY * k * sq, SAC.logoD * k);
    ctx.restore();
  }
  // onde fica a logo da sacola na tela (para nada pousar em cima dela)
  const logoSacola = (x, base, s, sq = 1) => { const k = s / SAC.Hb; return { x, y: base + SAC.logoY * k * sq, r: SAC.logoD * k / 2 + 6 }; };

  // ---- o bonequinho do ep04 (de pijama listrado): como os bonequinhos da visita, com cara de sono, bocejo, susto,
  //      felicidade e espreguiçada. (x, base) = o chão (ou o assento); h = altura. o: olhos ('sono' | 'susto' | 'feliz' | 'normal'),
  //      boceja 0..1, sorriso 0..1, bracos 0..1 (0 = caídos, 1 = esticados para cima), cobertor 0..1 (enrolado no
  //      cobertor, com capuz), descabelado 0..1 (o cabelo em pé do susto), look, blink, box
  const ZE = { pele: '#E8B48C', cabelo: '#5E2C12', pijama: '#8FC1E3', pijamaEsc: '#5E95C2', coberta: C.amarelo, cobertaEsc: C.amareloDark };
  function ze(ctx, x, base, h, t, o = {}) {
    const cab = h * 0.2, by = base - h + cab * 2, cx = x, cy = by - cab * 0.85;
    const up = clamp(o.bracos || 0), cob = clamp(o.cobertor || 0);
    ctx.save();
    if (!o.semSombra) shadow(ctx, x, base, h * 0.28, 7, 0.14);
    ctx.lineCap = 'round';
    // os braços (atrás do corpo quando esticados para cima)
    const braco = (sx) => {
      const ox = x + sx * h * 0.17, oy = by + h * 0.1;
      const hx = lerp(x + sx * h * 0.28, x + sx * h * 0.24, up), hy = lerp(by + h * 0.32, by - h * 0.36, up);
      ctx.strokeStyle = ZE.pijama; ctx.lineWidth = h * 0.075; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(lerp(ox + sx * h * 0.08, ox + sx * h * 0.14, up), lerp(oy + h * 0.1, oy - h * 0.2, up), hx, hy); ctx.stroke();
      ctx.fillStyle = ZE.pele; ctx.beginPath(); ctx.arc(hx, hy, h * 0.045, 0, TAU); ctx.fill();
    };
    if (cob < 0.5) { braco(-1); braco(1); }
    if (cob > 0) {                                          // o capuz do cobertor, atrás da cabeça
      ctx.fillStyle = ZE.coberta; ctx.beginPath(); ctx.arc(cx, cy - cab * 0.05, cab * 1.38, 0, TAU); ctx.fill();
    }
    // o corpo de pijama listrado
    if (cob < 1) {
      ctx.save(); rr(ctx, x - h * 0.2, by, h * 0.4, base - by, h * 0.18); ctx.fillStyle = ZE.pijama; ctx.fill(); ctx.clip();
      ctx.strokeStyle = css(ZE.pijamaEsc, 0.55); ctx.lineWidth = h * 0.035;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * h * 0.075, by); ctx.lineTo(x + i * h * 0.075, base); ctx.stroke(); }
      ctx.fillStyle = C.branco; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, by + h * (0.08 + i * 0.1), h * 0.014, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // a cabeça
    ctx.fillStyle = ZE.pele; ctx.beginPath(); ctx.arc(cx, cy, cab, 0, TAU); ctx.fill();
    ctx.fillStyle = ZE.cabelo;
    if (cob < 0.5) {
      ctx.beginPath(); ctx.arc(cx, cy - cab * 0.1, cab * 1.03, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      const dsc = clamp(o.descabelado || 0);                // o topete (em pé no susto)
      for (const [dx, a] of [[-0.35, -0.5], [0, 0], [0.35, 0.5]]) {
        ctx.save(); ctx.translate(cx + dx * cab, cy - cab * 0.95); ctx.rotate(a * (0.4 + 0.6 * dsc));
        ctx.beginPath(); ctx.moveTo(-cab * 0.16, 0); ctx.lineTo(0, -cab * (0.28 + 0.45 * dsc)); ctx.lineTo(cab * 0.16, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // o rosto
    const lk = o.look || [0, 0], ex = cab * 0.36, olh = o.olhos || 'normal', bc = clamp(o.boceja || 0);
    ctx.fillStyle = css(C.coral, 0.3); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sx * cab * 0.56, cy + cab * 0.3, cab * 0.18, cab * 0.11, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = C.tinta; ctx.strokeStyle = C.tinta; ctx.lineWidth = cab * 0.09;
    [-1, 1].forEach((sx) => {
      const exx = cx + sx * ex + lk[0] * cab * 0.12, eyy = cy - cab * 0.08 + lk[1] * cab * 0.08;
      if (olh === 'sono' || bc > 0.35) {                    // de olho fechado (sono ou no meio do bocejo), com a olheira
        ctx.beginPath(); ctx.moveTo(exx - cab * 0.15, eyy); ctx.quadraticCurveTo(exx, eyy + cab * 0.08, exx + cab * 0.15, eyy); ctx.stroke();
        ctx.save(); ctx.strokeStyle = css('#9C6B8A', 0.45); ctx.lineWidth = cab * 0.05; ctx.beginPath(); ctx.arc(exx, eyy + cab * 0.06, cab * 0.14, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); ctx.restore();
      } else if (olh === 'feliz') {
        ctx.beginPath(); ctx.arc(exx, eyy + cab * 0.06, cab * 0.14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else if (olh === 'susto') {
        ctx.save(); ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(exx, eyy, cab * 0.22, 0, TAU); ctx.fill(); ctx.lineWidth = cab * 0.06; ctx.stroke(); ctx.restore();
        ctx.beginPath(); ctx.arc(exx + lk[0] * cab * 0.06, eyy + lk[1] * cab * 0.06, cab * 0.08, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(exx - cab * 0.2, eyy - cab * 0.38); ctx.lineTo(exx + cab * 0.16, eyy - cab * 0.46); ctx.stroke();   // as sobrancelhas lá em cima
      } else {
        const bl = o.blink || 0;
        ctx.beginPath(); ctx.ellipse(exx, eyy, cab * 0.1, cab * 0.13 * (1 - 0.9 * bl), 0, 0, TAU); ctx.fill();
      }
    });
    // a boca: bocejo (o "O" grande, com a linguinha), susto (o "o") ou sorriso
    if (bc > 0.05) {
      ctx.fillStyle = '#5A2A1A'; ctx.beginPath(); ctx.ellipse(cx, cy + cab * 0.42, cab * (0.12 + 0.1 * bc), cab * (0.08 + 0.3 * bc), 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.ellipse(cx, cy + cab * (0.42 + 0.2 * bc), cab * 0.1 * bc + 1, cab * 0.08 * bc + 1, 0, 0, TAU); ctx.fill();
    } else if (olh === 'susto') {
      ctx.fillStyle = '#5A2A1A'; ctx.beginPath(); ctx.ellipse(cx, cy + cab * 0.42, cab * 0.12, cab * 0.16, 0, 0, TAU); ctx.fill();
    } else if (olh === 'sono') {
      ctx.beginPath(); ctx.moveTo(cx - cab * 0.16, cy + cab * 0.4); ctx.lineTo(cx + cab * 0.16, cy + cab * 0.38); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy + cab * 0.22, cab * (0.28 + 0.1 * (o.sorriso || 0)), 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    // o cobertor: a borda do capuz na testa e o corpo enrolado (xadrez), por cima do pijama
    if (cob > 0) {
      ctx.save(); ctx.globalAlpha *= cob;
      ctx.strokeStyle = ZE.coberta; ctx.lineWidth = cab * 0.36; ctx.beginPath(); ctx.arc(cx, cy + cab * 0.05, cab * 1.12, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - cab * 1.25, cy + cab * 0.55); ctx.quadraticCurveTo(x - h * 0.34, base - h * 0.25, x - h * 0.3, base);
      ctx.lineTo(x + h * 0.3, base); ctx.quadraticCurveTo(x + h * 0.34, base - h * 0.25, x + cab * 1.25, cy + cab * 0.55);
      ctx.quadraticCurveTo(x, cy + cab * 1.25, x - cab * 1.25, cy + cab * 0.55); ctx.closePath();
      ctx.fillStyle = ZE.coberta; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = css(ZE.cobertaEsc, 0.8); ctx.lineWidth = h * 0.03;
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * h * 0.08, cy); ctx.lineTo(x + i * h * 0.08, base); ctx.stroke(); }
      ctx.strokeStyle = css(C.coral, 0.55); ctx.lineWidth = h * 0.022;
      for (let j = 0; j < 6; j++) { const yy = cy + cab * 1.2 + j * h * 0.09; ctx.beginPath(); ctx.moveTo(x - h * 0.4, yy); ctx.lineTo(x + h * 0.4, yy); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
    if (o.box) BOX(o.box, x - h * (cob > 0 ? 0.36 : 0.32), base - h - cab * (0.4 + 0.5 * (o.descabelado || 0)) - (up > 0.1 ? h * 0.25 * up : 0), x + h * (cob > 0 ? 0.36 : 0.32), base);
  }

  // ---- a geladeira: (x, base) = o chão no meio; w × h. o: abre 0..1 (a porta gira na dobradiça da esquerda e mostra o
  //      lado de dentro), fresta 0..1 (entreaberta, com a luz escapando), luz 0..1, dentro(ix0, iy0, ix1, iy1, prateleiras)
  //      desenha o conteúdo (por trás da porta)
  function geladeira(ctx, x, base, w, h, o = {}) {
    const x0 = x - w / 2, top = base - h, ab = clamp(o.abre || 0), fr = clamp(o.fresta || 0), luz = clamp(o.luz ?? Math.max(ab, fr));
    ctx.save();
    shadow(ctx, x, base, w * 0.6, 9, 0.14);
    ctx.fillStyle = C.tinta2; rr(ctx, x0 + w * 0.08, base - 10, w * 0.14, 10, 3); ctx.fill(); rr(ctx, x0 + w * 0.78, base - 10, w * 0.14, 10, 3); ctx.fill();   // os pezinhos
    ctx.fillStyle = '#E9E3DA'; rr(ctx, x0, top, w, h - 8, w * 0.08); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    // o vão de dentro (iluminado quando abre)
    const ix0 = x0 + w * 0.06, ix1 = x0 + w * 0.94, iy0 = top + w * 0.06, iy1 = base - 8 - w * 0.06;
    ctx.fillStyle = mixHex('#6E6158', '#FFF4CF', luz); rr(ctx, ix0, iy0, ix1 - ix0, iy1 - iy0, w * 0.05); ctx.fill();
    const prat = [iy0 + (iy1 - iy0) * 0.27, iy0 + (iy1 - iy0) * 0.53, iy0 + (iy1 - iy0) * 0.79];
    ctx.fillStyle = css(C.branco, 0.85); prat.forEach((py) => { rr(ctx, ix0 + 4, py, ix1 - ix0 - 8, 7, 3); ctx.fill(); });
    if (o.dentro) o.dentro(ix0, iy0, ix1, iy1, prat);
    // a luz que escapa
    if (luz > 0.01) {
      const g = ctx.createRadialGradient(x, top + h * 0.35, 10, x, top + h * 0.35, w * 1.25);
      g.addColorStop(0, css('#FFE48A', 0.38 * luz)); g.addColorStop(1, css('#FFE48A', 0));
      ctx.fillStyle = g; ctx.fillRect(x - w * 1.3, top - h * 0.2, w * 2.6, h * 1.25);
    }
    // a porta (dobradiça à esquerda): a borda solta vai de x0 + w (fechada) até passar da dobradiça (aberta, mostra o lado de dentro)
    const a = Math.max(E.outCubic(ab), 0.16 * fr), free = lerp(x0 + w, x0 - w * 0.3, a), sk = 22 * Math.sin(Math.PI * Math.min(1, a * 1.1)) * (free > x0 ? 0.6 : 1);
    const lado = free > x0;
    if (fr > 0 && ab < 0.05) {                               // entreaberta: a luzinha amarela escapando pela fresta (no máx. 30 px para fora)
      const gx = x0 + w, gl = ctx.createLinearGradient(free, 0, gx + 30, 0);
      gl.addColorStop(0, css('#FFD95A', 0.95)); gl.addColorStop(1, css('#FFD95A', 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(free, top + 8); ctx.lineTo(gx + 30, top - 20); ctx.lineTo(gx + 30, base + 4); ctx.lineTo(free, base - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFE48A'; ctx.fillRect(free, top + 10, gx - free - 4, h - 30);
    }
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(free, top - sk); ctx.lineTo(free, base - 8 + sk); ctx.lineTo(x0, base - 8); ctx.closePath();
    ctx.fillStyle = lado ? '#F4F0EA' : '#E0D8CC'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    if (lado) {
      // o lado de fora: a linha do congelador e o puxador perto da borda solta
      const fw = free - x0;
      ctx.strokeStyle = C.cremeDeep; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 + 2, top + h * 0.3); ctx.lineTo(free - 2, top + h * 0.3 - sk * 0.4); ctx.stroke();
      ctx.fillStyle = C.cinza; for (const [y0_, y1_] of [[0.12, 0.24], [0.36, 0.56]]) rr(ctx, free - Math.min(30, fw * 0.16) - 10, top + h * y0_, 10, h * (y1_ - y0_), 5), ctx.fill();
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(x0 + fw * 0.3, top + h * 0.15, Math.min(14, fw * 0.06), 0, TAU); ctx.fill();   // o ímã
    } else {
      // o lado de dentro da porta: as prateleirinhas
      ctx.fillStyle = css(C.branco, 0.8); for (const f of [0.3, 0.55, 0.8]) rr(ctx, free + 6, top + h * f, x0 - free - 12, 8, 3), ctx.fill();
    }
    ctx.restore();
  }

  // ---- o calendário de mesa (folhinha) com "SEG": a folha presa num aro só, caindo de lado. (x, base) = o pé; cai 0..1
  function calendario(ctx, x, base, s, t, o = {}) {
    const k = s / 100, cai = o.cai ?? 0.3;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    shadow(ctx, 0, 0, 62, 7, 0.14);
    ctx.fillStyle = C.madeiraDark; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(-44, -112); ctx.lineTo(44, -112); ctx.lineTo(58, 0); ctx.closePath(); ctx.fill();   // o cavalete
    ctx.fillStyle = C.coral; rr(ctx, -60, -132, 120, 30, 9); ctx.fill();                                                                 // a capa de cima
    // a folha do "SEG" (presa só no aro da esquerda, pendendo)
    const ang = (6 + 16 * cai) * DEG + 0.04 * Math.sin(t * 2.2) * (0.4 + cai);
    ctx.save(); ctx.translate(-34, -110); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(80,40,20,0.15)'; rr(ctx, -16, 6, 120, 116, 10); ctx.fill();
    ctx.fillStyle = C.branco; rr(ctx, -20, 0, 120, 116, 10); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    ctx.fillStyle = css(C.coral, 0.15); rr(ctx, -20, 0, 120, 26, 10); ctx.fill();
    txt(ctx, 'SEG', 40, 82, { size: 46, weight: 900, align: 'center', color: C.coral });
    ctx.strokeStyle = css(C.cinza, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, 96); ctx.lineTo(66, 96); ctx.stroke();
    ctx.restore();
    for (const ax of [-34, 34]) { ctx.strokeStyle = C.tinta2; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ax, -112, 8, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke(); }   // os aros
    ctx.restore();
    if (o.box) BOX(o.box, x - 64 * k, base - 140 * k, x + 108 * k, base);
  }

  // ---- os itens do ep04 (sem marca): limão, pote de sorvete (com feijão), pacote de arroz, de feijão, de café, caixa de ovos, verdura
  function itemLimao(ctx, x, y, s) {
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#C9D84A'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 31, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B3C43A'; ctx.beginPath(); ctx.ellipse(38, -6, 8, 6, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = css(C.branco, 0.5); ctx.beginPath(); ctx.ellipse(-12, -12, 12, 6, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.ellipse(-30, -30, 18, 8, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function potePote(ctx, x, base, s, aberto, t) {         // o pote de sorvete (rótulo de sorvete, sem marca); aberto 0..1 mostra o feijão
    const k = s / 100;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    ctx.fillStyle = C.branco; ctx.beginPath(); ctx.moveTo(-46, -70); ctx.lineTo(46, -70); ctx.lineTo(38, 0); ctx.lineTo(-38, 0); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
    ctx.fillStyle = '#F7B6C2'; ctx.beginPath(); ctx.moveTo(-43, -48); ctx.lineTo(43, -48); ctx.lineTo(40, -22); ctx.lineTo(-40, -22); ctx.closePath(); ctx.fill();
    // a casquinha desenhada no rótulo
    ctx.fillStyle = C.madeira; ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(9, -36); ctx.lineTo(0, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.coralLight; ctx.beginPath(); ctx.arc(0, -40, 9, 0, TAU); ctx.fill();
    if (aberto > 0) {                                        // o feijão lá dentro
      ctx.fillStyle = '#5A2E1E'; ctx.beginPath(); ctx.ellipse(0, -70, 46, 11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7A3E26'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-34 + i * 8.5, -71 + 4 * Math.sin(i * 2.1), 5, 3.4, i, 0, TAU); ctx.fill(); }
    }
    // a tampa: pula e fica de lado
    const tp = E.outBack(clamp(aberto), 2);
    ctx.save(); ctx.translate(lerp(0, 58, tp), lerp(-72, -118, Math.sin(Math.PI * Math.min(1, aberto * 1.4))) + lerp(0, 40, tp)); ctx.rotate(lerp(0, 0.9, tp));
    ctx.fillStyle = '#F7B6C2'; rr(ctx, -50, -10, 100, 14, 6); ctx.fill(); ctx.fillStyle = css(C.branco, 0.6); rr(ctx, -40, -8, 80, 4, 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function pacote(ctx, x, y, s, cor, faixa, janela) {        // um pacote em pé (arroz, feijão, café): papel, faixa e a janelinha
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(80,40,20,0.15)'; rr(ctx, -32, -44, 70, 96, 10); ctx.fill();
    ctx.fillStyle = cor; rr(ctx, -36, -48, 72, 96, 10); ctx.fill();
    ctx.fillStyle = faixa; ctx.fillRect(-36, -18, 72, 22);
    ctx.fillStyle = css(C.tinta, 0.18); ctx.beginPath(); ctx.moveTo(-36, -48); ctx.lineTo(36, -48); ctx.lineTo(30, -58); ctx.lineTo(-30, -58); ctx.closePath(); ctx.fill();   // a dobra de cima
    janela(ctx);
    ctx.restore();
  }
  function itemArroz(ctx, x, y, s) {
    pacote(ctx, x, y, s, C.branco, C.amarelo, (c) => {
      c.fillStyle = '#F6F1E6'; rr(c, -22, 12, 44, 28, 8); c.fill(); c.strokeStyle = C.cremeDeep; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#E8DFCB'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(-14 + (i % 4) * 9, 20 + Math.floor(i / 4) * 10, 3.5, 1.8, i, 0, TAU); c.fill(); }
    });
  }
  function itemFeijaoPac(ctx, x, y, s) {
    pacote(ctx, x, y, s, '#F3E3C8', C.coral, (c) => {
      c.fillStyle = '#FFF6E6'; rr(c, -22, 12, 44, 28, 8); c.fill();
      c.fillStyle = '#6B3420'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(-14 + (i % 4) * 9, 20 + Math.floor(i / 4) * 10, 4, 2.6, i, 0, TAU); c.fill(); }
    });
  }
  function itemCafe(ctx, x, y, s) {
    pacote(ctx, x, y, s, '#8A5A3A', C.amarelo, (c) => {
      c.fillStyle = '#5A3420'; for (const [bx, by] of [[-10, 24], [10, 26]]) { c.beginPath(); c.ellipse(bx, by, 9, 12, 0.4, 0, TAU); c.fill(); c.strokeStyle = '#B98A5E'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 3, by - 9); c.quadraticCurveTo(bx + 4, by, bx - 2, by + 9); c.stroke(); }
    });
  }
  function itemOvos(ctx, x, y, s) {                           // a caixa de ovos aberta, com 3 ovinhos aparecendo
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#D9CBB4'; rr(ctx, -52, -4, 104, 34, 8); ctx.fill();
    ctx.fillStyle = '#E8DCC8'; rr(ctx, -52, -30, 104, 12, 6); ctx.fill();
    for (const ex of [-30, 0, 30]) { ctx.fillStyle = '#F6E7D2'; ctx.beginPath(); ctx.ellipse(ex, -10, 14, 18, 0, 0, TAU); ctx.fill(); ctx.fillStyle = css(C.branco, 0.7); ctx.beginPath(); ctx.ellipse(ex - 4, -16, 4, 6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#D9CBB4'; rr(ctx, -52, 0, 104, 30, 8); ctx.fill();
    ctx.strokeStyle = css(C.tinta, 0.15); ctx.lineWidth = 3; for (const ex of [-17, 17]) { ctx.beginPath(); ctx.moveTo(ex, 4); ctx.lineTo(ex, 26); ctx.stroke(); }
    ctx.restore();
  }
  function itemVerdura(ctx, x, y, s) {                        // o maço de couve/alface
    const k = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.verdeDark; ctx.beginPath(); ctx.ellipse(-20, -6, 22, 40, -0.4, 0, TAU); ctx.ellipse(20, -6, 22, 40, 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.ellipse(0, -12, 24, 46, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.verdeLight; ctx.beginPath(); ctx.ellipse(0, -16, 10, 34, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(C.branco, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(0, -46); ctx.stroke();
    ctx.fillStyle = C.coral; rr(ctx, -16, 22, 32, 10, 4); ctx.fill();   // o elástico
    ctx.restore();
  }
  Object.assign(ITENS, { limao: itemLimao, arroz: itemArroz, feijao: itemFeijaoPac, cafe: itemCafe, ovos: itemOvos, verdura: itemVerdura });

  // ---- a nuvem cinza (só em cima dele), com chuvisco; vira sol quando sol 0..1
  function nuvemCinza(ctx, x, y, s, t, o = {}) {
    const k = s / 100, sol = clamp(o.sol || 0), e = clamp(o.e ?? 1);
    if (e <= 0.002) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k * E.outBack(e, 2), k * E.outBack(e, 2));
    if (sol < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - sol; ctx.scale(1 - 0.5 * sol, 1 - 0.5 * sol);
      ctx.strokeStyle = css('#7C8FA6', 0.7); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i * 0.37) % 1, dx = -50 + i * 25; ctx.globalAlpha = (1 - sol) * Math.sin(Math.PI * ph); ctx.beginPath(); ctx.moveTo(dx - 4 * ph, 30 + ph * 70); ctx.lineTo(dx - 4 * ph - 4, 44 + ph * 70); ctx.stroke(); }
      ctx.globalAlpha = 1 - sol;
      ctx.fillStyle = '#A7A3A6'; ctx.beginPath(); ctx.arc(-38, 6, 30, 0, TAU); ctx.arc(0, -10, 40, 0, TAU); ctx.arc(40, 6, 30, 0, TAU); ctx.fill();
      rr(ctx, -68, 0, 136, 34, 17); ctx.fill();
      ctx.fillStyle = css('#C9C5C7', 0.8); ctx.beginPath(); ctx.arc(-6, -20, 18, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (sol > 0) {                                           // o sol sorrindo
      ctx.save(); ctx.scale(E.outBack(sol, 2.4), E.outBack(sol, 2.4)); ctx.rotate(t * 0.6);
      ctx.fillStyle = C.amarelo; for (let i = 0; i < 10; i++) { ctx.save(); ctx.rotate(i * TAU / 10); rr(ctx, -7, -78, 14, 24, 7); ctx.fill(); ctx.restore(); }
      ctx.rotate(-t * 0.6);
      ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fillStyle = C.amareloLight; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.amarelo; ctx.stroke();
      ctx.strokeStyle = C.tinta; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 15, -4, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 8, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  // o "Zzz" subindo
  function zzz(ctx, x, y, t, e) {
    if (e <= 0.002) return;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3) % 1, a = Math.sin(Math.PI * ph) * e;
      txt(ctx, 'Z', x + 50 * ph + 12 * Math.sin(ph * 6 + i), y - 170 * ph, { size: 40 + 26 * ph, weight: 900, align: 'center', color: css(C.tinta2, a) });
    }
  }
  // o grilinho cantando (verde, com as notinhas)
  function grilo(ctx, x, base, s, t) {
    const k = s / 100, canta = Math.max(0, Math.sin(t * 9)) > 0.6;
    ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
    ctx.strokeStyle = C.verdeDark; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [lx, ly] of [[-22, 0], [-4, 0], [14, 0]]) { ctx.beginPath(); ctx.moveTo(lx, -16); ctx.lineTo(lx - 8, ly); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(-38, -46); ctx.lineTo(-44, 0); ctx.stroke();               // a pernona de trás
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.ellipse(-6, -22, 30, 13, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = C.verdeLight; ctx.beginPath(); ctx.ellipse(-10, -27 - (canta ? 4 : 0), 22, 7, -0.25 - (canta ? 0.2 : 0), 0, TAU); ctx.fill();   // a asinha que vibra
    ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(26, -26, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = C.tinta; ctx.beginPath(); ctx.arc(30, -29, 3.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.verdeDark; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(30, -36); ctx.quadraticCurveTo(44, -70, 66, -62); ctx.moveTo(26, -37); ctx.quadraticCurveTo(30, -74, 48, -78); ctx.stroke();
    // as notinhas
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.8 + i * 0.5) % 1, a = Math.sin(Math.PI * ph);
      const nx = 40 + 30 * ph + i * 16, ny = -60 - 70 * ph;
      ctx.fillStyle = css(C.verdeDark, a); ctx.strokeStyle = css(C.verdeDark, a); ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(nx, ny, 8, 6, -0.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(nx + 7, ny - 2); ctx.lineTo(nx + 7, ny - 30); ctx.quadraticCurveTo(nx + 14, ny - 22, nx + 20, ny - 20); ctx.stroke();
    }
    ctx.restore();
  }
  // o "?!" num balão coral
  function susto(ctx, x, y, r, e, t, t0) {
    if (e <= 0.002) return;
    const k = E.outBack(e, 2.6) * (1 + 0.06 * Math.sin((t - t0) * 7));
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); ctx.scale(k, k);
    ctx.beginPath(); for (let j = 0; j <= 20; j++) { const a = j / 20 * TAU, r2 = j % 2 ? r * 0.82 : r; ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); }
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = C.branco; ctx.stroke(); ctx.fillStyle = C.coral; ctx.fill();
    txt(ctx, '?!', 0, r * 0.36, { size: r * 1.05, weight: 900, align: 'center', color: C.branco });
    ctx.restore();
  }

  // ===================== cenas do ep04 ("Segunda sem coragem")

  // a capa da segunda-feira (ep04): no quadro 0 o calendário com o "SEG" caindo, o bonequinho enrolado no cobertor
  // (com sono) e a geladeira entreaberta (com a luzinha) já estão na tela
  CENAS.capa.segunda = function (ctx, cap, t) {
    const Ly = cap.Ly, ev = cap.ev, B = Ly.bottom;
    // o "SEG" despenca mais um pouco na palavra (e balança)
    const cai = 0.35 + 0.65 * E.outBack(p(t, ev.cal, ev.cal + 0.5), 2.2);
    calendario(ctx, 225, B, 150, t, { cai, box: 'calendário' });
    // o bonequinho no cobertor: boceja na palavra (e de novo, de tempos em tempos)
    const boc = (x0) => Math.sin(Math.PI * p(t, x0, x0 + 1.1));
    const bc = Math.max(boc(ev.bocejo), ...ev.bocejos.map(boc));
    ze(ctx, 530, B, 300, t, { cobertor: 1, olhos: 'sono', boceja: bc, box: 'bonequinho' });
    // a geladeira entreaberta (a porta abre mais um tiquinho na palavra)
    const fr = 1 + 0.6 * Math.sin(Math.PI * p(t, ev.geladeira, ev.geladeira + 0.6));
    geladeira(ctx, 800, B, 180, 300, { fresta: fr * 0.62, luz: 1 });
    BOX('geladeira', 800 - 94, B - 302, 800 + 94, B);
  };

  // ---- geladeira: abre com luz e revela, no tempo da voz, o limão solitário, o meio queijo e o pote de sorvete…
  //      que abre e mostra o feijão ("?!" e o bonequinho levando susto); o grilinho canta na geladeira vazia
  CENAS.geladeira = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.abre = at(cap, d.abre.em, cap.t0 + 0.3);
      ev.limao = Math.max(at(cap, d.limao.em, ev.abre + 0.6), ev.abre + 0.45);
      ev.queijo = Math.max(at(cap, d.queijo.em, ev.limao + 0.5), ev.limao + 0.3);
      ev.sorvete = Math.max(at(cap, d.sorvete.em, ev.queijo + 0.5), ev.queijo + 0.3);
      ev.feijao = Math.max(at(cap, d.feijao.em, ev.sorvete + 0.6), ev.sorvete + 0.45);
      cue(ev.abre, 'door'); cue(ev.abre + 0.12, 'light');
      cue(ev.limao, 'pop', { f: 620 }); cue(ev.queijo, 'pop', { f: 700 }); cue(ev.sorvete, 'pop', { f: 780 });
      cue(ev.feijao, 'question'); cue(ev.feijao + 0.08, 'jump');
      for (let tk = ev.abre + 0.5; tk < cap.t1 - 0.3; tk += 1.1) cue(tk, 'grilo');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const GX = 360, GW = 300, GB = PE - 10, GH = Math.min(600, GB - T - 24);
      const ab = E.outCubic(p(t, ev.abre, ev.abre + 0.55)), sus = t >= ev.feijao;
      const eg = ent(t, cap.t0 + 0.1, 0.45);
      let potY = 0;
      enter(ctx, eg, GX, GB, () => {
        geladeira(ctx, GX, GB, GW, GH, { abre: ab, dentro: (ix0, iy0, ix1, iy1, prat) => {
          potY = prat[2];
          pop(ctx, p(t, ev.limao, ev.limao + 0.35), GX - 20, prat[0], () => itemLimao(ctx, GX - 20, prat[0] - 30, 92), 2.4);
          pop(ctx, p(t, ev.queijo, ev.queijo + 0.35), GX + 40, prat[1], () => itemQueijo(ctx, GX + 30, prat[1] - 40, 118), 2.4);
          pop(ctx, p(t, ev.sorvete, ev.sorvete + 0.35), GX + 60, prat[2], () => potePote(ctx, GX + 58, prat[2], 124, p(t, ev.feijao - 0.05, ev.feijao + 0.4), t), 2.4);
          if (ab > 0.5) grilo(ctx, GX - 86, prat[2], 80, t);
        } });
      });
      if (eg >= 1) BOX('geladeira', GX - GW / 2 - (ab > 0.5 ? GW * 0.3 : 0), GB - GH, GX + GW / 2, GB);
      // o "?!" do feijão (por cima, ao lado do pote)
      susto(ctx, GX + 150, (potY || GB - 150) - 150, 52, p(t, ev.feijao, ev.feijao + 0.3), t, ev.feijao);
      // o bonequinho de pijama olhando a geladeira (no feijão: o susto, com o cabelo em pé e um pulinho)
      const ez = ent(t, cap.t0 + 0.2, 0.45), pulo = 46 * Math.sin(Math.PI * p(t, ev.feijao, ev.feijao + 0.4));
      enter(ctx, ez, 760, PE - 10, () => ze(ctx, 760, PE - 10 - pulo, 330, t, {
        olhos: sus ? 'susto' : 'normal', descabelado: sus ? p(t, ev.feijao, ev.feijao + 0.25) : 0, look: [-0.9, 0.2],
        blink: sus ? 0 : blinkAt(t, 71), sorriso: 0, box: ez >= 1 ? 'bonequinho' : null }));
    },
  };

  // ---- preguica: o bonequinho de pijama afundando no sofá, a nuvem cinza só em cima dele, o "Zzz" e o chinelo
  CENAS.preguica = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.nuvem = at(cap, d.nuvem.em, cap.t0 + 0.3);
      ev.afunda = Math.max(at(cap, d.afunda.em, ev.nuvem + 0.6), ev.nuvem + 0.4);
      ev.zzz = Math.max(at(cap, d.zzz.em, ev.afunda + 0.6), ev.afunda + 0.4);
      ev.chinelo = Math.max(at(cap, d.chinelo.em, ev.zzz + 0.4), ev.zzz + 0.3);
      cue(ev.nuvem, 'whoosh'); cue(ev.afunda, 'flop'); cue(ev.zzz, 'zzz'); cue(ev.chinelo, 'plop');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev;
      const SX = 500, SW = 560, SB = PE - 10, k = SW / 300;
      const es = ent(t, cap.t0 + 0.1, 0.45);
      const sink = 48 * E.outCubic(p(t, ev.afunda, ev.afunda + 0.9)), ZH = 300, zb = SB - 40 * k + sink;
      const cab = ZH * 0.2, headY = zb - ZH + cab * 2 - cab * 0.85, headX = SX + 10;
      enter(ctx, es, SX, SB, () => {
        sofa(ctx, SX, SB, SW);
        // ele, sentado e afundando (o assento cobre a parte de baixo)
        const bc = Math.sin(Math.PI * p(t, ev.zzz - 1.3, ev.zzz - 0.2));
        ze(ctx, headX, zb, ZH, t, { olhos: 'sono', boceja: bc, semSombra: true });
        ctx.save(); ctx.translate(SX, SB); ctx.scale(k, k);
        ctx.fillStyle = C.coralBg; rr(ctx, -112, -66, 224, 48, 18); ctx.fill();
        ctx.strokeStyle = css(C.coralDark, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, -62); ctx.quadraticCurveTo(0, -56 + sink / k * 0.4, 100, -62); ctx.stroke();
        ctx.restore();
        if (es >= 1) BOX('sofá', SX - 154 * k, SB - 150 * k, SX + 154 * k, SB);
      });
      // a nuvem cinza só em cima dele
      const en = p(t, ev.nuvem, ev.nuvem + 0.45);
      nuvemCinza(ctx, headX, headY - 175 + 6 * Math.sin(t * 2), 120, t, { e: en });
      if (en >= 1) BOX('nuvem', headX - 100, headY - 240, headX + 100, headY - 120);
      // o "Zzz"
      zzz(ctx, headX + 120, headY - 40, t, p(t, ev.zzz, ev.zzz + 0.4));
      // os chinelos no chão
      pop(ctx, p(t, ev.chinelo, ev.chinelo + 0.35), 850, SB, () => chinelos(ctx, 850, SB, 92), 2.4);
      if (t >= ev.chinelo + 0.35) BOX('chinelos', 850 - 50, SB - 90, 850 + 50, SB);
    },
  };

  // ---- solucao: as 3 lojinhas (hortifrúti, mercadim, açougue) brotam apagadas e acendem em sequência, acenando
  CENAS.solucao = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.brota = at(cap, d.brota && d.brota.em, cap.t0 + 0.6);
      let prev = ev.brota;
      ev.lojas = d.lojas.map((o) => (prev = Math.max(at(cap, o.em, prev + 0.4), prev + 0.3)));
      [0, 1, 2].forEach((i) => cue(cap.t0 + 0.12 + i * 0.12, 'sprout', { i }));
      cue(ev.brota, 'jump');
      ev.lojas.forEach((x, i) => { cue(x, 'light'); cue(x + 0.05, 'pop', { f: 640 + 120 * i }); });
      cue(ev.lojas[ev.lojas.length - 1] + 0.5, 'shine');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const xs = [210, 510, 810], w = 250, base = PE - 10, lados = [1, 1, -1];
      d.lojas.forEach((o, i) => {
        const lit = E.outCubic(p(t, ev.lojas[i], ev.lojas[i] + 0.35)), x = xs[i];
        // o brilho de quando acende (atrás)
        if (lit > 0) {
          const g = ctx.createRadialGradient(x, base - w * 0.75, 10, x, base - w * 0.75, w * 0.95);
          g.addColorStop(0, css(C.amareloLight, 0.55 * lit)); g.addColorStop(1, css(C.amareloLight, 0));
          ctx.fillStyle = g; ctx.fillRect(x - w, base - w * 1.8, 2 * w, w * 1.8);
        }
        const e = p(t, cap.t0 + 0.1 + i * 0.12, cap.t0 + 0.6 + i * 0.12);
        const festa = t >= ev.brota ? 1 : 0;
        lojinha(ctx, o.tipo, x, base, w, t, { e, lit, smile: lit, altura: 11 + 22 * festa * (1 - lit) + 26 * lit * Math.exp(-Math.max(0, t - ev.lojas[i]) * 2), fase: i * 0.33,
          look: t >= ev.brota && lit < 1 ? [0, 0] : [0, 0.25], seed: 80 + i, box: e >= 1 ? `lojinha ${i + 1}` : null });
        // o bracinho acenando (sai da parede, para cima, só depois de acender)
        if (lit > 0.2) {
          const s = lados[i], ox = x + s * w * 0.4, oy = base - w * 0.62, a = -Math.PI / 2 + s * (0.35 + 0.35 * Math.sin((t - ev.lojas[i]) * 10)), L_ = 62 * clamp((lit - 0.2) / 0.8);
          const col = (LOOK[o.tipo] || LOOK.loja).wallDark;
          ctx.strokeStyle = col; ctx.lineWidth = 13; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * L_, oy + Math.sin(a) * L_); ctx.stroke();
          ctx.fillStyle = C.branco; ctx.beginPath(); ctx.arc(ox + Math.cos(a) * L_, oy + Math.sin(a) * L_, 12, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
        }
        sticker(ctx, i % 2 ? 'coracao' : 'estrela', x + (i === 2 ? -60 : 60), base - w * 1.27 - 70, 52, p(t, ev.lojas[i] + 0.1, ev.lojas[i] + 0.4), t);
      });
    },
  };

  // ---- lista: os itens da compra da semana caindo um a um na sacola da marca (sem marca nenhuma nos produtos)
  CENAS.lista = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      let prev = cap.t0 + 0.2;
      ev.itens = d.itens.map((it) => (prev = Math.max(at(cap, it.em, prev + 0.4), prev + 0.3)));
      ev.sacola = Math.min(cap.t0 + 0.25, ev.itens[0] - 0.3);
      ev.fim = ev.itens[ev.itens.length - 1] + 0.7;
      cue(ev.sacola, 'pop', { f: 460 });
      ev.itens.forEach((x) => { cue(x, 'whoosh'); cue(x + 0.42, 'plop'); });
      cue(ev.fim, 'check'); cue(ev.fim + 0.05, 'confete');
    },
    draw(ctx, cap, t) {
      const d = cap.diagrama, ev = cap.ev, T = cap.cenaTop;
      const S = { x: 510, bot: PE - 20, w: 320, h: 260 }, tp = S.bot - S.h, n = d.itens.length;
      const dxi = (i) => (i - (n - 1) / 2) * 56;
      // as figurinhas e o confete atrás da sacola com a logo
      sticker(ctx, 'estrela', 200, tp + 40, 60, p(t, ev.fim, ev.fim + 0.35), t);
      sticker(ctx, 'coracao', 820, tp + 20, 58, p(t, ev.fim + 0.1, ev.fim + 0.45), t);
      confete(ctx, t, ev.fim + 0.05, S.x, tp - 120, 61, { n: 34, v: 900 });
      const es = ent(t, ev.sacola, 0.45);
      enter(ctx, es, S.x, S.bot, () => {
        ctx.strokeStyle = C.coralDark; ctx.lineWidth = 14; ctx.lineCap = 'round';
        for (const dx of [-70, 70]) { ctx.beginPath(); ctx.moveTo(S.x + dx - 32, tp + 4); ctx.bezierCurveTo(S.x + dx - 32, tp - 80, S.x + dx + 32, tp - 80, S.x + dx + 32, tp + 4); ctx.stroke(); }
        // os itens que já caíram, aparecendo pela boca (atrás da frente)
        d.itens.forEach((it, i) => {
          const tl = ev.itens[i] + 0.42; if (t < tl) return;
          const bq = 10 * Math.sin(Math.PI * p(t, tl, tl + 0.2));
          ITENS[it.tipo](ctx, S.x + dxi(i), tp - 14 - bq + (i % 2) * 8, 104);
        });
        ctx.fillStyle = C.papel; ctx.beginPath(); ctx.moveTo(S.x - S.w / 2, tp); ctx.lineTo(S.x + S.w / 2, tp); ctx.lineTo(S.x + S.w / 2 + 14, S.bot); ctx.lineTo(S.x - S.w / 2 - 14, S.bot); ctx.closePath();
        ctx.shadowColor = 'rgba(120,60,30,0.2)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 3; ctx.strokeStyle = C.cremeDeep; ctx.stroke();
        ctx.fillStyle = C.coral; ctx.fillRect(S.x - S.w / 2, tp, S.w, 30);
        logo(ctx, S.x, tp + 30 + (S.h - 30) / 2, Math.min(160, S.h - 50));
        if (es >= 1) BOX('sacola', S.x - S.w / 2 - 14, tp - 80, S.x + S.w / 2 + 14, S.bot);
      });
      // os itens caindo do alto até a boca da sacola (por cima de tudo, mas param antes da logo)
      d.itens.forEach((it, i) => {
        const t0 = ev.itens[i]; if (t < t0 || t >= t0 + 0.42) return;
        const u = p(t, t0, t0 + 0.42), x = S.x + dxi(i) + 40 * (1 - u) * (i % 2 ? 1 : -1), y = lerp(T + 40, tp - 14, u * u);
        ctx.save(); ctx.translate(x, y); ctx.rotate((1 - u) * (i % 2 ? 0.6 : -0.6)); ITENS[it.tipo](ctx, 0, 0, 110); ctx.restore();
      });
      check(ctx, S.x + S.w / 2 - 4, tp + 8, 44, p(t, ev.fim, ev.fim + 0.4), { box: t >= ev.fim + 0.4 ? 'check' : null });
    },
  };

  // ---- leve ("CHEGOU"): a motinha chega, a geladeira abre cheia e iluminada, o bonequinho se espreguiça feliz e a
  //      nuvem cinza vira sol
  CENAS.leve = {
    setup(cap) {
      const d = cap.diagrama, ev = cap.ev;
      ev.moto = at(cap, d.moto.em, cap.t0 + 0.3);
      ev.chega = ev.moto + 1.0;
      ev.geladeira = Math.max(at(cap, d.geladeira.em, ev.moto + 0.5), ev.moto + 0.4);
      ev.espreguica = Math.max(at(cap, d.espreguica.em, ev.geladeira + 0.5), ev.geladeira + 0.4);
      ev.sol = Math.max(at(cap, d.sol.em, ev.espreguica + 0.6), ev.espreguica + 0.4);
      cue(ev.moto, 'moto', { d: 1.0 }); cue(ev.chega, 'horn');
      cue(ev.geladeira, 'door'); cue(ev.geladeira + 0.1, 'light'); cue(ev.espreguica, 'jump'); cue(ev.sol, 'shine'); cue(ev.sol + 0.1, 'heart');
    },
    draw(ctx, cap, t) {
      const ev = cap.ev, T = cap.cenaTop;
      const GX = 770, GW = 250, GB = PE - 10, GH = Math.min(500, GB - T - 40), ZX = 440;
      // a geladeira cheia e iluminada
      const ab = E.outCubic(p(t, ev.geladeira, ev.geladeira + 0.5)), eg = ent(t, cap.t0 + 0.1, 0.45);
      enter(ctx, eg, GX, GB, () => {
        geladeira(ctx, GX, GB, GW, GH, { abre: ab, dentro: (ix0, iy0, ix1, iy1, prat) => {
          const cheia = [[0, 'verdura', -50, 66], [0, 'tomate', 40, 70], [1, 'queijo', -45, 74], [1, 'ovos', 45, 66], [2, 'arroz', -55, 64], [2, 'cafe', 5, 64], [2, 'feijao', 62, 64], [3, 'limao', -40, 56], [3, 'paoQueijo', 40, 56]];
          cheia.forEach(([pi, kk, dx, sz], j) => {
            const py = pi < 3 ? prat[pi] : iy1;
            const ee = p(t, ev.geladeira + 0.15 + j * 0.04, ev.geladeira + 0.45 + j * 0.04);
            const dy = kk === 'arroz' || kk === 'cafe' || kk === 'feijao' ? -sz * 0.5 : kk === 'ovos' ? -sz * 0.3 : -sz * 0.36;
            pop(ctx, ee, GX + dx, py, () => ITENS[kk](ctx, GX + dx, py + dy, sz), 2.2);
          });
        } });
      });
      if (eg >= 1) BOX('geladeira', GX - GW / 2 - (ab > 0.5 ? GW * 0.3 : 0), GB - GH, GX + GW / 2, GB);
      if (ab > 0.5) sticker(ctx, 'brilho', GX + 70, GB - GH - 40, 50, p(t, ev.geladeira + 0.3, ev.geladeira + 0.6), t);
      // a nuvem cinza que vira sol, em cima do bonequinho
      const ZH = 320, cab = ZH * 0.2, headY = PE - 10 - ZH + cab * 2 - cab * 0.85;
      nuvemCinza(ctx, ZX, headY - 230 + 5 * Math.sin(t * 2), 120, t, { e: ent(t, cap.t0 + 0.15, 0.4), sol: E.outCubic(p(t, ev.sol, ev.sol + 0.5)) });
      if (t >= cap.t0 + 0.6) BOX(t >= ev.sol + 0.5 ? 'sol' : 'nuvem', ZX - 100, headY - 330, ZX + 100, headY - 140);
      // o bonequinho se espreguiçando, feliz
      const up = E.outBack(p(t, ev.espreguica, ev.espreguica + 0.6), 1.6) * (1 - 0.15 * Math.max(0, Math.sin((t - ev.espreguica) * 3)));
      const ez = ent(t, cap.t0 + 0.2, 0.45), feliz = t >= ev.espreguica;
      enter(ctx, ez, ZX, PE - 10, () => ze(ctx, ZX, PE - 10 - (feliz ? 6 * hop(t) : 0), ZH, t, {
        olhos: feliz ? 'feliz' : 'sono', bracos: feliz ? up : 0, boceja: feliz ? 0.4 * Math.sin(Math.PI * p(t, ev.espreguica, ev.espreguica + 0.8)) : 0,
        sorriso: 1, box: ez >= 1 ? 'bonequinho' : null }));
      // a motinha chegando com a sacola (para à esquerda)
      if (t >= ev.moto - 0.05) {
        const um = p(t, ev.moto, ev.chega), x = lerp(-120, 200, E.outCubic(um)), sp = Math.sin(Math.PI * um), MS = 200;
        moto(ctx, x, PE - 10 - (um >= 1 ? 3 * hop(t) : 0), MS, { dir: 1, roll: x / 16, speed: sp, tilt: -0.04 * sp });
        if (um >= 1) BOX('motinha', 200 - MS * 0.55, PE - 10 - MS * 0.98, 200 + MS * 0.55, PE - 10);
      }
    },
  };

  // =====================================================================
  // O QUADRO
  // =====================================================================
  // o relógio grande do capítulo (opcional: "relogio": {h, m} no JSON): no canto de cima à direita da cena, entra com "plop"
  // depois do título e os ponteiros correm da hora do capítulo anterior até a deste
  const relogioT = (cap) => tituloT(cap)[1] + BT;
  const RELOGIO_POS = (cap) => ({ x: 842, y: cap.cenaTop + 84, r: 66 });
  function relogioDoCap(ctx, cap, t) {
    const tr = relogioT(cap), e = p(t, tr, tr + 0.35);
    if (e <= 0) return;
    const R = RELOGIO_POS(cap), hora = cap.relogio.h + (cap.relogio.m || 0) / 60;
    const ant = CAPS.slice(0, cap.n).reverse().find((c) => c.relogio), h0 = ant ? ant.relogio.h + (ant.relogio.m || 0) / 60 : hora - 3;
    const hAgora = lerp(h0, hora, E.outCubic(p(t, tr + 0.1, tr + 0.8)));
    pop(ctx, e, R.x, R.y + R.r, () => relogio(ctx, R.x, R.y, R.r, hAgora, { rot: 0.1 * Math.sin((t - tr) * 30) * Math.exp(-Math.max(0, t - tr - 0.8) * 6) * (t > tr + 0.8 ? 1 : 0) }), 2.6);
    if (e >= 1) BOX('relógio', R.x - R.r * 1.05, R.y - R.r * 1.35, R.x + R.r * 1.05, R.y + R.r * 1.1);
  }
  function drawChap(ctx, cap, t) {
    const tipo = cap.diagrama.tipo;
    if (tipo !== 'capa') header(ctx, cap, t);
    if (cap.relogio) relogioDoCap(ctx, cap, t);
    CENAS[tipo].draw(ctx, cap, t);
    drawApoio(ctx, cap, t);
  }
  function frame(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = 'transparent';
    const w = where(t);
    if (!CEU) background(ctx, t, { y: (w.k + (w.trans ? E.inOutSine(w.u) : 0)) * STEP });
    else {
      // com o céu do dia: o céu de cada capítulo é varrido junto com a motinha; o sol e a lua andam no arco por cima
      const lados = w.trans ? (() => { const T = travessia(w.k, w.u); return T.dir > 0 ? [[T.borda, W], [0, T.borda]] : [[0, T.borda], [T.borda, W]]; })() : [[0, W]];
      lados.forEach(([a, b], i) => {
        if (b - a <= 0.5) return;
        const k = w.k + i;
        ctx.save(); ctx.beginPath(); ctx.rect(a, 0, b - a, H); ctx.clip();
        background(ctx, t, { y: k * STEP }); ceuFundo(ctx, t, CAPS[k]);
        ctx.restore();
      });
      if (w.trans) {
        // na faixa da coluna de botões o céu não tem borda: os dois céus se fundem (nada passa por ali, nem a borda)
        ctx.save(); ctx.beginPath(); ctx.rect(BTN.x, BTN.y0, W - BTN.x, BTN.y1 - BTN.y0); ctx.clip();
        background(ctx, t, { y: w.k * STEP }); ceuFundo(ctx, t, CAPS[w.k]);
        ctx.globalAlpha = E.inOutSine(w.u); background(ctx, t, { y: (w.k + 1) * STEP }); ceuFundo(ctx, t, CAPS[w.k + 1]);
        ctx.restore();
      }
      astros(ctx, t);
    }
    ctx.save();
    // nada passa pela coluna de botões
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(BTN.x, BTN.y0, W - BTN.x, BTN.y1 - BTN.y0); ctx.clip('evenodd');
    if (!w.trans) {
      OFF = { dx: 0, dy: 0, n: w.k };
      drawChap(ctx, CAPS[w.k], t);
    } else {
      // a varredura: do lado de onde a motinha ainda não passou, o capítulo atual; do lado de trás dela, o próximo
      const T = travessia(w.k, w.u);
      const lados = T.dir > 0 ? [[T.borda, W], [0, T.borda]] : [[0, T.borda], [T.borda, W]];
      [w.k, w.k + 1].forEach((k, i) => {
        const [a, b] = lados[i];
        if (b - a <= 0.5) return;
        ctx.save(); ctx.beginPath(); ctx.rect(a, 0, b - a, H); ctx.clip();
        OFF = { dx: 0, dy: 0, n: k };
        drawChap(ctx, CAPS[k], t);
        ctx.restore();
      });
      OFF = { dx: 0, dy: 0, n: -1 };
      drawWipe(ctx, t, w.k, w.u);
    }
    OFF = { dx: 0, dy: 0, n: -1 };
    ctx.restore();
    brand(ctx, t);
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
    CEU = CAPS.some((c) => c.ceu);
    TRANS = linha.transicao || 'moto';                    // a transição do episódio ("transicao" no JSON); sem o campo, a motinha
    CAPS.forEach((cap, k) => {
      if (!CENAS[cap.diagrama.tipo]) throw new Error('tipo de cena desconhecido: ' + cap.diagrama.tipo);
      if (cap.diagrama.tipo !== 'capa') layoutTitulo(cap);
      CENAS[cap.diagrama.tipo].setup(cap, k);
      if (k > 0) {
        if (TRANS === 'sacola') cue(CAPS[k - 1].t1, 'sacola', { d: TR, k, dir: travessia(k - 1, 0).dir, nhac: nhacU(k - 1) * TR, jeito: (k - 1) % 4 });   // os pulos, o NHAC! e o ploc
        else cue(CAPS[k - 1].t1, { galinha: 'galinha', viralata: 'cachorro' }[TRANS] || 'trans', { d: TR, k, dir: travessia(k - 1, 0).dir });   // quem atravessa (o som anda junto)
        cue(rotuloT(cap), 'pop', { f: 820 });                                        // o "plop" do adesivo do rótulo
        tituloT(cap).forEach((x, i) => cue(x, 'punch', { i }));
        if (cap.relogio) { cue(relogioT(cap), 'pop', { f: 980 }); cue(relogioT(cap) + 0.12, 'alarme'); }
      }
      cap.apoios.forEach((a, i) => { if (k > 0 || i > 0) cue(a.t, 'apoio'); });
    });
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
