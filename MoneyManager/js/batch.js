function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  const btn = document.getElementById('btnSelectMode');
  const batchBar = document.getElementById('batchBar');

  if (isSelectMode) {
    btn.textContent = '取消';
    btn.classList.add('active');
    batchBar.style.display = 'flex';
    selectedIds.clear();
    updateBatchCount();
  } else {
    btn.textContent = '选择';
    btn.classList.remove('active');
    batchBar.style.display = 'none';
    selectedIds.clear();
  }

  renderList();
}

function toggleSelectItem(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateBatchCount();
  updateListItemCheckState(id);
}

function initSwipeSelect() {
  const listBody = document.getElementById('listBody');

  listBody.addEventListener('touchstart', (e) => {
    if (!isSelectMode) return;
    swipeSelectLastId = null;

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const listItem = el?.closest('.list-item');
    if (!listItem) return;

    longPressTimer = setTimeout(() => {
      swipeLocked = true;
      listBody.style.overflow = 'hidden';
      listBody.style.webkitOverflowScrolling = 'none';
      listBody.style.touchAction = 'none';

      if (!selectedIds.has(listItem.dataset.id)) {
        selectedIds.add(listItem.dataset.id);
        updateBatchCount();
        updateListItemCheckState(listItem.dataset.id);
      }

      if (navigator.vibrate) navigator.vibrate(10);
    }, 300);
  }, { passive: true });

  listBody.addEventListener('touchmove', (e) => {
    if (!isSelectMode) return;

    if (swipeLocked) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;

    const listItem = el.closest('.list-item');
    if (!listItem) return;

    const id = listItem.dataset.id;
    if (id && id !== swipeSelectLastId) {
      swipeSelectLastId = id;
      if (!selectedIds.has(id)) {
        selectedIds.add(id);
        updateBatchCount();
        updateListItemCheckState(id);
      }
    }
  }, { passive: false });

  listBody.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    if (swipeLocked) {
      swipeLocked = false;
      listBody.style.overflow = '';
      listBody.style.webkitOverflowScrolling = '';
      listBody.style.touchAction = '';
    }
  }, { passive: true });

  listBody.addEventListener('touchcancel', () => {
    clearTimeout(longPressTimer);
    if (swipeLocked) {
      swipeLocked = false;
      listBody.style.overflow = '';
      listBody.style.webkitOverflowScrolling = '';
      listBody.style.touchAction = '';
    }
  }, { passive: true });
}

function updateBatchCount() {
  document.getElementById('batchCount').textContent = `已选 ${selectedIds.size} 笔`;
}

function updateListItemCheckState(id) {
  const el = document.querySelector(`.list-item[data-id="${id}"]`);
  if (el) {
    el.classList.toggle('checking', selectedIds.has(id));
  }
}

function batchDelete() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const count = selectedIds.size;
  transactions = transactions.filter(t => !selectedIds.has(t.id));
  saveData();

  selectedIds.clear();
  updateBatchCount();

  showToast(`已删除 ${count} 笔`);
  refreshAll();
}

function batchInvert() {
  const listTx = getSelectedDateTransactions();
  listTx.forEach(t => {
    if (selectedIds.has(t.id)) {
      selectedIds.delete(t.id);
    } else {
      selectedIds.add(t.id);
    }
  });
  updateBatchCount();
  renderList();
}

function batchChangeCategory() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const categories = CATEGORIES;
  const container = document.getElementById('editCategoryGrid');
  container.innerHTML = categories.map(c => `
    <button class="cat-btn" data-category="${c}">
      <span>${c}</span>
    </button>
  `).join('');

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  container.querySelector('.cat-btn').classList.add('selected');

  document.querySelectorAll('.edit-field-group').forEach(el => el.style.display = 'none');
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = 'none';
  document.getElementById('editPanelTitle').textContent = '批量改分类';

  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '确认修改';
  saveBtn.onclick = () => {
    const category = container.querySelector('.cat-btn.selected');
    if (!category) {
      showToast('请选择分类');
      return;
    }
    const newCategory = category.dataset.category;
    transactions.forEach(t => {
      if (selectedIds.has(t.id)) {
        t.category = newCategory;
      }
    });
    saveData();
    closeEditPanel();
    selectedIds.clear();
    showToast('分类已更新');
    if (isSelectMode) toggleSelectMode();
    refreshAll();
  };

  document.getElementById('editOverlay').style.display = '';
}

function batchChangeDate() {
  if (selectedIds.size === 0) {
    showToast('请先选择账单');
    return;
  }

  const overlay = document.getElementById('editOverlay');
  document.getElementById('editPanelTitle').textContent = '修改日期';
  document.getElementById('editAmount').value = '';
  document.getElementById('editNote').value = '';
  document.getElementById('editCategoryGrid').innerHTML = '';
  const editDisplay = document.getElementById('editDateDisplay');
  editDisplay.textContent = formatDateDisplay(getTodayDate());
  editDisplay.dataset.date = getTodayDate();

  const amountGroup = document.querySelector('.edit-panel-body .amount-group');
  if (amountGroup) amountGroup.style.display = 'none';
  const categoryGrid = document.getElementById('editCategoryGrid');
  if (categoryGrid) categoryGrid.style.display = 'none';
  const noteField = document.querySelector('.form-field:last-child');
  if (noteField) noteField.style.display = 'none';
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = 'none';

  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '确认修改';
  saveBtn.onclick = () => {
    const newDate = document.getElementById('editDateDisplay').dataset.date;
    transactions.forEach(t => {
      if (selectedIds.has(t.id)) {
        t.date = newDate;
      }
    });
    saveData();
    closeEditPanel();
    selectedIds.clear();
    showToast('日期已更新');
    if (isSelectMode) toggleSelectMode();
    refreshAll();
  };

  overlay.style.display = '';
}
