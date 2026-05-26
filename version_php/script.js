// ================== LOGIQUE JS ==================
// Ce fichier gère toute l'interactivité de l'application :
// - Communication avec l'API PHP (CRUD des dépenses, revenus, objectifs)
// - Affichage dynamique du tableau, du graphique et du résumé financier
// - Gestion des formulaires (ajout / modification / suppression)

// ================== 1. SÉLECTEURS DOM ==================
// On récupère les éléments HTML dont on aura besoin tout au long du script.
// getElementById() cible un élément par son attribut id="" dans le HTML.

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

// ================== 2. ÉTAT DE L'APPLICATION ==================
// Ces variables "état" contiennent les données en mémoire côté JS.
// Elles sont mises à jour à chaque appel API et servent à éviter
// des requêtes inutiles pour chaque affichage.

let goals = [];         // liste des objectifs d'épargne
let expenses = [];      // liste des dépenses  → { id, amount, date, description, category }
let revenues = [];      // liste des revenus   → { id, amount, date, description }
let editingId = null;   // id de la dépense en cours d'édition (null = mode ajout)

// ================== 3. API HELPERS ==================
// Couche d'abstraction pour communiquer avec le backend PHP via fetch().
// fetch() est l'API native du navigateur pour faire des requêtes HTTP asynchrones.
// Le mot-clé "async/await" permet d'écrire du code asynchrone de façon lisible.

async function apiJSON(url, options = {}) {
  // On envoie la requête avec les headers JSON par défaut
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options, // on fusionne les options supplémentaires (method, body…)
  });

  // Si la réponse HTTP n'est pas OK (code 200-299), on lève une erreur
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${txt}`);
  }

  // Certaines routes (DELETE/POST) peuvent renvoyer une réponse vide
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

// ---------- EXPENSES (Dépenses) ----------
// Chaque fonction correspond à une opération CRUD :
// Create → POST | Read → GET | Update → PUT | Delete → DELETE

async function loadExpenses() {
  // Récupère toutes les dépenses depuis la BDD via l'API PHP
  expenses = await apiJSON("api/expenses.php");
}

async function createExpense(expense) {
  // Envoie une nouvelle dépense en JSON au serveur (INSERT en BDD)
  await apiJSON("api/expenses.php", { method: "POST", body: JSON.stringify(expense) });
}

async function updateExpenseAPI(expense) {
  // Met à jour une dépense existante (UPDATE en BDD)
  await apiJSON("api/expenses.php", { method: "PUT", body: JSON.stringify(expense) });
}

async function deleteExpenseAPI(id) {
  // Supprime une dépense par son id (DELETE en BDD)
  await apiJSON(`api/expenses.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- REVENUES (Revenus) ----------

async function loadRevenues() {
  revenues = await apiJSON("api/revenues.php");
}

async function createRevenue(revenue) {
  await apiJSON("api/revenues.php", { method: "POST", body: JSON.stringify(revenue) });
}

async function deleteRevenueAPI(id) {
  await apiJSON(`api/revenues.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- GOALS (Objectifs d'épargne) ----------

async function loadGoals() {
  goals = await apiJSON("api/goals.php");
}

async function createGoal(goal) {
  await apiJSON("api/goals.php", { method: "POST", body: JSON.stringify(goal) });
}

async function updateGoalSaved(id, saved) {
  // Met à jour uniquement le montant épargné d'un objectif
  await apiJSON("api/goals.php", { method: "PUT", body: JSON.stringify({ id, saved }) });
}

async function deleteGoalAPI(id) {
  await apiJSON(`api/goals.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ================== 4. CRUD UI ==================
// Ces fonctions font le lien entre les actions de l'utilisateur
// (clic sur un bouton) et les appels API correspondants.
// Après chaque modification, refreshAll() est appelé pour
// resynchroniser l'affichage avec la BDD.

async function addExpense(expense) {
  await createExpense(expense);
  await refreshAll(); // on recharge tout après l'ajout
}

async function addRevenue(amount) {
  // On construit l'objet revenu avec la date du jour automatiquement
  const revenue = {
    amount,
    date: new Date().toISOString().split("T")[0], // format YYYY-MM-DD
    description: "Revenu",
  };
  await createRevenue(revenue);
  await refreshAll();
}

async function updateExpense(id, updatedFields) {
  // On fusionne l'id et les champs modifiés en un seul objet pour l'API
  await updateExpenseAPI({ id, ...updatedFields });
  await refreshAll();
}

async function deleteExpense(id) {
  // On demande une confirmation avant de supprimer (action irréversible)
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

// Pré-remplit le formulaire avec les données d'une dépense pour la modifier
function startEdit(id) {
  const exp = expenses.find((e) => String(e.id) === String(id));
  if (!exp) return;

  editingId = exp.id; // on mémorise l'id pour savoir qu'on est en mode édition

  // On remplit chaque champ du formulaire avec les valeurs existantes
  amountInput.value = exp.amount;
  dateInput.value = exp.date;
  descriptionInput.value = exp.description;
  categoryInput.value = exp.category;

  setMode('edit'); // on change l'apparence du formulaire
  amountInput.focus();
}

// Supprime TOUTES les données (dépenses + revenus + objectifs)
async function resetAllData() {
  const sure = confirm(
    "⚠️ Tu es sûr de vouloir supprimer TOUTES les données ?\n\nDépenses + Revenus + Objectifs seront effacés."
  );
  if (!sure) return;

  // Promise.all() permet de lancer plusieurs requêtes en parallèle
  // et d'attendre qu'elles soient TOUTES terminées avant de continuer
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

// Point d'entrée unique pour recharger et réafficher toutes les données
async function refreshAll() {
  // 1. On recharge les données depuis la BDD
  await Promise.all([loadExpenses(), loadRevenues(), loadGoals()]);
  // 2. On met à jour chaque partie de l'interface
  renderTable();    // tableau des transactions
  renderChart();    // graphique par catégorie
  renderSummary();  // résumé financier (total dépenses / revenus / reste)
  renderGoals();    // objectifs d'épargne
}

// ================== 5. FONCTIONS UTILITAIRES ==================
// Petites fonctions réutilisables qui formatent ou transforment des données.

// Convertit un nombre en montant affiché "1 234,56 €"
function formatAmount(amount) {
  const n = Number(amount) || 0;
  return n.toFixed(2).replace('.', ',') + ' €';
}

// Convertit une date "YYYY-MM-DD" (format BDD) en "DD/MM/YYYY" (format français)
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Retourne le libellé français d'une catégorie (clé BDD → label UI)
function categoryLabel(cat) {
  switch (cat) {
    case 'logement':     return 'Logement';
    case 'alimentation': return 'Alimentation';
    case 'transports':   return 'Transports';
    case 'loisirs':      return 'Loisirs';
    default:             return 'Autres';
  }
}

// Génère la classe CSS du badge de catégorie dans le tableau
function categoryClass(cat) {
  return 'cat-' + (cat || 'autres');
}

// Génère la classe CSS de la barre de couleur dans le graphique
function colorClass(cat) {
  return 'col-' + (cat || 'autres');
}

// Bascule l'interface entre le mode "ajout" et le mode "édition"
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

// Remet le formulaire à zéro et repasse en mode "ajout"
function resetForm() {
  expenseForm.reset();
  dateInput.valueAsDate = new Date(); // date du jour par défaut
  setMode('add');
}

// ================== 6. RENDU DU TABLEAU ==================
// Construit dynamiquement les lignes du tableau HTML à partir
// des tableaux expenses[] et revenues[] chargés en mémoire.

function renderTable() {
  tableBody.innerHTML = ''; // on vide le tableau avant de le reconstruire

  // On filtre pour ne garder que les entrées valides (objet avec une date)
  const validExpenses = expenses.filter(
    (exp) => exp && typeof exp === 'object' && typeof exp.date === 'string'
  );

  const validRevenues = revenues.filter(
    (rev) => rev && typeof rev === 'object' && typeof rev.date === 'string'
  );

  // On fusionne dépenses et revenus en une seule liste unifiée
  // Le champ "kind" permet de distinguer le type de ligne lors du rendu
  const rows = [
    ...validExpenses.map((exp) => ({ ...exp, kind: 'expense' })),
    ...validRevenues.map((rev) => ({
      id: rev.id,
      amount: rev.amount,
      date: rev.date,
      description: rev.description || 'Revenu',
      category: 'revenu',
      kind: 'revenue'
    }))
  ];

  // Si aucune transaction, on affiche le message "vide" et on masque le tableau
  if (rows.length === 0) {
    emptyState.style.display = 'block';
    tableWrapper.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';

  // Tri par date décroissante : les transactions les plus récentes en premier
  const sorted = [...rows].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );

  // Pour chaque transaction, on crée une ligne <tr> avec ses cellules <td>
  for (const row of sorted) {
    const tr = document.createElement('tr');

    // Cellule Date
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(row.date);
    tr.appendChild(tdDate);

    // Cellule Type (Revenu ou Dépense)
    const tdType = document.createElement('td');
    tdType.textContent = row.kind === 'revenue' ? 'Revenu' : 'Dépense';
    tr.appendChild(tdType);

    // Cellule Description
    const tdDesc = document.createElement('td');
    tdDesc.textContent = row.description;
    tr.appendChild(tdDesc);

    // Cellule Catégorie — affichée sous forme de badge coloré (pill)
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

    // Cellule Montant — vert pour les revenus, rouge pour les dépenses
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

    // Cellule Actions — boutons différents selon le type de ligne
    const tdActions = document.createElement('td');

    if (row.kind === 'revenue') {
      // Les revenus n'ont qu'un bouton Supprimer
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger';
      deleteBtn.textContent = '🗑️ Supprimer';
      deleteBtn.addEventListener('click', () => deleteRevenue(row.id));
      tdActions.appendChild(deleteBtn);
    } else {
      // Les dépenses ont un bouton Modifier et un bouton Supprimer
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

// ================== 7. RENDU DES OBJECTIFS ==================
// Affiche la liste des objectifs d'épargne avec une barre de progression.

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

    // Calcul du pourcentage de progression (plafonné à 100%)
    const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    const div = document.createElement('div');
    div.className = 'goal-item';

    // On utilise innerHTML ici pour injecter du HTML structuré directement
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

    // Bouton supprimer l'objectif
    div.querySelector('.goal-delete').addEventListener('click', async () => {
      await deleteGoalAPI(goal.id);
      await refreshAll();
    });

    // Bouton ajouter 50€ rapidement (montant fixe)
    div.querySelector('.goal-add').addEventListener('click', async () => {
      const newSaved = Math.min(target, saved + 50); // on ne dépasse pas l'objectif
      await updateGoalSaved(goal.id, newSaved);
      await refreshAll();
    });

    // Bouton ajouter un montant personnalisé via une boîte de dialogue
    div.querySelector('.goal-add-custom').addEventListener('click', async () => {
      const raw = prompt("Combien veux-tu ajouter à cet objectif ? (en €)");
      const val = parseFloat((raw || '').replace(',', '.')); // on accepte la virgule
      if (isNaN(val) || val <= 0) return;

      const newSaved = Math.min(target, saved + val);
      await updateGoalSaved(goal.id, newSaved);
      await refreshAll();
    });

    goalsList.appendChild(div);
  }
}

// ================== 8. RENDU DU GRAPHIQUE ==================
// Génère un graphique en barres horizontales des dépenses par catégorie.
// Chaque barre représente le montant d'une catégorie, sa largeur est
// proportionnelle à la catégorie la plus dépensée (et non au total).

function renderChart() {
  chartContainer.innerHTML = '';

  if (expenses.length === 0) {
    chartTotal.textContent = 'Aucune dépense à afficher.';
    return;
  }

  // On initialise les totaux par catégorie à 0
  const totals = {
    logement: 0,
    alimentation: 0,
    transports: 0,
    loisirs: 0,
    autres: 0
  };

  let totalAll = 0;

  // On parcourt toutes les dépenses et on cumule par catégorie
  for (const exp of expenses) {
    const cat = exp.category || 'autres';
    // parseFloat() est indispensable : la BDD renvoie les montants en STRING ("5.00")
    // Sans cette conversion, l'addition devient une concaténation → NaN%
    const amt = parseFloat(exp.amount) || 0;
    if (!totals[cat]) totals[cat] = 0;
    totals[cat] += amt;
    totalAll += amt;
  }

  // La barre la plus large correspond à la catégorie avec le plus de dépenses
  const max = Math.max(...Object.values(totals));

  // Ordre d'affichage fixe des catégories
  const categoriesOrder = ['logement', 'alimentation', 'transports', 'loisirs', 'autres'];

  for (const cat of categoriesOrder) {
    const amount = totals[cat];
    if (amount === 0) continue; // on n'affiche pas les catégories sans dépense

    const row = document.createElement('div');
    row.className = 'chart-row';

    const header = document.createElement('div');
    header.className = 'chart-row-header';

    const label = document.createElement('span');
    label.textContent = categoryLabel(cat);

    // Calcul du pourcentage sur le total général des dépenses
    const percentage = ((amount / totalAll) * 100).toFixed(1);
    const value = document.createElement('span');
    value.textContent = `${formatAmount(amount)} • ${percentage}%`;

    header.appendChild(label);
    header.appendChild(value);

    const barBg = document.createElement('div');
    barBg.className = 'chart-bar-bg';

    const barFill = document.createElement('div');
    barFill.className = 'chart-bar-fill ' + colorClass(cat);

    // La largeur de la barre est relative à la catégorie max (pas au total)
    const width = max === 0 ? 0 : (amount / max) * 100;
    barFill.style.width = width + '%';

    barBg.appendChild(barFill);
    row.appendChild(header);
    row.appendChild(barBg);
    chartContainer.appendChild(row);
  }

  chartTotal.textContent = 'Total des dépenses : ' + formatAmount(totalAll);
}

// ================== 9. RÉSUMÉ FINANCIER ==================
// Calcule et affiche les trois indicateurs clés en haut de page :
// Total dépenses | Total revenus | Reste à vivre

function renderSummary() {
  // reduce() parcourt le tableau et accumule une valeur (ici, la somme)
  // Number() convertit les montants en nombre (la BDD renvoie des strings)
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const reste = totalRevenues - totalExpenses; // positif = on a de l'argent, négatif = déficit

  // Mise à jour du texte dans le DOM
  if (depensesTotalValue) depensesTotalValue.textContent = formatAmount(totalExpenses);
  if (revenusValue)       revenusValue.textContent       = formatAmount(totalRevenues);
  if (resteAVivreValue)   resteAVivreValue.textContent   = formatAmount(reste);

  // Couleur dynamique du reste à vivre selon qu'il est positif ou négatif
  if (resteAVivreValue) {
    resteAVivreValue.classList.remove('positive', 'negative', 'neutral');
    resteAVivreValue.classList.add(reste > 0 ? 'positive' : reste < 0 ? 'negative' : 'neutral');
  }

  // Les revenus sont toujours en vert, les dépenses toujours en rouge
  if (revenusValue) {
    revenusValue.classList.remove('positive', 'negative', 'neutral');
    revenusValue.classList.add('positive');
  }
  if (depensesTotalValue) {
    depensesTotalValue.classList.remove('positive', 'negative', 'neutral');
    depensesTotalValue.classList.add('negative');
  }
}

// ================== 10. ÉVÉNEMENTS ==================
// On attache ici les écouteurs d'événements aux éléments du DOM.
// Un écouteur "écoute" une action utilisateur (clic, submit…)
// et exécute une fonction en réponse.

// Soumission du formulaire de dépense (ajout ou modification)
expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // on empêche le rechargement de la page (comportement par défaut)

  // Récupération et validation des valeurs du formulaire
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

  // Si editingId est défini → on est en mode édition, sinon en mode ajout
  if (editingId) {
    await updateExpense(editingId, { amount, date, description, category });
    resetForm();
  } else {
    await addExpense({ amount, date, description, category });
    resetForm();
  }
});

// Bouton "Annuler la modification" → repasse en mode ajout
if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => resetForm());

// Bouton "Ajouter" un revenu
if (revenuButton && amountRevenuInput) {
  const revenueAddButton = revenuButton.querySelector('button');

  if (revenueAddButton) {
    revenueAddButton.addEventListener('click', async () => {
      const amount = parseFloat(amountRevenuInput.value);

      if (isNaN(amount) || amount <= 0) {
        alert("Montant invalide");
        return;
      }

      await addRevenue(amount);
      amountRevenuInput.value = ""; // on vide le champ après ajout
    });
  }
}

// Bouton "Reset" → supprime toutes les données
if (resetDataBtn) {
  resetDataBtn.addEventListener('click', resetAllData);
}

// Ouvre le sélecteur de date natif au clic sur le champ date
dateInput.addEventListener('click', () => {
  if (dateInput.showPicker) {
    dateInput.showPicker();
  }
});

// Soumission du formulaire d'ajout d'objectif d'épargne
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

// ================== 11. INITIALISATION ==================
// Point de démarrage de l'application.
// Appelé une seule fois au chargement de la page.

async function init() {
  if (dateInput) dateInput.valueAsDate = new Date(); // date du jour par défaut dans le formulaire
  await refreshAll(); // charge les données et affiche l'interface
}

init(); // démarrage de l'app
