function addTransaction() {
  const amountInput = document.getElementById('inputAmount');
  const noteInput = document.getElementById('inputNote');

  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    amountInput.focus();
    amountInput.style.borderColor = 'var(--color-expense)';
    showToast('请输入有效金额');
    setTimeout(() => { amountInput.style.borderColor = ''; }, 1500);
    return;
  }

  const isAdvance = document.getElementById('advanceToggle').checked;

  const currentTotal = getTotalExpense();
  if (currentTotal + amount > MAX_TOTAL) {
    showToast('累计支出已达上限，请先清除部分数据');
    amountInput.focus();
    return;
  }

  const date = selectedDate;

  const transaction = {
    id: generateId(),
    subType: currentSubType,
    amount: amount,
    category: selectedCategory,
    note: noteInput.value.trim(),
    date: date,
    createdAt: Date.now()
  };

  if (selectedCategory === '退款') {
    transaction.subType = 'refund';
  } else if (isAdvance) {
    transaction.subType = 'advance';
  }

  transactions.push(transaction);
  saveData();
  setLastAmount(selectedCategory, amount);

  selectedDate = date;

  amountInput.value = '';
  noteInput.value = '';
  amountInput.focus();

  showToast(`已记录 ${formatAmount(amount)}`);

  refreshAll();
}

function deleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  if (item) {
    showToast(`已删除 ${formatAmount(item.amount)}`);
  }
  refreshAll();
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  syncDateToCurrentMonth();
  refreshAll();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  syncDateToCurrentMonth();
  refreshAll();
}

function toggleReview() {
  isReviewMode = !isReviewMode;
  const formSection = document.getElementById('formSection');
  const listSection = document.getElementById('listSection');
  const reviewSection = document.getElementById('reviewSection');
  const btnTopReview = document.getElementById('btnTopReview');
  const pageWrapper = document.getElementById('pageWrapper');
  const appContainer = document.querySelector('.app');
  const isWideScreen = window.innerWidth >= 768;

  if (isReviewMode) {
    if (isSelectMode) toggleSelectMode();
    btnTopReview.classList.add('active');
    renderReview();
    if (isWideScreen) {
      pageWrapper.classList.add('dual-page');
      appContainer.classList.add('dual-mode');
      document.body.classList.add('dual-mode');
      formSection.style.display = '';
      listSection.style.display = '';
      reviewSection.style.display = '';
    } else {
      formSection.style.display = 'none';
      listSection.style.display = 'none';
      reviewSection.style.display = '';
    }
  } else {
    btnTopReview.classList.remove('active');
    if (isWideScreen) {
      pageWrapper.classList.remove('dual-page');
      appContainer.classList.remove('dual-mode');
      document.body.classList.remove('dual-mode');
      setTimeout(() => {
        reviewSection.style.display = 'none';
      }, 300);
    } else {
      pageWrapper.classList.remove('dual-page');
      appContainer.classList.remove('dual-mode');
      document.body.classList.remove('dual-mode');
      reviewSection.style.display = 'none';
    }
    formSection.style.display = '';
    listSection.style.display = '';
  }
}

function refreshAll() {
  updateMonthLabel();
  updateMonthExpense();
  if (isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail && detail.style.display !== 'none') {
      hideCategoryDetail();
    }
    renderReview();
    renderList();
  } else {
    renderList();
  }
}
