function loadData() {
  const data = localStorage.getItem('mm_transactions');
  if (data) {
    try {
      transactions = JSON.parse(data);
      transactions.forEach(t => {
        if (!t.subType) {
          t.subType = t.type === 'income' ? 'refund' : 'expense';
        }
      });
    } catch {
      transactions = [];
    }
  }
}

function saveData() {
  localStorage.setItem('mm_transactions', JSON.stringify(transactions));
}

function getMemoKey() {
  return `mm_memo_${currentYear}_${currentMonth}`;
}

function loadMemo() {
  const memo = localStorage.getItem(getMemoKey()) || '';
  const input = document.getElementById('memoInput');
  if (input) {
    input.value = memo;
    updateMemoCount();
    input.style.height = '';
    input.style.height = Math.max(100, Math.min(input.scrollHeight, 400)) + 'px';
  }
}

function saveMemo() {
  const input = document.getElementById('memoInput');
  if (input) {
    localStorage.setItem(getMemoKey(), input.value);
  }
}

function updateMemoCount() {
  const input = document.getElementById('memoInput');
  const count = document.getElementById('memoCount');
  if (input && count) {
    count.textContent = `${input.value.length}/500`;
  }
}

function getTotalExpense() {
  const expense = transactions
    .filter(t => t.subType === 'expense' || t.subType === 'advance')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const refund = transactions
    .filter(t => t.subType === 'refund')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  return Math.max(0, expense - refund);
}
