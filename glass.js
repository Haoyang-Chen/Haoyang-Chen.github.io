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
  let lastClicked = links.findIndex(link => link.hash === location.hash);
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
    const positions = targets.map(target => target ? target.getBoundingClientRect().top : Infinity);
    const threshold = Math.max(160, innerHeight * .3);
    let group = [0];
    let groupTop = -Infinity;
    positions.forEach((top, i) => {
      if (top > threshold) return;
      if (top > groupTop + 1) { group = [i]; groupTop = top; }
      else if (Math.abs(top - groupTop) <= 1) group.push(i);
    });
    // Side-by-side sections share one scroll position. Preserve the user's
    // choice within that group rather than always selecting its last heading.
    if (window.scrollY > 0 && innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      const lastTop = positions[positions.length - 1];
      group = positions.flatMap((top, i) => Math.abs(top - lastTop) <= 1 ? [i] : []);
    }
    const index = group.includes(lastClicked) ? lastClicked : group.includes(current) ? current : group[0];
    select(index);
    scheduled = false;
  };
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, { passive: true });
  links.forEach((link, i) => link.addEventListener('click', () => {
    lastClicked = i;
    select(i);
  }));
  addEventListener('resize', update);
  new ResizeObserver(positionIndicator).observe(list);
  update();
})();
