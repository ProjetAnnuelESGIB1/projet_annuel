// ================== LOGIQUE JS ==================

// Sélecteurs principaux
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

const STORAGE_KEY_GOALS = 'budget_app_goals';
let goals = [];

// État de l'application
let expenses = [];  // { id, amount, date, description, category }
let revenues = [];  // { id, amount, date, description }
let editingId = null; // id de la dépense en cours d'édition

// ------------- LocalStorage -------------
const STORAGE_KEY_EXPENSES = 'budget_app_expenses';
const STORAGE_KEY_REVENUES = 'budget_app_revenues';

function loadExpenses() {
  const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      expenses = data.filter(
        (e) =>
          e &&
          typeof e === 'object' &&
          typeof e.amount === 'number' &&
          typeof e.date === 'string' &&
          typeof e.description === 'string' &&
          typeof e.category === 'string'
      );
    }
  } catch (e) {
    console.error('Erreur de parsing dépenses', e);
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
}

function loadRevenues() {
  const raw = localStorage.getItem(STORAGE_KEY_REVENUES);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      revenues = data.filter(
        (r) =>
          r &&
          typeof r === 'object' &&
          typeof r.amount === 'number' &&
          typeof r.date === 'string'
      );
    }
  } catch (e) {
    console.error('Erreur de parsing revenus', e);
  }
}

function saveRevenues() {
  localStorage.setItem(STORAGE_KEY_REVENUES, JSON.stringify(revenues));
}

// ------------- Helpers -------------

function formatAmount(amount) {
  return amount.toFixed(2).replace('.', ',') + ' €';
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

function loadGoals() {
  const raw = localStorage.getItem(STORAGE_KEY_GOALS);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) goals = data;
  } catch {}
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
}

function renderGoals() {
  if (!goalsList) return;
  goalsList.innerHTML = '';

  if (goals.length === 0) {
    goalsList.innerHTML = '<p class="empty-state">Aucun objectif pour le moment.</p>';
    return;
  }

  for (const goal of goals) {
    const progress = Math.min((goal.saved / goal.target) * 100, 100);

    const div = document.createElement('div');
    div.className = 'goal-item';

    div.innerHTML = `
      <div class="goal-header">
        <span class="goal-name">${goal.name}</span>
        <button class="danger" data-id="${goal.id}">🗑️</button>
      </div>

      <div class="goal-amount">
        ${formatAmount(goal.saved)} / ${formatAmount(goal.target)}
      </div>

      <div class="goal-bar-bg">
        <div class="goal-bar-fill" style="width:${progress}%"></div>
      </div>

      
      <div class="goal-footer">
        <div class="goal-actions">
          <button type="button" class="secondary goal-add" data-id="${goal.id}">➕ +50 €</button>
          <button type="button" class="secondary goal-add-custom" data-id="${goal.id}">➕ Montant</button>
        </div>

        <span>${progress.toFixed(1)}%</span>
      </div>

    `;

    // Supprimer l'objectif
    div.querySelector('.danger').addEventListener('click', () => {
      goals = goals.filter(g => g.id !== goal.id);
      saveGoals();
      renderGoals();
    });

    // Ajouter +50 €
    div.querySelector('.goal-add').addEventListener('click', () => {
      const g = goals.find(x => x.id === goal.id);
      if (!g) return;

      g.saved = Math.min(g.target, (Number(g.saved) || 0) + 50);
      saveGoals();
      renderGoals();
    });

    // Ajouter un montant perso
    div.querySelector('.goal-add-custom').addEventListener('click', () => {
      const g = goals.find(x => x.id === goal.id);
      if (!g) return;

      const raw = prompt("Combien veux-tu ajouter à cet objectif ? (en €)");
      const val = parseFloat((raw || '').replace(',', '.'));
      if (isNaN(val) || val <= 0) return;

      g.saved = Math.min(g.target, (Number(g.saved) || 0) + val);
      saveGoals();
      renderGoals();
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

// ------------- CRUD Dépenses & Revenus -------------

function addExpense(expense) {
  expenses.push(expense);
  saveExpenses();
  renderTable();
  renderChart();
  renderSummary();
}

function addRevenue(amount) {
  const revenue = {
    id: Date.now().toString(),
    amount: amount,
    date: new Date().toISOString().split('T')[0],
    description: 'Revenu'
  };
  revenues.push(revenue);
  saveRevenues();
  renderTable();
  renderChart();
  renderSummary();
}

function updateExpense(id, updatedFields) {
  expenses = expenses.map((exp) =>
    exp.id === id ? { ...exp, ...updatedFields } : exp
  );
  saveExpenses();
  renderTable();
  renderChart();
  renderSummary();
}

function deleteExpense(id) {
  const sure = confirm('Supprimer définitivement cette dépense ?');
  if (!sure) return;
  expenses = expenses.filter((exp) => exp.id !== id);
  saveExpenses();
  renderTable();
  renderChart();
  renderSummary();
  resetForm();
}

function deleteRevenue(id) {
  const sure = confirm('Supprimer définitivement ce revenu ?');
  if (!sure) return;
  revenues = revenues.filter((rev) => rev.id !== id);
  saveRevenues();
  renderTable();
  renderChart();
  renderSummary();
}

function resetAllData() {
  const sure = confirm(
    "⚠️ Tu es sûr de vouloir supprimer TOUTES les données ?\n\nDépenses + Revenus seront effacés définitivement."
  );
  if (!sure) return;

  expenses = [];
  revenues = [];
  editingId = null;

  localStorage.removeItem(STORAGE_KEY_EXPENSES);
  localStorage.removeItem(STORAGE_KEY_REVENUES);

  renderTable();
  renderChart();
  if (typeof renderSummary === "function") renderSummary();

  resetForm();
}


function startEdit(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;

  editingId = id;
  amountInput.value = exp.amount;
  dateInput.value = exp.date;
  descriptionInput.value = exp.description;
  categoryInput.value = exp.category;
  setMode('edit');
  amountInput.focus();
}

// ------------- Events -------------

expenseForm.addEventListener('submit', (event) => {
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
    updateExpense(editingId, { amount, date, description, category });
    resetForm();
  } else {
    const newExpense = {
      id: Date.now().toString(),
      amount,
      date,
      description,
      category
    };
    addExpense(newExpense);
    resetForm();
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

// bouton "Ajouter" des revenus
if (revenuButton && amountRevenuInput) {
  const revenueAddButton = revenuButton.querySelector('button');
  if (revenueAddButton) {
    revenueAddButton.addEventListener('click', () => {
      const amount = parseFloat(amountRevenuInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('Montant invalide');
        return;
      }
      addRevenue(amount);
      amountRevenuInput.value = '';
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
  goalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = goalNameInput.value.trim();
    const target = parseFloat(goalAmountInput.value);

    if (!name || isNaN(target) || target <= 0) return;

    goals.push({
      id: Date.now().toString(),
      name,
      target,
      saved: 0
    });

    saveGoals();
    renderGoals();
    goalForm.reset();
  });
}


// ------------- Initialisation -------------


function init() {
  loadExpenses();
  loadRevenues();
  loadGoals();       
  dateInput.valueAsDate = new Date();
  renderTable();
  renderChart();
  renderSummary();
  renderGoals();     
}

init();