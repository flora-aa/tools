# MoneyManager UI 组件说明书

## 1. CSS 变量系统

### 主题色板（可自定义）
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--accent` | #5a5aff | 主色调/强调色 |
| `--accent-hover` | #6b6bff | 主色调悬停态 |
| `--accent-alpha-10` | rgba(90, 90, 255, 0.10) | 透明色 10% |
| `--accent-alpha-15` | rgba(90, 90, 255, 0.15) | 透明色 15% |
| `--accent-alpha-20` | rgba(90, 90, 255, 0.20) | 透明色 20% |
| `--accent-alpha-25` | rgba(90, 90, 255, 0.25) | 透明色 25% |

### 支出/收入色
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--color-expense` | #ff4757 | 支出色（红色） |
| `--color-expense-alpha-12` | rgba(255, 71, 87, 0.12) | 支出背景色 |
| `--color-expense-alpha-25` | rgba(255, 71, 87, 0.25) | 支出强调色 |
| `--color-income` | #2ecc71 | 收入色（绿色） |
| `--color-income-alpha-12` | rgba(46, 204, 113, 0.12) | 收入背景色 |
| `--color-income-alpha-15` | rgba(46, 204, 113, 0.15) | 收入浅色 |
| `--color-income-alpha-25` | rgba(46, 204, 113, 0.25) | 收入强调色 |

### 警示色
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--color-warn` | #ffc107 | 警告色（黄色） |
| `--color-warn-alpha-25` | rgba(255, 193, 7, 0.25) | 警告背景色 |
| `--color-great` | #34c759 | 优秀状态色（亮绿） |

### 背景色
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--bg-primary` | #0d0d1a | 主背景（深蓝黑） |
| `--bg-card` | #16162a | 卡片背景 |
| `--bg-card-alt` | #1e1e3a | 卡片交替色 |
| `--bg-input` | #12122a | 输入框背景 |
| `--bg-hover` | rgba(255, 255, 255, 0.03) | 悬停态背景 |
| `--bg-active` | rgba(255, 255, 255, 0.06) | 激活态背景 |

### 文字色
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--text-primary` | #f0f0f5 | 主要文字（白色） |
| `--text-secondary` | #8888aa | 次要文字（灰紫） |
| `--text-muted` | #555577 | 弱化文字 |
| `--text-disabled` | #444466 | 禁用态文字 |

### 边框色
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--border-color` | #2a2a4a | 默认边框 |
| `--border-focus` | var(--accent) | 聚焦边框 |

### 阴影
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--shadow-card` | 0 4px 20px rgba(0, 0, 0, 0.3) | 卡片阴影 |
| `--shadow-dropdown` | 0 8px 24px rgba(0, 0, 0, 0.4) | 下拉菜单阴影 |
| `--shadow-modal` | 0 16px 48px rgba(0, 0, 0, 0.5) | 模态框阴影 |

### 圆角
| 变量名 | 默认值 | 用途 |
|--------|--------|------|
| `--radius-xs` | 4px | 超小圆角 |
| `--radius-sm` | 8px | 小圆角 |
| `--radius-md` | 12px | 中等圆角 |
| `--radius-lg` | 16px | 大圆角 |
| `--radius-xl` | 20px | 超大圆角 |
| `--radius-full` | 9999px | 圆形/药丸形 |

---

## 2. 按钮组件

### .btn-primary - 主要按钮
用于全宽的主操作按钮（如"记一笔"、"保存"）。

```html
<button class="btn-primary">记一笔</button>
```

**样式：**
- 宽度：100%
- 背景：渐变 (accent → accent-hover)
- 内边距：14px 20px
- 圆角：radius-lg (16px)
- 文字：白色，16px，600字重
- 激活态：scale(0.97) + opacity(0.9)

### .btn-secondary - 次要按钮
带边框的按钮，用于次要操作（如"快速记账"、"今天"）。

```html
<button class="btn-secondary">快速记账</button>
```

**样式：**
- 背景：bg-card
- 边框：1.5px solid border-color
- 内边距：10px 16px
- 圆角：radius-md (12px)
- 文字：text-secondary，13px
- 悬停态：边框变accent，文字变accent
- 激活态：背景变bg-hover

### .btn-ghost - 幽灵按钮
无边框按钮，用于辅助操作（如"设置"、"取消"）。

```html
<button class="btn-ghost">设置</button>
```

**样式：**
- 背景：透明
- 边框：无
- 内边距：6px 12px
- 圆角：radius-sm (8px)
- 文字：text-secondary，13px
- 悬停态：背景变bg-hover，文字变text-primary
- 激活态：背景变bg-active

### .btn-icon - 图标按钮
圆形图标按钮，用于导航/切换（如月份切换、关闭）。

```html
<button class="btn-icon">‹</button>
<button class="btn-icon btn-icon-sm">×</button>
```

**样式：**
- 尺寸：32x32px（小型：28x28px）
- 背景：bg-card
- 边框：1.5px solid border-color
- 圆角：radius-full (圆形)
- 悬停态：边框变accent
- 激活态：scale(0.9)

### 按钮修饰符

| 修饰符 | 用途 |
|--------|------|
| `.btn-danger` | 危险操作（红色背景） |
| `.btn-success` | 成功操作（绿色背景） |
| `.btn-icon-sm` | 小型图标按钮 |

---

## 3. 输入框组件

### .input - 输入框基础
```html
<input type="text" class="input input-text" placeholder="备注">
<input type="number" class="input input-number" placeholder="0.00">
```

**基础样式：**
- 宽度：100%
- 背景：bg-input
- 边框：1.5px solid border-color
- 内边距：12px 16px
- 圆角：radius-md (12px)
- 聚焦态：边框变accent

### .input-number - 数字输入框
用于金额输入，大字号居中。

**样式：**
- 字号：32px
- 字重：700
- 文字对齐：居中

---

## 4. 表单组件

### .toggle - 开关组件
```html
<label class="toggle">
  <input type="checkbox" id="advanceToggle">
  <span class="toggle-track">
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-label">垫付</span>
</label>
```

**样式：**
- 轨道：40x22px，圆角full
- 滑块：18x18px，白色圆形
- 关闭态：bg为border-color
- 开启态：bg为accent
- 动画：transform 0.25s

---

## 5. 卡片组件

### .card - 基础卡片
```html
<div class="card">内容</div>
<div class="card card-sm">小卡片</div>
<div class="card card-alt">交替色卡片</div>
```

**样式：**
- 背景：bg-card
- 内边距：20px
- 圆角：radius-xl (20px)
- 阴影：shadow-card

### .card-sm - 小卡片
- 内边距：12px
- 圆角：radius-md (12px)

---

## 6. 其他组件

### .section-title - 区块标题
```html
<div class="section-title">预算追踪</div>
```

### .divider - 分隔线
```html
<div class="divider"></div>
```

### .tag - 标签
```html
<span class="tag">支出</span>
<span class="tag tag-expense">-¥100</span>
<span class="tag tag-income">+¥50</span>
```

### .list-item - 列表项
```html
<div class="list-item">可点击的列表项</div>
```

---

## 7. 主题设置

### 预设主题
| 主题名 | 主色 | 支出色 | 收入色 | 警示色 |
|--------|------|--------|--------|--------|
| 经典紫 | #5a5aff | #ff4757 | #2ecc71 | #ffc107 |
| 商务蓝 | #007aff | #ff3b30 | #34c759 | #ff9500 |
| 森林绿 | #34c759 | #ff6b6b | #4ecdc4 | #ffe66d |
| 暖阳橙 | #ff9500 | #ff4757 | #2ecc71 | #ffcc00 |
| 极简灰 | #8e8e93 | #ff453a | #30d158 | #ffd60a |
| 玫瑰粉 | #ff2d55 | #ff6b6b | #4ecdc4 | #ffcc02 |

### 自定义颜色
支持4个可自定义颜色：
- 主色调 (accent)
- 支出色 (expense)
- 收入色 (income)
- 警示色 (warn)

### JS API
```javascript
// 应用预设主题
applyTheme(THEME_PRESETS[0]);

// 应用自定义主题
applyTheme({ accent: '#ff0000', expense: '#ff4757', income: '#2ecc71', warn: '#ffc107' });

// 获取当前主题
const current = JSON.parse(localStorage.getItem('mm_theme'));
```

---

## 8. 响应式断点

| 断点 | 屏幕宽度 | 布局变化 |
|------|----------|----------|
| < 480px | 手机 | 单列，padding 16px |
| 480px+ | 大手机 | padding 24px |
| 768px+ | 平板/PC | 双列布局，阴影容器 |
| 1024px+ | 大屏 | 增大间距 |

---

## 9. 热力图等级

每日预算追踪使用热力图颜色表示消费紧迫度：

| 等级 | 条件 | 背景色 | 含义 |
|------|------|--------|------|
| heat-0 | 无消费或无预算 | 无 | 默认 |
| heat-1 | 消费 ≤ 50% 预算 | 绿色 15% | 控制良好 |
| heat-2 | 消费 ≤ 75% 预算 | 绿色 25% | 正常范围 |
| heat-3 | 消费 ≤ 100% 预算 | 黄色 25% | 接近警戒 |
| heat-4 | 消费 > 100% 预算 | 红色 25% | 已超预算 |
