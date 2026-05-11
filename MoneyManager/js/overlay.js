function initOverlaySwipe(overlayEl) {
  if (overlayEl._swipeReady) return;
  overlayEl._swipeReady = true;

  const panel = overlayEl.querySelector('.panel');
  if (!panel) return;

  const isPanelModal = overlayEl.classList.contains('panel-modal');
  if (isPanelModal) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let panelHeight = 0;
  let startScrollTop = 0;

  const onTouchStart = (e) => {
    startScrollTop = panel.scrollTop;
    const touch = e.touches[0];
    startY = touch.clientY;
    currentY = startY;
    isDragging = false;
    panelHeight = panel.offsetHeight;
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    if (!isDragging) {
      if (deltaY > 0 && startScrollTop === 0) {
        isDragging = true;
        panel.style.transition = 'none';
        panel.style.animation = 'none';
        panel.style.overflowY = 'hidden';
      } else {
        return;
      }
    }

    currentY = touch.clientY;
    const moveDelta = currentY - startY;

    if (moveDelta > 0) {
      const damped = Math.min(moveDelta * 0.5, panelHeight * 0.4);
      panel.style.transform = `translateY(${damped}px)`;
      overlayEl.style.background = `rgba(0, 0, 0, ${Math.max(0, 0.6 - moveDelta / panelHeight * 0.6)})`;
    } else if (moveDelta < 0 && isDragging) {
      const pullUp = Math.abs(moveDelta) * 0.3;
      panel.style.transform = `translateY(${-pullUp}px)`;
    }
  };

  const onTouchEnd = () => {
    if (!isDragging) {
      panel.style.overflowY = '';
      return;
    }

    const moveDelta = currentY - startY;
    const threshold = panelHeight * 0.25;

    panel.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    if (moveDelta > threshold) {
      panel.style.transform = `translateY(${panelHeight}px)`;
      overlayEl.style.transition = 'background 0.3s ease';
      overlayEl.style.background = 'rgba(0, 0, 0, 0)';
      setTimeout(() => {
        closeAllOverlays();
        overlayEl.style.transition = '';
        panel.style.transition = '';
        panel.style.transform = '';
        panel.style.animation = '';
        overlayEl.style.background = '';
        panel.style.overflowY = '';
      }, 300);
    } else {
      panel.style.transform = 'translateY(0)';
      overlayEl.style.transition = 'background 0.3s ease';
      overlayEl.style.background = '';
      setTimeout(() => {
        panel.style.transition = '';
        panel.style.transform = '';
        panel.style.animation = '';
        overlayEl.style.transition = '';
        overlayEl.style.background = '';
        panel.style.overflowY = '';
      }, 300);
    }

    isDragging = false;
  };

  panel.addEventListener('touchstart', onTouchStart, { passive: true });
  panel.addEventListener('touchmove', onTouchMove, { passive: true });
  panel.addEventListener('touchend', onTouchEnd, { passive: true });
  panel.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

function closeAllOverlays() {
  ALL_OVERLAYS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  activeOverlay = null;
  document.body.classList.remove('overlay-open');
  document.body.offsetHeight;
}

function openOverlay(id) {
  if (activeOverlay === id) return;
  closeAllOverlays();
  const el = document.getElementById(id);
  if (el) {
    el.style.display = '';
    activeOverlay = id;
    document.body.classList.add('overlay-open');
    initOverlaySwipe(el);
  }
}
