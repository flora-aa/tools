const CATEGORIES = ['餐饮', '购物', '交通', '娱乐', '住房', '通讯', '医疗', '教育', '退款', '其他'];

const MAX_TOTAL = 100000000;

const THEME_PRESETS = [
  { name: '经典紫', accent: '#5a5aff', bg: '#0d0d1a', expense: '#ff4757', income: '#2ecc71' },
  { name: '商务蓝', accent: '#007aff', bg: '#0a1628', expense: '#ff453a', income: '#34c759' },
  { name: '森林绿', accent: '#34c759', bg: '#0a1f14', expense: '#ff6b6b', income: '#4ecdc4' },
  { name: '暖阳橙', accent: '#ff9500', bg: '#1a1208', expense: '#ff4757', income: '#2ecc71' },
  { name: '极简灰', accent: '#8e8e93', bg: '#1a1a1a', expense: '#ff453a', income: '#30d158' },
  { name: '玫瑰粉', accent: '#ff2d55', bg: '#1a0a10', expense: '#ff6b6b', income: '#4ecdc4' },
  { name: '日间模式', accent: '#5a5aff', bg: '#f5f5fa', expense: '#e74c3c', income: '#27ae60' },
  { name: '护眼绿', accent: '#2ecc71', bg: '#e8f5e9', expense: '#e74c3c', income: '#27ae60' },
];

let activeOverlay = null;
const ALL_OVERLAYS = [
  'quickOverlay', 'editOverlay', 'dataOverlay',
  'budgetOverlay', 'calendarOverlay', 'themeOverlay'
];

function closeAllOverlays() {
  ALL_OVERLAYS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  activeOverlay = null;
}

function openOverlay(id) {
  if (activeOverlay === id) return;
  closeAllOverlays();
  const el = document.getElementById(id);
  if (el) {
    el.style.display = '';
    activeOverlay = id;
  }
}

let themePreview = null;
let originalTheme = null;

function updateThemeColorBtn(btnId, color) {
  const btn = document.getElementById(btnId);
  btn.style.background = color;
  btn.style.color = getPureContrastColor(color);
}

function initThemePanel() {
  document.getElementById('btnTheme').addEventListener('click', () => {
    openOverlay('themeOverlay');
    const saved = localStorage.getItem('mm_theme');
    const currentTheme = saved ? JSON.parse(saved) : THEME_PRESETS[0];
    document.getElementById('themeAccent').value = currentTheme.accent;
    document.getElementById('themeBg').value = currentTheme.bg;
    document.getElementById('themeExpense').value = currentTheme.expense;
    document.getElementById('themeIncome').value = currentTheme.income;
    updateThemeColorBtn('themeAccentBtn', currentTheme.accent);
    updateThemeColorBtn('themeBgBtn', currentTheme.bg);
    updateThemeColorBtn('themeExpenseBtn', currentTheme.expense);
    updateThemeColorBtn('themeIncomeBtn', currentTheme.income);
    originalTheme = { ...currentTheme };
    themePreview = { ...currentTheme };
    renderThemePresets();
    renderThemePreview();
  });

  document.getElementById('btnThemeClose').addEventListener('click', () => {
    if (originalTheme) {
      applyTheme(originalTheme);
    }
    themePreview = null;
    originalTheme = null;
    closeAllOverlays();
  });

  document.getElementById('themeOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'themeOverlay') {
      if (originalTheme) {
        applyTheme(originalTheme);
      }
      themePreview = null;
      originalTheme = null;
      closeAllOverlays();
    }
  });

  document.getElementById('btnThemeApply').addEventListener('click', () => {
    if (themePreview) {
      applyTheme(themePreview);
      localStorage.setItem('mm_theme', JSON.stringify(themePreview));
    }
    themePreview = null;
    originalTheme = null;
    closeAllOverlays();
  });

  const accentInput = document.getElementById('themeAccent');
  const bgInput = document.getElementById('themeBg');
  const expenseInput = document.getElementById('themeExpense');
  const incomeInput = document.getElementById('themeIncome');

  const updateThemePreview = () => {
    themePreview = {
      accent: accentInput.value,
      bg: bgInput.value,
      expense: expenseInput.value,
      income: incomeInput.value
    };
    updateThemeColorBtn('themeAccentBtn', themePreview.accent);
    updateThemeColorBtn('themeBgBtn', themePreview.bg);
    updateThemeColorBtn('themeExpenseBtn', themePreview.expense);
    updateThemeColorBtn('themeIncomeBtn', themePreview.income);
    renderThemePreview();
    renderThemePresets();
  };

  accentInput.addEventListener('input', updateThemePreview);
  bgInput.addEventListener('input', updateThemePreview);
  expenseInput.addEventListener('input', updateThemePreview);
  incomeInput.addEventListener('input', updateThemePreview);
}

function renderThemePreview() {
  const container = document.getElementById('themeCustomPreview');
  if (!themePreview) return;

  const saved = localStorage.getItem('mm_theme');
  const currentTheme = saved ? JSON.parse(saved) : THEME_PRESETS[0];
  const isCustom = themePreview.accent !== currentTheme.accent ||
                   themePreview.bg !== currentTheme.bg ||
                   themePreview.expense !== currentTheme.expense ||
                   themePreview.income !== currentTheme.income;

  if (isCustom) {
    container.innerHTML = `
      <div class="theme-preset active custom" data-type="custom">
        <div class="theme-preset-preview" style="background: ${themePreview.bg}">
          <div class="theme-preset-accent" style="background: ${themePreview.accent}"></div>
          <div class="theme-preset-expense" style="background: ${themePreview.expense}"></div>
          <div class="theme-preset-income" style="background: ${themePreview.income}"></div>
        </div>
        <span class="theme-preset-name">自定义方案</span>
      </div>
    `;
    container.style.display = '';
  } else {
    container.style.display = 'none';
  }
}

let transactions = [];

let currentSubType = 'expense';
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
      transactions.forEach(t => {
        if (!t.subType) {
          t.subType = t.type === 'income' ? 'refund' : 'expense';
        }
      });
    } catch {
      transactions = [];
    }
  }
  loadTheme();
}

function loadTheme() {
  const saved = localStorage.getItem('mm_theme');
  if (saved) {
    try {
      const theme = JSON.parse(saved);
      applyTheme(theme);
    } catch {
      applyTheme(THEME_PRESETS[0]);
    }
  } else {
    applyTheme(THEME_PRESETS[0]);
  }
}

function saveTheme() {
  const root = document.documentElement;
  const theme = {
    accent: getComputedStyle(root).getPropertyValue('--accent').trim(),
    bg: getComputedStyle(root).getPropertyValue('--bg-primary').trim(),
    expense: getComputedStyle(root).getPropertyValue('--color-expense').trim(),
    income: getComputedStyle(root).getPropertyValue('--color-income').trim(),
    btnTopReviewColor: getComputedStyle(root).getPropertyValue('--btn-top-review-color').trim()
  };
  localStorage.setItem('mm_theme', JSON.stringify(theme));
}

function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.4 ? '#3c3c43' : '#e8eaed';
}

function getPureContrastColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.4 ? '#000000' : '#ffffff';
}

function getSecondaryColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.4 ? '#636366' : '#a1a1a6';
}

function getMutedColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.4 ? '#8e8e93' : '#636366';
}

function getDisabledColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.4 ? '#c7c7cc' : '#48484a';
}

function lighten(hex, percent) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const amount = Math.round(2.55 * percent);
  return `#${Math.min(255, r + amount).toString(16).padStart(2, '0')}${Math.min(255, g + amount).toString(16).padStart(2, '0')}${Math.min(255, b + amount).toString(16).padStart(2, '0')}`;
}

function darken(hex, percent) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const amount = Math.round(2.55 * percent);
  return `#${Math.max(0, r - amount).toString(16).padStart(2, '0')}${Math.max(0, g - amount).toString(16).padStart(2, '0')}${Math.max(0, b - amount).toString(16).padStart(2, '0')}`;
}

function applyTheme(theme) {
  const root = document.documentElement;
  const bg = theme.bg || '#0d0d1a';
  const accent = theme.accent || '#5a5aff';
  const expense = theme.expense || lighten(accent, 30);
  const income = theme.income || '#27ae60';
  const textColor = getContrastColor(bg);
  const secondaryColor = getSecondaryColor(bg);
  const mutedColor = getMutedColor(bg);
  const disabledColor = getDisabledColor(bg);

  const luminance = getLuminance(bg);
  const isLight = luminance > 0.4;

  const cardBg = isLight ? darken(bg, 5) : lighten(bg, 8);
  const cardAltBg = isLight ? darken(bg, 8) : lighten(bg, 15);
  const inputBg = isLight ? lighten(bg, 3) : darken(bg, 8);
  const borderColor = isLight ? darken(bg, 15) : lighten(bg, 20);

  const shadowAlpha = isLight ? 0.1 : 0.3;
  const shadowCard = isLight
    ? `0 2px 8px rgba(0, 0, 0, ${shadowAlpha})`
    : `0 4px 20px rgba(0, 0, 0, ${shadowAlpha})`;
  const shadowDropdown = `0 8px 24px rgba(0, 0, 0, ${shadowAlpha + 0.1})`;
  const shadowModal = `0 16px 48px rgba(0, 0, 0, ${shadowAlpha + 0.2})`;

  let btnTopReviewColor = theme.btnTopReviewColor;
  if (!btnTopReviewColor) {
    const accentLuminance = getLuminance(accent);
    const bgLuminance = getLuminance(bg);
    const midLuminance = (accentLuminance + bgLuminance) / 2;
    btnTopReviewColor = midLuminance > 0.5
      ? darken(textColor, 30)
      : lighten(textColor, 30);
  }

  root.style.setProperty('--bg-primary', bg);
  root.style.setProperty('--bg-card', cardBg);
  root.style.setProperty('--bg-card-alt', cardAltBg);
  root.style.setProperty('--bg-input', inputBg);
  root.style.setProperty('--bg-hover', isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)');
  root.style.setProperty('--bg-active', isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)');

  root.style.setProperty('--text-primary', textColor);
  root.style.setProperty('--text-secondary', secondaryColor);
  root.style.setProperty('--text-muted', mutedColor);
  root.style.setProperty('--text-disabled', disabledColor);

  root.style.setProperty('--border-color', borderColor);
  root.style.setProperty('--border-focus', accent);

  root.style.setProperty('--shadow-card', shadowCard);
  root.style.setProperty('--shadow-dropdown', shadowDropdown);
  root.style.setProperty('--shadow-modal', shadowModal);

  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-hover', lighten(accent, 15));
  root.style.setProperty('--accent-text', getContrastColor(accent));
  root.style.setProperty('--accent-alpha-10', hexToRgba(accent, 0.10));
  root.style.setProperty('--accent-alpha-15', hexToRgba(accent, 0.15));
  root.style.setProperty('--accent-alpha-20', hexToRgba(accent, 0.20));
  root.style.setProperty('--accent-alpha-25', hexToRgba(accent, 0.25));
  root.style.setProperty('--btn-top-review-color', btnTopReviewColor);

  const warn = '#ffc107';

  root.style.setProperty('--color-expense', expense);
  root.style.setProperty('--color-expense-alpha-12', hexToRgba(expense, 0.12));
  root.style.setProperty('--color-expense-alpha-25', hexToRgba(expense, 0.25));
  root.style.setProperty('--color-income', income);
  root.style.setProperty('--color-income-alpha-12', hexToRgba(income, 0.12));
  root.style.setProperty('--color-income-alpha-15', hexToRgba(income, 0.15));
  root.style.setProperty('--color-income-alpha-25', hexToRgba(income, 0.25));
  root.style.setProperty('--color-warn', warn);
  root.style.setProperty('--color-warn-alpha-25', hexToRgba(warn, 0.25));
  root.style.setProperty('--color-great', '#34c759');

  saveTheme();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderThemePresets() {
  const container = document.getElementById('themePresets');
  const previewTheme = themePreview || (() => {
    const saved = localStorage.getItem('mm_theme');
    return saved ? JSON.parse(saved) : THEME_PRESETS[0];
  })();

  container.innerHTML = THEME_PRESETS.map(preset => `
    <div class="theme-preset ${preset.accent === previewTheme.accent && preset.bg === previewTheme.bg && preset.expense === previewTheme.expense && preset.income === previewTheme.income ? 'active' : ''}" data-preset="${preset.name}">
      <div class="theme-preset-preview" style="background: ${preset.bg}">
        <div class="theme-preset-accent" style="background: ${preset.accent}"></div>
        <div class="theme-preset-expense" style="background: ${preset.expense}"></div>
        <div class="theme-preset-income" style="background: ${preset.income}"></div>
      </div>
      <span class="theme-preset-name">${preset.name}</span>
    </div>
  `).join('');

  container.querySelectorAll('.theme-preset').forEach(el => {
    el.addEventListener('click', () => {
      const preset = THEME_PRESETS.find(p => p.name === el.dataset.preset);
      if (preset) {
        document.getElementById('themeAccent').value = preset.accent;
        document.getElementById('themeBg').value = preset.bg;
        document.getElementById('themeExpense').value = preset.expense;
        document.getElementById('themeIncome').value = preset.income;
        updateThemeColorBtn('themeAccentBtn', preset.accent);
        updateThemeColorBtn('themeBgBtn', preset.bg);
        updateThemeColorBtn('themeExpenseBtn', preset.expense);
        updateThemeColorBtn('themeIncomeBtn', preset.income);
        themePreview = { ...preset };
        renderThemePresets();
        renderThemePreview();
      }
    });
  });
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
  const categories = CATEGORIES;

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

let calActiveSource = null; // 'input' or 'edit'
let calYear = 0;
let calMonth = 0;
let calSelectedDate = '';

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}/${parseInt(m)}/${parseInt(d)}`;
}

function updateDateDisplay() {
  document.getElementById('dateDisplay').textContent = formatDateDisplay(selectedDate);
}

function openCalendar(source) {
  calActiveSource = source;
  let currentDate;
  if (source === 'edit') {
    currentDate = document.getElementById('editDateDisplay').dataset.date || selectedDate;
  } else {
    currentDate = selectedDate;
  }
  const [y, m, d] = currentDate.split('-').map(Number);
  calYear = currentYear;
  calMonth = currentMonth;
  calSelectedDate = currentDate;
  renderCalendar();
  openOverlay('calendarOverlay');
}

function closeCalendar() {
  closeAllOverlays();
  calActiveSource = null;
}

function renderCalendar() {
  document.getElementById('calTitle').textContent = `${calYear}年${calMonth}月`;

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();

  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startOffset; i++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day other-month';
    btn.textContent = daysInPrev - startOffset + 1 + i;
    btn.disabled = true;
    grid.appendChild(btn);
  }

  const todayStr = getTodayDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = d;

    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (dateStr === todayStr) btn.classList.add('today');
    if (dateStr === calSelectedDate) btn.classList.add('selected');

    btn.dataset.date = dateStr;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
      calSelectedDate = dateStr;
    });

    grid.appendChild(btn);
  }

  const totalCells = startOffset + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day other-month';
    btn.textContent = i;
    btn.disabled = true;
    grid.appendChild(btn);
  }
}

function confirmCalendar() {
  if (!calSelectedDate) return;

  if (calActiveSource === 'edit') {
    const display = document.getElementById('editDateDisplay');
    display.textContent = formatDateDisplay(calSelectedDate);
    display.dataset.date = calSelectedDate;
  } else {
    const [y, m] = calSelectedDate.split('-').map(Number);
    if (y !== currentYear || m !== currentMonth) {
      currentYear = y;
      currentMonth = m;
      syncDateToCurrentMonth();
      refreshAll();
    } else {
      selectedDate = calSelectedDate;
      updateDateDisplay();
      renderList();
    }
  }

  closeCalendar();
}

function calGoToday() {
  const today = getTodayDate();
  calYear = currentYear;
  calMonth = currentMonth;
  calSelectedDate = today;
  renderCalendar();
}

function calPrevMonth() {
  if (calMonth === 1) {
    calYear--;
    calMonth = 12;
  } else {
    calMonth--;
  }
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const [y, m, d] = calSelectedDate.split('-').map(Number);
  if (d > daysInMonth) {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  } else {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  renderCalendar();
}

function calNextMonth() {
  if (calMonth === 12) {
    calYear++;
    calMonth = 1;
  } else {
    calMonth++;
  }
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const [y, m, d] = calSelectedDate.split('-').map(Number);
  if (d > daysInMonth) {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  } else {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  renderCalendar();
}

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
  loadMemo();
  renderReviewSummary();
  renderReviewRank();
  renderBudgetOverview();
  renderDayBudgetList();
}

function renderReviewSummary() {
  const monthTx = getMonthTransactions();
  const monthRefunds = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.subType === 'refund';
  });

  const totalExpense = monthTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefund = monthRefunds.reduce((sum, t) => sum + Number(t.amount), 0);
  const netTotal = Math.max(0, totalExpense - totalRefund);

  document.getElementById('reviewTotal').textContent = formatAmount(netTotal);
  document.getElementById('reviewCount').textContent = monthTx.length + monthRefunds.length;

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dailyAvg = monthTx.length > 0 ? netTotal / daysInMonth : 0;
  document.getElementById('reviewDailyAvg').textContent = formatAmount(dailyAvg);

  const allMonthTx = [...monthTx, ...monthRefunds];
  const maxAmount = allMonthTx.length > 0 ? Math.max(...allMonthTx.map(t => Number(t.amount))) : 0;
  document.getElementById('reviewMax').textContent = formatAmount(maxAmount);
}

function renderReviewRank() {
  const monthTx = getMonthTransactions();
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
    return d.getFullYear() === prevYear && (d.getMonth() + 1) === prevMonth
      && (t.subType === 'expense' || t.subType === 'advance');
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

  container.innerHTML = filtered.map(t => {
    const isRefund = t.subType === 'refund';
    const isAdvance = t.subType === 'advance';
    const typeTag = isRefund ? '<span class="list-item-tag tag-refund">退款</span>'
      : isAdvance ? '<span class="list-item-tag tag-advance">垫付</span>' : '';
    const amountClass = isRefund ? 'review-category-item-amount refund' : 'review-category-item-amount';
    const amountSign = isRefund ? '+' : '-';
    return `
    <div class="review-category-item" data-id="${t.id}">
      <div class="review-category-item-info">
        <div class="review-category-item-date">${t.date}${typeTag}</div>
        ${t.note ? `<div class="review-category-item-note">${escapeHtml(t.note)}</div>` : ''}
      </div>
      <div class="${amountClass}">${amountSign}${formatAmount(t.amount).slice(1)}</div>
    </div>
  `;
  }).join('');

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
        && (t.subType === 'expense' || t.subType === 'advance') && t.category === category;
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
  renderReviewRank();
}

function toggleReview() {
  isReviewMode = !isReviewMode;
  const formSection = document.getElementById('formSection');
  const listSection = document.getElementById('listSection');
  const reviewSection = document.getElementById('reviewSection');
  const btnTopReview = document.getElementById('btnTopReview');
  const pageWrapper = document.getElementById('pageWrapper');
  const appContainer = document.querySelector('.app');
  const isWideScreen = window.innerWidth >= 768;

  if (isReviewMode) {
    if (isSelectMode) toggleSelectMode();
    btnTopReview.classList.add('active');
    renderReview();
    if (isWideScreen) {
      pageWrapper.classList.add('dual-page');
      appContainer.classList.add('dual-mode');
      document.body.classList.add('dual-mode');
      formSection.style.display = '';
      listSection.style.display = '';
      reviewSection.style.display = '';
    } else {
      formSection.style.display = 'none';
      listSection.style.display = 'none';
      reviewSection.style.display = '';
    }
  } else {
    btnTopReview.classList.remove('active');
    if (isWideScreen) {
      pageWrapper.classList.remove('dual-page');
      appContainer.classList.remove('dual-mode');
      document.body.classList.remove('dual-mode');
      setTimeout(() => {
        reviewSection.style.display = 'none';
      }, 300);
    } else {
      pageWrapper.classList.remove('dual-page');
      appContainer.classList.remove('dual-mode');
      document.body.classList.remove('dual-mode');
      reviewSection.style.display = 'none';
    }
    formSection.style.display = '';
    listSection.style.display = '';
  }
}

function refreshAll() {
  updateMonthLabel();
  updateMonthExpense();
  if (isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail && detail.style.display !== 'none') {
      hideCategoryDetail();
    }
    renderReview();
    renderList();
  } else {
    renderList();
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
  updateDateDisplay();

  const editDateDisplay = document.getElementById('editDateDisplay');
  if (editDateDisplay) {
    editDateDisplay.textContent = formatDateDisplay(selectedDate);
    editDateDisplay.dataset.date = selectedDate;
  }
}

function addTransaction() {
  const amountInput = document.getElementById('inputAmount');
  const noteInput = document.getElementById('inputNote');

  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    amountInput.focus();
    amountInput.style.borderColor = 'var(--color-expense)';
    showToast('请输入有效金额');
    setTimeout(() => { amountInput.style.borderColor = ''; }, 1500);
    return;
  }

  const isAdvance = document.getElementById('advanceToggle').checked;

  const currentTotal = getTotalExpense();
  if (currentTotal + amount > MAX_TOTAL) {
    showToast('累计支出已达上限，请先清除部分数据');
    amountInput.focus();
    return;
  }

  const date = selectedDate;

  const transaction = {
    id: generateId(),
    subType: currentSubType,
    amount: amount,
    category: selectedCategory,
    note: noteInput.value.trim(),
    date: date,
    createdAt: Date.now()
  };

  if (selectedCategory === '退款') {
    transaction.subType = 'refund';
  } else if (isAdvance) {
    transaction.subType = 'advance';
  }

  transactions.push(transaction);
  saveData();
  setLastAmount(selectedCategory, amount);

  selectedDate = date;

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

let quickSelectedCategory = null;

function openQuickPanel() {
  quickSelectedCategory = null;
  renderQuickCategories();
  document.getElementById('quickAmountDisplay').textContent = '0.00';
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
      document.getElementById('quickAmountDisplay').textContent = amount > 0 ? amount.toFixed(2) : '0.00';
      renderQuickCategories();
      quickSubmit();
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

function getDailyExpenses() {
  const dailyData = {};
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth
      && (t.subType === 'expense' || t.subType === 'advance');
  });
  const monthRefunds = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.subType === 'refund';
  });

  monthTx.forEach(t => {
    if (!dailyData[t.date]) dailyData[t.date] = 0;
    dailyData[t.date] += Number(t.amount);
  });
  monthRefunds.forEach(t => {
    if (!dailyData[t.date]) dailyData[t.date] = 0;
    dailyData[t.date] -= Number(t.amount);
  });

  return dailyData;
}

function getDayHeatLevel(dailyBudget, actualSpent) {
  if (dailyBudget <= 0 || actualSpent <= 0) return 0;
  const ratio = actualSpent / dailyBudget;
  if (ratio <= 0.5) return 1;
  if (ratio <= 0.75) return 2;
  if (ratio <= 1.0) return 3;
  return 4;
}

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
        
        // 检查是否未激活双页模式（即不是宽屏或宽屏但未处于双页显示）
        const isWideScreen = window.innerWidth >= 768;
        const isDualPageActive = isWideScreen && document.body.classList.contains('dual-mode');
        
        if (!isDualPageActive && isReviewMode) {
          // 取消激活月度复盘按钮
          toggleReview();
        }
      }
    });
  });
}

let isDayBudgetExpanded = false;

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

let editingId = null;

function openEditPanel(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId = id;

  document.getElementById('editAmount').value = tx.amount;
  const editDisplay = document.getElementById('editDateDisplay');
  editDisplay.textContent = formatDateDisplay(tx.date);
  editDisplay.dataset.date = tx.date;
  document.getElementById('editNote').value = tx.note || '';

  populateEditCategories(tx.category);

  document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.subtype === (tx.subType || 'expense'));
  });

  openOverlay('editOverlay');
  document.getElementById('editAmount').focus();
}

function closeEditPanel() {
  closeAllOverlays();
  editingId = null;
  restoreEditPanel();
}

function restoreEditPanel() {
  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '保存';
  saveBtn.onclick = saveEdit;
  document.getElementById('editPanelTitle').textContent = '编辑账单';
  document.querySelectorAll('.edit-field-group').forEach(el => el.style.display = '');
  const amountGroup = document.querySelector('.edit-panel-body .amount-group');
  if (amountGroup) amountGroup.style.display = '';
  const categoryGrid = document.getElementById('editCategoryGrid');
  if (categoryGrid) categoryGrid.style.display = '';
  const noteField = document.querySelector('.form-field:last-child');
  if (noteField) noteField.style.display = '';
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = '';
}

function populateEditCategories(selected) {
  const grid = document.getElementById('editCategoryGrid');
  const categories = CATEGORIES;

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
  return selected ? selected.dataset.category : CATEGORIES[0];
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

  const currentTotal = getTotalExpense();
  const otherTotal = currentTotal - tx.amount;
  if (otherTotal + amount > MAX_TOTAL) {
    showToast('修改后累计支出将超出上限');
    return;
  }

  const category = getEditSelectedCategory();
  const date = document.getElementById('editDateDisplay').dataset.date || tx.date;
  const note = document.getElementById('editNote').value.trim();
  const subType = document.querySelector('#editSubTypeGroup .subtype-btn.selected')?.dataset.subtype || tx.subType;

  const oldDate = tx.date;
  const oldCategory = tx.category;

  tx.amount = amount;
  tx.category = category;
  tx.date = date;
  tx.note = note;
  tx.subType = subType;

  saveData();
  closeEditPanel();

  const isSameMonth = (d1, d2) => {
    const a = new Date(d1), b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  };

  const monthChanged = !isSameMonth(oldDate, date);
  const categoryChanged = oldCategory !== category;

  refreshAll();

  selectedDate = date;
  updateDateDisplay();

  if (monthChanged) {
    const d = new Date(date);
    showToast(`已更新，该记录已移至${d.getFullYear()}年${d.getMonth() + 1}月`);
  } else if (categoryChanged && isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail.style.display !== 'none') {
      hideCategoryDetail();
    }
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

  const categories = CATEGORIES;
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
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = 'none';
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

function batchChangeDate() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const overlay = document.getElementById('editOverlay');
  document.getElementById('editPanelTitle').textContent = '修改日期';
  document.getElementById('editAmount').value = '';
  document.getElementById('editNote').value = '';
  document.getElementById('editCategoryGrid').innerHTML = '';
  const editDisplay = document.getElementById('editDateDisplay');
  editDisplay.textContent = formatDateDisplay(getTodayDate());
  editDisplay.dataset.date = getTodayDate();

  const amountGroup = document.querySelector('.edit-panel-body .amount-group');
  if (amountGroup) amountGroup.style.display = 'none';
  const categoryGrid = document.getElementById('editCategoryGrid');
  if (categoryGrid) categoryGrid.style.display = 'none';
  const noteField = document.querySelector('.form-field:last-child');
  if (noteField) noteField.style.display = 'none';
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = 'none';

  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '确认修改';
  saveBtn.onclick = () => {
    const newDate = document.getElementById('editDateDisplay').dataset.date;
    transactions.forEach(t => {
      if (selectedIds.has(t.id)) {
        t.date = newDate;
      }
    });
    saveData();
    closeEditPanel();
    selectedIds.clear();
    showToast('日期已更新');
    if (isSelectMode) toggleSelectMode();
    refreshAll();
  };

  overlay.style.display = '';
}

function openDataPanel() {
  document.getElementById('clearMonthDesc').textContent =
    `删除 ${currentYear}年${currentMonth}月 的所有账单`;

  const total = getTotalExpense();
  const el = document.getElementById('dataTotalExpense');
  el.textContent = formatAmount(total);

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

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initMonth();
  initThemePanel();

  window.addEventListener('resize', () => {
    const pageWrapper = document.getElementById('pageWrapper');
    const appContainer = document.querySelector('.app');
    const reviewSection = document.getElementById('reviewSection');
    const isWideScreen = window.innerWidth >= 768;
    if (isReviewMode) {
      if (isWideScreen) {
        pageWrapper.classList.add('dual-page');
        appContainer.classList.add('dual-mode');
        document.body.classList.add('dual-mode');
        reviewSection.style.display = '';
        document.getElementById('formSection').style.display = '';
        document.getElementById('listSection').style.display = '';
      } else {
        pageWrapper.classList.remove('dual-page');
        appContainer.classList.remove('dual-mode');
        document.body.classList.remove('dual-mode');
        setTimeout(() => {
          reviewSection.style.display = 'none';
          document.getElementById('formSection').style.display = 'none';
          document.getElementById('listSection').style.display = 'none';
        }, 300);
      }
    }
  });

  const today = getTodayDate();
  selectedDate = today;
  updateDateDisplay();

  document.getElementById('dateTrigger').addEventListener('click', () => openCalendar('input'));
  document.getElementById('editDateTrigger').addEventListener('click', () => openCalendar('edit'));
  document.getElementById('calendarOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCalendar();
  });
  document.getElementById('calPrevMonth').addEventListener('click', calPrevMonth);
  document.getElementById('calNextMonth').addEventListener('click', calNextMonth);
  document.getElementById('calToday').addEventListener('click', calGoToday);
  document.getElementById('calConfirm').addEventListener('click', confirmCalendar);

  document.getElementById('btnSubmit').addEventListener('click', addTransaction);
  document.getElementById('btnQuickEntry').addEventListener('click', openQuickPanel);
  document.getElementById('btnQuickClose').addEventListener('click', closeQuickPanel);
  document.getElementById('quickOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeQuickPanel();
  });
  document.getElementById('btnPrevMonth').addEventListener('click', () => { saveMemo(); prevMonth(); });
  document.getElementById('btnNextMonth').addEventListener('click', () => { saveMemo(); nextMonth(); });
  document.getElementById('btnTopReview').addEventListener('click', toggleReview);

  document.getElementById('btnCategoryBack').addEventListener('click', hideCategoryDetail);

  document.getElementById('btnSelectMode').addEventListener('click', toggleSelectMode);
  document.getElementById('btnBatchDelete').addEventListener('click', batchDelete);
  document.getElementById('btnBatchCategory').addEventListener('click', batchChangeCategory);
  document.getElementById('btnBatchDate').addEventListener('click', batchChangeDate);
  document.getElementById('btnBatchInvert').addEventListener('click', batchInvert);

  document.getElementById('btnEditSave').addEventListener('click', saveEdit);
  document.getElementById('btnEditDelete').addEventListener('click', deleteFromEdit);
  document.getElementById('editOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditPanel();
  });
  document.getElementById('editAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
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

  document.getElementById('btnBudgetEdit').addEventListener('click', () => {
    openBudgetPanel(currentYear, currentMonth);
  });
  document.getElementById('btnBudgetClose').addEventListener('click', closeBudgetPanel);
  document.getElementById('budgetOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBudgetPanel();
  });
  document.getElementById('dayBudgetToggle').addEventListener('click', toggleDayBudget);
  document.getElementById('budgetOverviewToggle').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') toggleBudgetOverview();
  });
  document.getElementById('btnBudgetSave').addEventListener('click', saveBudget);
  document.getElementById('btnBudgetDelete').addEventListener('click', deleteBudgetConfig);

  document.getElementById('inputAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTransaction();
  });

  const memoInput = document.getElementById('memoInput');
  if (memoInput) {
    memoInput.addEventListener('input', () => {
      updateMemoCount();
      saveMemo();
    });
  }

  populateCategories();
  initSwipeSelect();
  refreshAll();
});
