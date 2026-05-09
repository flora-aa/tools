# 数据流文档

## 数据模型

### 账单记录（Transaction）

```javascript
{
  id: string,           // 唯一标识：Date.now().toString(36) + 随机5位字符
  subType: string,      // 子类型：'expense'（支出）| 'refund'（退款）| 'advance'（垫付）
  amount: number,       // 金额（正数）
  category: string,     // 分类名称，来自 CATEGORIES 数组
  note: string,         // 备注文本
  date: string,         // 日期，格式 'YYYY-MM-DD'
  createdAt: number     // 创建时间戳，Date.now()
}
```

### 预算配置（Budget）

```javascript
{
  "YYYY-MM": {
    amount: number,       // 月度预算金额
    target: string,       // 预算目标描述（可选）
    workMode: string,     // 'double'（双休）| 'single'（单休）
    excludeIds: string[]  // 排除的账单 ID 列表
  }
}
```

### 主题配置（Theme）

```javascript
{
  accent: string,       // 主题色 hex
  bg: string,           // 背景色 hex
  expense: string,      // 支出色 hex
  income: string,       // 收入色 hex
  btnTopReviewColor: string  // 复盘按钮颜色（可选）
}
```

---

## 数据流图

### 记账流程

```
用户输入 → 验证金额 → 创建 Transaction 对象
  → transactions.push() → saveData() → localStorage
  → renderList() → renderBudgetOverview() → UI 更新
```

### 快速记账流程

```
点击快速记账 → openQuickPanel()
  → 从 mm_lastAmounts 读取各分类上次金额
  → 渲染分类网格
  → 点击分类 → quickSubmit(category)
  → 创建 Transaction → saveData()
  → 更新 mm_lastAmounts
  → closeAllOverlays() → renderList()
```

### 编辑/删除流程

```
点击账单项 → openEditPanel(tx)
  → 预填金额、分类、日期、备注、子类型
  → 保存：更新 transactions → saveData() → renderList()
  → 删除：确认 → transactions.splice() → saveData() → renderList()
```

### 月度复盘流程

```
点击月度复盘 → toggleReview()
  → isReviewMode = !isReviewMode
  → 宽屏：启用双页模式（表单+复盘左右分栏）
  → 窄屏：隐藏表单和列表，仅显示复盘
  → renderReview() → renderBudgetOverview() → renderDayBudgetList()
```

### 预算计算流程

```
设置预算 → 保存到 mm_budgets
  → renderBudgetOverview():
    → 计算月度总支出 getBudgetMonthSpent()
    → 计算剩余预算 = amount - spent
    → 计算每日可用额度 getDailyBudget()
    → 更新进度条、今日状态
  → renderDayBudgetList():
    → 遍历当月每一天
    → 计算每日预算 vs 实际支出
    → 计算热力等级 getDayHeatLevel()
    → 渲染每日预算行
```

### 主题应用流程

```
applyTheme(theme):
  → 根据 bg 亮度计算文字色、卡片色、输入框色
  → 生成 accent 的 alpha 变体
  → root.style.setProperty() 设置所有 CSS 变量
  → 保存到 localStorage mm_theme
```

---

## 关键算法

### 动态日预算

```javascript
getDailyBudget(year, month, day) {
  // 1. 获取当月预算配置
  // 2. 计算当月已支出（排除退款和排除 ID）
  // 3. 计算剩余预算 = 总预算 - 已支出
  // 4. 计算剩余天数（根据工作模式排除周末）
  // 5. 日预算 = 剩余预算 / 剩余天数
}
```

### 支出状态判定

```javascript
getDayStatus(budget, actual) {
  ratio = actual / budget
  if (budget === 0) return 'EMPTY'     // 无预算
  if (actual === 0) return 'GREAT'     // 未支出
  if (ratio <= 0.5) return 'GOOD'      // 良好
  if (ratio <= 1.0) return 'WARN'      // 警告
  return 'OVER'                         // 超支
}
```

### 热力等级

```javascript
getDayHeatLevel(dailyBudget, actualSpent) {
  ratio = actualSpent / dailyBudget
  if (dailyBudget <= 0) return 4       // 超支
  if (actualSpent === 0) return 0      // 无支出
  if (ratio <= 0.5) return 1           // 低
  if (ratio <= 0.8) return 2           // 中
  if (ratio <= 1.0) return 3           // 高
  return 4                              // 超支
}
```

### 主题颜色计算

```javascript
getLuminance(hex) → 计算亮度值 (0-255)
getContrastColor(bgHex) → 根据背景亮度返回黑/白
lighten(hex, percent) → 颜色变亮
darken(hex, percent) → 颜色变暗
hexToRgba(hex, alpha) → 十六进制转 RGBA
```

---

## 状态管理

### 全局变量

```javascript
let transactions = [];       // 所有账单数据
let currentYear, currentMonth;  // 当前查看的年份和月份
let selectedDate = '';       // 当前选中的日期 'YYYY-MM-DD'
let isReviewMode = false;    // 是否处于月度复盘模式
let isSelectMode = false;    // 是否处于批量选择模式
let selectedIds = new Set(); // 批量选中的账单 ID
let activeOverlay = null;    // 当前打开的 overlay
```

### 状态变更触发链

```
日期变更 → syncDateToCurrentMonth() → refreshAll()
  → renderList() → renderBudgetOverview() → renderDayBudgetList()

月份变更 → prevMonth()/nextMonth()
  → currentYear/currentMonth 更新
  → syncDateToCurrentMonth() → refreshAll()

数据变更 → saveData() → refreshAll()

窗口尺寸变更 → resize 事件
  → 检查 isReviewMode && window.innerWidth >= 768
  → 切换双页/单页模式
```
