function initMonth() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;
}

function updateDateDisplay() {
  document.getElementById('dateDisplay').textContent = formatDateDisplay(selectedDate);
}

function openCalendar(source) {
  calActiveSource = source;
  let currentDate;
  if (source === 'edit') {
    currentDate = document.getElementById('editDateDisplay').dataset.date || selectedDate;
  } else {
    currentDate = selectedDate;
  }
  const [y, m, d] = currentDate.split('-').map(Number);
  calYear = currentYear;
  calMonth = currentMonth;
  calSelectedDate = currentDate;
  renderCalendar();
  openOverlay('calendarOverlay');
}

function closeCalendar() {
  closeAllOverlays();
  calActiveSource = null;
}

function renderCalendar() {
  document.getElementById('calTitle').textContent = `${calYear}年${calMonth}月`;

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();

  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startOffset; i++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day other-month';
    btn.textContent = daysInPrev - startOffset + 1 + i;
    btn.disabled = true;
    grid.appendChild(btn);
  }

  const todayStr = getTodayDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = d;

    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (dateStr === todayStr) btn.classList.add('today');
    if (dateStr === calSelectedDate) btn.classList.add('selected');

    btn.dataset.date = dateStr;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
      calSelectedDate = dateStr;
    });

    grid.appendChild(btn);
  }

  const totalCells = startOffset + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day other-month';
    btn.textContent = i;
    btn.disabled = true;
    grid.appendChild(btn);
  }
}

function confirmCalendar() {
  if (!calSelectedDate) return;

  if (calActiveSource === 'edit') {
    const display = document.getElementById('editDateDisplay');
    display.textContent = formatDateDisplay(calSelectedDate);
    display.dataset.date = calSelectedDate;
  } else {
    const [y, m] = calSelectedDate.split('-').map(Number);
    if (y !== currentYear || m !== currentMonth) {
      currentYear = y;
      currentMonth = m;
      syncDateToCurrentMonth();
      refreshAll();
    } else {
      selectedDate = calSelectedDate;
      updateDateDisplay();
      renderList();
    }
  }

  closeCalendar();
}

function calGoToday() {
  const today = getTodayDate();
  calYear = currentYear;
  calMonth = currentMonth;
  calSelectedDate = today;
  renderCalendar();
}

function calPrevMonth() {
  if (calMonth === 1) {
    calYear--;
    calMonth = 12;
  } else {
    calMonth--;
  }
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const [y, m, d] = calSelectedDate.split('-').map(Number);
  if (d > daysInMonth) {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  } else {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  renderCalendar();
}

function calNextMonth() {
  if (calMonth === 12) {
    calYear++;
    calMonth = 1;
  } else {
    calMonth++;
  }
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const [y, m, d] = calSelectedDate.split('-').map(Number);
  if (d > daysInMonth) {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  } else {
    calSelectedDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  renderCalendar();
}

function syncDateToCurrentMonth() {
  const today = getTodayDate();
  const [y, m] = today.split('-').map(Number);
  let targetDay;

  if (y === currentYear && m === currentMonth) {
    targetDay = String(new Date().getDate()).padStart(2, '0');
  } else {
    targetDay = String(new Date(currentYear, currentMonth, 0).getDate()).padStart(2, '0');
  }

  selectedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${targetDay}`;
  updateDateDisplay();

  const editDateDisplay = document.getElementById('editDateDisplay');
  if (editDateDisplay) {
    editDateDisplay.textContent = formatDateDisplay(selectedDate);
    editDateDisplay.dataset.date = selectedDate;
  }
}
