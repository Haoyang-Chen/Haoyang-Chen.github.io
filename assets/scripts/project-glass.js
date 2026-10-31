(() => {
  const links = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
  const targets = links.map(link => document.querySelector(link.hash));
  let frame = 0;
  const update = () => {
    let active = -1;
    targets.forEach((target, index) => {
      if (target && target.getBoundingClientRect().top <= 190) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    frame = 0;
  };
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  addEventListener('resize', update);
  update();
})();
