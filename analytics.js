(() => {
  const id = window.PORTFOLIO_GA4_ID;
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const enabled = /^G-[A-Z0-9]+$/i.test(id || '') && !local;
  const events = [];

  if (enabled) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    // A single page load is one page view; hashes and dialog history changes are interactions.
    gtag('config', id, { send_page_view: false });
  }

  function track(name, params = {}) {
    const event = { name, ...params };
    events.push(event);
    if (events.length > 100) events.shift();
    if (enabled) gtag('event', name, params);
  }

  window.portfolioAnalytics = { track, events, enabled };
  track('page_view', { page_title: document.title, page_location: location.origin + location.pathname });

  const sections = [
    ['home', '首頁'], ['work', '精選案例'], ['about', '核心能力'],
    ['certificates', '學習與證明'], ['contact', '聯絡']
  ];
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target.id)) continue;
        seen.add(entry.target.id);
        track('section_view', {
          section_id: entry.target.id,
          section_name: sections.find(([id]) => id === entry.target.id)?.[1] || entry.target.id
        });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.25 });
    sections.forEach(([sectionId]) => {
      const section = document.getElementById(sectionId);
      if (section) observer.observe(section);
    });
  }

  const reached = new Set();
  function measureDepth() {
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    if (maxScroll <= 0) return;
    const depth = Math.min(100, Math.round(scrollY / maxScroll * 100));
    for (const milestone of [25, 50, 75, 100]) {
      if (depth >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        track('scroll_depth', { percent_scrolled: milestone });
      }
    }
  }
  addEventListener('scroll', measureDepth, { passive: true });

  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.closest('.skill-bubbles')) {
      track('skill_click', { skill_name: link.textContent.trim() });
    } else if (link.closest('.contact-links')) {
      const channel = link.href.startsWith('mailto:') ? 'email' : link.href.startsWith('tel:') ? 'phone' : 'linkedin';
      track('contact_click', { contact_channel: channel });
    } else if (link.closest('.evidence')) {
      track('source_click', { case_id: location.hash.replace(/^#case-/, ''), source_name: link.textContent.trim() });
    } else if (link.hash && document.getElementById(link.hash.slice(1))) {
      track('anchor_click', { section_id: link.hash.slice(1) });
    }
  });
})();
