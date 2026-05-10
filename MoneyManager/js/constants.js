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
