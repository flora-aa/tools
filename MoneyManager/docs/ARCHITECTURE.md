# 架构文档

## 整体架构

MoneyManager 是一个纯前端单页应用（SPA），采用模块化代码组织：

```
index.html  →  视图模板（DOM 结构）
css/*.css   →  样式系统（9 个 CSS 文件：base, components, overlay, theme, review, budget, batch, data, dual）
js/*.js     →  控制器 + 模型（19 个 JS 模块：main, data, calendar, quick, edit, review, budget, theme, overlay, inherit, utils, constants, categories, state, storage, transaction, list, batch, heatmap）
```

所有数据持久化在浏览器的 `localStorage` 中，无后端依赖。

---

## HTML 结构

### 主要 Section

| Section | ID | 用途 |
|---|---|---|
| 顶部导航栏 | `.top-bar` | 月份切换、月度支出显示、复盘按钮 |
| 记账表单 | `formSection` | 金额输入、分类选择、日期选择、备注、提交按钮 |
| 账单列表 | `listSection` | 当日预算条、日期标题、账单列表、选择模式 |
| 月度复盘 | `reviewSection` | 预算概览、每日预算追踪、支出统计、分类分析、月度小结 |
| 批量操作栏 | `batchBar` | 批量反选、改分类、改日期、删除 |

### Overlay 列表（共 6 个）

| Overlay | ID | 类型 | 用途 |
|---|---|---|---|
| 快速记账 | `quickOverlay` | 底部弹出 | 快速选择分类，基于上次金额一键记账 |
| 编辑账单 | `editOverlay` | 底部弹出 | 编辑/删除单条账单，也用于批量改分类/日期 |
| 数据管理 | `dataOverlay` | 底部弹出 | 显示累计支出，提供清除本月/全部数据、进入主题设置 |
| 预算设置 | `budgetOverlay` | 底部弹出 | 设置月度预算金额、目标、工作模式 |
| 日历选择 | `calendarOverlay` | 居中模态 | 自定义日期选择器 |
| 主题设置 | `themeOverlay` | 底部弹出 | 8 套预设主题 + 5 个自定义颜色按钮（含字体色）+ 24 色取色面板 + 深浅微调条 |
| 数据继承 | `inheritOverlay` | 底部弹出 | GitHub Gist 导入/导出，AES-GCM 加密 |

---

## CSS 架构

### 主题变量系统

CSS 使用自定义属性构建了完整的主题系统，约 40 个变量：

**核心色板**：`--accent`、`--color-expense`、`--color-income`、`--color-warn`、`--color-great`

**背景系统**：`--bg-primary`、`--bg-card`、`--bg-card-alt`、`--bg-input`、`--bg-hover`、`--bg-active`

**文字系统**：`--text-primary`、`--text-secondary`、`--text-muted`、`--text-disabled`

**边框与阴影**：`--border-color`、`--border-focus`、`--shadow-card`、`--shadow-dropdown`、`--shadow-modal`

**圆角系统**：`--radius-xs`(4px)、`--radius-sm`(8px)、`--radius-md`(12px)、`--radius-lg`(16px)、`--radius-xl`(20px)、`--radius-full`(9999px)

### 组件分类

- **按钮系统**：`.btn-primary`、`.btn-secondary`、`.btn-ghost`、`.btn-icon`、`.btn-danger`、`.btn-success`
- **输入框系统**：`.input`、`.input-number`、`.input-text`
- **卡片系统**：`.card`、`.card-sm`、`.card-alt`
- **Overlay 系统**：`.overlay`、`.panel`、`.panel-header`、`.panel-body`、`.panel-actions`
- **开关组件**：`.toggle`、`.toggle-track`、`.toggle-thumb`
- **标签组件**：`.tag`、`.tag-expense`、`.tag-income`
- **列表项组件**：`.list-item`、`.list-item-check`、`.list-item-info`、`.list-item-amount`
- **日历组件**：`.cal-day`、`.cal-grid`、`.cal-weekdays`
- **预算组件**：`.budget-summary-row`、`.budget-progress`、`.budget-today-row`
- **复盘组件**：`.review-card`、`.review-summary-grid`、`.review-rank-item`、`.review-memo-input`

### 响应式断点

| 断点 | 媒体查询 | 主要变化 |
|---|---|---|
| 窄屏 | `max-width: 360px` | 缩小字体、间距 |
| 矮屏 | `max-height: 640px` | 缩小内边距和字号 |
| 中屏 | `min-width: 480px` | 增大金额输入字号 |
| 宽屏 | `min-width: 768px` | 启用双页模式、body 加 padding、app 加圆角和阴影 |
| 大屏 | `min-width: 1024px` | 增大间距 |

### 动画

- `slideUp`：底部面板弹出（0.3s ease）
- `fadeIn`：Overlay 背景淡入（0.2s ease）
- `scaleIn`：居中模态框缩放进入（0.2s ease）
- `pageFadeIn`：双页模式下左右面板的淡入+位移（0.3s cubic-bezier）

---

## JavaScript 架构

### 核心数据

```javascript
let transactions = [];  // 所有账单记录
// 每条记录格式：
{
  id: string,           // generateId() 生成
  subType: string,      // 'expense' | 'refund' | 'advance'
  amount: number,       // 金额
  category: string,     // 分类
  note: string,         // 备注
  date: string,         // 'YYYY-MM-DD'
  createdAt: number     // 时间戳
}
```

### 数据持久化（localStorage）

| Key | 格式 | 用途 |
|---|---|---|
| `mm_transactions` | `Transaction[]` JSON | 所有账单记录 |
| `mm_theme` | `{ accent, bg, expense, income, text, btnTopReviewColor }` | 主题配置 |
| `mm_budgets` | `{ "YYYY-MM": { amount, target, workMode, excludeIds } }` | 月度预算 |
| `mm_lastAmounts` | `{ "分类": 金额 }` | 各分类上次记录金额 |
| `mm_memo_YYYY_MM` | 纯文本 | 月度小结内容 |

### 核心函数分类

**数据层**：`loadData()`（data.js）、`saveData()`（data.js）、`getBudgetMonthSpent()`（budget.js）

**日期处理**：`getTodayDate()`（utils.js）、`formatDateDisplay()`、`formatDateLabel()`（calendar.js）、`prevMonth()`、`nextMonth()`（data.js）

**UI 渲染**：`renderList()`（edit.js）、`renderReview()`（review.js）、`renderBudgetOverview()`、`renderDayBudgetList()`（budget.js）

**Overlay 管理**：`openOverlay(id)`、`closeAllOverlays()`（overlay.js）

**主题系统**：`applyTheme(theme)`、`getLuminance(hex)`、`getContrastColor(bgHex)`、`lighten(hex, percent)`、`darken(hex, percent)`、`hexToRgba(hex, alpha)`（theme.js）

**预算算法**：`getDailyBudget(year, month, day)`、`getDayStatus(budget, actual)`、`getDayHeatLevel(dailyBudget, actualSpent)`（budget.js）

**批量操作**：`toggleSelectMode()`、`toggleSelectItem(id)`、`batchDelete()`、`batchInvert()`、`batchChangeCategory()`、`batchChangeDate()`（edit.js）

**快速记账**：`openQuickPanel()`、`quickSubmit(category)`（quick.js）

**数据继承**：`exportToGist()`、`importFromGist()`、`encryptData()`、`decryptData()`（inherit.js）

### 双页模式

- 触发条件：`isReviewMode === true` 且 `window.innerWidth >= 768`
- 实现方式：给 `pageWrapper` 添加 `dual-page` class，给 `.app` 和 `body` 添加 `dual-mode` class
- 宽屏下：表单区（左）和复盘区（右）同时显示
- 窄屏下：表单和列表隐藏，仅显示复盘区
- `resize` 事件监听：动态切换双页模式

### 交互流程

1. **记账**：输入金额 → 选择分类 → 选择日期 → 输入备注 → 提交 → 保存 → 刷新列表
2. **快速记账**：点击快速记账 → 弹出面板 → 点击分类 → 自动提交 → 关闭面板 → 刷新列表
3. **编辑/删除**：点击账单项 → 弹出编辑面板 → 修改后保存/删除 → 刷新
4. **批量操作**：点击选择 → 进入选择模式 → 选中账单 → 执行批量操作 → 刷新
5. **月度复盘**：点击月度复盘 → 切换 isReviewMode → 宽屏双页/窄屏单页
6. **预算管理**：在复盘区点击设置 → 弹出预算面板 → 输入金额/目标 → 保存 → 自动更新
7. **主题设置**：从数据管理进入 → 选择预设/自定义 → 应用/取消
8. **日历交互**：点击日期触发器 → 弹出日历 → 选择日期 → 确定应用
