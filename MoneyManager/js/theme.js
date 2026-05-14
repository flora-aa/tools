function updateThemeColorBtn(btnId, color) {
  const btn = document.getElementById(btnId);
  const preview = btn.querySelector('.theme-color-preview');
  if (preview) preview.style.background = color;
}

const COLOR_SWATCHES = [
  // 第1行: 纯暗背景色 (深红→深橙→深黄→深绿→深蓝→深紫)
  '#2d1a1a', '#2d1f1a', '#3d3510', '#1a2d1a', '#0d1a2d', '#1a1a2d',
  // 第2行: 鲜艳强调色 (红→橙→黄→绿→蓝→紫)
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
  // 第3行: 现代艺术色 (柔化/高级)
  '#ff6b6b', '#ffa94d', '#ffd43b', '#38d9a9', '#74c0fc', '#b197fc',
  // 第4行: 浅色亮色 (适合浅背景/浅色文字)
  '#e9ecef', '#fff4e6', '#fff9db', '#e6fcf5', '#e7f5ff', '#f3f0ff',
];

let activeColorField = null;
let themeColors = {};

const COLOR_FIELDS = {
  themeAccentBtn: { key: 'accent', label: '主题色' },
  themeBgBtn: { key: 'bg', label: '背景色' },
  themeExpenseBtn: { key: 'expense', label: '支出色' },
  themeIncomeBtn: { key: 'income', label: '收入色' },
  themeTextBtn: { key: 'text', label: '字体色' },
};

function renderShadeBar(baseColor) {
  const shadeRow = document.getElementById('colorSwatchShadeRow');
  const shadesContainer = document.getElementById('colorSwatchShades');
  const shades = [
    { level: -40, label: '更暗', color: darken(baseColor, 40) },
    { level: -20, label: '暗', color: darken(baseColor, 20) },
    { level: 0, label: '当前', color: baseColor },
    { level: 20, label: '亮', color: lighten(baseColor, 20) },
    { level: 40, label: '更亮', color: lighten(baseColor, 40) },
  ];
  shadesContainer.innerHTML = shades.map(s => `
    <div class="color-swatch-shade ${s.level === 0 ? 'active' : ''}" style="background:${s.color};color:${s.color}" data-shade-color="${s.color}"></div>
  `).join('');
  shadeRow.style.display = '';
}

function openColorSwatch(fieldKey) {
  const field = COLOR_FIELDS[fieldKey];
  if (!field) return;
  activeColorField = fieldKey;
  const panel = document.getElementById('colorSwatchPanel');
  const title = document.getElementById('colorSwatchTitle');
  const grid = document.getElementById('colorSwatchGrid');
  const currentColor = themeColors[field.key];

  title.textContent = field.label;

  document.querySelectorAll('.theme-color-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(fieldKey).classList.add('active');

  grid.innerHTML = COLOR_SWATCHES.map(c => `
    <div class="color-swatch ${c === currentColor ? 'active' : ''}" style="background:${c};color:${c}" data-color="${c}"></div>
  `).join('');

  renderShadeBar(currentColor);
  panel.style.display = '';
}

function closeColorSwatch() {
  document.getElementById('colorSwatchPanel').style.display = 'none';
  document.querySelectorAll('.theme-color-btn').forEach(el => el.classList.remove('active'));
  activeColorField = null;
}

function applySwatchColor(color) {
  if (!activeColorField) return;
  const field = COLOR_FIELDS[activeColorField];
  if (!field) return;

  themeColors[field.key] = color;
  updateThemeColorBtn(activeColorField, color);

  document.querySelectorAll('.color-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.color === color);
  });

  renderShadeBar(color);

  applyTheme(themeColors);
  renderThemePresets();
  renderThemePreview();
}

function initThemePanel() {
  document.getElementById('btnTheme').addEventListener('click', () => {
    openOverlay('themeOverlay');
    const saved = localStorage.getItem('mm_theme');
    const currentTheme = saved ? JSON.parse(saved) : THEME_PRESETS[0];
    themeColors = { ...currentTheme };
    if (!themeColors.text) themeColors.text = getContrastColor(themeColors.bg);
    updateThemeColorBtn('themeAccentBtn', currentTheme.accent);
    updateThemeColorBtn('themeBgBtn', currentTheme.bg);
    updateThemeColorBtn('themeExpenseBtn', currentTheme.expense);
    updateThemeColorBtn('themeIncomeBtn', currentTheme.income);
    updateThemeColorBtn('themeTextBtn', themeColors.text);
    originalTheme = { ...themeColors };
    themePreview = { ...themeColors };
    closeColorSwatch();
    renderThemePresets();
    renderThemePreview();
  });

  document.getElementById('btnThemeClose').addEventListener('click', () => {
    if (originalTheme) {
      applyTheme(originalTheme);
    }
    themePreview = null;
    originalTheme = null;
    closeColorSwatch();
    closeAllOverlays();
  });

  document.getElementById('themeOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'themeOverlay') {
      if (originalTheme) {
        applyTheme(originalTheme);
      }
      themePreview = null;
      originalTheme = null;
      closeColorSwatch();
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
    closeColorSwatch();
    closeAllOverlays();
  });

  Object.keys(COLOR_FIELDS).forEach(btnId => {
    document.getElementById(btnId).addEventListener('click', (e) => {
      if (e.target.closest('.color-swatch-close') || e.target.closest('.color-swatch-shade')) return;
      if (activeColorField === btnId) {
        closeColorSwatch();
      } else {
        openColorSwatch(btnId);
      }
    });
  });

  document.getElementById('colorSwatchClose').addEventListener('click', closeColorSwatch);

  document.getElementById('colorSwatchGrid').addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (swatch) {
      applySwatchColor(swatch.dataset.color);
    }
  });

  document.getElementById('colorSwatchShades').addEventListener('click', (e) => {
    const shade = e.target.closest('.color-swatch-shade');
    if (shade) {
      applySwatchColor(shade.dataset.shadeColor);
    }
  });
}

function renderThemePreview() {
  const container = document.getElementById('themeCustomPreview');
  if (!themePreview) return;

  const saved = localStorage.getItem('mm_theme');
  const currentTheme = saved ? JSON.parse(saved) : THEME_PRESETS[0];
  const isCustom = themePreview.accent !== currentTheme.accent ||
                   themePreview.bg !== currentTheme.bg ||
                   themePreview.expense !== currentTheme.expense ||
                   themePreview.income !== currentTheme.income ||
                   (themePreview.text || getContrastColor(themePreview.bg)) !== (currentTheme.text || getContrastColor(currentTheme.bg));

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
    text: getComputedStyle(root).getPropertyValue('--text-primary').trim(),
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
  const textColor = theme.text || getContrastColor(bg);
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

  container.innerHTML = THEME_PRESETS.map(preset => {
    const presetText = preset.text || getContrastColor(preset.bg);
    const previewText = previewTheme.text || getContrastColor(previewTheme.bg);
    const isActive = preset.accent === previewTheme.accent &&
      preset.bg === previewTheme.bg &&
      preset.expense === previewTheme.expense &&
      preset.income === previewTheme.income &&
      presetText === previewText;
    return `
    <div class="theme-preset ${isActive ? 'active' : ''}" data-preset="${preset.name}">
      <div class="theme-preset-preview" style="background: ${preset.bg}">
        <div class="theme-preset-accent" style="background: ${preset.accent}"></div>
        <div class="theme-preset-expense" style="background: ${preset.expense}"></div>
        <div class="theme-preset-income" style="background: ${preset.income}"></div>
      </div>
      <span class="theme-preset-name">${preset.name}</span>
    </div>
  `}).join('');

  container.querySelectorAll('.theme-preset').forEach(el => {
    el.addEventListener('click', () => {
      const preset = THEME_PRESETS.find(p => p.name === el.dataset.preset);
      if (preset) {
        themeColors = { ...preset };
        themeColors.text = preset.text || getContrastColor(preset.bg);
        updateThemeColorBtn('themeAccentBtn', preset.accent);
        updateThemeColorBtn('themeBgBtn', preset.bg);
        updateThemeColorBtn('themeExpenseBtn', preset.expense);
        updateThemeColorBtn('themeIncomeBtn', preset.income);
        updateThemeColorBtn('themeTextBtn', themeColors.text);
        themePreview = { ...themeColors };
        closeColorSwatch();
        renderThemePresets();
        renderThemePreview();
      }
    });
  });
}
