(() => {
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let suppressedTrigger = null;
  let enterTimer;
  let leaveTimer;

  function close(immediate = false) {
    clearTimeout(enterTimer);
    clearTimeout(leaveTimer);
    if (!active) return;
    const current = active;
    active = null;
    suppressedTrigger = current.trigger;
    current.trigger.setAttribute('aria-expanded', 'false');
    current.trigger.classList.remove('is-growing');
    if (document.activeElement === current.preview) current.trigger.focus({ preventScroll: true });
    current.preview.style.pointerEvents = 'none';
    const rect = current.image.getBoundingClientRect();
    const scale = Math.min(rect.width / current.width, rect.height / current.height);
    const x = rect.left + (rect.width - current.width * scale) / 2;
    const y = rect.top + (rect.height - current.height * scale) / 2;
    current.preview.style.transform = `translate(${x - current.left}px, ${y - current.top}px) scale(${scale})`;
    current.preview.style.boxShadow = 'none';
    const remove = () => {
      current.preview.remove();
    };
    if (immediate || reducedMotion.matches) remove();
    else window.setTimeout(remove, 240);
  }

  function pin() {
    if (!active) return;
    active.pinned = true;
    active.preview.classList.add('is-pinned');
    active.preview.setAttribute('aria-label', 'Close enlarged image');
  }

  function open(trigger, pinned = false) {
    clearTimeout(enterTimer);
    clearTimeout(leaveTimer);
    if (active && active.trigger === trigger) {
      if (pinned) pin();
      return;
    }
    close(true);
    const image = trigger.querySelector('img');
    if (!image.naturalWidth) return;
    const rect = image.getBoundingClientRect();
    const margin = 16;
    const ratio = image.naturalWidth / image.naturalHeight;
    const width = Math.min(1100, document.documentElement.clientWidth - margin * 2,
      (window.innerHeight - margin * 2) * ratio, image.naturalWidth);
    const height = width / ratio;
    const left = Math.max(margin, Math.min(rect.left, document.documentElement.clientWidth - width - margin));
    const top = Math.max(margin, Math.min(rect.top, window.innerHeight - height - margin));
    const scale = Math.min(rect.width / width, rect.height / height);
    const x = rect.left + (rect.width - width * scale) / 2;
    const y = rect.top + (rect.height - height * scale) / 2;
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'image-preview';
    preview.tabIndex = -1;
    preview.setAttribute('aria-label', 'Keep enlarged image open');
    const enlarged = image.cloneNode();
    enlarged.removeAttribute('loading');
    enlarged.removeAttribute('class');
    preview.append(enlarged);
    Object.assign(preview.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
      transform: `translate(${x - left}px, ${y - top}px) scale(${scale})`,
      boxShadow: 'none'
    });
    document.body.append(preview);
    trigger.classList.add('is-growing');
    trigger.setAttribute('aria-expanded', 'true');
    const current = { trigger, image, preview, width, height, left, top, pinned: false };
    active = current;
    if (pinned) pin();
    // Commit the thumbnail-sized starting frame before growing it in place.
    preview.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (active !== current) return;
      preview.style.transform = 'translate(0, 0) scale(1)';
      preview.style.boxShadow = '';
    });
    preview.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
    preview.addEventListener('pointerleave', scheduleClose);
    preview.addEventListener('click', () => {
      if (current.pinned) close();
      else pin();
    });
  }

  function scheduleClose() {
    clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => {
      if (active && !active.pinned && !active.preview.matches(':hover') &&
          !active.trigger.matches(':hover')) close();
    }, 120);
  }

  document.querySelectorAll('.project-image').forEach(trigger => {
    const image = trigger.querySelector('img');
    const title = trigger.closest('article')?.querySelector('h3')?.textContent.trim();
    trigger.setAttribute('aria-label', `Enlarge image: ${title || image.alt || 'Side project'}`);
    trigger.addEventListener('pointerenter', event => {
      if (!hover.matches || event.pointerType !== 'mouse' || active?.pinned || suppressedTrigger === trigger) return;
      clearTimeout(enterTimer);
      enterTimer = window.setTimeout(() => open(trigger), 100);
    });
    trigger.addEventListener('pointerleave', () => {
      if (suppressedTrigger === trigger) suppressedTrigger = null;
      clearTimeout(enterTimer);
      scheduleClose();
    });
    trigger.addEventListener('click', () => {
      if (active?.trigger === trigger && active.pinned) close();
      else open(trigger, true);
    });
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.preview.contains(event.target) && !active.trigger.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab') close();
  });
  window.addEventListener('scroll', () => close(true), { passive: true });
  window.addEventListener('resize', () => close(true));
})();
