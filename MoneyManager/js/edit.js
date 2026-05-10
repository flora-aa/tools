function openEditPanel(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId = id;

  document.getElementById('editAmount').value = tx.amount;
  const editDisplay = document.getElementById('editDateDisplay');
  editDisplay.textContent = formatDateDisplay(tx.date);
  editDisplay.dataset.date = tx.date;
  document.getElementById('editNote').value = tx.note || '';

  populateEditCategories(tx.category);

  document.querySelectorAll('#editSubTypeGroup .subtype-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.subtype === (tx.subType || 'expense'));
  });

  openOverlay('editOverlay');
  document.getElementById('editAmount').focus();
}

function closeEditPanel() {
  closeAllOverlays();
  editingId = null;
  restoreEditPanel();
}

function restoreEditPanel() {
  const saveBtn = document.getElementById('btnEditSave');
  saveBtn.textContent = '保存';
  saveBtn.onclick = saveEdit;
  document.getElementById('editPanelTitle').textContent = '编辑账单';
  document.querySelectorAll('.edit-field-group').forEach(el => el.style.display = '');
  const amountGroup = document.querySelector('.edit-panel-body .amount-group');
  if (amountGroup) amountGroup.style.display = '';
  const categoryGrid = document.getElementById('editCategoryGrid');
  if (categoryGrid) categoryGrid.style.display = '';
  const noteField = document.querySelector('.form-field:last-child');
  if (noteField) noteField.style.display = '';
  const subTypeGroup = document.getElementById('editSubTypeGroup');
  if (subTypeGroup) subTypeGroup.style.display = '';
}

function populateEditCategories(selected) {
  const grid = document.getElementById('editCategoryGrid');
  const categories = CATEGORIES;

  grid.innerHTML = categories.map(c => {
    const isSelected = c === selected;
    return `
      <button class="cat-btn ${isSelected ? 'selected' : ''}" data-category="${c}">
        <span>${c}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function getEditSelectedCategory() {
  const selected = document.querySelector('#editCategoryGrid .cat-btn.selected');
  return selected ? selected.dataset.category : CATEGORIES[0];
}

function saveEdit() {
  if (!editingId) return;

  const tx = transactions.find(t => t.id === editingId);
  if (!tx) return;

  const amount = parseFloat(document.getElementById('editAmount').value);
  if (!amount || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }

  const currentTotal = getTotalExpense();
  const otherTotal = currentTotal - tx.amount;
  if (otherTotal + amount > MAX_TOTAL) {
    showToast('修改后累计支出将超出上限');
    return;
  }

  const category = getEditSelectedCategory();
  const date = document.getElementById('editDateDisplay').dataset.date || tx.date;
  const note = document.getElementById('editNote').value.trim();
  const subType = document.querySelector('#editSubTypeGroup .subtype-btn.selected')?.dataset.subtype || tx.subType;

  const oldDate = tx.date;
  const oldCategory = tx.category;

  tx.amount = amount;
  tx.category = category;
  tx.date = date;
  tx.note = note;
  tx.subType = subType;

  saveData();
  closeEditPanel();

  const isSameMonth = (d1, d2) => {
    const a = new Date(d1), b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  };

  const monthChanged = !isSameMonth(oldDate, date);
  const categoryChanged = oldCategory !== category;

  refreshAll();

  selectedDate = date;
  updateDateDisplay();

  if (monthChanged) {
    const d = new Date(date);
    showToast(`已更新，该记录已移至${d.getFullYear()}年${d.getMonth() + 1}月`);
  } else if (categoryChanged && isReviewMode) {
    const detail = document.getElementById('reviewCategoryDetail');
    if (detail.style.display !== 'none') {
      hideCategoryDetail();
    }
  }
}

function deleteFromEdit() {
  if (!editingId) return;
  deleteTransaction(editingId);
  closeEditPanel();
}
