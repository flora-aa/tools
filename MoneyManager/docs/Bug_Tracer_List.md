# Bug Tracer List - MoneyManager

生成日期：2026-05-09
状态：**全部修复（2026-05-14 审核）**

> 注：代码已从单体 script.js 重构为多模块架构（19 个 JS 文件），所有早期 Bug 已在重构过程中通过模块拆分、函数重组解决。

---

### 问题描述
在预算设置面板保存预算后，页面没有正确刷新显示新设置的预算。

### 影响功能
- 预算模块 - 预算设置

### 根因分析

**调用链追踪**：

```
用户点击"保存"按钮
  ↓
btnBudgetSave.click → saveBudget()
  ↓
setBudget() → saveBudgets() → localStorage ✓
  ↓
showToast('预算已保存') ✓
  ↓
closeBudgetPanel() ✓
  ↓
refreshAll() ← 理论上应该刷新
```

**问题发现**：

在 `refreshAll()` 函数中：
```javascript
function refreshAll() {
  updateMonthLabel();
  updateMonthExpense();
  if (isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail.style.display !== 'none') {
      hideCategoryDetail();  // ← 问题1：隐藏分类详情后没有重新渲染
    }
    renderReview();
  } else {
    renderList();
  }
}
```

在 `hideCategoryDetail()` 函数中：
```javascript
function hideCategoryDetail() {
  document.getElementById('reviewRank').style.display = '';  // 显示分类排行
  document.getElementById('reviewCategoryDetail').style.display = 'none';  // 隐藏详情
  // ← 问题2：没有重新渲染分类排行！
}
```

### 涉及函数

| 函数名 | 位置 | 问题 |
|--------|------|------|
| `refreshAll()` | script.js:704 | 隐藏详情后应重新调用 renderReview() |
| `hideCategoryDetail()` | script.js:672 | 只修改 display，没重新渲染内容 |

### 修复建议

**方案A**：在 `hideCategoryDetail()` 末尾添加重新渲染分类排行的逻辑

**方案B**：修改 `refreshAll()` 中的逻辑，检测是否需要重新渲染

**推荐方案A**：
```javascript
function hideCategoryDetail() {
  document.getElementById('reviewRank').style.display = '';
  document.getElementById('reviewCategoryDetail').style.display = 'none';
  // 添加：重新渲染分类排行
  renderReviewRank();
}
```

需要新增 `renderReviewRank()` 函数来单独渲染分类排行部分。

---

## Bug #2：每日预算追踪应该放在记账的当前模块里

### 问题描述
用户反映每日预算追踪功能只显示在"月度复盘"页面，但用户希望在日常记账时也能看到当天的预算执行情况。

### 影响功能
- 预算模块 - 每日预算追踪
- 记账模块 - 日常使用体验

### 根因分析
每日预算追踪的 HTML 和渲染逻辑目前只在 `review-section` 中：
- HTML：只在复盘页面（index.html:134-139）
- 渲染：在 `renderReview()` 中调用 `renderDayBudgetList()`

### 涉及函数

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `renderDayBudgetList()` | script.js:1306 | 目前只在 renderReview 中调用 |
| `renderBudgetOverview()` | script.js:1284 | 目前只在 renderReview 中调用 |

### 修复建议

**Phase 1（简单方案）**：
将每日预算追踪的 HTML 结构添加到记账页面的列表区域上方（`list-section`），并在 `renderList()` 或 `refreshAll()` 中同时调用 `renderDayBudgetList()`。

**Phase 2（完整方案）**：
设计独立的"今日预算"模块，显示在记账表单下方：
- 今日可用预算
- 今日实际支出
- 今日状态（GoodJob!/Good/ComeOn/Over）
- 剩余可用

需要新增：
- `renderTodayBudget()` 函数
- 对应的 HTML 结构

---

## Bug #3：本月消费分布热力图未显示

### 问题描述
在月度复盘页面中，热力图没有显示。

### 影响功能
- 月度热力图模块

### 根因分析

**调用链追踪**：

```
renderReview() 开始
  ↓
reviewPeriod 设置 ✓
loadMemo() ✓
reviewTotal/reviewCount/reviewDailyAvg/reviewMax 设置
  ↓
获取 monthTx 和 monthRefunds
  ↓
if (monthTx.length === 0) {
  container.innerHTML = '<div class="empty-list">暂无数据</div>';
  return;  // ← 问题：这里直接返回，后面的热力图和预算都不执行！
}
```

**核心问题**：

`renderReview()` 函数在第419-422行有早期返回逻辑：
```javascript
if (monthTx.length === 0) {
  container.innerHTML = '<div class="empty-list">暂无数据</div>';
  return;  // 直接 return
}
```

这导致以下代码永远不会执行：
- 分类排行渲染（renderReviewRank）
- 热力图渲染（renderHeatmap）
- 预算概览（renderBudgetOverview）
- 每日追踪（renderDayBudgetList）

### 涉及函数

| 函数名 | 位置 | 问题 |
|--------|------|------|
| `renderReview()` | script.js:393 | 早期返回阻断后续渲染 |

### 修复建议

**方案A**：将早期返回移到分类排行之后
```javascript
// 先渲染热力图和预算
renderHeatmap();
renderBudgetOverview();
renderDayBudgetList();

// 然后渲染分类排行（这个可以为空时提前返回）
if (monthTx.length === 0) {
  container.innerHTML = '<div class="empty-list">暂无数据</div>';
  return;
}
renderReviewRank(); // 渲染分类排行
```

**方案B**：提取各部分为独立函数，在主流程中按顺序调用
```javascript
function renderReview() {
  loadMemo();
  renderHeatmap();           // 先渲染热力图（不需要数据）
  renderBudgetOverview();     // 渲染预算概览（不需要 monthTx）
  renderDayBudgetList();      // 渲染每日追踪（不需要 monthTx）
  renderReviewRank();         // 渲染分类排行（需要 monthTx，可提前返回）
}
```

---

## Bug #4：分类排行未显示

### 问题描述
在月度复盘页面中，分类排行没有显示。

### 影响功能
- 月度复盘 - 分类统计

### 根因分析

**与 Bug #3 同根因**：

由于 `renderReview()` 中的早期返回：
```javascript
if (monthTx.length === 0) {
  container.innerHTML = '<div class="empty-list">暂无数据</div>';
  return;
}
```

当月份没有交易记录时，函数提前返回，分类排行的渲染代码（第418-509行）不会执行。

### 涉及函数

| 函数名 | 位置 | 问题 |
|--------|------|------|
| `renderReview()` | script.js:393 | 早期返回阻断分类排行渲染 |

### 修复建议

**与 Bug #3 相同**：重构 `renderReview()` 函数，将分类排行渲染与热力图/预算渲染分离。

---

## Bug #5：摘要统计区域缺失

### 问题描述
在重构过程中，原有的"总支出、总笔数、日均、单笔最高"摘要统计区域被意外删除。

### 影响功能
- 月度复盘 - 摘要统计

### 根因分析

在添加预算模块 HTML 时，误将原有的 `review-summary` 部分替换掉了：

```html
<!-- 错误：直接替换了 review-summary -->
<div class="budget-overview" id="budgetOverview">
  ...
</div>
<!-- 应该是添加，而不是替换 -->
```

### 涉及文件

| 文件 | 位置 | 问题 |
|------|------|------|
| index.html | ~line 102 | 误删 review-summary 区域 |

### 修复建议

在 `budget-overview` 之前添加 `review-summary` 区域，或将摘要统计整合到预算概览中。

---

## 修复优先级建议

| 优先级 | Bug | 原因 |
|--------|-----|------|
| P0 | Bug #3, #4, #5 | 功能完全不可见，需要紧急修复 |
| P1 | Bug #1 | 核心功能不可用 |
| P2 | Bug #2 | 体验优化，可后续迭代 |

---

## 修复后的 renderReview() 函数设计

```javascript
function renderReview() {
  // 1. 设置月份标题
  document.getElementById('reviewPeriod').textContent = `${currentYear}年${currentMonth}月`;

  // 2. 加载月度小结
  loadMemo();

  // 3. 渲染摘要统计（总支出、总笔数、日均、单笔最高）
  renderReviewSummary();

  // 4. 渲染预算概览
  renderBudgetOverview();

  // 5. 渲染每日预算追踪
  renderDayBudgetList();

  // 6. 渲染热力图
  renderHeatmap();

  // 7. 渲染分类排行
  renderReviewRank();
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

  // ... 原有的分类排行渲染逻辑
}
```

---

## 相关函数清单

### 需要新增的函数

| 函数名 | 功能 | 优先级 |
|--------|------|--------|
| `renderReviewSummary()` | 渲染摘要统计区域 | P0 |
| `renderReviewRank()` | 渲染分类排行区域 | P0 |
| `renderTodayBudget()` | 渲染今日预算（记账页面用） | P2 |

### 需要修改的函数

| 函数名 | 修改内容 | 优先级 |
|--------|---------|--------|
| `renderReview()` | 重构为调用各子渲染函数 | P0 |
| `hideCategoryDetail()` | 重新渲染分类排行 | P1 |
| `refreshAll()` | 调整刷新逻辑 | P1 |
| `renderList()` | 添加今日预算渲染调用 | P2 |

### 需要修复的 HTML

| 元素 | 问题 | 优先级 |
|------|------|--------|
| `.review-summary` | 缺失，需要添加 | P0 |
| `#reviewTotal` | 需要确保存在于 HTML 中 | P0 |
| `#reviewCount` | 需要确保存在于 HTML 中 | P0 |
| `#reviewDailyAvg` | 需要确保存在于 HTML 中 | P0 |
| `#reviewMax` | 需要确保存在于 HTML 中 | P0 |
