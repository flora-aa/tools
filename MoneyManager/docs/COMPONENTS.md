# 组件文档

## Overlay 组件

所有 overlay 使用统一的 `.overlay` + `.panel` 结构，支持底部弹出和居中模态两种模式。

### 底部弹出（默认）

```html
<div class="overlay" id="xxxOverlay" style="display:none">
  <div class="panel">
    <div class="panel-handle"></div>
    <div class="panel-header">
      <span class="panel-title">标题</span>
      <button class="panel-close">×</button>
    </div>
    <div class="panel-body">
      <!-- 内容 -->
    </div>
    <div class="panel-actions">
      <!-- 底部按钮 -->
    </div>
  </div>
</div>
```

### 居中模态

```html
<div class="overlay panel-modal" id="xxxOverlay" style="display:none">
  <div class="panel">
    <!-- 同上 -->
  </div>
</div>
```

### 双页模式适配

- 宽屏（>=768px）下，overlay 的 panel 宽度限制为 `max-width: 480px`（单页）或 `calc(480px * 2 + 20px + 32px)`（双页）
- 遮罩层使用 `position: fixed; inset: 0` 覆盖整个视口
- 所有 overlay 放在 `.app` 容器外部，避免被容器的 `border-radius` 和 `overflow` 裁剪

---

## 按钮系统

| Class | 用途 | 样式特征 |
|---|---|---|
| `.btn-primary` | 主要操作 | 渐变背景，主题色 |
| `.btn-secondary` | 次要操作 | 带边框，透明背景 |
| `.btn-ghost` | 轻量操作 | 无边框，悬停显示背景 |
| `.btn-icon` | 图标按钮 | 圆形，40x40 |
| `.btn-danger` | 危险操作 | 红色调 |
| `.btn-success` | 成功操作 | 绿色调 |

---

## 输入框系统

| Class | 用途 | 特征 |
|---|---|---|
| `.input` | 通用输入 | 标准圆角，边框 |
| `.input-number` | 金额输入 | 大号字体，无上下箭头 |
| `.input-text` | 文本输入 | 标准文本输入 |

---

## 卡片系统

| Class | 用途 |
|---|---|
| `.card` | 标准卡片 |
| `.card-sm` | 小号卡片 |
| `.card-alt` | 备选样式卡片 |

---

## 列表系统

### 列表容器

```html
<section class="list-section" id="listSection">
  <div class="list-header">
    <span class="list-title">日期标题</span>
    <span class="list-count">账单数</span>
    <span class="list-day-expense">日支出</span>
  </div>
  <div class="list-body" id="listBody">
    <!-- 列表项 -->
  </div>
</section>
```

### 列表项

```html
<div class="list-item" data-id="xxx">
  <div class="list-item-check" style="display:none">
    <input type="checkbox">
  </div>
  <div class="list-item-info">
    <span class="list-item-category">分类</span>
    <span class="list-item-note">备注</span>
  </div>
  <div class="list-item-amount">
    <span class="amount">金额</span>
    <span class="time">时间</span>
  </div>
</div>
```

---

## 预算系统

### 预算概览卡片

```html
<div class="review-card collapsible" id="budgetOverviewCard">
  <div class="card-header collapsible-header">
    <span>月度预算</span>
    <span class="card-badge">状态</span>
  </div>
  <div class="collapsible-body">
    <div class="budget-summary-row">
      <span>预算</span>
      <span id="budgetAmount">¥0</span>
    </div>
    <div class="budget-progress">
      <div class="budget-progress-bar" id="budgetProgressBar"></div>
    </div>
    <div class="budget-today-row">
      <span>今日可用</span>
      <span id="budgetTodayValue">¥0</span>
    </div>
  </div>
</div>
```

### 每日预算追踪

```html
<div class="day-budget-list" id="dayBudgetList">
  <div class="day-budget-row" data-date="YYYY-MM-DD">
    <span class="day-label">日期</span>
    <span class="day-budget">预算</span>
    <span class="day-actual">实际</span>
    <span class="day-heat" style="--heat: 0-4"></span>
  </div>
</div>
```

---

## 复盘系统

### 统计网格

```html
<div class="review-summary-grid">
  <div class="review-stat">
    <span class="stat-value">总支出</span>
    <span class="stat-label">本月总计</span>
  </div>
  <!-- 日均、笔数、最高 -->
</div>
```

### 分类排名

```html
<div class="review-rank-item" data-category="分类名">
  <span class="rank-name">分类</span>
  <span class="rank-bar">
    <span class="rank-fill" style="width: 百分比%"></span>
  </span>
  <span class="rank-amount">金额</span>
  <span class="rank-change">变化</span>
</div>
```

### 分类详情

点击分类排名项后显示：
- 近 7 个月趋势图（Canvas）
- 该分类的所有账单列表

---

## 日历组件

```html
<div class="cal-header">
  <button class="cal-nav" data-dir="-1">‹</button>
  <span class="cal-month">2025年 1月</span>
  <button class="cal-nav" data-dir="1">›</button>
</div>
<div class="cal-weekdays">
  <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
</div>
<div class="cal-grid" id="calGrid">
  <!-- 日期按钮 -->
</div>
<div class="cal-footer">
  <button class="btn-ghost" id="calToday">今天</button>
  <button class="btn-primary" id="calConfirm">确定</button>
</div>
```

---

## 主题设置

### 预设主题网格

```html
<div class="theme-grid" id="themeGrid">
  <div class="theme-preset" data-theme="0">
    <div class="theme-preview" style="--preview-accent: ...; --preview-bg: ..."></div>
    <span>主题名</span>
  </div>
  <!-- 共 8 个预设主题 -->
</div>
```

### 自定义颜色

```html
<div class="theme-custom-row">
  <label>主题色</label>
  <input type="color" id="customAccent">
</div>
<div class="theme-custom-row">
  <label>背景色</label>
  <input type="color" id="customBg">
</div>
<div class="theme-custom-row">
  <label>支出色</label>
  <input type="color" id="customExpense">
</div>
<div class="theme-custom-row">
  <label>收入色</label>
  <input type="color" id="customIncome">
</div>
```

---

## 批量操作栏

```html
<div class="batch-bar" id="batchBar" style="display:none">
  <span id="batchCount">已选 0 项</span>
  <button id="btnBatchInvert">反选</button>
  <button id="btnBatchCategory">分类</button>
  <button id="btnBatchDate">日期</button>
  <button id="btnBatchDelete">删除</button>
</div>
```
