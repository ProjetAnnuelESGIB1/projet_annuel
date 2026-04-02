// ================== INSIGHT.JS ==================

// ---- DOM (métriques) ----
const resteAVivreValue = document.getElementById('resteAVivreValue');
const depensesTotalValue = document.getElementById('depensesTotalValue');
const revenusValue = document.getElementById('revenusValue');

// ---- DOM (pie) ----
const pieSvg = document.getElementById('pieSvg');
const pieLegendList = document.getElementById('pieLegendList');
const pieTotalBadge = document.getElementById('pieTotalBadge');

// ---- DOM (carousel) ----
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const prevSlideBtn = document.getElementById('prevSlide');
const nextSlideBtn = document.getElementById('nextSlide');

let carouselBound = false;
// ---- Helpers ----
function formatAmount(amount) {
  const safe = Number(amount) || 0;
  return safe.toFixed(2).replace('.', ',') + ' €';
}
function formatPct(p) {
  return p.toFixed(1).replace('.', ',') + ' %';
}

const CATEGORY_ORDER = ['logement', 'alimentation', 'transports', 'loisirs', 'autres'];
const CATEGORY_LABEL = {
  logement: 'Logement',
  alimentation: 'Alimentation',
  transports: 'Transports',
  loisirs: 'Loisirs',
  autres: 'Autres',
};

// couleurs = identiques à tes .col-* dans styles.css [1](https://reseauges75-my.sharepoint.com/personal/m_lequy_myskolae_fr/Documents/Fichiers%20Microsoft%20Copilot%20Chat/styles.css)
const CATEGORY_COLOR = {
  logement: '#3b82f6',
  alimentation: '#22c55e',
  transports: '#f97316',
  loisirs: '#f43f5e',
  autres: '#64748b',
};

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

// ---- Render summary ----
function renderSummary(expenses, revenues) {
  if (!resteAVivreValue || !depensesTotalValue || !revenusValue) return;

  const { totalExpenses, totalRevenues, resteAVivre } = computeTotals(expenses, revenues);

  depensesTotalValue.textContent = formatAmount(totalExpenses);
  revenusValue.textContent = formatAmount(totalRevenues);
  resteAVivreValue.textContent = formatAmount(resteAVivre);

  depensesTotalValue.classList.remove('positive', 'negative', 'neutral');
  revenusValue.classList.remove('positive', 'negative', 'neutral');
  resteAVivreValue.classList.remove('positive', 'negative', 'neutral');

  depensesTotalValue.classList.add('negative');
  revenusValue.classList.add('positive');
  resteAVivreValue.classList.add(
    resteAVivre > 0 ? 'positive' : resteAVivre < 0 ? 'negative' : 'neutral'
  );
}

// ---- SVG pie helpers ----
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
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

// ---- Render pie: UNIQUEMENT catégories avec dépenses ----
function renderPie(expenses) {
  if (!pieSvg || !pieLegendList) return;

  const totals = computeCategoryTotals(expenses);
  const nonEmptyCats = CATEGORY_ORDER.filter((c) => totals[c] > 0); // ✅ uniquement si > 0
  const totalAll = nonEmptyCats.reduce((sum, c) => sum + totals[c], 0);

  pieLegendList.innerHTML = '';
  clearSvg(pieSvg);

  
  // cercle de fond pour détacher le pie du background
  const bgCircle = makeSvgEl('circle', {
    cx: 130,
    cy: 130,
    r: 110,
    fill: '#020617',          // même fond que les cards
    stroke: '#1f2937',        // bordure visible
    'stroke-width': 2
  });
  pieSvg.appendChild(bgCircle);

  if (pieTotalBadge) {
    pieTotalBadge.textContent = totalAll > 0 ? `Total : ${formatAmount(totalAll)}` : 'Aucune dépense';
  }

  if (nonEmptyCats.length === 1) {
    const cat = nonEmptyCats[0];

    // cercle rempli avec la couleur de la catégorie
    const full = makeSvgEl('circle', {
      cx: 130,
      cy: 130,
      r: 105,
      fill: CATEGORY_COLOR[cat] || '#64748b',
      stroke: '#020617',
      'stroke-width': 2
    });
    pieSvg.appendChild(full);

    // label 100% au centre
    const t = makeSvgEl('text', {
      x: 130,
      y: 130,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      class: 'pie-label'
    });
    t.textContent = '100,0 %';
    pieSvg.appendChild(t);

    // légende (1 ligne)
    const row = document.createElement('div');
    row.className = 'legend-row';

    const left = document.createElement('div');
    left.className = 'legend-left';

    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.background = CATEGORY_COLOR[cat] || '#64748b';

    const name = document.createElement('span');
    name.textContent = CATEGORY_LABEL[cat] || cat;

    left.appendChild(dot);
    left.appendChild(name);

    const right = document.createElement('div');
    right.className = 'legend-pct';
    right.textContent = '100,0 %';

    row.appendChild(left);
    row.appendChild(right);
    pieLegendList.appendChild(row);

    return; // ✅ on stoppe ici, pas besoin de dessiner des arcs
  }

  if (totalAll <= 0) {
    const txt = makeSvgEl('text', {
      x: 130,
      y: 130,
      'text-anchor': 'middle',
      fill: '#9ca3af',
      'font-size': 14,
      'font-weight': 800,
    });
    txt.textContent = 'Aucune dépense';
    pieSvg.appendChild(txt);
    return;
  }

  const cx = 130, cy = 130, r = 105;
  let start = 0;

  for (const cat of nonEmptyCats) {
    const value = totals[cat];
    const pct = (value / totalAll) * 100;
    const slice = (value / totalAll) * 360;
    const end = start + slice;

    // slice
    const path = makeSvgEl('path', {
      d: describeArc(cx, cy, r, start, end),
      fill: CATEGORY_COLOR[cat] || '#64748b',
      stroke: '#020617',      // séparation entre les parts
      'stroke-width': 2
    });
    pieSvg.appendChild(path);

    // % label sur la part (si pas trop petit)
    if (pct >= 7) {
      const mid = start + slice / 2;
      const p = polarToCartesian(cx, cy, r * 0.62, mid);
      const t = makeSvgEl('text', {
        x: p.x,
        y: p.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        class: 'pie-label'
      });
      t.textContent = formatPct(pct);
      pieSvg.appendChild(t);
    }

    // legend
    const row = document.createElement('div');
    row.className = 'legend-row';

    const left = document.createElement('div');
    left.className = 'legend-left';

    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.background = CATEGORY_COLOR[cat] || '#64748b';

    const name = document.createElement('span');
    name.textContent = CATEGORY_LABEL[cat] || cat;

    left.appendChild(dot);
    left.appendChild(name);

    const right = document.createElement('div');
    right.className = 'legend-pct';
    right.textContent = formatPct(pct);

    row.appendChild(left);
    row.appendChild(right);
    pieLegendList.appendChild(row);

    start = end;
  }
}

// ---- Carousel (simple) ----
function weekdayNameFR(dayIdx) {
  return ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][dayIdx] || '';
}

function computeInsights(expenses) {
  if (!expenses.length) {
    return [
      {
        title: "Ajoute des dépenses 🙂",
        text: "Pour l’instant je n’ai pas assez de données pour générer des insights."
      }
    ];
  }

  // 1) jour max
  const totalsByDay = Array(7).fill(0);
  for (const e of expenses) {
    const d = new Date(e.date + "T00:00:00");
    totalsByDay[d.getDay()] += Number(e.amount) || 0;
  }
  const max = Math.max(...totalsByDay);
  const idx = totalsByDay.indexOf(max);

  // 2) plus grosse dépense
  let biggest = expenses[0];
  for (const e of expenses) if ((+e.amount || 0) > (+biggest.amount || 0)) biggest = e;

  // 3) catégorie dominante
  const totals = computeCategoryTotals(expenses);
  const nonEmptyCats = CATEGORY_ORDER.filter((c) => totals[c] > 0);
  let topCat = nonEmptyCats[0] || 'autres';
  for (const c of nonEmptyCats) if (totals[c] > totals[topCat]) topCat = c;

  return [
    {
      title: "Quel est ton jour de dépense maximal ?",
      text: `Il semble que tu dépenses davantage le ${weekdayNameFR(idx)}.`
    },
    {
      title: "Ta plus grosse dépense",
      text: `${biggest.description || 'Dépense'} • ${formatAmount(biggest.amount)}`
    },
    {
      title: "Catégorie dominante",
      text: `${CATEGORY_LABEL[topCat]} est ta catégorie la plus importante pour l’instant.`
    },
  ];
}

let slides = [];
let currentSlide = 0;

function renderCarousel(expenses) {
  if (!carouselTrack || !carouselDots) return;

  slides = computeInsights(expenses);
  currentSlide = 0;

  carouselTrack.innerHTML = '';
  carouselDots.innerHTML = '';

  slides.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    const h = document.createElement('h3');
    h.className = 'slide-title';
    h.textContent = s.title;

    const p = document.createElement('p');
    p.className = 'slide-text';
    p.textContent = s.text;

    slide.appendChild(h);
    slide.appendChild(p);
    carouselTrack.appendChild(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Aller au slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    carouselDots.appendChild(dot);
  });

  updateCarousel();
}

function updateCarousel() {
  carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  const dots = [...carouselDots.querySelectorAll('.carousel-dot')];
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}
function goToSlide(i) {
  currentSlide = (i + slides.length) % slides.length;
  updateCarousel();
}
function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

// ---- Init ----

async function apiJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

async function initInsight() {
  try {
    const [expenses, revenues] = await Promise.all([
      apiJSON("api/expenses.php"),
      apiJSON("api/revenues.php"),
    ]);

    renderSummary(expenses, revenues);
    renderCarousel(expenses);
    renderPie(expenses);

    if (!carouselBound) {
      if (nextSlideBtn) nextSlideBtn.addEventListener('click', nextSlide);
      if (prevSlideBtn) prevSlideBtn.addEventListener('click', prevSlide);
      carouselBound = true;
    }
  } catch (err) {
    console.error(err);
    if (pieTotalBadge) pieTotalBadge.textContent = "Erreur API";
  }
}

initInsight();

