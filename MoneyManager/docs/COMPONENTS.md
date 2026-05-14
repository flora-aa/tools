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
| `.btn-month` | 月份导航 | 圆形 36×36（桌面 40×40），内嵌 SVG 箭头，flex-shrink:0，active 时填充 accent |
| `.btn-top-review` | 月度复盘入口 | 圆形 38×38（桌面 42×42），2×2 网格布局，bg-card 背景，active 时填充 accent |

---

## 输入框系统

| Class | 用途 | 特征 |
|---|---|---|
| `.input` | 通用输入 | 标准圆角，边框 |
| `.input-number` | 金额输入 | 大号字体，无上下箭头（使用 `inputmode="decimal"` 替代 `type="number"`，支持 `=30.3-11.4` 类表达式） |
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
  <button class="cal-month-btn" id="calPrevMonth">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <span class="cal-month">2025年 1月</span>
  <button class="cal-month-btn" id="calNextMonth">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
  </button>
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

注：月份切换按钮使用 `cal-month-btn` 类（28×28 圆形，bg-card 背景，active 时填充 accent 色），代替原有的 `cal-nav` 文本字符按钮，避免字体渲染变形。

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

### 自定义颜色（取色面板）

颜色选择改为卡片式按钮 + 弹出取色面板，替代原生 `<input type="color">`：

```html
<div class="theme-color-btn" id="themeAccentBtn">
  <span>主题色</span>
  <div class="theme-color-preview" style="background: ..."></div>
</div>
<div class="theme-color-btn" id="themeBgBtn">
  <span>背景色</span>
  <div class="theme-color-preview" style="background: ..."></div>
</div>
<div class="theme-color-btn" id="themeExpenseBtn">
  <span>支出色</span>
  <div class="theme-color-preview" style="background: ..."></div>
</div>
<div class="theme-color-btn" id="themeIncomeBtn">
  <span>收入色</span>
  <div class="theme-color-preview" style="background: ..."></div>
</div>
<div class="theme-color-btn" id="themeTextBtn">
  <span>字体色</span>
  <div class="theme-color-preview" style="background: ..."></div>
</div>
```

#### 取色面板

```html
<div class="color-swatch-panel" id="colorSwatchPanel">
  <div class="color-swatch-header">
    <span class="color-swatch-title" id="colorSwatchTitle">主题色</span>
    <button class="color-swatch-close" id="colorSwatchClose">✕</button>
  </div>
  <div class="color-swatch-grid" id="colorSwatchGrid">
    <!-- 6×4 颜色网格（24 色） -->
  </div>
  <div class="color-swatch-shade-row" id="colorSwatchShadeRow">
    <div class="color-swatch-shades" id="colorSwatchShades">
      <!-- 5 个深浅调节色块 -->
    </div>
    <span class="color-swatch-shade-hint">点击微调深浅</span>
  </div>
</div>
```

特征：
- 24 色预置色盘（6×4 网格）：暗背景色、鲜艳强调色、现代艺术色、浅色亮色各一行
- 点击色块即时应用并实时预览
- 深浅微调条：5 级（更暗 40%/20%/当前/亮 20%/更亮 40%），基于当前色通过 darken()/lighten() 动态生成
- 无 hex 输入框，全视觉化操作

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
