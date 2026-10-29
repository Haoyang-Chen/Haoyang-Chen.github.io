(() => {
  const guide = document.getElementById('guided-demo');
  const graph = document.getElementById('conversation-graph');
  const nodes = new Map([...graph.querySelectorAll('[data-node]')].map(node => [node.dataset.node, node]));
  const steps = [...guide.querySelectorAll('[data-step]')];
  const stories = [...guide.querySelectorAll('[data-story]')];
  const previous = document.getElementById('guide-back');
  const next = document.getElementById('guide-next');
  const workerContext = ['root', 'workers', 'worker-evidence'];
  const mergedContext = ['root', 'organization', 'org-evidence', 'workers', 'worker-evidence', 'synthesis'];
  const supportedContext = mergedContext.filter(id => id !== 'synthesis');
  const baseEdges = [
    ['root', 'organization'], ['root', 'workers'],
    ['organization', 'org-evidence'], ['workers', 'worker-evidence'],
    ['org-evidence', 'synthesis'], ['worker-evidence', 'synthesis']
  ];
  const nextLabels = ['Bring the branches together →', 'Inspect the overview →', 'Revise the context →', 'Replay the walkthrough ↺'];
  let current = 0;
  let editState = 'ready';
  let included = new Set(workerContext);

  function drawEdges() {
    const bounds = graph.getBoundingClientRect();
    if (!bounds.width) return;
    const paths = document.getElementById('edge-paths');
    paths.replaceChildren();
    const edges = current === 0 ? baseEdges.slice(0, 4) : [...baseEdges];
    if (current === 3 && ['preview', 'accepted'].includes(editState)) edges.push(['org-evidence', 'worker-evidence']);
    edges.forEach(([from, to]) => {
      const source = nodes.get(from).getBoundingClientRect();
      const target = nodes.get(to).getBoundingClientRect();
      const supportEdge = from === 'org-evidence' && to === 'worker-evidence';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;
      if (supportEdge) {
        const x1 = source.right - bounds.left;
        const x2 = target.left - bounds.left;
        const y1 = source.top + source.height / 2 - bounds.top;
        const y2 = target.top + target.height / 2 - bounds.top;
        d = `M ${x1} ${y1} C ${x1 + 14} ${y1}, ${x2 - 14} ${y2}, ${x2} ${y2}`;
      } else {
        const x1 = source.left + source.width / 2 - bounds.left;
        const x2 = target.left + target.width / 2 - bounds.left;
        const y1 = source.bottom - bounds.top;
        const y2 = target.top - bounds.top;
        const midY = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'graph-edge');
      path.dataset.from = from;
      path.dataset.to = to;
      if (included.has(from) && included.has(to)) path.classList.add('is-included');
      if (current === 3 && editState === 'preview' && (supportEdge || (from === 'root' && to === 'organization') || from === 'organization')) path.classList.add('is-preview');
      paths.append(path);
    });
  }

  function renderContext() {
    const accepted = current === 3 && editState === 'accepted';
    const preview = current === 3 && editState === 'preview';
    const context = current === 1 ? mergedContext : accepted ? supportedContext : workerContext;
    const active = current === 1 ? 'synthesis' : 'worker-evidence';
    included = new Set(context);
    nodes.forEach((node, id) => {
      node.classList.toggle('is-included', included.has(id));
      node.classList.toggle('is-active', id === active);
      node.classList.toggle('is-preview', preview && ['organization', 'org-evidence'].includes(id));
      node.classList.remove('is-located');
      let activeLabel = node.querySelector('.node-active-label');
      if (id === active && !activeLabel) {
        activeLabel = document.createElement('span');
        activeLabel.className = 'node-active-label';
        activeLabel.textContent = 'Continue here';
        node.append(activeLabel);
      }
    });
    nodes.get('synthesis').classList.toggle('is-future', current === 0);
    nodes.get('synthesis').querySelector('.node-label').textContent = current === 0 ? 'Bring the branches together next' : 'Merged inquiry';
    nodes.get('synthesis').querySelector('.stale-label').hidden = !accepted;
    const list = document.getElementById('context-list');
    list.replaceChildren(...context.map(id => {
      const item = document.createElement('li');
      item.dataset.contextNode = id;
      item.textContent = nodes.get(id).querySelector('strong').textContent;
      return item;
    }));
    document.getElementById('context-count').textContent = `${context.length} turns`;
    document.getElementById('context-note').textContent = current === 1
      ? 'Shared history is included once; the two branches retain their provenance.'
      : accepted
        ? 'Both branches now support the next turn. Existing responses have not been rewritten.'
        : preview
          ? 'Preview only: the two proposed turns are not included yet.'
          : current === 2
            ? 'The whole-graph brief can show material outside this working context.'
            : 'The other branch remains available on the graph.';
    document.getElementById('preview-edit').hidden = editState !== 'ready';
    document.getElementById('accept-edit').hidden = editState !== 'preview';
    document.getElementById('reject-edit').hidden = editState !== 'preview';
    document.getElementById('reset-edit').hidden = !['accepted', 'rejected'].includes(editState);
    const status = {
      ready: 'The context stays unchanged until you accept.',
      preview: 'The dashed connection would add two turns. Accept or reject the proposal.',
      accepted: 'Connection accepted. Two turns were added; the downstream merged response is marked for review.',
      rejected: 'Proposal rejected. The original three-turn context is unchanged.'
    };
    document.getElementById('edit-status').textContent = status[editState];
    drawEdges();
  }

  function showStep(index, reveal = false) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    editState = 'ready';
    steps.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      stories[i].hidden = i !== current;
    });
    document.getElementById('context-brief').hidden = current !== 2;
    document.getElementById('refactor-controls').hidden = current !== 3;
    previous.disabled = current === 0;
    next.textContent = nextLabels[current];
    document.getElementById('guide-progress').textContent = `${current + 1} of ${steps.length}`;
    renderContext();
    if (reveal && guide.getBoundingClientRect().top < 100) guide.scrollIntoView({ block: 'start' });
  }

  steps.forEach((button, index) => {
    button.addEventListener('click', () => showStep(index, true));
    button.addEventListener('keydown', event => {
      const destination = { ArrowRight: (index + 1) % steps.length, ArrowLeft: (index + steps.length - 1) % steps.length, Home: 0, End: steps.length - 1 }[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      showStep(destination, true);
      steps[destination].focus({ preventScroll: true });
    });
  });
  previous.addEventListener('click', () => showStep(current - 1, true));
  next.addEventListener('click', () => showStep(current === steps.length - 1 ? 0 : current + 1, true));
  [['preview-edit', 'preview'], ['accept-edit', 'accepted'], ['reject-edit', 'rejected'], ['reset-edit', 'ready']].forEach(([id, state]) => {
    document.getElementById(id).addEventListener('click', () => {
      editState = state;
      renderContext();
      document.getElementById(state === 'preview' ? 'accept-edit' : state === 'ready' ? 'preview-edit' : 'reset-edit').focus({ preventScroll: true });
    });
  });
  document.querySelectorAll('[data-source]').forEach(button => {
    const locate = () => nodes.forEach((node, id) => node.classList.toggle('is-located', id === button.dataset.source));
    button.addEventListener('click', locate);
    button.addEventListener('focus', locate);
    button.addEventListener('mouseenter', locate);
    button.addEventListener('mouseleave', () => { if (document.activeElement !== button) nodes.forEach(node => node.classList.remove('is-located')); });
    button.addEventListener('blur', () => nodes.forEach(node => node.classList.remove('is-located')));
  });

  const dialog = document.getElementById('figure-dialog');
  const enlarged = document.getElementById('dialog-image');
  const zoomButton = document.getElementById('zoom-figure');
  let figureTrigger;
  document.querySelectorAll('[data-zoom]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      figureTrigger = link;
      enlarged.src = link.href;
      enlarged.alt = link.dataset.figureAlt || link.querySelector('img').alt;
      document.getElementById('figure-dialog-title').textContent = link.dataset.figureTitle || 'Trellis · Paper figure';
      document.getElementById('dialog-caption').textContent = link.dataset.caption || link.closest('figure').querySelector('figcaption').textContent;
      dialog.classList.remove('is-zoomed');
      zoomButton.setAttribute('aria-pressed', 'false');
      zoomButton.textContent = 'Zoom in';
      dialog.showModal();
      dialog.querySelector('.dialog-image-wrap').scrollTo(0, 0);
    });
  });
  zoomButton.addEventListener('click', () => {
    const zoomed = dialog.classList.toggle('is-zoomed');
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.textContent = zoomed ? 'Fit image' : 'Zoom in';
  });
  document.getElementById('close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => figureTrigger?.focus({ preventScroll: true }));

  document.documentElement.classList.add('has-js');
  document.querySelectorAll('[data-enhanced]').forEach(element => { element.hidden = false; });
  showStep(0);
  new ResizeObserver(drawEdges).observe(graph);
})();
