// ================== LOGIQUE JS ==================

// Sélecteurs principaux
const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('category');

const tableBody = document.getElementById('expenseTableBody');
const countBadge = document.getElementById('countBadge');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.getElementById('tableWrapper');

const chartContainer = document.getElementById('chart');
const chartTotal = document.getElementById('chartTotal');

const modeBadge = document.getElementById('modeBadge');
const submitBtn = document.getElementById('submitBtn');
const submitLabel = document.getElementById('submitLabel');
const cardTitle = document.getElementById('cardtitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Etat de l'application
let expenses = [];      // { id, amount, date, description, category }
let editingId = null;   // id de la dépense en cours d'édition

// ------------- LocalStorage -------------
const STORAGE_KEY = 'budget_app_expenses';

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            expenses = data;
        }
    } catch (e) {
        console.error('Erreur de parsing localStorage', e);
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
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
        case 'logement': return 'Logement';
        case 'alimentation': return 'Alimentation';
        case 'transports': return 'Transports';
        case 'loisirs': return 'Loisirs';
        default: return 'Autres';
    }
}

function categoryClass(cat) {
    return 'cat-' + (cat || 'autres');
}

function colorClass(cat) {
    return 'col-' + (cat || 'autres');
}

function updateCountBadge() {
    const n = expenses.length;
    countBadge.textContent = n === 0
        ? '0 dépense'
        : n === 1
            ? '1 dépense'
            : n + ' dépenses';
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
    // Met la date du jour par défaut
    dateInput.valueAsDate = new Date();
    setMode('add');
}

// ------------- Rendu du tableau -------------
function renderTable() {
    tableBody.innerHTML = '';

    if (expenses.length === 0) {
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    // Option : trier par date descendante
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

    for (const exp of sorted) {
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(exp.date);
        tr.appendChild(tdDate);

        const tdDesc = document.createElement('td');
        tdDesc.textContent = exp.description;
        tr.appendChild(tdDesc);

        const tdCat = document.createElement('td');
        tdCat.className = 'category-pill';
        const spanCat = document.createElement('span');
        spanCat.textContent = categoryLabel(exp.category);
        spanCat.className = categoryClass(exp.category);
        tdCat.appendChild(spanCat);
        tr.appendChild(tdCat);

        const tdAmount = document.createElement('td');
        tdAmount.className = 'amount';
        tdAmount.textContent = formatAmount(exp.amount);
        tr.appendChild(tdAmount);

        const tdActions = document.createElement('td');

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'secondary';
        editBtn.textContent = '✏️ Modifier';
        editBtn.addEventListener('click', () => startEdit(exp.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'danger';
        deleteBtn.textContent = '🗑️ Supprimer';
        deleteBtn.addEventListener('click', () => deleteExpense(exp.id));

        tdActions.appendChild(editBtn);
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
    }

    updateCountBadge();
}

// ------------- Rendu du graphique -------------
function renderChart() {
    chartContainer.innerHTML = '';

    if (expenses.length === 0) {
        chartTotal.textContent = 'Aucune dépense à afficher.';
        return;
    }

    // Calcul des totaux par catégorie
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

    // Max pour adapter la largeur des barres
    const max = Math.max(...Object.values(totals));

    const categoriesOrder = ['logement', 'alimentation', 'transports', 'loisirs', 'autres'];

    for (const cat of categoriesOrder) {
        const amount = totals[cat];
        if (amount === 0) continue; // On n'affiche pas les catégories vides

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

// ------------- CRUD -------------
function addExpense(expense) {
    expenses.push(expense);
    saveToStorage();
    renderTable();
    renderChart();
}

function updateExpense(id, updatedFields) {
    expenses = expenses.map(exp =>
        exp.id === id ? { ...exp, ...updatedFields } : exp
    );
    saveToStorage();
    renderTable();
    renderChart();
}

function deleteExpense(id) {
    const sure = confirm('Supprimer définitivement cette dépense ?');
    if (!sure) return;

    expenses = expenses.filter(exp => exp.id !== id);
    saveToStorage();
    renderTable();
    renderChart();
    resetForm();
    updateCountBadge();
}

function startEdit(id) {
    const exp = expenses.find(e => e.id === id);
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

// ------------- Initialisation -------------
function init() {
    loadFromStorage();
    // Date par défaut = aujourd'hui
    dateInput.valueAsDate = new Date();
    updateCountBadge();
    renderTable();
    renderChart();
}

init();
