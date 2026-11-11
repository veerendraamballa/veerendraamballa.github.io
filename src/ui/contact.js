// Contact, kept one click away.
//
//   dock   a small fixed pair (Email / LinkedIn) that appears once the hero
//          has scrolled away and steps aside in the finale, which carries its
//          own full-size contact block
//   copy   "Copy email address" with a spoken confirmation; falls back to
//          selecting nothing and simply leaving the mailto button to do its job

export function initContact() {
  // Contact email is never in the raw HTML — each element carries it split
  // across data-u / data-d (no "@"), so regex harvesters find nothing. The
  // site already requires JS, so assembling it here costs nothing in reach.
  document.querySelectorAll('[data-u][data-d]').forEach((el) => {
    const addr = el.dataset.u + '@' + el.dataset.d;
    if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + addr);
    if (el.classList.contains('copy')) el.dataset.copy = addr;
    if (el.hasAttribute('data-show')) el.textContent = addr;
  });

  const dock = document.getElementById('dock');
  const hero = document.querySelector('.hero-spacer');
  const fin = document.getElementById('fin');
  if (dock && hero && fin && 'IntersectionObserver' in window) {
    const seen = { hero: true, fin: false };
    const apply = () => {
      const on = !seen.hero && !seen.fin;
      if (on) dock.hidden = false;
      // next frame, so the transition runs from the hidden state
      requestAnimationFrame(() => dock.classList.toggle('is-on', on));
      dock.inert = !on;
    };
    new IntersectionObserver((es) => {
      for (const e of es) seen.hero = e.intersectionRatio > 0.35;
      apply();
    }, { threshold: [0, 0.35, 1] }).observe(hero);
    new IntersectionObserver((es) => {
      for (const e of es) seen.fin = e.isIntersecting;
      apply();
    }, { threshold: 0.12 }).observe(fin);
  }

  for (const btn of document.querySelectorAll('[data-copy]')) {
    const status = btn.parentElement.querySelector('.copy__status');
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied to clipboard';
      } catch {
        if (status) status.textContent = btn.dataset.copy;
      }
      setTimeout(() => {
        btn.textContent = label;
        if (status) status.textContent = '';
      }, 2200);
    });
  }
}
