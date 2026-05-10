function getBudgetKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function getBudgets() {
  try {
    const data = localStorage.getItem('mm_budgets');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveBudgets(budgets) {
  localStorage.setItem('mm_budgets', JSON.stringify(budgets));
}

function getBudget(year, month) {
  const budgets = getBudgets();
  const key = getBudgetKey(year, month);
  return budgets[key] || null;
}

function setBudget(year, month, config) {
  const budgets = getBudgets();
  const key = getBudgetKey(year, month);
  budgets[key] = config;
  saveBudgets(budgets);
}

function deleteBudget(year, month) {
  const budgets = getBudgets();
  const key = getBudgetKey(year, month);
  delete budgets[key];
  saveBudgets(budgets);
}

function getEffectiveBudget(year, month) {
  const budget = getBudget(year, month);
  if (!budget) return 0;
  return budget.amount || 0;
}

function getBudgetExcludeIds(year, month) {
  const budget = getBudget(year, month);
  return budget?.excludeIds || [];
}

function getDayActualSpent(year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const excludeIds = getBudgetExcludeIds(year, month);

  const dayTx = transactions.filter(t => {
    if (t.date !== dateStr) return false;
    if (t.subType === 'refund') return false;
    if (excludeIds.includes(t.id)) return false;
    return t.subType === 'expense' || t.subType === 'advance';
  });

  const refunds = transactions.filter(t => {
    if (t.date !== dateStr) return false;
    if (t.subType !== 'refund') return false;
    if (excludeIds.includes(t.id)) return false;
    return true;
  });

  const spent = dayTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const refund = refunds.reduce((sum, t) => sum + Number(t.amount), 0);
  return Math.max(0, spent - refund);
}

function getSpentTillDate(year, month, day) {
  let total = 0;
  for (let d = 1; d < day; d++) {
    total += getDayActualSpent(year, month, d);
  }
  return total;
}

function getDailyBudget(year, month, day) {
  const effectiveBudget = getEffectiveBudget(year, month);
  if (effectiveBudget <= 0) return 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const spentTillYesterday = getSpentTillDate(year, month, day);
  const remaining = effectiveBudget - spentTillYesterday;
  const remainingDays = daysInMonth - day + 1;

  return Math.max(0, remaining / remainingDays);
}

function getDayStatus(budget, actual) {
  if (actual === 0) return 'EMPTY';
  if (budget <= 0) return 'EMPTY';
  const ratio = actual / budget;
  if (ratio <= 0.8) return 'GREAT';
  if (ratio <= 1.1) return 'GOOD';
  if (ratio <= 1.5) return 'WARN';
  return 'OVER';
}

function getDayStatusLabel(status) {
  const labels = {
    'EMPTY': { text: '—', class: 'empty' },
    'GREAT': { text: '🎉 GoodJob!', class: 'great' },
    'GOOD': { text: '✓ Good', class: 'good' },
    'WARN': { text: '⚠️ ComeOn', class: 'warn' },
    'OVER': { text: '💸 Over', class: 'over' }
  };
  return labels[status] || labels['EMPTY'];
}

function getBudgetMonthSpent(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let total = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    total += getDayActualSpent(year, month, d);
  }
  return total;
}

function openBudgetPanel(year, month) {
  const budget = getBudget(currentYear, currentMonth);

  if (budget) {
    document.getElementById('inputBudgetAmount').value = budget.amount || '';
    document.getElementById('inputBudgetTarget').value = budget.target || '';
    document.querySelector(`input[name="workMode"][value="${budget.workMode || 'double'}"]`).checked = true;
    document.getElementById('btnBudgetDelete').style.display = '';
  } else {
    document.getElementById('inputBudgetAmount').value = '';
    document.getElementById('inputBudgetTarget').value = '';
    document.querySelector('input[name="workMode"][value="double"]').checked = true;
    document.getElementById('btnBudgetDelete').style.display = 'none';
  }

  openOverlay('budgetOverlay');
}

function closeBudgetPanel() {
  closeAllOverlays();
}

function saveBudget() {
  const amountStr = document.getElementById('inputBudgetAmount').value.trim();
  const amount = amountStr ? parseFloat(amountStr) : 0;
  const target = document.getElementById('inputBudgetTarget').value.trim();
  const workMode = document.querySelector('input[name="workMode"]:checked').value;

  if (amount < 0) {
    showToast('预算金额不能为负数');
    return;
  }

  setBudget(currentYear, currentMonth, {
    amount,
    target,
    workMode,
    excludeIds: getBudget(currentYear, currentMonth)?.excludeIds || []
  });

  closeBudgetPanel();
  showToast(amount > 0 ? '预算已保存' : '预算已清除');
  refreshAll();
}

function deleteBudgetConfig() {
  if (!confirm(`确定删除 ${currentYear}年${currentMonth}月 的预算吗？`)) {
    return;
  }

  deleteBudget(currentYear, currentMonth);
  closeBudgetPanel();
  showToast('预算已删除');
  refreshAll();
}

function renderBudgetOverview() {
  const budget = getBudget(currentYear, currentMonth);
  const effectiveBudget = getEffectiveBudget(currentYear, currentMonth);
  const spent = getBudgetMonthSpent(currentYear, currentMonth);
  const remaining = Math.max(0, effectiveBudget - spent);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && (today.getMonth() + 1) === currentMonth;
  const todayDay = isCurrentMonth ? today.getDate() : 0;
  const todayDailyBudget = isCurrentMonth ? getDailyBudget(currentYear, currentMonth, todayDay) : 0;
  const todaySpent = isCurrentMonth ? getDayActualSpent(currentYear, currentMonth, todayDay) : 0;

  const budgetCard = document.getElementById('budgetOverviewCard');
  const budgetBody = document.getElementById('budgetOverviewBody');

  if (effectiveBudget <= 0) {
    budgetCard?.classList.add('collapsible');
    budgetCard?.classList.add('collapsed');
    if (budgetBody) budgetBody.style.display = 'none';
  } else {
    budgetCard?.classList.add('collapsible');
    budgetCard?.classList.remove('collapsed');
    if (budgetBody) budgetBody.style.display = '';
  }

  document.getElementById('budgetAmount').textContent = effectiveBudget > 0 ? formatAmount(effectiveBudget) : '未设置';
  document.getElementById('budgetSpent').textContent = formatAmount(spent);
  document.getElementById('budgetRemaining').textContent = formatAmount(remaining);

  const progressPercent = effectiveBudget > 0 ? Math.min(100, (spent / effectiveBudget) * 100) : 0;
  document.getElementById('budgetProgressBar').style.width = `${progressPercent}%`;

  const todayStatusEl = document.getElementById('budgetTodayStatus');
  if (effectiveBudget > 0 && isCurrentMonth) {
    document.getElementById('budgetTodayValue').textContent = formatAmount(todayDailyBudget);
    const status = getDayStatus(todayDailyBudget, todaySpent);
    const statusInfo = getDayStatusLabel(status);
    todayStatusEl.textContent = statusInfo.text;
    todayStatusEl.className = 'budget-today-status ' + statusInfo.class;
  } else {
    document.getElementById('budgetTodayValue').textContent = '—';
    todayStatusEl.textContent = '';
    todayStatusEl.className = 'budget-today-status';
  }

  const targetEl = document.getElementById('budgetTarget');
  const targetValueEl = document.getElementById('budgetTargetValue');
  if (budget?.target) {
    targetEl.style.display = '';
    targetValueEl.textContent = budget.target;
  } else {
    targetEl.style.display = 'none';
  }
}

function toggleBudgetOverview() {
  const budgetCard = document.getElementById('budgetOverviewCard');
  const budgetBody = document.getElementById('budgetOverviewBody');
  if (!budgetCard || !budgetBody) return;

  const isCollapsed = budgetCard.classList.contains('collapsed');
  if (isCollapsed) {
    budgetBody.style.display = '';
    budgetCard.classList.remove('collapsed');
  } else {
    budgetBody.style.display = 'none';
    budgetCard.classList.add('collapsed');
  }
}

function renderSelectedDateBudget() {
  const [year, month, day] = selectedDate.split('-').map(Number);

  const effectiveBudget = getEffectiveBudget(year, month);

  let dateBudget = 0;
  let dateSpent = getDayActualSpent(year, month, day);

  if (effectiveBudget > 0) {
    dateBudget = getDailyBudget(year, month, day);
  }

  const status = getDayStatus(dateBudget, dateSpent);
  const statusInfo = getDayStatusLabel(status);

  document.getElementById('todayBudgetValue').textContent = effectiveBudget > 0 ? formatAmount(dateBudget) : '—';
  document.getElementById('todayBudgetSpent').textContent = formatAmount(dateSpent);

  const statusEl = document.getElementById('todayBudgetStatus');
  statusEl.textContent = effectiveBudget > 0 ? statusInfo.text : '';
  statusEl.className = 'today-budget-status ' + statusInfo.class;
}

function renderDayBudgetList() {
  const container = document.getElementById('dayBudgetList');
  const today = getTodayDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const effectiveBudget = getEffectiveBudget(currentYear, currentMonth);
  const hasBudget = effectiveBudget > 0;

  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === currentYear && (todayDate.getMonth() + 1) === currentMonth;

  let html = '';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;

    const dailyBudget = hasBudget ? getDailyBudget(currentYear, currentMonth, d) : 0;
    const actualSpent = isFuture ? 0 : getDayActualSpent(currentYear, currentMonth, d);

    let status = 'EMPTY';
    if (!isFuture && actualSpent > 0) {
      status = getDayStatus(dailyBudget, actualSpent);
    }

    const statusInfo = getDayStatusLabel(status);
    const isOver = status === 'OVER' || (actualSpent > dailyBudget && dailyBudget > 0);
    const heatLevel = hasBudget ? getDayHeatLevel(dailyBudget, actualSpent) : 0;

    const barWidth = dailyBudget > 0 ? Math.min(100, (actualSpent / dailyBudget) * 100) : 0;

    html += `
      <div class="day-budget-row ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} heat-${heatLevel}" data-date="${dateStr}">
        <span class="day-budget-date">${d}</span>
        <div class="day-budget-bar-bg">
          <div class="day-budget-bar ${isOver ? 'over' : ''}" style="width: ${barWidth}%"></div>
        </div>
        <span class="day-budget-actual ${isOver ? 'over' : ''}">${isFuture ? '—' : formatAmount(actualSpent)}</span>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.day-budget-row:not(.future)').forEach(row => {
    row.addEventListener('click', () => {
      const date = row.dataset.date;
      if (date) {
        const [y, m] = date.split('-').map(Number);
        if (y !== currentYear || m !== currentMonth) {
          currentYear = y;
          currentMonth = m;
          syncDateToCurrentMonth();
          refreshAll();
        } else {
          selectedDate = date;
          updateDateDisplay();
          renderList();
        }
        
        const isWideScreen = window.innerWidth >= 768;
        const isDualPageActive = isWideScreen && document.body.classList.contains('dual-mode');
        
        if (!isDualPageActive && isReviewMode) {
          toggleReview();
        }
      }
    });
  });
}

function toggleDayBudget() {
  isDayBudgetExpanded = !isDayBudgetExpanded;
  const card = document.querySelector('.review-card.collapsible');
  const section = document.getElementById('dayBudgetSection');
  const toggle = document.getElementById('dayBudgetToggle');

  if (isDayBudgetExpanded) {
    section.style.display = '';
    card.classList.remove('collapsed');
  } else {
    section.style.display = 'none';
    card.classList.add('collapsed');
  }
}
