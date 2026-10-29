(() => {
  const root = document.getElementById('guided-demo');
  const frame = document.getElementById('guide-viewport');
  const camera = document.getElementById('guide-camera');
  const spotlight = document.getElementById('guide-spotlight');
  const steps = [...root.querySelectorAll('[data-guide-step]')];
  const previous = document.getElementById('guide-back');
  const next = document.getElementById('guide-next');
  const zoom = root.querySelector('[data-zoom]');
  const source = document.getElementById('guide-source-image');
  const sourceWidth = 1540;
  const sourceHeight = 710;
  let current = 0;

  // Camera and highlight rectangles use the original Figure 4 pixel coordinates.
  // Targets annotate that image; they are not outputs of a retrained model.
  const scenes = [
    {
      kicker: '01 / The mismatch',
      title: 'You take the onions. The AI should serve.',
      description: 'You are the green chef. You want the blue AI to handle dishes and soup. But it favors collecting onions, with a 68% probability—so both partners want the same job.',
      view: [15, 65, 1020, 565], mobileView: [20, 75, 495, 545],
      focus: [25, 77, 990, 535],
      labels: ['Your intended role', 'AI’s current preference'],
      facts: ['Collect onions', '68% onion pickup'],
      takeaway: 'The explanation makes the competing intentions visible before you make a correction.',
      figureLabel: 'The agent’s original explanation',
      caption: 'Figure 4 · The blue agent and green human currently anticipate different divisions of work.',
      next: 'Read its expectation'
    },
    {
      kicker: '02 / Read',
      title: 'It expects you to take the dishes.',
      description: 'Follow the onion branch. If the AI collects an onion, it predicts that you will pick up a dish with 76% probability. Its preferred choice relies on you taking the other role.',
      view: [515, 25, 1015, 325], mobileView: [1030, 32, 490, 310],
      focus: [1030, 38, 485, 151],
      labels: ['AI action', 'Predicted human response'],
      facts: ['Pick up onion', '76% dish pickup'],
      takeaway: 'Reading the explanation reveals the expectation behind the mismatch. You can reconsider your role or correct the agent.',
      figureLabel: 'Read the action and its predicted consequence',
      caption: 'Figure 4 · The 76% prediction is conditional on the AI choosing the onion branch.',
      next: 'Show the correction'
    },
    {
      kicker: '03 / Revise',
      title: 'Give the AI the dish role.',
      description: 'In this example, increase the dish-pickup target from 32% to 90%. The onion target becomes 10%. This edits Behavior and supplies supervision for the Actor at this decision.',
      view: [515, 375, 520, 255], mobileView: [515, 375, 520, 255],
      focus: [530, 386, 488, 222],
      labels: ['Dish-pickup target', 'Onion-pickup target'],
      facts: ['32% → 90%', '68% → 10%'],
      takeaway: 'The purple annotations show the requested distribution. They are training targets, not the resulting policy.',
      figureLabel: 'An illustrative Behavior correction',
      caption: 'Figure 4 with illustrative target annotations · The method converts the revised probabilities into Actor supervision (§5.3).',
      next: 'Inspect the consequence',
      edited: true
    },
    {
      kicker: '04 / Inspect',
      title: 'Check the expectation attached to that choice.',
      description: 'On the dish branch, the agent already predicts that you will collect onions with 82% probability. It values that outcome at 20.82. This example leaves both quantities unchanged.',
      view: [515, 350, 1015, 350], mobileView: [1030, 375, 490, 300],
      focus: [1028, 382, 486, 151],
      labels: ['Belief: you collect onions', 'Benefit: outcome value'],
      facts: ['82% · unchanged', '20.82 · unchanged'],
      takeaway: 'A correction can target one component. Belief or Benefit edits would instead guide the World Model or Critic.',
      figureLabel: 'Inspect Belief and Benefit on the selected branch',
      caption: 'Figure 4 · The human-response probability and outcome value come from the original explanation; only the Behavior targets are annotated.',
      next: 'Why learning matters',
      edited: true
    },
    {
      kicker: '05 / Reinforce',
      title: 'A dish pickup is only the first decision.',
      description: 'Serving also requires collecting the soup and delivering it. CoChoice retains edit-derived guidance during continued reinforcement learning, so adaptation can extend beyond the decision a person edited.',
      labels: ['Revise', 'Reinforce'],
      facts: ['Targeted correction', 'Continued learning'],
      takeaway: 'The study distinguished changing one choice from following through on the broader role. The excerpts report those observations.',
      figureLabel: 'The learning step and evidence from the study',
      caption: 'Figure 3 and participant accounts from §6.2 · These are study observations, not outcomes generated by this demonstration.',
      next: 'Replay the guide',
      learning: true
    }
  ];

  function updateCamera() {
    const scene = scenes[current];
    if (scene.learning || !frame.clientWidth) return;
    const [x, y, width, height] = frame.clientWidth < 550 ? scene.mobileView : scene.view;
    const base = frame.clientWidth / sourceWidth;
    const scale = Math.min(frame.clientWidth / (width * base), frame.clientHeight / (height * base)) * 0.94;
    const translateX = frame.clientWidth / 2 - (x + width / 2) * base * scale;
    const translateY = frame.clientHeight / 2 - (y + height / 2) * base * scale;
    camera.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    const [left, top, focusWidth, focusHeight] = scene.focus;
    Object.assign(spotlight.style, {
      left: `${left / sourceWidth * 100}%`, top: `${top / sourceHeight * 100}%`,
      width: `${focusWidth / sourceWidth * 100}%`, height: `${focusHeight / sourceHeight * 100}%`
    });
  }

  function showScene(index, reveal = false) {
    current = Math.max(0, Math.min(index, scenes.length - 1));
    const scene = scenes[current];
    steps.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    document.getElementById('guide-kicker').textContent = scene.kicker;
    document.getElementById('guide-title').textContent = scene.title;
    document.getElementById('guide-description').textContent = scene.description;
    document.getElementById('guide-figure-label').textContent = scene.figureLabel;
    document.getElementById('guide-figure-caption').textContent = scene.caption;
    document.getElementById('guide-takeaway').textContent = scene.takeaway;
    scene.labels.forEach((label, i) => {
      document.getElementById(`guide-fact-label-${i + 1}`).textContent = label;
      document.getElementById(`guide-fact-${i + 1}`).textContent = scene.facts[i];
    });
    root.classList.toggle('guide-has-edit', Boolean(scene.edited));
    frame.hidden = Boolean(scene.learning);
    document.getElementById('guide-learning').hidden = !scene.learning;
    zoom.dataset.zoomImage = scene.learning ? 'guide-learning-image' : 'guide-source-image';
    zoom.dataset.zoomCaption = scene.learning
      ? 'Figure 3 · CoChoice’s Read–Revise–Reinforce workflow retains edit-derived guidance during further learning.'
      : 'Original Figure 4 · Values are from the manuscript. The guide’s illustrative target annotations are not shown in this source figure.';
    zoom.dataset.zoomAlt = scene.learning
      ? 'CoChoice’s Read–Revise–Reinforce workflow, connecting the Markov tree to the Actor, World Model, and Critic.'
      : 'Original CoChoice explanation with 68 percent onion pickup, 32 percent dish pickup, predicted human responses, and outcome values.';
    // Expanded images remain the unchanged source figures, so label them accordingly.
    zoom.setAttribute('aria-label', `Enlarge original Figure ${scene.learning ? '3' : '4'}`);
    source.alt = scene.edited
      ? 'Original CoChoice tree with illustrative Behavior targets overlaid: 90 percent dish pickup and 10 percent onion pickup. Beliefs and values are unchanged.'
      : 'Original CoChoice tree: 68 percent onion pickup and 32 percent dish pickup. Predicted human responses and outcome values follow each action.';
    document.getElementById('guide-progress').textContent = `${current + 1} of ${scenes.length}`;
    previous.disabled = current === 0;
    next.textContent = scene.next;
    updateCamera();
    if (reveal) {
      const bounds = root.getBoundingClientRect();
      if (bounds.top < 90 || bounds.bottom > window.innerHeight) {
        root.scrollIntoView({ block: 'start' });
      }
    }
  }

  steps.forEach((button, index) => {
    button.addEventListener('click', () => showScene(index, true));
    button.addEventListener('keydown', event => {
      let destination;
      if (event.key === 'ArrowRight') destination = (index + 1) % scenes.length;
      if (event.key === 'ArrowLeft') destination = (index + scenes.length - 1) % scenes.length;
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = scenes.length - 1;
      if (destination === undefined) return;
      event.preventDefault();
      showScene(destination, true);
      steps[destination].focus({ preventScroll: true });
    });
  });
  previous.addEventListener('click', () => showScene(current - 1, true));
  next.addEventListener('click', () => showScene(current === scenes.length - 1 ? 0 : current + 1, true));
  root.querySelectorAll('[data-guide-enhanced]').forEach(element => { element.hidden = false; });
  showScene(0);
  root.classList.add('guide-ready');
  new ResizeObserver(updateCamera).observe(frame);
})();
