function updateMonthLabel() {
  document.getElementById('monthLabel').textContent = `${currentYear}年${currentMonth}月`;
}

function getMonthTransactions() {
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth
      && (t.subType === 'expense' || t.subType === 'advance');
  });
}

function updateMonthExpense() {
  const monthTx = getMonthTransactions();
  const refunds = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.subType === 'refund';
  });
  const total = monthTx.reduce((sum, t) => sum + Number(t.amount), 0)
    - refunds.reduce((sum, t) => sum + Number(t.amount), 0);
  document.getElementById('monthExpense').textContent = formatAmount(Math.max(0, total));
}

function getSelectedDateTransactions() {
  return transactions
    .filter(t => t.date === selectedDate)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getSelectedDateExpense() {
  const listTx = getSelectedDateTransactions();
  const expense = listTx
    .filter(t => t.subType === 'expense' || t.subType === 'advance')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const refund = listTx
    .filter(t => t.subType === 'refund')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  return Math.max(0, expense - refund);
}

function updateListDayExpense() {
  const total = getSelectedDateExpense();
  const el = document.getElementById('listDayExpense');
  if (total > 0) {
    el.textContent = formatAmount(total);
  } else {
    el.textContent = '';
  }
}

function formatDateLabel(dateStr) {
  const today = getTodayDate();
  if (dateStr === today) return '今天';

  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function renderList() {
  const container = document.getElementById('listBody');
  const listTx = getSelectedDateTransactions();

  renderSelectedDateBudget();

  document.getElementById('listTitle').textContent = formatDateLabel(selectedDate);
  document.getElementById('listCount').textContent = `${listTx.length} 笔`;
  updateListDayExpense();

  if (listTx.length === 0) {
    container.innerHTML = '<div class="empty-list">还没有记录</div>';
    return;
  }

  container.innerHTML = listTx.map(t => {
    const checked = selectedIds.has(t.id) ? 'checking' : '';
    const isRefund = t.subType === 'refund';
    const isAdvance = t.subType === 'advance';
    const typeTag = isRefund ? '<span class="list-item-tag tag-refund">退款</span>'
      : isAdvance ? '<span class="list-item-tag tag-advance">垫付</span>' : '';
    const amountClass = isRefund ? 'list-item-amount refund' : 'list-item-amount';
    const amountSign = isRefund ? '+' : '-';
    return `
      <div class="list-item ${checked} ${isSelectMode ? 'selectable' : ''}" data-id="${t.id}">
        <div class="list-item-check">✓</div>
        <div class="list-item-info">
          <div class="list-item-category">${t.category}${typeTag}</div>
          ${t.note ? `<div class="list-item-note">${escapeHtml(t.note)}</div>` : ''}
        </div>
        <div class="list-item-right">
          <div>
            <div class="${amountClass}">${amountSign}${formatAmount(t.amount).slice(1)}</div>
            <div class="list-item-time">${getTimeFromTimestamp(t.createdAt)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', () => {
      if (isSelectMode) {
        toggleSelectItem(el.dataset.id);
      } else {
        openEditPanel(el.dataset.id);
      }
    });
  });
}
