(() => {
  const domainTabs = [...document.querySelectorAll('[data-domain]')];
  const domainPanels = [...document.querySelectorAll('[data-domain-panel]')];
  let currentDomain = 0;

  function showDomain(index, focusTab = false) {
    currentDomain = (index + domainTabs.length) % domainTabs.length;
    domainTabs.forEach((tab, i) => {
      const selected = i === currentDomain;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      domainPanels[i].hidden = !selected;
    });
    if (focusTab) domainTabs[currentDomain].focus({ preventScroll: true });
  }

  domainTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showDomain(index));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = currentDomain + 1;
      if (event.key === 'ArrowLeft') target = currentDomain - 1;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = domainTabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      showDomain(target, true);
    });
    domainPanels[index].setAttribute('role', 'tabpanel');
    domainPanels[index].setAttribute('aria-labelledby', tab.id);
    domainPanels[index].tabIndex = 0;
  });

  const dialog = document.getElementById('figure-dialog');
  const zoomFigure = document.getElementById('zoom-figure');
  zoomFigure.addEventListener('click', () => {
    const zoomed = dialog.classList.toggle('is-zoomed');
    zoomFigure.setAttribute('aria-pressed', String(zoomed));
    zoomFigure.textContent = zoomed ? 'Fit image' : 'Zoom in';
  });
  document.querySelectorAll('[data-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.dataset.zoomImage
        ? document.getElementById(button.dataset.zoomImage)
        : button.querySelector('img');
      const enlarged = document.getElementById('dialog-image');
      enlarged.src = source.src;
      enlarged.alt = button.dataset.zoomAlt || source.alt;
      dialog.classList.remove('is-zoomed');
      zoomFigure.setAttribute('aria-pressed', 'false');
      zoomFigure.textContent = 'Zoom in';
      document.getElementById('dialog-caption').textContent = button.dataset.zoomCaption
        || button.closest('figure').querySelector('figcaption').textContent;
      dialog.showModal();
      dialog.querySelector('.dialog-image-wrap').scrollTo(0, 0);
    });
  });
  document.getElementById('close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  document.documentElement.classList.add('has-js');
  showDomain(0);
  document.querySelectorAll('[data-enhanced]').forEach(control => { control.hidden = false; });
})();
