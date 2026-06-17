/* ============================================================
   JJGARAGE — UI / ANIMACIONES GENERALES
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* ---- Navbar: cambia apariencia con el scroll ---- */
  const navbar = document.querySelector('.navbar');
  const onScrollNav = () => {
    if (window.scrollY > 24) navbar.classList.add('is-scrolled');
    else navbar.classList.remove('is-scrolled');
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---- Menú mobile ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => navLinks.classList.remove('is-open'));
    });
  }

  /* ---- Scroll reveal genérico ---- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  /* ---- Reveal específico de las "cortinas" de autos ---- */
  const ioCars = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          ioCars.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  function observeAll() {
    document.querySelectorAll('.reveal:not(.is-visible), .reveal-stagger:not(.is-visible)').forEach((el) => io.observe(el));
    document.querySelectorAll('.car-card:not(.is-revealed)').forEach((el) => ioCars.observe(el));
  }

  observeAll();
  // Expuesto globalmente para que render.js pueda re-observar contenido
  // pintado dinámicamente desde el store (autos, testimonios, etc.)
  window.JJObserveNewReveals = observeAll;

  /* ---- Contadores animados (stats) ---- */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const startVal = 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = startVal + (target - startVal) * eased;
      const formatted = target % 1 === 0
        ? Math.floor(current).toLocaleString('es-AR')
        : current.toFixed(1);
      el.textContent = formatted + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  const ioCounters = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          ioCounters.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => ioCounters.observe(el));

  /* ---- Año dinámico en footer ---- */
  const yearEl = document.querySelector('[data-current-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
