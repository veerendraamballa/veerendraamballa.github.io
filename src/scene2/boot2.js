// Scene two's lifecycle — the engineering universe.
//
// The room is DOM + SVG (see universe.css). This file does three things:
//   - arrival: the section fades up from black the first time it is reached,
//     and every animation pauses while it is off screen
//   - the energy lines: one curve from the core to each card, rebuilt on
//     resize from the cards' own custom properties, with a spark that
//     travels each line
//   - parallax: the pointer leans the room; cards read the same two custom
//     properties and scale the shift by their depth

export async function initUniverse() {
  const section = document.getElementById('universe');
  const deck = document.getElementById('uniDeck');
  const svg = document.getElementById('uniLines');
  if (!section || !deck || !svg) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...deck.querySelectorAll('.u-card')];
  const state = { visible: false, entered: false, raf: 0, px: 0, py: 0, tx: 0, ty: 0 };
  const NS = 'http://www.w3.org/2000/svg';

  // ---- energy lines ---------------------------------------------------------
  const buildLines = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.replaceChildren();
    const cx = w * 0.5;
    const cy = h * 0.5;
    cards.forEach((el, i) => {
      const cs = getComputedStyle(el);
      const x = parseFloat(cs.getPropertyValue('--x')) * w;
      const y = parseFloat(cs.getPropertyValue('--y')) * h;
      // leave the core tangentially, arrive at the card: a bowed quadratic
      const side = x < cx ? -1 : 1;
      const mx = cx + (x - cx) * 0.5 + side * w * 0.03;
      const my = cy + (y - cy) * 0.5 - h * 0.12 * (y < cy ? -0.4 : 1) * 0.6;
      const d = `M${cx.toFixed(1)} ${cy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.style.setProperty('--i', String(i));
      svg.appendChild(path);
      if (!reduced) {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', '1.8');
        const mo = document.createElementNS(NS, 'animateMotion');
        mo.setAttribute('dur', `${(3.6 + (i % 5) * 0.7).toFixed(1)}s`);
        mo.setAttribute('begin', `${(i * 0.43).toFixed(2)}s`);
        mo.setAttribute('repeatCount', 'indefinite');
        mo.setAttribute('path', d);
        dot.appendChild(mo);
        svg.appendChild(dot);
      }
    });
  };
  buildLines();
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(buildLines, 160);
  });

  // ---- parallax -------------------------------------------------------------
  const tick = () => {
    state.raf = 0;
    state.px += (state.tx - state.px) * 0.07;
    state.py += (state.ty - state.py) * 0.07;
    section.style.setProperty('--px', state.px.toFixed(4));
    section.style.setProperty('--py', state.py.toFixed(4));
    if (state.visible && (Math.abs(state.tx - state.px) > 0.001
      || Math.abs(state.ty - state.py) > 0.001)) {
      state.raf = requestAnimationFrame(tick);
    }
  };
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      state.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      state.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    });
    section.addEventListener('pointerleave', () => {
      state.tx = 0;
      state.ty = 0;
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    });
  }

  // ---- arrival + pause off screen --------------------------------------------
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      state.visible = e.isIntersecting;
      if (e.isIntersecting && !state.entered) {
        state.entered = true;
        section.classList.add('is-on');
      }
      section.classList.toggle('is-live', e.isIntersecting && !reduced);
      if (e.isIntersecting) svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    }
  }, { threshold: 0.3 }).observe(section);

  return { section };
}
