// ================== LOGIQUE JS ==================

// Sélecteurs principaux
const resetDataBtn = document.getElementById('resetDataBtn');
const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const amountRevenuInput = document.getElementById('amountRevenu');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('category');
const revenuButton = document.getElementById('revenuButton');

const tableBody = document.getElementById('expenseTableBody');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.getElementById('tableWrapper');

const chartContainer = document.getElementById('chart');
const chartTotal = document.getElementById('chartTotal');

const modeBadge = document.getElementById('modeBadge');
const submitBtn = document.getElementById('submitBtn');
const submitLabel = document.getElementById('submitLabel');
const cardTitle = document.getElementById('cardtitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');


const resteAVivreValue = document.getElementById('resteAVivreValue');
const depensesTotalValue = document.getElementById('depensesTotalValue');
const revenusValue = document.getElementById('revenusValue');


// ----- Objectifs d'épargne -----
const goalForm = document.getElementById('goalForm');
const goalNameInput = document.getElementById('goalName');
const goalAmountInput = document.getElementById('goalAmount');
const goalsList = document.getElementById('goalsList');

let goals = [];

// État de l'application
let expenses = [];  // { id, amount, date, description, category }
let revenues = [];  // { id, amount, date, description }
let editingId = null; // id de la dépense en cours d'édition

// ================== API HELPERS (MySQL via PHP) ==================
async function apiJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  // Certaines routes DELETE/POST peuvent renvoyer vide
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

// ---------- EXPENSES ----------
async function loadExpenses() {
  expenses = await apiJSON("api/expenses.php");
}

async function createExpense(expense) {
  await apiJSON("api/expenses.php", { method: "POST", body: JSON.stringify(expense) });
}

async function updateExpenseAPI(expense) {
  await apiJSON("api/expenses.php", { method: "PUT", body: JSON.stringify(expense) });
}

async function deleteExpenseAPI(id) {
  await apiJSON(`api/expenses.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- REVENUES ----------
async function loadRevenues() {
  revenues = await apiJSON("api/revenues.php");
}

async function createRevenue(revenue) {
  await apiJSON("api/revenues.php", { method: "POST", body: JSON.stringify(revenue) });
}

async function deleteRevenueAPI(id) {
  await apiJSON(`api/revenues.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- GOALS ----------
async function loadGoals() {
  goals = await apiJSON("api/goals.php");
}

async function createGoal(goal) {
  await apiJSON("api/goals.php", { method: "POST", body: JSON.stringify(goal) });
}

async function updateGoalSaved(id, saved) {
  await apiJSON("api/goals.php", { method: "PUT", body: JSON.stringify({ id, saved }) });
}

async function deleteGoalAPI(id) {
  await apiJSON(`api/goals.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ================== CRUD UI (utilise l'API) ==================
async function addExpense(expense) {
  await createExpense(expense);
  await refreshAll();
}

async function addRevenue(amount) {
  const revenue = {
    amount,
    date: new Date().toISOString().split("T")[0],
    description: "Revenu",
  };
  await createRevenue(revenue);
  await refreshAll();
}

async function updateExpense(id, updatedFields) {
  await updateExpenseAPI({ id, ...updatedFields });
  await refreshAll();
}

async function deleteExpense(id) {
  const sure = confirm("Supprimer définitivement cette dépense ?");
  if (!sure) return;
  await deleteExpenseAPI(id);
  resetForm();
  await refreshAll();
}

async function deleteRevenue(id) {
  const sure = confirm("Supprimer définitivement ce revenu ?");
  if (!sure) return;
  await deleteRevenueAPI(id);
  await refreshAll();
}

function startEdit(id) {
  const exp = expenses.find((e) => String(e.id) === String(id));
  if (!exp) return;

  editingId = exp.id;
  amountInput.value = exp.amount;
  dateInput.value = exp.date;
  descriptionInput.value = exp.description;
  categoryInput.value = exp.category;

  setMode('edit');
  amountInput.focus();
}

// Reset DB (avec tes endpoints existants) : on supprime tout en boucle
async function resetAllData() {
  const sure = confirm(
    "⚠️ Tu es sûr de vouloir supprimer TOUTES les données ?\n\nDépenses + Revenus + Objectifs seront effacés."
  );
  if (!sure) return;

  // on récupère tout puis on delete chaque ligne
  const [exp, rev, gls] = await Promise.all([
    apiJSON("api/expenses.php"),
    apiJSON("api/revenues.php"),
    apiJSON("api/goals.php"),
  ]);

  await Promise.all((exp || []).map(e => deleteExpenseAPI(e.id)));
  await Promise.all((rev || []).map(r => deleteRevenueAPI(r.id)));
  await Promise.all((gls || []).map(g => deleteGoalAPI(g.id)));

  editingId = null;
  resetForm();
  await refreshAll();
}

// Recharge toutes les données puis rerender
async function refreshAll() {
  await Promise.all([loadExpenses(), loadRevenues(), loadGoals()]);
  renderTable();
  renderChart();
  renderSummary();
  renderGoals();
}

// ------------- Helpers -------------

function formatAmount(amount) {
  const n = Number(amount) || 0;
  return n.toFixed(2).replace('.', ',') + ' €';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function categoryLabel(cat) {
  switch (cat) {
    case 'logement':
      return 'Logement';
    case 'alimentation':
      return 'Alimentation';
    case 'transports':
      return 'Transports';
    case 'loisirs':
      return 'Loisirs';
    default:
      return 'Autres';
  }
}

// Classe CSS pour le pill dans le tableau
function categoryClass(cat) {
  return 'cat-' + (cat || 'autres');
}

// Classe CSS pour la couleur de barre dans le graphique
function colorClass(cat) {
  return 'col-' + (cat || 'autres');
}

function setMode(mode) {
  if (mode === 'edit') {
    modeBadge.textContent = 'Mode : édition';
    submitLabel.textContent = 'Mettre à jour la dépense';
    cardTitle.textContent = 'Modifier une dépense';
    cancelEditBtn.disabled = false;
  } else {
    modeBadge.textContent = 'Mode : ajout';
    submitLabel.textContent = 'Ajouter la dépense';
    cardTitle.textContent = 'Nouvelle dépense';
    cancelEditBtn.disabled = true;
    editingId = null;
  }
}

function resetForm() {
  expenseForm.reset();
  dateInput.valueAsDate = new Date();
  setMode('add');
}

// ------------- Rendu du tableau (dépenses + revenus) -------------

function renderTable() {
  tableBody.innerHTML = '';

  // dépenses valides
  const validExpenses = expenses.filter(
    (exp) => exp && typeof exp === 'object' && typeof exp.date === 'string'
  );

  // revenus valides
  const validRevenues = revenues.filter(
    (rev) => rev && typeof rev === 'object' && typeof rev.date === 'string'
  );

  // fusion en une seule liste
  const rows = [
    ...validExpenses.map((exp) => ({
      ...exp,
      kind: 'expense'
    })),
    ...validRevenues.map((rev) => ({
      id: rev.id,
      amount: rev.amount,
      date: rev.date,
      description: rev.description || 'Revenu',
      category: 'revenu',
      kind: 'revenue'
    }))
  ];

  if (rows.length === 0) {
    emptyState.style.display = 'block';
    tableWrapper.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';

  // tri par date (plus récentes en haut)
  const sorted = [...rows].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );

  for (const row of sorted) {
    const tr = document.createElement('tr');

    // Date
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(row.date);
    tr.appendChild(tdDate);

    // Type
    const tdType = document.createElement('td');
    tdType.textContent = row.kind === 'revenue' ? 'Revenu' : 'Dépense';
    tr.appendChild(tdType);

    // Description
    const tdDesc = document.createElement('td');
    tdDesc.textContent = row.description;
    tr.appendChild(tdDesc);

    // Catégorie
    const tdCat = document.createElement('td');
    tdCat.className = 'category-pill';
    const spanCat = document.createElement('span');
    if (row.kind === 'revenue') {
      spanCat.textContent = 'Revenu';
      spanCat.className = 'cat-revenu';
    } else {
      spanCat.textContent = categoryLabel(row.category);
      spanCat.className = categoryClass(row.category);
    }
    tdCat.appendChild(spanCat);
    tr.appendChild(tdCat);

    // Montant
    const tdAmount = document.createElement('td');
    tdAmount.className = 'amount';
    if (row.kind === 'revenue') {
      tdAmount.style.color = '#22c55e';
      tdAmount.textContent = '+ ' + formatAmount(row.amount);
    } else {
      tdAmount.style.color = '#c52222';
      tdAmount.textContent = '- ' + formatAmount(row.amount);
    }
    tr.appendChild(tdAmount);

    // Actions
    const tdActions = document.createElement('td');

    if (row.kind === 'revenue') {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger';
      deleteBtn.textContent = '🗑️ Supprimer';
      deleteBtn.addEventListener('click', () => deleteRevenue(row.id));
      tdActions.appendChild(deleteBtn);
    } else {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'secondary';
      editBtn.textContent = '✏️ Modifier';
      editBtn.addEventListener('click', () => startEdit(row.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger';
      deleteBtn.textContent = '🗑️ Supprimer';
      deleteBtn.addEventListener('click', () => deleteExpense(row.id));

      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);
    }

    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  }

}

function renderGoals() {
  if (!goalsList) return;
  goalsList.innerHTML = '';

  if (!goals || goals.length === 0) {
    goalsList.innerHTML = '<p class="empty-state">Aucun objectif pour le moment.</p>';
    return;
  }

  for (const goal of goals) {
    const saved = Number(goal.saved) || 0;
    const target = Number(goal.target) || 0;
    const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    const div = document.createElement('div');
    div.className = 'goal-item';

    div.innerHTML = `
      <div class="goal-header">
        <span class="goal-name">${goal.name}</span>
        <button type="button" class="danger goal-delete">🗑️</button>
      </div>

      <div class="goal-amount">
        ${formatAmount(saved)} / ${formatAmount(target)}
      </div>

      <div class="goal-bar-bg">
        <div class="goal-bar-fill" style="width:${progress}%"></div>
      </div>

      <div class="goal-footer">
        <div class="goal-actions">
          <button type="button" class="secondary goal-add">➕ +50 €</button>
          <button type="button" class="secondary goal-add-custom">➕ Montant</button>
        </div>
        <span>${progress.toFixed(1)}%</span>
      </div>
    `;

    // Delete
    div.querySelector('.goal-delete').addEventListener('click', async () => {
      await deleteGoalAPI(goal.id);
      await refreshAll();
    });

    // +50
    div.querySelector('.goal-add').addEventListener('click', async () => {
      const newSaved = Math.min(target, saved + 50);
      await updateGoalSaved(goal.id, newSaved);
      await refreshAll();
    });

    // Montant custom
    div.querySelector('.goal-add-custom').addEventListener('click', async () => {
      const raw = prompt("Combien veux-tu ajouter à cet objectif ? (en €)");
      const val = parseFloat((raw || '').replace(',', '.'));
      if (isNaN(val) || val <= 0) return;

      const newSaved = Math.min(target, saved + val);
      await updateGoalSaved(goal.id, newSaved);
      await refreshAll();
    });

    goalsList.appendChild(div);
  }
}

// ------------- Rendu du graphique (dépenses par catégorie) -------------

function renderChart() {
  chartContainer.innerHTML = '';

  if (expenses.length === 0) {
    chartTotal.textContent = 'Aucune dépense à afficher.';
    return;
  }

  const totals = {
    logement: 0,
    alimentation: 0,
    transports: 0,
    loisirs: 0,
    autres: 0
  };

  let totalAll = 0;

  for (const exp of expenses) {
    const cat = exp.category || 'autres';
    const amt = exp.amount;
    if (!totals[cat]) totals[cat] = 0;
    totals[cat] += amt;
    totalAll += amt;
  }

  const max = Math.max(...Object.values(totals));
  const categoriesOrder = ['logement', 'alimentation', 'transports', 'loisirs', 'autres'];

  for (const cat of categoriesOrder) {
    const amount = totals[cat];
    if (amount === 0) continue;

    const row = document.createElement('div');
    row.className = 'chart-row';

    const header = document.createElement('div');
    header.className = 'chart-row-header';

    const label = document.createElement('span');
    label.textContent = categoryLabel(cat);

    const percentage = ((amount / totalAll) * 100).toFixed(1);
    const value = document.createElement('span');
    value.textContent = `${formatAmount(amount)} • ${percentage}%`;

    header.appendChild(label);
    header.appendChild(value);

    const barBg = document.createElement('div');
    barBg.className = 'chart-bar-bg';

    const barFill = document.createElement('div');
    barFill.className = 'chart-bar-fill ' + colorClass(cat);

    const width = max === 0 ? 0 : (amount / max) * 100;
    barFill.style.width = width + '%';

    barBg.appendChild(barFill);
    row.appendChild(header);
    row.appendChild(barBg);
    chartContainer.appendChild(row);
  }

  chartTotal.textContent = 'Total des dépenses : ' + formatAmount(totalAll);
}

function renderSummary() {
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const reste = totalRevenues - totalExpenses;

  // Affichage
  if (depensesTotalValue) depensesTotalValue.textContent = formatAmount(totalExpenses);
  if (revenusValue) revenusValue.textContent = formatAmount(totalRevenues);
  if (resteAVivreValue) resteAVivreValue.textContent = formatAmount(reste);

  // Couleurs (reste à vivre)
  if (resteAVivreValue) {
    resteAVivreValue.classList.remove('positive', 'negative', 'neutral');
    resteAVivreValue.classList.add(reste > 0 ? 'positive' : reste < 0 ? 'negative' : 'neutral');
  }

  // Couleur cohérente pour revenus/dépenses
  if (revenusValue) {
    revenusValue.classList.remove('positive', 'negative', 'neutral');
    revenusValue.classList.add('positive');
  }
  if (depensesTotalValue) {
    depensesTotalValue.classList.remove('positive', 'negative', 'neutral');
    depensesTotalValue.classList.add('negative');
  }

}

// ------------- Events -------------

expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const amount = parseFloat(amountInput.value);
  const date = dateInput.value;
  const description = descriptionInput.value.trim();
  const category = categoryInput.value;

  if (isNaN(amount) || amount <= 0) {
    alert('Le montant doit être un nombre positif.');
    return;
  }
  if (!date || !description || !category) {
    alert('Merci de remplir tous les champs.');
    return;
  }

  if (editingId) {
    await updateExpense(editingId, { amount, date, description, category });
    resetForm();
  } else {
    await addExpense({ amount, date, description, category });
    resetForm();
  }
});

if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => resetForm());

// bouton "Ajouter" des revenus (API)
if (revenuButton && amountRevenuInput) {
  const revenueAddButton = revenuButton.querySelector('button');

  if (revenueAddButton) {
    revenueAddButton.addEventListener('click', async () => {
      const amount = parseFloat(amountRevenuInput.value);

      if (isNaN(amount) || amount <= 0) {
        alert("Montant invalide");
        return;
      }

      await addRevenue(amount); // ✅ envoie au PHP/MySQL (via fetch dans addRevenue)
      amountRevenuInput.value = ""; // ✅ reset du champ
    });
  }
}

if (resetDataBtn) {
  resetDataBtn.addEventListener('click', resetAllData);
}


dateInput.addEventListener('click', () => {
  if (dateInput.showPicker) {
    dateInput.showPicker(); // Chrome / Edge
  }
});

if (goalForm) {
  goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = goalNameInput.value.trim();
    const target = parseFloat(goalAmountInput.value);

    if (!name || isNaN(target) || target <= 0) return;

    await createGoal({ name, target });
    goalForm.reset();
    await refreshAll();
  });
}


// ------------- Initialisation -------------

async function init() {
  if (dateInput) dateInput.valueAsDate = new Date();
  await refreshAll();
}
init();