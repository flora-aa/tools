function openDataPanel() {
  document.getElementById('clearMonthDesc').textContent =
    `删除 ${currentYear}年${currentMonth}月 的所有账单`;

  const total = getTotalExpense();
  const el = document.getElementById('dataTotalExpense');
  el.textContent = formatAmount(total);

  initInheritPanel();
  resetExportForm();
  switchInheritTab('export');

  openOverlay('dataOverlay');
}

function closeDataPanel() {
  closeAllOverlays();
}

function clearCurrentMonth() {
  const before = transactions.length;
  transactions = transactions.filter(t => {
    const d = new Date(t.date);
    return !(d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth);
  });
  const count = before - transactions.length;
  if (count === 0) {
    showToast('本月暂无数据');
    closeDataPanel();
    return;
  }
  saveData();
  closeDataPanel();
  showToast(`已清除 ${count} 笔记录`);
  refreshAll();
}

function clearAllData() {
  transactions = [];
  saveData();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mm_memo_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  closeDataPanel();
  showToast('已清除所有数据');
  refreshAll();
}
