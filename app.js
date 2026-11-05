 (() => {
'use strict';
const PACK = window.PACK;
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v === true) n.setAttribute(k, ''); else if (v !== false && v != null) n.setAttribute(k, v); } kids.flat().forEach(c => n.append(c instanceof Node ? c : document.createTextNode(c))); return n; };
const fmt = (n, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Libellés, unités et habillage de chaque jeu de données */
const UI = {
  telephone: {
    hash: 'telephone', name: 'Téléphones', file: 'Telephone_data.csv', blurb: "Neuf, d'occasion, réconditionné ou venant ?",
    title: "L'état d'un téléphone", model: 'Random Forest', noun: 'annonce',
    glyph: '<svg class="gl" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="16" height="28" rx="4"/><path d="M15 27h4"/><path d="M13 8h8"/></svg>',
    out: 'État estimé', predCol: 'etat_predit',
    fields: { prix: { label: 'Prix annoncé', unit: 'FCFA', step: 10000 }, adresse: { label: 'Quartier', wide: true }, marque: { label: 'Marque', wide: true }, dim_ecr: { label: "Taille d'écran", unit: 'pouces', step: 0.1, dec: 1 }, ram: { label: 'Mémoire RAM', unit: 'Go', step: 1 }, stockage: { label: 'Stockage', unit: 'Go', step: 32 } },
    order: ['marque', 'adresse', 'prix', 'dim_ecr', 'ram', 'stockage'],
    cap: "Le modèle compare votre téléphone aux annonces qu'il a apprises et retient l'état le plus probable. Les barres donnent la probabilité de chaque état."
  },
  cardata: {
    hash: 'voitures-dakar', name: 'Voitures de Dakar', file: 'Car_Data.csv', blurb: "Venant ou d'occasion ?",
    title: "L'origine d'une voiture à Dakar", model: 'Random Forest', noun: 'annonce',
    glyph: '<svg class="gl" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22v-5l3-7h18l3 7v5"/><path d="M3 22h28v4H3z"/><circle cx="10" cy="22" r="1" fill="currentColor"/><circle cx="24" cy="22" r="1" fill="currentColor"/><path d="M9 14h16"/></svg>',
    out: 'Origine estimée', predCol: 'Venant_Occasion_predit',
    fields: { Marque: { label: 'Marque', wide: true }, Année: { label: 'Année', step: 1 }, Boite_Vitesse: { label: 'Boîte de vitesse', wide: true }, Quartier: { label: 'Quartier', wide: true }, Prix: { label: 'Prix annoncé', unit: 'FCFA', step: 500000 } },
    order: ['Marque', 'Année', 'Boite_Vitesse', 'Quartier', 'Prix'],
    cap: "Le modèle compare votre voiture aux annonces qu'il a apprises et retient l'origine la plus probable : venant ou d'occasion. Les barres donnent la probabilité de chaque réponse."
  },
  cardataset: {
    hash: 'revente-voitures', name: 'Revente de voitures', file: 'Car_dataset.csv', blurb: 'Prix de revente selon le kilométrage et l\'âge.',
    title: "Le prix de revente d'une voiture", model: 'Random Forest', noun: 'annonce', mdec: 3,
    glyph: '<svg class="gl" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 25a11 11 0 1 1 22 0"/><path d="M17 25l5-8"/><path d="M9 25h2M23 25h2M17 14v2"/></svg>',
    out: 'Prix de revente estimé', unit: 'unités', dec: 2, predCol: 'Selling_Price_predit',
    fields: { Kms_Driven: { label: 'Kilométrage', unit: 'km', step: 5000 }, Present_Price: { label: 'Prix neuf actuel', unit: 'unités', step: 0.5, dec: 2 }, Fuel_Type: { label: 'Carburant', wide: true }, Seller_Type: { label: 'Vendeur', wide: true }, Transmission: { label: 'Transmission', wide: true }, Age: { label: 'Âge', unit: 'ans', step: 1 } },
    order: ['Present_Price', 'Kms_Driven', 'Age', 'Fuel_Type', 'Seller_Type', 'Transmission'],
    cap: "Les prix sont exprimés dans l'unité du jeu de données d'origine, la même que « Prix neuf actuel »."
  },
  taxi: {
    hash: 'taxi', name: 'Courses de taxi', file: 'taxi_trip_pricing.csv', blurb: 'Combien coûte cette course ?',
    title: "Le prix d'une course de taxi", model: 'Random Forest', noun: 'trajet', mdec: 2, munit: ' $',
    glyph: '<svg class="gl" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v5h-6z"/><path d="M5 26v-8l3-7h18l3 7v8z"/><path d="M5 18h24"/><circle cx="11" cy="26" r="2" fill="currentColor"/><circle cx="23" cy="26" r="2" fill="currentColor"/></svg>',
    out: 'Prix de la course estimé', unit: '$', dec: 2, predCol: 'Trip_Price_predit',
    fields: { Trip_Distance_km: { label: 'Distance', unit: 'km', step: 1, dec: 1 }, Time_of_Day: { label: 'Moment de la journée', wide: true }, Day_of_Week: { label: 'Jour', wide: true }, Passenger_Count: { label: 'Passagers', step: 1 }, Traffic_Conditions: { label: 'Circulation', wide: true }, Weather: { label: 'Météo', wide: true }, Base_Fare: { label: 'Tarif de base', unit: '$', step: 0.5, dec: 2 }, Per_Km_Rate: { label: 'Tarif au km', unit: '$/km', step: 0.05, dec: 2 }, Per_Minute_Rate: { label: 'Tarif à la minute', unit: '$/min', step: 0.01, dec: 2 }, Trip_Duration_Minutes: { label: 'Durée', unit: 'min', step: 5, dec: 1 } },
    order: ['Trip_Distance_km', 'Trip_Duration_Minutes', 'Time_of_Day', 'Day_of_Week', 'Traffic_Conditions', 'Weather', 'Passenger_Count', 'Base_Fare', 'Per_Km_Rate', 'Per_Minute_Rate'],
    cap: "Le prix est la moyenne des estimations des arbres de décision. La barre montre où se situent 80 % d'entre eux. Les prix sont exprimés dans l'unité du jeu de données d'origine."
  }
};
const KEYS = Object.keys(UI);
const optLabel = (f, o) => o.label;   // valeurs telles qu'elles sont dans le jeu de données (Petrol, Dealer, Manual…)

/* État */
const S = { mod: 'telephone', mode: 'single', vals: {}, batch: {} };
const models = {};
const getModel = (k) => models[k] || (models[k] = Engine.decode(PACK.meta[k], PACK.blobs[k]));
function defaults(k) {
  const m = PACK.meta[k], v = {};
  m.feats.forEach((f, i) => { const raw = m.first[i]; v[f.name] = f.type === 'num' ? Number(raw) : (f.alias[strip(raw).replace(/\s*,\s*/g, ',')] ?? f.alias[strip(raw)] ?? f.options[0].code); });
  return v;
}
KEYS.forEach(k => S.vals[k] = defaults(k));

/* Thème clair / sombre */
const paintTheme = () => $('#themeBtn').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; paintTheme();
  try { localStorage.setItem('xaalis-theme', next); } catch (e) { /* stockage indisponible */ }
});
paintTheme();

/* Toast */
let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2800); }

/* Étals */
function renderStalls() {
  const host = $('#stalls'); host.replaceChildren();
  KEYS.forEach(k => {
    const u = UI[k], b = el('button', { class: 'stall', role: 'tab', id: 'st-' + k, 'aria-selected': String(k === S.mod), onclick: () => go(k) });
    b.innerHTML = u.glyph; b.append(el('h2', {}, u.name), el('span', { class: 'file' }, u.file));
    host.append(b);
  });
}

/* Champs */
function numField(f, u, k) {
  const fu = UI[k].fields[f.name], dec = fu.dec ?? (f.integer ? 0 : 2), step = fu.step ?? 1;
  const input = el('input', { id: 'f-' + f.name, type: 'text', inputmode: 'decimal' });
  const show = () => { const v = S.vals[k][f.name]; input.value = v == null || Number.isNaN(v) ? '' : fmt(v, dec); };
  const set = (v) => { S.vals[k][f.name] = v; touch(); };
  input.addEventListener('input', () => { const s = input.value.replace(/\s/g, '').replace(',', '.'); set(s === '' || isNaN(Number(s)) ? null : Number(s)); });
  input.addEventListener('blur', show);
  const nudge = (d) => { const cur = S.vals[k][f.name] ?? f.median; const nv = Math.round((cur + d * step) * 1000) / 1000; set(nv); show(); };
  const wrap = el('div', { class: 'num' }, input, fu.unit ? el('span', { class: 'u' }, fu.unit) : '', el('button', { type: 'button', 'aria-label': 'Diminuer', onclick: () => nudge(-1) }, '−'), el('button', { type: 'button', 'aria-label': 'Augmenter', onclick: () => nudge(1) }, '+'));
  show();
  return [wrap];
}
function radioField(f, k) {
  const g = el('div', { class: 'radios', role: 'radiogroup', 'aria-labelledby': 'l-' + f.name });
  const paint = () => [...g.children].forEach(b => b.setAttribute('aria-checked', String(Number(b.dataset.code) === S.vals[k][f.name])));
  f.options.forEach(o => g.append(el('button', { type: 'button', role: 'radio', 'data-code': o.code, onclick: () => { S.vals[k][f.name] = o.code; paint(); touch(); } }, optLabel(f, o))));
  paint(); return [g];
}
function comboField(f, k) {
  const id = 'f-' + f.name, list = el('ul', { role: 'listbox', id: id + '-l', hidden: true }), input = el('input', { id, type: 'text', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': id + '-l', 'aria-autocomplete': 'list', spellcheck: 'false' });
  const byCode = new Map(f.options.map(o => [o.code, o]));
  let act = -1, shown = [];
  const cur = () => byCode.get(S.vals[k][f.name]);
  const label = () => { const o = cur(); input.value = o ? optLabel(f, o) : ''; };
  const build = (q) => {
    const s = strip(q || ''); shown = f.options.filter(o => !s || strip(optLabel(f, o)).includes(s)); list.replaceChildren();
    if (!shown.length) list.append(el('li', { class: 'empty' }, 'Aucun résultat'));
    shown.forEach((o, i) => list.append(el('li', { role: 'option', class: o.code === S.vals[k][f.name] ? 'on' : '', 'aria-selected': String(i === act), onmousedown: (e) => { e.preventDefault(); pick(o); } }, el('span', {}, optLabel(f, o)), el('small', {}, fmt(o.n) + (o.n > 1 ? ' ' + UI[k].noun + 's' : ' ' + UI[k].noun)))));
  };
  const open = (q) => {
    act = -1; build(q); list.classList.remove('up'); list.hidden = false; input.setAttribute('aria-expanded', 'true');
    // Pas assez de place sous le champ : la liste s'ouvre vers le haut, sinon on fait défiler la page pour la montrer en entier
    const r = list.getBoundingClientRect();
    if (r.bottom > innerHeight - 8) { if (input.getBoundingClientRect().top > r.height + 16) list.classList.add('up'); else list.scrollIntoView({ block: 'nearest' }); }
    const on = list.querySelector('.on'); if (on && !q) on.scrollIntoView({ block: 'nearest' });
  };
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); label(); };
  const pick = (o) => { S.vals[k][f.name] = o.code; close(); touch(); };
  const mark = () => { [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === act))); list.children[act]?.scrollIntoView({ block: 'nearest' }); };
  input.addEventListener('focus', () => { input.select(); open(''); });
  input.addEventListener('click', () => { if (list.hidden) open(''); });
  input.addEventListener('input', () => open(input.value));
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(''); act = Math.min(shown.length - 1, act + 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[act >= 0 ? act : 0] && !list.hidden) pick(shown[act >= 0 ? act : 0]); }
    else if (e.key === 'Escape') { close(); }
  });
  label();
  return [el('div', { class: 'combo' }, input, list)];
}
function renderForm() {
  const k = S.mod, u = UI[k], m = PACK.meta[k], form = $('#fields'); form.replaceChildren();
  u.order.forEach(name => {
    const f = m.feats.find(x => x.name === name), fu = u.fields[name];
    const body = f.type === 'num' ? numField(f, u, k) : (f.options.length <= 4 ? radioField(f, k) : comboField(f, k));
    form.append(el('div', { class: 'field' + (fu.wide ? ' wide' : '') }, el('div', { class: 'lab', id: 'l-' + name }, el('label', { for: 'f-' + name }, fu.label)), ...body));
  });
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('viewBox', '0 0 20 20'); arrow.setAttribute('width', '18'); arrow.setAttribute('height', '18'); arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = '<path d="M4 10h11m0 0-4.500-4.500M15 10l-4.500 4.500" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  form.append(el('button', { class: 'cta', type: 'submit' }, el('span', {}, 'Prédire'), arrow));
}

/* Étiquette */
const SVG = 'http://www.w3.org/2000/svg';
function barcode(seed) {
  const s = String(seed).replace(/\D/g, '').padStart(10, '7').slice(0, 14), svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('class', 'barcode'); svg.setAttribute('viewBox', '0 0 200 34'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  let x = 4; const add = (w) => { const r = document.createElementNS(SVG, 'rect'); r.setAttribute('x', x); r.setAttribute('y', 0); r.setAttribute('width', w); r.setAttribute('height', 34); r.setAttribute('fill', 'currentColor'); svg.append(r); };
  add(1.5); x += 3; add(1.5); x += 3;
  for (const ch of s) { const d = +ch; [1 + (d % 3), 1 + ((d * 3) % 3), 1 + ((d + 2) % 2)].forEach((w, i) => { add(w * 1.1); x += w * 1.1 + 1.4 + i * .4; }); x += 1.2; }
  add(1.5); x += 3; add(1.5);
  return svg;
}
const stringSvg = () => { const s = document.createElementNS(SVG, 'svg'); s.setAttribute('class', 'string'); s.setAttribute('viewBox', '0 0 120 56'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<path d="M6 40C0 14 28 0 60 8s70 20 56-4" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><path d="M6 40c3 5 8 6 12 2" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>'; return s; };
let lastKey = '', shownVal = 0, raf, countFrom = null, hasResult = false;
function countTo(node, to, render) {
  cancelAnimationFrame(raf);
  if (reduce) { node.textContent = render(to); shownVal = to; return; }
  const from = shownVal, t0 = performance.now(), dur = 380;
  const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); node.textContent = render(from + (to - from) * e); shownVal = from + (to - from) * e; if (p < 1) raf = requestAnimationFrame(step); };
  raf = requestAnimationFrame(step);
}
function inputsOf(k) {
  const m = PACK.meta[k], raw = [], warn = [];
  for (const f of m.feats) { const v = S.vals[k][f.name]; if (v == null || Number.isNaN(v)) return { raw: null }; raw.push(v); if (f.type === 'num' && (v < f.min || v > f.max)) warn.push(UI[k].fields[f.name].label); }
  return { raw, warn };
}
/* Étiquette vierge : avant le premier clic sur « Prédire » */
function showEmpty() {
  const u = UI[S.mod], body = el('div', { class: 'tag-body' });
  body.append(el('p', { class: 'tag-k' }, u.out), el('p', { class: 'tag-empty' }, 'Renseignez la fiche, puis cliquez sur Prédire.'));
  $('#tagHost').replaceChildren(el('div', { class: 'tag', id: 'tag' }, stringSvg(), el('div', { class: 'hole' }), body));
  $('#tagCap').textContent = u.cap; 
  hasResult = false; lastKey = '';
}
/* La fiche a changé après une prédiction : on grise l'étiquette jusqu'au prochain clic */
function touch() {
  if (!hasResult) return;
  $('#tag')?.classList.add('stale'); $('#tagCap').textContent = 'La fiche a changé : cliquez sur Prédire pour mettre l\'estimation à jour.';
}
function compute() {
  const k = S.mod, u = UI[k], host = $('#tagHost'), { raw, warn } = inputsOf(k); countFrom = null;
  $('#tagCap').textContent = u.cap; hasResult = false;
  const body = el('div', { class: 'tag-body' });
  const tag = el('div', { class: 'tag', id: 'tag' }, stringSvg(), el('div', { class: 'hole' }), body);
  if (!raw) {
    body.append(el('p', { class: 'tag-k' }, u.out), el('p', { class: 'tag-empty' }, 'Complétez tous les champs pour obtenir une estimation.'));
    host.replaceChildren(tag); lastKey = ''; return;
  }
  const r = Engine.predict(getModel(k), raw);
  let seed, summary;
  body.append(el('p', { class: 'tag-k' }, u.out));
  if (r.label !== undefined) {
    body.append(el('p', { class: 'tag-v txt' }, r.label), el('hr', { class: 'perf' }));
    const bars = el('div', { class: 'bars' }); const ord = PACK.meta[k].classes.map((c, i) => [c, r.proba[i], i]).sort((a, b) => b[1] - a[1]);
    ord.forEach(([c, p, i]) => bars.append(el('div', { class: 'bar' + (i === r.index ? ' top' : ''), style: `--w:${(p * 100).toFixed(1)}%` }, el('b', {}, c), el('span', {}, fmt(p * 100, 0) + ' %'), el('i'))));
    body.append(bars); seed = Math.round(r.proba[r.index] * 1e6) + '' + r.index; summary = r.label + ' · ' + fmt(r.proba[r.index] * 100) + ' %';
  } else {
    const rd = u.round ? (v) => Math.round(v / u.round) * u.round : (v) => v, dec = u.dec ?? 0, render = (v) => fmt(rd(v), dec);
    const v = el('p', { class: 'tag-v' }, el('span', { id: 'val' }, render(lastKey === k ? shownVal : r.value)), el('small', {}, u.unit));
    body.append(v, el('hr', { class: 'perf' }));
    const lo = r.min, hi = r.max, span = Math.max(hi - lo, 1e-9), pc = (x) => Math.min(100, Math.max(0, (x - lo) / span * 100));
    const trk = el('div', { class: 'trk' }, el('div', { class: 'band', style: `left:${pc(r.low)}%;width:${Math.max(1.5, pc(r.high) - pc(r.low))}%` }), el('div', { class: 'mk', style: `left:${pc(r.value)}%` }));
    body.append(el('div', { class: 'range' }, trk, el('div', { class: 'lbl' }, el('span', {}, render(r.low)), el('span', {}, render(r.high))), el('p', {}, `Fourchette probable : 80 % des ${PACK.meta[k].nTrees} arbres estiment entre ${render(r.low)} et ${render(r.high)} ${u.unit}.`)));
    seed = Math.round(r.value * 100); summary = render(r.value) + ' ' + u.unit;
    countFrom = { render, to: r.value };
  }
  body.append(barcode(seed), el('div', { class: 'tag-foot' }, el('span', {}, 'XAALIS · ' + u.file.replace('.csv', '').toUpperCase()), el('span', {}, 'RF/' + PACK.meta[k].nTrees)));
  if (warn.length) body.append(el('p', { class: 'tag-warn' }, 'Valeur hors de la plage connue : ' + warn.join(', ') + '. Estimation peu fiable.'));
  host.replaceChildren(tag); hasResult = true;
  if (countFrom) { const n = $('#val'); if (n) { if (lastKey !== k) shownVal = countFrom.to; countTo(n, countFrom.to, countFrom.render); } countFrom = null; }
  if (!reduce) tag.classList.add('swing');
  lastKey = k;
}

/* Fichier CSV */
function parseCSV(text) {
  text = text.replace(/^﻿/, ''); const first = text.split(/\r?\n/, 1)[0], sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; }
    else cell += c; }
  row.push(cell); if (row.some(x => x.trim() !== '')) rows.push(row);
  return { rows, sep };
}
const csvCell = (v) => { v = String(v ?? ''); return /[",\n\r;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function runBatch(k, text, name, size) {
  const u = UI[k], m = PACK.meta[k], { rows, sep } = parseCSV(text);
  if (rows.length < 2) { S.batch[k] = { size, name, error: 'Le fichier est vide ou ne contient que des en-têtes.' }; renderBatch(); return; }
  const head = rows[0].map(h => h.trim()), idx = {}, missing = [];
  m.feats.forEach(f => { const j = head.findIndex(h => strip(h) === strip(f.name) || (f.name === 'Quartier' && strip(h) === 'adresse')); if (j < 0) missing.push(f.name); else idx[f.name] = j; });
  if (missing.length) { S.batch[k] = { size, error: `Colonnes manquantes : ${missing.join(', ')}. Colonnes attendues : ${m.feats.map(f => f.name).join(', ')}.`, name }; renderBatch(); return; }
  const model = getModel(k), out = []; let bad = 0;
  rows.slice(1).forEach((r, n) => {
    const raw = []; let err = '';
    for (const f of m.feats) { const s = (r[idx[f.name]] ?? '').trim();
      if (f.type === 'num') { const t = s.replace(/\s/g, ''), v = Number(sep === ';' ? t.replace(',', '.') : t); if (s === '' || Number.isNaN(v)) { err = `${f.name} : nombre attendu, reçu « ${s} »`; break; } raw.push(v); }
      else { const q = f.name === 'Quartier' ? s.split(',')[0] : s, c = f.alias[strip(q).replace(/\s*,\s*/g, ',')] ?? f.alias[strip(q)]; if (c === undefined) { err = `${f.name} : valeur inconnue « ${s} »`; break; } raw.push(c); } }
    if (err) { bad++; out.push({ r, err }); } else out.push({ r, res: Engine.predict(model, raw) });
  });
  S.batch[k] = { head, idx, out, bad, name, sep, size: size ?? text.length };
  renderBatch();
  toast(`Fichier chargé : ${fmt(out.length)} ligne${out.length > 1 ? 's' : ''} lues, ${fmt(out.length - bad)} estimée${out.length - bad > 1 ? 's' : ''}.`);
}
function predText(k, res) {
  const u = UI[k]; if (res.label !== undefined) return res.label;
  const v = u.round ? Math.round(res.value / u.round) * u.round : res.value; return fmt(v, u.dec ?? 0) + ' ' + u.unit;
}
function resultsCSV(k) {
  const b = S.batch[k], u = UI[k], isC = PACK.meta[k].classes != null;
  const extra = isC ? [u.predCol, 'probabilite'] : [u.predCol, 'fourchette_basse', 'fourchette_haute'];
  const lines = [[...b.head, ...extra].map(csvCell).join(',')];
  b.out.forEach(o => { const base = b.head.map((_, i) => o.r[i] ?? '');
    if (o.err) lines.push([...base, 'erreur : ' + o.err, ...extra.slice(1).map(() => '')].map(csvCell).join(','));
    else if (isC) lines.push([...base, o.res.label, (o.res.proba[o.res.index]).toFixed(3)].map(csvCell).join(','));
    else { const rd = (v) => u.round ? Math.round(v / u.round) * u.round : Math.round(v * 100) / 100; lines.push([...base, rd(o.res.value), rd(o.res.low), rd(o.res.high)].map(csvCell).join(',')); } });
  return '﻿' + lines.join('\r\n');
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const t = el('textarea', { style: 'position:fixed;left:-9999px' }); t.value = text; document.body.append(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (e) { return false; }
}
async function save(filename, data) {
  try {
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' })), a = el('a', { href: url, download: filename });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Téléchargement lancé : ' + filename);
  } catch (e) { toast('Téléchargement impossible ici. Utilisez « Copier le CSV ».'); }
}
function renderBatch() {
  const k = S.mod, u = UI[k], m = PACK.meta[k], host = $('#batch'), b = S.batch[k]; host.replaceChildren();
  const loaded = !!b && !b.error, failed = !!b && !!b.error;
  const fileIn = el('input', { type: 'file', accept: '.csv,text/csv', hidden: true, id: 'file' });
  const readFile = (f) => { if (f) f.text().then(t => runBatch(k, t, f.name, f.size)); };
  fileIn.addEventListener('change', () => { readFile(fileIn.files[0]); fileIn.value = ''; });
  const check = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const mark = el('div', { class: 'okmark' }); mark.innerHTML = check;
  const sizeTxt = b && b.size != null ? (b.size < 1024 ? b.size + ' o' : fmt(b.size / 1024, 1) + ' Ko') : '';
  const drop = el('div', { class: 'drop' + (loaded ? ' ok' : '') + (failed ? ' bad' : ''), id: 'drop' },
    loaded ? mark : '',
    el('h4', {}, loaded ? 'Fichier chargé' : failed ? 'Fichier non utilisable' : 'Déposez un fichier CSV ici'),
    loaded ? el('p', { class: 'fname' }, `${b.name} · ${fmt(b.out.length)} ligne${b.out.length > 1 ? 's' : ''} · ${sizeTxt}`)
           : (failed ? el('p', {}, b.error) : ''),
    el('div', { class: 'cols' }, m.feats.map(f => el('code', {}, f.name))),
    el('div', { class: 'btns' },
      el('button', { class: 'btn', type: 'button', onclick: () => fileIn.click() }, loaded ? 'Changer de fichier' : 'Choisir un fichier'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => runBatch(k, m.sample, 'exemple_' + u.file, m.sample.length) }, 'Essayer avec 5 lignes d\'exemple')), fileIn);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => readFile(e.dataTransfer.files[0]));
  host.append(drop);
  if (!b) return;
  if (b.error) return;
  const ok = b.out.length - b.bad, cols = m.feats.map(f => f.name);
  host.append(el('div', { class: 'res-head' }, el('p', {}, `${fmt(ok)} estimation${ok > 1 ? 's' : ''}`, el('small', {}, ` · ${b.name}` + (b.bad ? ` · ${b.bad} ligne${b.bad > 1 ? 's' : ''} à corriger` : ''))),
    el('div', { class: 'btns' }, el('button', { class: 'btn', type: 'button', onclick: () => save(`xaalis_predictions_${u.file}`, resultsCSV(k)) }, 'Télécharger les résultats (CSV)'),
      el('button', { class: 'btn ghost', type: 'button', onclick: async () => toast((await copyText(resultsCSV(k).replace(/^\uFEFF/, ''))) ? 'CSV copié : collez-le dans un fichier .csv ou dans Excel.' : 'Copie impossible.') }, 'Copier le CSV'))));
  const thead = el('thead', {}, el('tr', {}, cols.map(c => el('th', {}, c)), el('th', {}, u.predCol)));
  const tb = el('tbody'); b.out.slice(0, 300).forEach(o => { const tr = el('tr', {}, cols.map(c => el('td', {}, o.r[b.idx[c]] ?? ''))); if (o.err) tr.append(el('td', { class: 'err' }, o.err)); else tr.append(el('td', { class: 'pred' }, predText(k, o.res))); tb.append(tr); });
  host.append(el('div', { class: 'tw', tabindex: '0', role: 'region', 'aria-label': 'Résultats' }, el('table', {}, thead, tb)));
  if (b.out.length > 300) host.append(el('p', { class: 'hint' }, `Aperçu des 300 premières lignes sur ${fmt(b.out.length)}. Le fichier téléchargé contient tout.`));
}

/* À propos du modèle : tous les chiffres viennent du pack exporté (nombre d'arbres, profondeur, lignes du CSV, jeux d'entraînement et de validation, métriques recalculées avec le modèle sauvegardé) */
function metric(m, u) {
  const s = m.stats, d = u.mdec ?? 3, mu = u.munit ?? '';
  if (m.classes) return [fmt(s.acc_val * 100, 2) + ' %', `de bonnes réponses sur le jeu de validation (${fmt(s.val)} ${u.noun}s) · accuracy et F1-score : ${fmt(s.acc_val, 4)}`];
  return ['R² ' + fmt(s.r2, 3), `sur le jeu de validation (${fmt(s.val)} ${u.noun}s) · erreur moyenne (MAE) ${fmt(s.mae, d)}${mu} · RMSE ${fmt(s.rmse, d)}${mu}`];
}
function renderAbout() {
  const k = S.mod, u = UI[k], m = PACK.meta[k], d = $('#about'); d.replaceChildren();
  const item = (t, v, s) => el('div', {}, el('dt', {}, t), el('dd', {}, v, s ? el('small', {}, s) : ''));
  d.append(item('Modèle', u.model, `${m.nTrees} arbres, profondeur ${m.stats.depth}`), item('Données', fmt(m.stats.rows) + ' ' + u.noun + 's', `${u.file} · ${fmt(m.stats.train)} pour l'entraînement`), item('Variables', String(m.feats.length), m.feats.map(f => f.name).join(', ')), item('Fiabilité', ...metric(m, u)));
}

/* Navigation */
function go(k, fromHash) {
  S.mod = k; if (!fromHash && location.hash !== '#' + UI[k].hash) history.replaceState(null, '', '#' + UI[k].hash);
  KEYS.forEach(x => $('#st-' + x)?.setAttribute('aria-selected', String(x === k)));
  $('#wsTitle').textContent = UI[k].title; lastKey = ''; shownVal = 0;
  renderForm(); renderBatch(); renderAbout(); showEmpty(); setMode(S.mode);
}
function setMode(m) {
  S.mode = m; $('#single').hidden = m !== 'single'; $('#batch').hidden = m !== 'batch';
  $('#m-single').setAttribute('aria-selected', String(m === 'single')); $('#m-batch').setAttribute('aria-selected', String(m === 'batch'));
  document.body.classList.toggle('batchmode', m === 'batch');
  if (m === 'batch') renderBatch();
}
$('#fields').addEventListener('submit', (e) => { e.preventDefault(); compute(); });
$('#m-single').addEventListener('click', () => setMode('single'));
$('#m-batch').addEventListener('click', () => setMode('batch'));
const fromHash = () => { const h = location.hash.slice(1), k = KEYS.find(x => UI[x].hash === h); return k; };
addEventListener('hashchange', () => { const k = fromHash(); if (k && k !== S.mod) go(k, true); });
renderStalls(); go(fromHash() || 'telephone', true);
})();
