const categories = {
  income: [
    '💼 Salary',
    '💻 Freelance',
    '📊 Investment',
    '🎁 Gift',
    '💰 Other Income'
  ],
  expense: [
    '🍔 Food',
    '🚗 Transport',
    '🛒 Shopping',
    '💡 Bills',
    '🏥 Health',
    '📚 Education',
    '🎮 Entertainment',
    '🏠 Rent',
    '📋 Other Expense'
  ]
};

let currentType = 'income';
let activeFilter = 'all';
let transactions = [];

const els = {
  form: document.getElementById('transactionForm'),
  description: document.getElementById('description'),
  amount: document.getElementById('amount'),
  date: document.getElementById('date'),
  category: document.getElementById('category'),
  incomeTypeBtn: document.getElementById('incomeTypeBtn'),
  expenseTypeBtn: document.getElementById('expenseTypeBtn'),
  balanceAmount: document.getElementById('balanceAmount'),
  incomeAmount: document.getElementById('incomeAmount'),
  expenseAmount: document.getElementById('expenseAmount'),
  transactionList: document.getElementById('transactionList'),
  recordCount: document.getElementById('recordCount'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortFilter: document.getElementById('sortFilter'),
  chartWrap: document.getElementById('chartWrap'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toast: document.getElementById('toast')
};

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function setToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  els.date.value = `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function updateCategoryOptions() {
  const list = categories[currentType];
  els.category.innerHTML = '<option value="">— Select category —</option>' +
    list.map(item => `<option value="${item}">${item}</option>`).join('');
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  if (isLight) {
    document.documentElement.setAttribute('data-theme', 'light');
    els.themeToggleBtn.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    els.themeToggleBtn.textContent = '🌙';
  }
  try { localStorage.setItem('spendwise_theme', theme); } catch (e) { }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('spendwise_theme'); } catch (e) { saved = null; }
  if (saved === 'light') applyTheme('light');
  else applyTheme('dark');
  els.themeToggleBtn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(now === 'light' ? 'dark' : 'light');
  });
}

function updateFilterCategories() {
  const allCategories = [...categories.income, ...categories.expense];
  els.categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
    allCategories.map(item => `<option value="${item}">${item}</option>`).join('');
}

function setType(type) {
  currentType = type;
  els.incomeTypeBtn.classList.toggle('active-income', type === 'income');
  els.expenseTypeBtn.classList.toggle('active-expense', type === 'expense');
  if (type !== 'income') els.incomeTypeBtn.classList.remove('active-income');
  if (type !== 'expense') els.expenseTypeBtn.classList.remove('active-expense');
  updateCategoryOptions();
}

function save() {
  try {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  } catch (e) { /* ignore storage errors */ }
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem('spendwise_transactions');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      transactions = parsed.map(t => ({ ...t, amount: Number(t.amount) }));
    }
  } catch (e) {
    transactions = [];
  }
}

function addTransaction(data) {
  transactions.unshift({
    id: crypto.randomUUID(),
    ...data,
    amount: Number(data.amount)
  });
  save();
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  save();
  render();
  showToast('Transaction deleted');
}

function clearAll() {
  if (!transactions.length) {
    showToast('No transactions to clear');
    return;
  }
  const ok = confirm('Clear all transactions?');
  if (!ok) return;
  transactions = [];
  save();
  render();
  showToast('All transactions cleared');
}

function getFilteredTransactions() {
  let list = [...transactions];

  if (activeFilter !== 'all') {
    list = list.filter(item => item.type === activeFilter);
  }

  const categoryValue = els.categoryFilter.value;
  if (categoryValue !== 'all') {
    list = list.filter(item => item.category === categoryValue);
  }

  const sortValue = els.sortFilter.value;
  if (sortValue === 'newest') {
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortValue === 'oldest') {
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortValue === 'highest') {
    list.sort((a, b) => b.amount - a.amount);
  } else if (sortValue === 'lowest') {
    list.sort((a, b) => a.amount - b.amount);
  }

  return list;
}

function renderSummary() {
  const income = transactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expense;

  els.incomeAmount.textContent = formatCurrency(income);
  els.expenseAmount.textContent = formatCurrency(expense);
  els.balanceAmount.textContent = formatCurrency(balance);
}

function renderTransactions() {
  const list = getFilteredTransactions();
  els.recordCount.textContent = `${list.length} record${list.length === 1 ? '' : 's'}`;

  if (!list.length) {
    els.transactionList.innerHTML = `
      <div class="empty">
        <strong>No transactions yet.</strong>
        Add your first one!
      </div>
    `;
    return;
  }

  els.transactionList.innerHTML = list.map(item => `
    <div class="transaction-item">
      <div class="tx-icon ${item.type}">${item.type === 'income' ? '⬆' : '⬇'}</div>
      <div class="tx-main">
        <div class="tx-title">${escapeHtml(item.description)}</div>
        <div class="tx-meta">
          <span>${item.category}</span>
          <span>${formatDate(item.date)}</span>
        </div>
      </div>
      <div class="tx-side">
        <div class="tx-amount ${item.type}">${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount)}</div>
        <button class="icon-btn" data-delete-id="${item.id}" title="Delete">🗑</button>
      </div>
    </div>
  `).join('');
}

function renderChart() {
  const expenses = transactions.filter(item => item.type === 'expense');
  if (!expenses.length) {
    els.chartWrap.innerHTML = '<div class="empty">No expense data yet.</div>';
    return;
  }

  const grouped = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const rows = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const max = rows[0][1] || 1;

  els.chartWrap.innerHTML = rows.map(([category, amount]) => `
    <div class="bar-row">
      <div class="bar-top">
        <span>${category}</span>
        <span>${formatCurrency(amount)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(amount / max) * 100}%"></div>
      </div>
    </div>
  `).join('') + '<div class="hint">Expense categories are ranked from highest to lowest.</div>';
}

function render() {
  renderSummary();
  renderTransactions();
  renderChart();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

els.form.addEventListener('submit', event => {
  event.preventDefault();

  const description = els.description.value.trim();
  const amount = Number(els.amount.value);
  const date = els.date.value;
  const category = els.category.value;

  if (!description || !amount || amount <= 0 || !date || !category) {
    showToast('Please fill all fields correctly');
    return;
  }

  addTransaction({ description, amount, date, category, type: currentType });
  els.form.reset();
  setToday();
  updateCategoryOptions();
  showToast('Transaction added successfully');
});

els.incomeTypeBtn.addEventListener('click', () => setType('income'));
els.expenseTypeBtn.addEventListener('click', () => setType('expense'));
els.clearAllBtn.addEventListener('click', clearAll);
els.categoryFilter.addEventListener('change', render);
els.sortFilter.addEventListener('change', render);

document.getElementById('filterTypeTabs').addEventListener('click', event => {
  const btn = event.target.closest('.tab');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  render();
});

els.transactionList.addEventListener('click', event => {
  const btn = event.target.closest('[data-delete-id]');
  if (!btn) return;
  deleteTransaction(btn.dataset.deleteId);
});

updateFilterCategories();
loadTransactions();
initTheme();
setType('income');
setToday();
render();
