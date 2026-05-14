document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadTheme();
  initMonth();
  initThemePanel();

  window.addEventListener('resize', () => {
    const pageWrapper = document.getElementById('pageWrapper');
    const appContainer = document.querySelector('.app');
    const isWideScreen = window.innerWidth >= 768;
    if (isReviewMode) {
      if (isWideScreen) {
        pageWrapper.classList.add('dual-page');
        appContainer.classList.add('dual-mode');
        document.body.classList.add('dual-mode');
      } else {
        pageWrapper.classList.remove('dual-page');
        appContainer.classList.remove('dual-mode');
        document.body.classList.remove('dual-mode');
      }
    }
  });

  const today = getTodayDate();
  selectedDate = today;
  updateDateDisplay();

  document.getElementById('dateTrigger').addEventListener('click', () => openCalendar('input'));
  document.getElementById('editDateTrigger').addEventListener('click', () => openCalendar('edit'));
  document.getElementById('calendarOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCalendar();
  });
  document.getElementById('calPrevMonth').addEventListener('click', calPrevMonth);
  document.getElementById('calNextMonth').addEventListener('click', calNextMonth);
  document.getElementById('calToday').addEventListener('click', calGoToday);
  document.getElementById('calConfirm').addEventListener('click', confirmCalendar);

  document.getElementById('btnSubmit').addEventListener('click', addTransaction);
  document.getElementById('btnQuickEntry').addEventListener('click', openQuickPanel);
  document.getElementById('btnQuickClose').addEventListener('click', closeQuickPanel);
  document.getElementById('btnQuickSubmit').addEventListener('click', quickSubmit);
  document.getElementById('quickOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeQuickPanel();
  });
  document.getElementById('btnPrevMonth').addEventListener('click', () => { saveMemo(); prevMonth(); });
  document.getElementById('btnNextMonth').addEventListener('click', () => { saveMemo(); nextMonth(); });
  document.getElementById('btnTopReview').addEventListener('click', toggleReview);

  document.getElementById('btnCategoryBack').addEventListener('click', hideCategoryDetail);

  document.getElementById('btnSelectMode').addEventListener('click', toggleSelectMode);
  document.getElementById('btnBatchDelete').addEventListener('click', batchDelete);
  document.getElementById('btnBatchCategory').addEventListener('click', batchChangeCategory);
  document.getElementById('btnBatchDate').addEventListener('click', batchChangeDate);
  document.getElementById('btnBatchInvert').addEventListener('click', batchInvert);

  document.getElementById('btnEditSave').addEventListener('click', saveEdit);
  document.getElementById('btnEditDelete').addEventListener('click', deleteFromEdit);
  document.getElementById('editOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditPanel();
  });
  document.getElementById('editAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.getElementById('btnDataMgmt').addEventListener('click', openDataPanel);
  document.getElementById('btnDataCancel').addEventListener('click', closeDataPanel);
  document.getElementById('dataOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDataPanel();
  });
  document.getElementById('btnClearMonth').addEventListener('click', () => {
    if (confirm(`确定清除 ${currentYear}年${currentMonth}月 的所有账单吗？`)) {
      clearCurrentMonth();
    }
  });
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (confirm('确定清除所有数据吗？此操作不可撤销！')) {
      clearAllData();
    }
  });

  document.getElementById('btnExportTab').addEventListener('click', () => switchInheritTab('export'));
  document.getElementById('btnImportTab').addEventListener('click', () => switchInheritTab('import'));
  document.getElementById('btnExport').addEventListener('click', handleExport);
  document.getElementById('btnCopyGistId').addEventListener('click', handleCopyGistId);
  document.getElementById('btnCopyPin').addEventListener('click', handleCopyPin);
  document.getElementById('btnExportReset').addEventListener('click', resetExportForm);
  document.getElementById('btnImport').addEventListener('click', handleImport);

  document.getElementById('btnBudgetEdit').addEventListener('click', () => {
    openBudgetPanel(currentYear, currentMonth);
  });
  document.getElementById('btnBudgetClose').addEventListener('click', closeBudgetPanel);
  document.getElementById('budgetOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBudgetPanel();
  });
  document.getElementById('dayBudgetToggle').addEventListener('click', toggleDayBudget);
  document.getElementById('budgetOverviewToggle').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') toggleBudgetOverview();
  });
  document.getElementById('btnBudgetSave').addEventListener('click', saveBudget);
  document.getElementById('btnBudgetDelete').addEventListener('click', deleteBudgetConfig);

  document.getElementById('inputAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTransaction();
  });

  document.getElementById('inputAmount').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.startsWith('=')) {
      const expr = val.slice(1);
      if (/^[\d+\-*/.()]+$/.test(expr)) {
        try {
          const result = new Function(`return (${expr})`)();
          if (typeof result === 'number' && isFinite(result) && result > 0) {
            e.target.value = result.toFixed(2);
          }
        } catch {
          /* incomplete expression, wait for more input */
        }
      }
    }
  });

  const memoInput = document.getElementById('memoInput');
  if (memoInput) {
    const MIN_MEMO_HEIGHT = 100;
    const MAX_MEMO_HEIGHT = 400;
    const STEP = 40;

    memoInput.addEventListener('input', () => {
      updateMemoCount();
      saveMemo();
      memoInput.style.height = '';
      const scrollH = memoInput.scrollHeight;
      const clamped = Math.max(MIN_MEMO_HEIGHT, Math.min(scrollH, MAX_MEMO_HEIGHT));
      memoInput.style.height = clamped + 'px';
    });

    const btnGrow = document.getElementById('btnMemoGrow');
    const btnShrink = document.getElementById('btnMemoShrink');
    if (btnGrow && btnShrink) {
      btnGrow.addEventListener('click', () => {
        const cur = parseInt(memoInput.style.height) || memoInput.scrollHeight || MIN_MEMO_HEIGHT;
        memoInput.style.height = Math.min(cur + STEP, MAX_MEMO_HEIGHT) + 'px';
      });
      btnShrink.addEventListener('click', () => {
        const cur = parseInt(memoInput.style.height) || memoInput.scrollHeight || MIN_MEMO_HEIGHT;
        memoInput.style.height = Math.max(cur - STEP, MIN_MEMO_HEIGHT) + 'px';
      });
    }
  }

  populateCategories();
  initSwipeSelect();
  refreshAll();
});
