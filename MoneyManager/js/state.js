let transactions = [];

let currentSubType = 'expense';
let currentYear = 0;
let currentMonth = 0;
let selectedCategory = '';
let selectedDate = '';
let isReviewMode = false;
let toastTimer = null;

let calActiveSource = null;
let calYear = 0;
let calMonth = 0;
let calSelectedDate = '';

let quickSelectedCategory = null;

let editingId = null;

let isSelectMode = false;
let selectedIds = new Set();

let swipeSelectLastId = null;
let swipeLocked = false;
let longPressTimer = null;

let isDayBudgetExpanded = false;

let themePreview = null;
let originalTheme = null;
