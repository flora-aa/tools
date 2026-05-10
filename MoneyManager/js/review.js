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
