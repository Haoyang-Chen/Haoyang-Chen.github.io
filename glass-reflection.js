(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  document.querySelectorAll('.project-grid').forEach(grid => {
    const reflection = document.createElement('span');
    reflection.className = 'project-reflection';
    reflection.setAttribute('aria-hidden', 'true');
    grid.prepend(reflection);
    let frame = 0;
    let point;
    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      reflection.classList.remove('is-active');
      ['left', 'top', 'width', 'height'].forEach(key => reflection.style.removeProperty(key));
    };
    grid.addEventListener('pointermove', event => {
      const card = event.target.closest('.research-project');
      if (!enabled.matches || !card || !grid.contains(card)) { hide(); return; }
      point = { card, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const bounds = point.card.getBoundingClientRect();
        const parent = grid.getBoundingClientRect();
        const x = point.x - bounds.left;
        const y = point.y - bounds.top;
        Object.assign(reflection.style, {
          left: `${bounds.left - parent.left}px`, top: `${bounds.top - parent.top}px`,
          width: `${bounds.width}px`, height: `${bounds.height}px`,
          borderRadius: getComputedStyle(point.card).borderRadius
        });
        reflection.style.setProperty('--light-x', `${x}px`);
        reflection.style.setProperty('--light-y', `${y}px`);
        reflection.style.setProperty('--light-angle', `${135 + x / bounds.width * 55}deg`);
        reflection.classList.add('is-active');
        frame = 0;
      });
    }, { passive: true });
    grid.addEventListener('pointerleave', hide);
    grid.addEventListener('pointercancel', hide);
    grid.addEventListener('focusin', hide);
    addEventListener('resize', hide);
    addEventListener('scroll', hide, { passive: true });
    enabled.addEventListener('change', hide);
  });
})();
