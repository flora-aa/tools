function getLastAmounts() {
  try {
    const data = localStorage.getItem('mm_lastAmounts');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setLastAmount(category, amount) {
  const lastAmounts = getLastAmounts();
  lastAmounts[category] = amount;
  localStorage.setItem('mm_lastAmounts', JSON.stringify(lastAmounts));
}

function openQuickPanel() {
  quickSelectedCategory = null;
  document.getElementById('quickAmountBar').style.display = 'none';
  document.getElementById('btnQuickSubmit').style.display = 'none';
  renderQuickCategories();
  openOverlay('quickOverlay');
}

function closeQuickPanel() {
  closeAllOverlays();
  quickSelectedCategory = null;
}

function renderQuickCategories() {
  const grid = document.getElementById('quickCategoryGrid');
  const lastAmounts = getLastAmounts();

  grid.innerHTML = CATEGORIES.map(c => {
    const amount = lastAmounts[c] || 0;
    const isSelected = c === quickSelectedCategory;
    const displayAmount = amount > 0 ? formatAmount(amount) : '';
    return `
      <button class="quick-cat-btn ${isSelected ? 'selected' : ''}" data-category="${c}">
        <span class="quick-cat-name">${c}</span>
        ${displayAmount ? `<span class="quick-cat-amount">${displayAmount}</span>` : ''}
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.quick-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      quickSelectedCategory = btn.dataset.category;
      const lastAmounts = getLastAmounts();
      const amount = lastAmounts[quickSelectedCategory] || 0;
      const bar = document.getElementById('quickAmountBar');
      const display = document.getElementById('quickAmountDisplay');
      const submitBtn = document.getElementById('btnQuickSubmit');

      if (amount > 0) {
        bar.style.display = '';
        display.textContent = formatAmount(amount);
        submitBtn.style.display = '';
      } else {
        bar.style.display = 'none';
        submitBtn.style.display = 'none';
      }

      renderQuickCategories();
    });
  });
}

function quickSubmit() {
  if (!quickSelectedCategory) return;

  const lastAmounts = getLastAmounts();
  let amount = lastAmounts[quickSelectedCategory] || 0;

  if (amount <= 0) return;

  const currentTotal = getTotalExpense();
  if (currentTotal + amount > MAX_TOTAL) {
    showToast('累计支出已达上限');
    return;
  }

  const transaction = {
    id: generateId(),
    subType: quickSelectedCategory === '退款' ? 'refund' : 'expense',
    amount: amount,
    category: quickSelectedCategory,
    note: '',
    date: selectedDate,
    createdAt: Date.now()
  };

  transactions.push(transaction);
  saveData();

  showToast(`已记录 ${formatAmount(amount)}`);

  closeQuickPanel();
  refreshAll();
}
