function getDailyExpenses() {
  const dailyData = {};
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth
      && (t.subType === 'expense' || t.subType === 'advance');
  });
  const monthRefunds = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth && t.subType === 'refund';
  });

  monthTx.forEach(t => {
    if (!dailyData[t.date]) dailyData[t.date] = 0;
    dailyData[t.date] += Number(t.amount);
  });
  monthRefunds.forEach(t => {
    if (!dailyData[t.date]) dailyData[t.date] = 0;
    dailyData[t.date] -= Number(t.amount);
  });

  return dailyData;
}

function getDayHeatLevel(dailyBudget, actualSpent) {
  if (dailyBudget <= 0 || actualSpent <= 0) return 0;
  const ratio = actualSpent / dailyBudget;
  if (ratio <= 0.5) return 1;
  if (ratio <= 0.75) return 2;
  if (ratio <= 1.0) return 3;
  return 4;
}
