// ================== INSIGHT.JS ==================

// ============================================================
// 1. CONSTANTES
// ============================================================

const STORAGE_KEY_EXPENSES = 'budget_app_expenses';
const STORAGE_KEY_REVENUES = 'budget_app_revenues';

const CATEGORY_ORDER = ['logement', 'alimentation', 'transports', 'loisirs', 'autres'];

const CATEGORY_LABEL = {
  logement:     'Logement',
  alimentation: 'Alimentation',
  transports:   'Transports',
  loisirs:      'Loisirs',
  autres:       'Autres',
};

const CATEGORY_COLOR = {
  logement:     '#3b82f6',
  alimentation: '#22c55e',
  transports:   '#f97316',
  loisirs:      '#f43f5e',
  autres:       '#64748b',
};


// ============================================================
// 2. SÉLECTEURS DOM
// ============================================================

// Métriques
const resteAVivreValue  = document.getElementById('resteAVivreValue');
const depensesTotalValue = document.getElementById('depensesTotalValue');
const revenusValue       = document.getElementById('revenusValue');

// Camembert
const pieSvg         = document.getElementById('pieSvg');
const pieLegendList  = document.getElementById('pieLegendList');
const pieTotalBadge  = document.getElementById('pieTotalBadge');

// Carousel
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots  = document.getElementById('carouselDots');
const prevSlideBtn  = document.getElementById('prevSlide');
const nextSlideBtn  = document.getElementById('nextSlide');


// ============================================================
// 3. UTILITAIRES GÉNÉRIQUES
// ============================================================

function formatAmount(amount) {
  const safe = Number(amount) || 0;
  return safe.toFixed(2).replace('.', ',') + ' €';
}

function formatPct(p) {
  return p.toFixed(1).replace('.', ',') + ' %';
}

// Récupérer un tableau depuis le localStorage
function loadArray(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function weekdayNameFR(dayIdx) {
  return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dayIdx] || '';
}


// ============================================================
// 4. CALCULS MÉTIER
// ============================================================

function computeTotals(expenses, revenues) {
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);
  return { totalExpenses, totalRevenues, resteAVivre: totalRevenues - totalExpenses };
}

function computeCategoryTotals(expenses) {
  const totals = { logement: 0, alimentation: 0, transports: 0, loisirs: 0, autres: 0 };
  for (const e of expenses) {
    const cat = CATEGORY_ORDER.includes(e?.category) ? e.category : 'autres';
    totals[cat] += Number(e?.amount) || 0;
  }
  return totals;
}

function computeInsights(expenses) {
  if (!expenses.length) {
    return [{
      title: "Ajoute des dépenses 🙂",
      text:  "Pour l'instant je n'ai pas assez de données pour générer des insights.",
    }];
  }

  // Jour de la semaine avec le total le plus élevé
  const totalsByDay = Array(7).fill(0);
  for (const e of expenses) {
    const d = new Date(e.date + 'T00:00:00');
    totalsByDay[d.getDay()] += Number(e.amount) || 0;
  }
  const maxDay = Math.max(...totalsByDay);
  const maxDayIdx = totalsByDay.indexOf(maxDay);

  // Plus grosse dépense individuelle
  const biggest = expenses.reduce(
    (prev, e) => (+e.amount || 0) > (+prev.amount || 0) ? e : prev,
    expenses[0]
  );

  // Catégorie dominante
  const catTotals = computeCategoryTotals(expenses);
  const nonEmptyCats = CATEGORY_ORDER.filter((c) => catTotals[c] > 0);
  const topCat = nonEmptyCats.reduce(
    (best, c) => catTotals[c] > catTotals[best] ? c : best,
    nonEmptyCats[0] || 'autres'
  );

  return [
    {
      title: "Quel est ton jour de dépense maximal ?",
      text:  `Il semble que tu dépenses davantage le ${weekdayNameFR(maxDayIdx)}.`,
    },
    {
      title: "Ta plus grosse dépense",
      text:  `${biggest.description || 'Dépense'} • ${formatAmount(biggest.amount)}`,
    },
    {
      title: "Catégorie dominante",
      text:  `${CATEGORY_LABEL[topCat]} est ta catégorie la plus importante pour l'instant.`,
    },
  ];
}


// ============================================================
// 5. RENDU — RÉSUMÉ FINANCIER
// ============================================================

function renderSummary(expenses, revenues) {
  if (!resteAVivreValue || !depensesTotalValue || !revenusValue) return;

  const { totalExpenses, totalRevenues, resteAVivre } = computeTotals(expenses, revenues);

  depensesTotalValue.textContent = formatAmount(totalExpenses);
  revenusValue.textContent       = formatAmount(totalRevenues);
  resteAVivreValue.textContent   = formatAmount(resteAVivre);

  for (const el of [depensesTotalValue, revenusValue, resteAVivreValue]) {
    el.classList.remove('positive', 'negative', 'neutral');
  }

  depensesTotalValue.classList.add('negative');
  revenusValue.classList.add('positive');
  resteAVivreValue.classList.add(
    resteAVivre > 0 ? 'positive' : resteAVivre < 0 ? 'negative' : 'neutral'
  );
}


// ============================================================
// 6. RENDU — CAMEMBERT SVG
// ============================================================

// -- Helpers SVG --

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = (endAngle - startAngle) <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function clearSvg(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function makeSvgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// -- Construction de la légende --

function buildLegendRow(cat, pctText) {
  const row  = document.createElement('div');
  row.className = 'legend-row';

  const left = document.createElement('div');
  left.className = 'legend-left';

  const dot  = document.createElement('span');
  dot.className = 'legend-dot';
  dot.style.background = CATEGORY_COLOR[cat] || '#64748b';

  const name = document.createElement('span');
  name.textContent = CATEGORY_LABEL[cat] || cat;

  left.appendChild(dot);
  left.appendChild(name);

  const right = document.createElement('div');
  right.className = 'legend-pct';
  right.textContent = pctText;

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

// -- Rendu principal --

function renderPie(expenses) {
  if (!pieSvg || !pieLegendList) return;

  const totals       = computeCategoryTotals(expenses);
  const nonEmptyCats = CATEGORY_ORDER.filter((c) => totals[c] > 0);
  const totalAll     = nonEmptyCats.reduce((sum, c) => sum + totals[c], 0);

  pieLegendList.innerHTML = '';
  clearSvg(pieSvg);

  // Fond du camembert
  pieSvg.appendChild(makeSvgEl('circle', {
    cx: 130, cy: 130, r: 110,
    fill: '#020617', stroke: '#1f2937', 'stroke-width': 2,
  }));

  if (pieTotalBadge) {
    pieTotalBadge.textContent = totalAll > 0
      ? `Total : ${formatAmount(totalAll)}`
      : 'Aucune dépense';
  }

  // Cas : aucune dépense
  if (totalAll <= 0) {
    const txt = makeSvgEl('text', {
      x: 130, y: 130,
      'text-anchor': 'middle',
      fill: '#9ca3af', 'font-size': 14, 'font-weight': 800,
    });
    txt.textContent = 'Aucune dépense';
    pieSvg.appendChild(txt);
    return;
  }

  // Cas : une seule catégorie → cercle plein
  if (nonEmptyCats.length === 1) {
    const cat = nonEmptyCats[0];
    pieSvg.appendChild(makeSvgEl('circle', {
      cx: 130, cy: 130, r: 105,
      fill: CATEGORY_COLOR[cat] || '#64748b',
      stroke: '#020617', 'stroke-width': 2,
    }));

    const t = makeSvgEl('text', {
      x: 130, y: 130,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      class: 'pie-label',
    });
    t.textContent = '100,0 %';
    pieSvg.appendChild(t);

    pieLegendList.appendChild(buildLegendRow(cat, '100,0 %'));
    return;
  }

  // Cas général : parts du camembert
  const cx = 130, cy = 130, r = 105;
  let start = 0;

  for (const cat of nonEmptyCats) {
    const value = totals[cat];
    const pct   = (value / totalAll) * 100;
    const slice = (value / totalAll) * 360;
    const end   = start + slice;

    pieSvg.appendChild(makeSvgEl('path', {
      d: describeArc(cx, cy, r, start, end),
      fill: CATEGORY_COLOR[cat] || '#64748b',
      stroke: '#020617', 'stroke-width': 2,
    }));

    // Étiquette % sur la part (si assez grande)
    if (pct >= 7) {
      const mid = start + slice / 2;
      const pos = polarToCartesian(cx, cy, r * 0.62, mid);
      const t   = makeSvgEl('text', {
        x: pos.x, y: pos.y,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        class: 'pie-label',
      });
      t.textContent = formatPct(pct);
      pieSvg.appendChild(t);
    }

    pieLegendList.appendChild(buildLegendRow(cat, formatPct(pct)));

    start = end;
  }
}


// ============================================================
// 7. RENDU — CAROUSEL D'INSIGHTS
// ============================================================

let slides        = [];
let currentSlide  = 0;

function renderCarousel(expenses) {
  if (!carouselTrack || !carouselDots) return;

  slides       = computeInsights(expenses);
  currentSlide = 0;

  carouselTrack.innerHTML = '';
  carouselDots.innerHTML  = '';

  slides.forEach((s, i) => {
    // Slide
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    const h = document.createElement('h3');
    h.className   = 'slide-title';
    h.textContent = s.title;

    const p = document.createElement('p');
    p.className   = 'slide-text';
    p.textContent = s.text;

    slide.appendChild(h);
    slide.appendChild(p);
    carouselTrack.appendChild(slide);

    // Point de navigation
    const dot = document.createElement('button');
    dot.type      = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Aller au slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    carouselDots.appendChild(dot);
  });

  updateCarousel();
}

function updateCarousel() {
  carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  [...carouselDots.querySelectorAll('.carousel-dot')]
    .forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function goToSlide(i) {
  currentSlide = (i + slides.length) % slides.length;
  updateCarousel();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }


// ============================================================
// 8. INITIALISATION
// ============================================================

function initInsight() {
  const expenses = loadArray(STORAGE_KEY_EXPENSES);
  const revenues = loadArray(STORAGE_KEY_REVENUES);

  renderSummary(expenses, revenues);
  renderCarousel(expenses);
  renderPie(expenses);

  if (nextSlideBtn) nextSlideBtn.addEventListener('click', nextSlide);
  if (prevSlideBtn) prevSlideBtn.addEventListener('click', prevSlide);
}

initInsight();

// Synchronisation entre onglets
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY_EXPENSES || e.key === STORAGE_KEY_REVENUES) {
    initInsight();
  }
});
