const CATEGORIES = {
  expense: ['餐饮', '购物', '交通', '娱乐', '住房', '通讯', '医疗', '教育', '其他'],
  income: ['工资', '奖金', '兼职', '投资', '红包', '其他']
};

let transactions = [];
let currentType = 'expense';
let currentYear = 0;
let currentMonth = 0;
let selectedCategory = '';
let selectedDate = '';
let isReviewMode = false;
let toastTimer = null;

function loadData() {
  const data = localStorage.getItem('mm_transactions');
  if (data) {
    try {
      transactions = JSON.parse(data);
    } catch {
      transactions = [];
    }
  }
}

function saveData() {
  localStorage.setItem('mm_transactions', JSON.stringify(transactions));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeFromTimestamp(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatAmount(amount) {
  const num = Number(amount);
  if (num >= 10000) {
    const val = (num / 10000).toFixed(1);
    return '¥' + (val.endsWith('.0') ? val.slice(0, -2) : val) + 'w';
  }
  if (num >= 1000) {
    const val = (num / 1000).toFixed(1);
    return '¥' + (val.endsWith('.0') ? val.slice(0, -2) : val) + 'k';
  }
  return '¥' + num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

function populateCategories() {
  const grid = document.getElementById('categoryGrid');
  const categories = CATEGORIES[currentType];

  if (!selectedCategory || !categories.includes(selectedCategory)) {
    selectedCategory = categories[0];
  }

  grid.innerHTML = categories.map(c => {
    const isSelected = c === selectedCategory;
    return `
      <button class="cat-btn ${isSelected ? 'selected' : ''}" data-category="${c}">
        <span>${c}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCategory = btn.dataset.category;
    });
  });
}

function initMonth() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;
}

function updateMonthLabel() {
  document.getElementById('monthLabel').textContent = `${currentYear}年${currentMonth}月`;
}

function getMonthTransactions() {
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.type === 'expense';
  });
}

function updateMonthExpense() {
  const monthTx = getMonthTransactions();
  const total = monthTx.reduce((sum, t) => sum + Number(t.amount), 0);
  document.getElementById('monthExpense').textContent = formatAmount(total);
}

function getSelectedDateTransactions() {
  return transactions
    .filter(t => t.date === selectedDate && t.type === 'expense')
    .sort((a, b) => b.createdAt - a.createdAt);
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

  document.getElementById('listTitle').textContent = formatDateLabel(selectedDate);
  document.getElementById('listCount').textContent = `${listTx.length} 笔`;

  if (listTx.length === 0) {
    container.innerHTML = '<div class="empty-list">还没有记录</div>';
    return;
  }

  container.innerHTML = listTx.map(t => {
    const checked = selectedIds.has(t.id) ? 'checking' : '';
    return `
      <div class="list-item ${checked} ${isSelectMode ? 'selectable' : ''}" data-id="${t.id}">
        <div class="list-item-check">✓</div>
        <div class="list-item-info">
          <div class="list-item-category">${t.category}</div>
          ${t.note ? `<div class="list-item-note">${escapeHtml(t.note)}</div>` : ''}
        </div>
        <div class="list-item-right">
          <div>
            <div class="list-item-amount">-${formatAmount(t.amount).slice(1)}</div>
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

function getMemoKey() {
  return `mm_memo_${currentYear}_${currentMonth}`;
}

function loadMemo() {
  const memo = localStorage.getItem(getMemoKey()) || '';
  const input = document.getElementById('memoInput');
  if (input) {
    input.value = memo;
    updateMemoCount();
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

function renderReview() {
  const monthTx = getMonthTransactions();

  document.getElementById('reviewPeriod').textContent = `${currentYear}年${currentMonth}月`;

  const total = monthTx.reduce((sum, t) => sum + Number(t.amount), 0);
  document.getElementById('reviewTotal').textContent = formatAmount(total);
  document.getElementById('reviewCount').textContent = monthTx.length;

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dailyAvg = monthTx.length > 0 ? total / daysInMonth : 0;
  document.getElementById('reviewDailyAvg').textContent = formatAmount(dailyAvg);

  const maxAmount = monthTx.length > 0 ? Math.max(...monthTx.map(t => Number(t.amount))) : 0;
  document.getElementById('reviewMax').textContent = formatAmount(maxAmount);

  const container = document.getElementById('reviewRank');
  if (monthTx.length === 0) {
    container.innerHTML = '<div class="empty-list">暂无数据</div>';
    return;
  }

  const grouped = {};
  monthTx.forEach(t => {
    if (!grouped[t.category]) {
      grouped[t.category] = { amount: 0, count: 0 };
    }
    grouped[t.category].amount += Number(t.amount);
    grouped[t.category].count += 1;
  });

  const sorted = Object.entries(grouped)
    .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
    .sort((a, b) => b.amount - a.amount);

  const maxCatAmount = sorted[0].amount;

  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const prevTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === prevYear && (d.getMonth() + 1) === prevMonth && t.type === 'expense';
  });

  const prevGrouped = {};
  prevTx.forEach(t => {
    if (!prevGrouped[t.category]) {
      prevGrouped[t.category] = 0;
    }
    prevGrouped[t.category] += Number(t.amount);
  });

  function getChangeText(currentAmount, category) {
    const prevAmount = prevGrouped[category] || 0;
    if (prevAmount === 0) return '<span class="change-none">—</span>';

    const diff = currentAmount - prevAmount;
    const pct = diff / prevAmount;

    if (Math.abs(pct) >= 0.01) {
      const pctDisplay = (pct * 100).toFixed(1);
      const cls = diff > 0 ? 'change-up' : 'change-down';
      const arrow = diff > 0 ? '↑' : '↓';
      return `<span class="${cls}">${arrow}${Math.abs(pctDisplay)}%</span>`;
    }

    if (Math.abs(diff) >= 1) {
      const cls = diff > 0 ? 'change-up' : 'change-down';
      const arrow = diff > 0 ? '↑' : '↓';
      return `<span class="${cls}">${arrow}${formatAmount(Math.abs(diff))}</span>`;
    }

    return '<span class="change-none">—</span>';
  }

  container.innerHTML = sorted.map(item => {
    const pct = maxCatAmount > 0 ? (item.amount / maxCatAmount * 100) : 0;
    const changeHtml = getChangeText(item.amount, item.category);
    return `
      <div class="review-rank-item" data-category="${item.category}">
        <div class="review-rank-item-info">
          <div class="review-rank-item-top">
            <span class="review-rank-item-name">${item.category}<span class="review-rank-item-count">${item.count}笔</span></span>
            <span class="review-rank-item-right">
              <span class="review-rank-item-change">${changeHtml}</span>
              <span class="review-rank-item-amount">${formatAmount(item.amount)}</span>
            </span>
          </div>
          <div class="review-rank-item-bar-bg">
            <div class="review-rank-item-bar" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.review-rank-item').forEach(el => {
    el.addEventListener('click', () => {
      showCategoryDetail(el.dataset.category);
    });
  });

  loadMemo();
}

function showCategoryDetail(category) {
  document.getElementById('reviewRank').style.display = 'none';
  document.getElementById('reviewCategoryDetail').style.display = '';
  document.getElementById('reviewCategoryTitle').textContent = category;

  const monthTx = getMonthTransactions();
  const filtered = monthTx
    .filter(t => t.category === category)
    .sort((a, b) => b.createdAt - a.createdAt);

  document.getElementById('reviewCategoryCount').textContent = `${filtered.length} 笔`;

  const container = document.getElementById('reviewCategoryList');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-list">暂无记录</div>';
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="review-category-item" data-id="${t.id}">
      <div class="review-category-item-info">
        <div class="review-category-item-date">${t.date}</div>
        ${t.note ? `<div class="review-category-item-note">${escapeHtml(t.note)}</div>` : ''}
      </div>
      <div class="review-category-item-amount">-${formatAmount(t.amount).slice(1)}</div>
    </div>
  `).join('');

  drawTrend(category);

  container.querySelectorAll('.review-category-item').forEach(el => {
    el.addEventListener('click', () => {
      openEditPanel(el.dataset.id);
    });
  });
}

function drawTrend(category) {
  const canvas = document.getElementById('trendCanvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width * dpr;
  const h = rect.height * dpr;
  canvas.width = w;
  canvas.height = h;
  ctx.scale(dpr, dpr);
  const cw = rect.width;
  const ch = rect.height;

  const months = [];
  for (let i = 6; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 1) { m += 12; y--; }
    months.push({ year: y, month: m });
  }

  const data = months.map(({ year, month }) => {
    const tx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month
        && t.type === 'expense' && t.category === category;
    });
    return {
      label: `${month}月`,
      amount: tx.reduce((s, t) => s + Number(t.amount), 0)
    };
  });

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  const padding = { top: 16, bottom: 20, left: 20, right: 20 };
  const chartW = cw - padding.left - padding.right;
  const chartH = ch - padding.top - padding.bottom;
  const stepX = chartW / (data.length - 1);

  ctx.clearRect(0, 0, cw, ch);

  if (data.every(d => d.amount === 0)) {
    ctx.fillStyle = '#555577';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无历史数据', cw / 2, ch / 2 + 4);
    return;
  }

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - (d.amount / maxVal) * chartH * 0.85,
    amount: d.amount
  }));

  ctx.beginPath();
  ctx.strokeStyle = '#5a5aff';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  points.forEach((p, i) => {
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#5a5aff';
    ctx.fill();
    ctx.strokeStyle = '#0d0d1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = '#8888aa';
  ctx.font = '10px -apple-system, sans-serif';
  data.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const labelW = ctx.measureText(d.label).width;
    const halfLabel = labelW / 2;
    let lx = x;
    if (x - halfLabel < 2) {
      lx = halfLabel + 4;
      ctx.textAlign = 'left';
    } else if (x + halfLabel > cw - 2) {
      lx = cw - halfLabel - 4;
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'center';
    }
    ctx.fillText(d.label, lx, ch - 2);
  });

  points.forEach((p, i) => {
    if (data[i].amount > 0) {
      ctx.fillStyle = '#f0f0f5';
      ctx.font = '10px -apple-system, sans-serif';
      const text = formatAmount(data[i].amount);
      const textW = ctx.measureText(text).width;
      const halfW = textW / 2;
      let alignX = p.x;
      if (p.x - halfW < 2) {
        alignX = Math.max(p.x + halfW + 4, textW / 2 + 4);
        ctx.textAlign = 'left';
      } else if (p.x + halfW > cw - 2) {
        alignX = Math.min(p.x - halfW - 4, cw - textW / 2 - 4);
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }
      ctx.fillText(text, alignX, p.y - 8);
    }
  });
}

function hideCategoryDetail() {
  document.getElementById('reviewRank').style.display = '';
  document.getElementById('reviewCategoryDetail').style.display = 'none';
}

function toggleReview() {
  isReviewMode = !isReviewMode;
  const formSection = document.getElementById('formSection');
  const listSection = document.getElementById('listSection');
  const reviewSection = document.getElementById('reviewSection');
  const btnReview = document.getElementById('btnReview');

  if (isReviewMode) {
    if (isSelectMode) toggleSelectMode();
    formSection.style.display = 'none';
    listSection.style.display = 'none';
    reviewSection.style.display = '';
    btnReview.classList.add('active');
    btnReview.innerHTML = '<span class="btn-review-icon">◈</span> 返回记账';
    renderReview();
  } else {
    formSection.style.display = '';
    listSection.style.display = '';
    reviewSection.style.display = 'none';
    btnReview.classList.remove('active');
    btnReview.innerHTML = '<span class="btn-review-icon">◈</span> 月度复盘';
  }
}

function refreshAll() {
  updateMonthLabel();
  updateMonthExpense();
  if (isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail.style.display !== 'none') {
      hideCategoryDetail();
    }
    renderReview();
  } else {
    renderList();
  }
}

function syncDateToCurrentMonth() {
  const today = getTodayDate();
  const [y, m] = today.split('-').map(Number);
  let targetDay;

  if (y === currentYear && m === currentMonth) {
    targetDay = String(new Date().getDate()).padStart(2, '0');
  } else {
    targetDay = String(new Date(currentYear, currentMonth, 0).getDate()).padStart(2, '0');
  }

  selectedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${targetDay}`;
  document.getElementById('inputDate').value = selectedDate;
}

function addTransaction() {
  const amountInput = document.getElementById('inputAmount');
  const noteInput = document.getElementById('inputNote');
  const dateInput = document.getElementById('inputDate');

  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    amountInput.focus();
    amountInput.style.borderColor = 'var(--color-expense)';
    showToast('请输入有效金额');
    setTimeout(() => { amountInput.style.borderColor = ''; }, 1500);
    return;
  }

  const transaction = {
    id: generateId(),
    type: currentType,
    amount: amount,
    category: selectedCategory,
    note: noteInput.value.trim(),
    date: dateInput.value || getTodayDate(),
    createdAt: Date.now()
  };

  transactions.push(transaction);
  saveData();

  selectedDate = transaction.date;
  dateInput.value = selectedDate;

  amountInput.value = '';
  noteInput.value = '';
  amountInput.focus();

  showToast(`已记录 ${formatAmount(amount)}`);

  refreshAll();
}

function deleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  if (item) {
    showToast(`已删除 ${formatAmount(item.amount)}`);
  }
  refreshAll();
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  syncDateToCurrentMonth();
  refreshAll();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  syncDateToCurrentMonth();
  refreshAll();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let editingId = null;

function openEditPanel(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId = id;

  document.getElementById('editAmount').value = tx.amount;
  document.getElementById('editDate').value = tx.date;
  document.getElementById('editNote').value = tx.note || '';

  populateEditCategories(tx.category);

  document.getElementById('editOverlay').style.display = '';
  document.getElementById('editAmount').focus();
}

function closeEditPanel() {
  document.getElementById('editOverlay').style.display = 'none';
  editingId = null;
  restoreEditPanel();
}

function restoreEditPanel() {
  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '保存';
  saveBtn.onclick = saveEdit;
  document.getElementById('editPanelTitle').textContent = '编辑账单';
  document.querySelectorAll('.edit-field-group').forEach(el => el.style.display = '');
}

function populateEditCategories(selected) {
  const grid = document.getElementById('editCategoryGrid');
  const categories = CATEGORIES.expense;

  grid.innerHTML = categories.map(c => {
    const isSelected = c === selected;
    return `
      <button class="cat-btn ${isSelected ? 'selected' : ''}" data-category="${c}">
        <span>${c}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function getEditSelectedCategory() {
  const selected = document.querySelector('#editCategoryGrid .cat-btn.selected');
  return selected ? selected.dataset.category : CATEGORIES.expense[0];
}

function saveEdit() {
  if (!editingId) return;

  const tx = transactions.find(t => t.id === editingId);
  if (!tx) return;

  const amount = parseFloat(document.getElementById('editAmount').value);
  if (!amount || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }

  const category = getEditSelectedCategory();
  const date = document.getElementById('editDate').value;
  const note = document.getElementById('editNote').value.trim();

  const oldDate = tx.date;
  const oldCategory = tx.category;

  tx.amount = amount;
  tx.category = category;
  tx.date = date;
  tx.note = note;

  saveData();
  closeEditPanel();

  const isSameMonth = (d1, d2) => {
    const a = new Date(d1), b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  };

  const monthChanged = !isSameMonth(oldDate, date);
  const categoryChanged = oldCategory !== category;

  refreshAll();

  if (monthChanged) {
    const d = new Date(date);
    showToast(`已更新，该记录已移至${d.getFullYear()}年${d.getMonth() + 1}月`);
  } else if (categoryChanged && isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail.style.display !== 'none') {
      hideCategoryDetail();
    }
  }

  if (!isReviewMode) {
    selectedDate = date;
    document.getElementById('inputDate').value = date;
  }
}

function deleteFromEdit() {
  if (!editingId) return;
  deleteTransaction(editingId);
  closeEditPanel();
}

let isSelectMode = false;
let selectedIds = new Set();

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  const btn = document.getElementById('btnSelectMode');
  const batchBar = document.getElementById('batchBar');

  if (isSelectMode) {
    btn.textContent = '取消';
    btn.classList.add('active');
    batchBar.style.display = 'flex';
    selectedIds.clear();
    updateBatchCount();
  } else {
    btn.textContent = '选择';
    btn.classList.remove('active');
    batchBar.style.display = 'none';
    selectedIds.clear();
  }

  renderList();
}

function toggleSelectItem(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateBatchCount();
  updateListItemCheckState(id);
}

let swipeSelectLastId = null;
let swipeLocked = false;
let longPressTimer = null;

function initSwipeSelect() {
  const listBody = document.getElementById('listBody');

  listBody.addEventListener('touchstart', (e) => {
    if (!isSelectMode) return;
    swipeSelectLastId = null;

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const listItem = el?.closest('.list-item');
    if (!listItem) return;

    longPressTimer = setTimeout(() => {
      swipeLocked = true;
      listBody.style.overflow = 'hidden';
      listBody.style.webkitOverflowScrolling = 'none';
      listBody.style.touchAction = 'none';

      if (!selectedIds.has(listItem.dataset.id)) {
        selectedIds.add(listItem.dataset.id);
        updateBatchCount();
        updateListItemCheckState(listItem.dataset.id);
      }

      if (navigator.vibrate) navigator.vibrate(10);
    }, 300);
  }, { passive: true });

  listBody.addEventListener('touchmove', (e) => {
    if (!isSelectMode) return;

    if (swipeLocked) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;

    const listItem = el.closest('.list-item');
    if (!listItem) return;

    const id = listItem.dataset.id;
    if (id && id !== swipeSelectLastId) {
      swipeSelectLastId = id;
      if (!selectedIds.has(id)) {
        selectedIds.add(id);
        updateBatchCount();
        updateListItemCheckState(id);
      }
    }
  }, { passive: false });

  listBody.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    if (swipeLocked) {
      swipeLocked = false;
      listBody.style.overflow = '';
      listBody.style.webkitOverflowScrolling = '';
      listBody.style.touchAction = '';
    }
  }, { passive: true });

  listBody.addEventListener('touchcancel', () => {
    clearTimeout(longPressTimer);
    if (swipeLocked) {
      swipeLocked = false;
      listBody.style.overflow = '';
      listBody.style.webkitOverflowScrolling = '';
      listBody.style.touchAction = '';
    }
  }, { passive: true });
}

function updateBatchCount() {
  document.getElementById('batchCount').textContent = `已选 ${selectedIds.size} 笔`;
}

function updateListItemCheckState(id) {
  const el = document.querySelector(`.list-item[data-id="${id}"]`);
  if (el) {
    el.classList.toggle('checking', selectedIds.has(id));
  }
}

function batchDelete() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const count = selectedIds.size;
  transactions = transactions.filter(t => !selectedIds.has(t.id));
  saveData();

  selectedIds.clear();
  updateBatchCount();

  showToast(`已删除 ${count} 笔`);
  refreshAll();
}

function batchInvert() {
  const listTx = getSelectedDateTransactions();
  listTx.forEach(t => {
    if (selectedIds.has(t.id)) {
      selectedIds.delete(t.id);
    } else {
      selectedIds.add(t.id);
    }
  });
  updateBatchCount();
  renderList();
}

function batchChangeCategory() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const categories = CATEGORIES.expense;
  const container = document.getElementById('editCategoryGrid');
  container.innerHTML = categories.map(c => `
    <button class="cat-btn" data-category="${c}">
      <span>${c}</span>
    </button>
  `).join('');

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  container.querySelector('.cat-btn').classList.add('selected');

  document.querySelectorAll('.edit-field-group').forEach(el => el.style.display = 'none');
  document.getElementById('editPanelTitle').textContent = '批量改分类';

  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '确认修改';
  saveBtn.onclick = () => {
    const category = container.querySelector('.cat-btn.selected');
    if (!category) {
      showToast('请选择分类');
      return;
    }
    const newCategory = category.dataset.category;
    transactions.forEach(t => {
      if (selectedIds.has(t.id)) {
        t.category = newCategory;
      }
    });
    saveData();
    closeEditPanel();
    selectedIds.clear();
    showToast('分类已更新');
    if (isSelectMode) toggleSelectMode();
    refreshAll();
  };

  document.getElementById('editOverlay').style.display = '';
}

function openDataPanel() {
  document.getElementById('clearMonthDesc').textContent =
    `删除 ${currentYear}年${currentMonth}月 的所有账单`;
  document.getElementById('dataOverlay').style.display = '';
}

function closeDataPanel() {
  document.getElementById('dataOverlay').style.display = 'none';
}

function clearCurrentMonth() {
  const before = transactions.length;
  transactions = transactions.filter(t => {
    const d = new Date(t.date);
    return !(d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.type === 'expense');
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
  closeDataPanel();
  showToast('已清除所有数据');
  refreshAll();
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initMonth();

  const today = getTodayDate();
  selectedDate = today;

  const dateInput = document.getElementById('inputDate');
  dateInput.value = today;

  dateInput.addEventListener('change', () => {
    if (dateInput.value) {
      selectedDate = dateInput.value;
      if (!isReviewMode) renderList();
    }
  });

  document.getElementById('btnSubmit').addEventListener('click', addTransaction);
  document.getElementById('btnPrevMonth').addEventListener('click', () => { saveMemo(); prevMonth(); });
  document.getElementById('btnNextMonth').addEventListener('click', () => { saveMemo(); nextMonth(); });
  document.getElementById('btnReview').addEventListener('click', toggleReview);

  document.getElementById('btnCategoryBack').addEventListener('click', hideCategoryDetail);

  document.getElementById('btnSelectMode').addEventListener('click', toggleSelectMode);
  document.getElementById('btnBatchDelete').addEventListener('click', batchDelete);
  document.getElementById('btnBatchCategory').addEventListener('click', batchChangeCategory);
  document.getElementById('btnBatchInvert').addEventListener('click', batchInvert);

  document.getElementById('btnEditSave').addEventListener('click', saveEdit);
  document.getElementById('btnEditDelete').addEventListener('click', deleteFromEdit);
  document.getElementById('editOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditPanel();
  });
  document.getElementById('editAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  document.getElementById('btnDataMgmt').addEventListener('click', openDataPanel);
  document.getElementById('btnDataCancel').addEventListener('click', closeDataPanel);
  document.getElementById('dataOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDataPanel();
  });
  document.getElementById('btnClearMonth').addEventListener('click', () => {
    if (confirm(`确定清除 ${currentYear}年${currentMonth}月 的所有账单吗？`)) {
      clearCurrentMonth();
    }
  });
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (confirm('确定清除所有数据吗？此操作不可撤销！')) {
      clearAllData();
    }
  });

  document.getElementById('inputAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTransaction();
  });

  const memoInput = document.getElementById('memoInput');
  if (memoInput) {
    memoInput.addEventListener('input', updateMemoCount);
  }

  populateCategories();
  initSwipeSelect();
  refreshAll();
});
