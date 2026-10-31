(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  document.querySelectorAll('.research-project').forEach(card => {
    let frame = 0;
    let point;
    card.addEventListener('pointermove', event => {
      if (!enabled.matches) return;
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        const x = point.x - bounds.left;
        card.style.setProperty('--light-x', `${x}px`);
        card.style.setProperty('--light-y', `${point.y - bounds.top}px`);
        card.style.setProperty('--light-angle', `${135 + x / bounds.width * 55}deg`);
        card.style.setProperty('--light-active', '1');
        frame = 0;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      ['--light-x', '--light-y', '--light-angle', '--light-active'].forEach(key => card.style.removeProperty(key));
    });
  });
})();
