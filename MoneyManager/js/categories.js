function populateCategories() {
  const grid = document.getElementById('categoryGrid');
  const categories = CATEGORIES;

  if (!selectedCategory || !categories.includes(selectedCategory)) {
    selectedCategory = categories[0];
  }

  grid.innerHTML = categories.map(c => {
    const isSelected = c === selectedCategory;
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
      selectedCategory = btn.dataset.category;
    });
  });
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
