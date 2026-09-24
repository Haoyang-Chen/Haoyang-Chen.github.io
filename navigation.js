(() => {
  const menu = document.getElementById('navbarNav');
  const toggle = document.querySelector('.navbar-toggler');
  const closeMenu = () => {
    menu.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const expanded = menu.classList.toggle('show');
    toggle.setAttribute('aria-expanded', String(expanded));
  });
  document.querySelectorAll('.nav-link, .skip-link').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeMenu();
      if (target.tagName === 'DETAILS') target.open = true;
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      const focusTarget = target.tagName === 'DETAILS' ? target.querySelector('summary') : target;
      if (focusTarget.tagName !== 'SUMMARY') focusTarget.setAttribute('tabindex', '-1');
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      focusTarget.focus({ preventScroll: true });
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('show')) {
      closeMenu();
      toggle.focus();
    }
  });
})();
