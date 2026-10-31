(() => {
  const nav = document.getElementById('navbar');
  const list = nav.querySelector('.navbar-nav');
  const links = [...list.querySelectorAll('.nav-link')];
  const targets = links.map(link => document.querySelector(link.hash));
  const indicator = document.createElement('li');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  list.prepend(indicator);
  let current = -1;
  const positionIndicator = () => {
    const link = links[current];
    if (!link || !list.getClientRects().length) return;
    const bounds = link.getBoundingClientRect();
    const parent = list.getBoundingClientRect();
    indicator.style.width = `${bounds.width}px`;
    indicator.style.transform = `translateX(${bounds.left - parent.left}px)`;
  };
  const select = index => {
    if (current !== index) {
      links.forEach((link, i) => {
        if (i === index) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      current = index;
    }
    positionIndicator();
  };
  let scheduled = false;
  const update = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    let index = 0;
    targets.forEach((target, i) => {
      if (target && target.getBoundingClientRect().top <= Math.max(160, innerHeight * .3)) index = i;
    });
    if (window.scrollY > 0 && innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) index = links.length - 1;
    select(index);
    scheduled = false;
  };
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, { passive: true });
  links.forEach((link, i) => link.addEventListener('click', () => select(i)));
  addEventListener('resize', update);
  new ResizeObserver(positionIndicator).observe(list);
  update();
})();
