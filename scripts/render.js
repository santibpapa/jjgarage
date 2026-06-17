/* ============================================================
   JJGARAGE — RENDER PÚBLICO
   Lee del JJStore y pinta el HTML de las secciones dinámicas:
   autos, testimonios, "quiénes somos" y datos de contacto.
   ============================================================ */

(() => {
  const fmtPrice = (price, currency) => {
    const symbol = currency === 'USD' ? 'US$' : '$';
    return `${symbol} ${Number(price).toLocaleString('es-AR')}`;
  };

  const starSVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 20.9l1.7-7L2 9.2l7.1-.6L12 2z"/></svg>`;

  /* ================= AUTOS ================= */
  async function renderCars() {
    const root = document.getElementById('fleet-list');
    if (!root) return;
    const cars = await JJStore.getCars();
    const counterEl = document.getElementById('fleet-counter-total');
    if (counterEl) counterEl.textContent = String(cars.length).padStart(2, '0');

    if (cars.length === 0) {
      root.innerHTML = `<div class="admin-empty" style="margin: 0 var(--container-pad);">Por el momento no hay unidades publicadas. Volvé a visitarnos pronto.</div>`;
      return;
    }

    root.innerHTML = cars.map((car, i) => {
      const img = car.images && car.images.length
        ? `<img src="${car.images[0]}" alt="${car.brand} ${car.model}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
        : carSilhouetteSVG();

      return `
      <article class="car-card reveal" style="--car-art:${car.colorArt || 'linear-gradient(135deg,#2a2a26,#0f0f0d)'}">
        <div class="car-card-inner">
          <div class="car-visual">
            <div class="car-visual-art">${img}</div>
            <div class="car-badge-floating">${car.tag || 'Disponible'}</div>
            <div class="car-visual-curtain"></div>
          </div>
          <div class="car-info">
            <div class="car-info-eyebrow">Unidad ${String(i + 1).padStart(2, '0')} · ${car.year}</div>
            <h3>${car.brand} ${car.model}</h3>
            <p class="desc">${car.description || ''}</p>
            <div class="car-specs">
              <div class="car-spec">
                <div class="val">${car.mileage || '—'}</div>
                <div class="lbl">Kilometraje</div>
              </div>
              <div class="car-spec">
                <div class="val">${car.transmission || '—'}</div>
                <div class="lbl">Transmisión</div>
              </div>
              <div class="car-spec">
                <div class="val">${car.fuel || '—'}</div>
                <div class="lbl">Combustible</div>
              </div>
            </div>
            <div class="car-price-row">
              <div class="car-price">
                <div class="lbl">Precio de referencia</div>
                <div class="amount">${fmtPrice(car.price, car.currency)}</div>
              </div>
              <a href="#contacto" class="btn btn-primary">Consultar</a>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');

    if (window.JJObserveNewReveals) window.JJObserveNewReveals();
  }

  function carSilhouetteSVG() {
    return `<svg class="car-silhouette" viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 60 Q20 40 45 35 L65 22 Q85 14 115 16 L140 22 Q165 28 178 45 L185 58 L185 68 Q185 72 180 72 L168 72 Q165 60 153 60 Q141 60 138 72 L62 72 Q59 60 47 60 Q35 60 32 72 L18 72 Q14 72 14 68 Z" fill="rgba(245,245,240,0.13)" stroke="rgba(245,245,240,0.35)" stroke-width="1"/>
      <circle cx="47" cy="72" r="11" fill="rgba(10,10,10,0.6)" stroke="rgba(245,245,240,0.4)" stroke-width="1.5"/>
      <circle cx="153" cy="72" r="11" fill="rgba(10,10,10,0.6)" stroke="rgba(245,245,240,0.4)" stroke-width="1.5"/>
      <path d="M68 36 Q85 24 112 26 L134 32 Q120 28 100 28 Q82 28 68 36Z" fill="rgba(201,162,75,0.25)"/>
    </svg>`;
  }

  /* ================= TESTIMONIOS ================= */
  async function renderTestimonials() {
    const root = document.getElementById('testimonials-list');
    if (!root) return;
    const items = await JJStore.getTestimonials();

    if (items.length === 0) {
      root.innerHTML = `<div class="admin-empty">Todavía no hay testimonios publicados.</div>`;
      return;
    }

    root.innerHTML = items.map((t) => {
      const initials = t.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
      const stars = Array.from({ length: 5 }).map((_, i) =>
        `<span style="opacity:${i < t.rating ? 1 : 0.25}">${starSVG}</span>`
      ).join('');

      return `
      <div class="testimonial-card reveal">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-quote">&ldquo;${t.quote}&rdquo;</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${initials}</div>
          <div>
            <div class="testimonial-author-name">${t.name}</div>
            <div class="testimonial-author-detail">${t.detail || ''}</div>
          </div>
        </div>
      </div>`;
    }).join('');

    if (window.JJObserveNewReveals) window.JJObserveNewReveals();
  }

  /* ================= QUIÉNES SOMOS ================= */
  async function renderAbout() {
    const about = await JJStore.getAbout();
    const titleEl = document.getElementById('about-title');
    const p1 = document.getElementById('about-p1');
    const p2 = document.getElementById('about-p2');
    const p3 = document.getElementById('about-p3');
    if (titleEl) titleEl.textContent = about.title;
    if (p1) p1.textContent = about.paragraph1;
    if (p2) p2.textContent = about.paragraph2;
    if (p3) p3.textContent = about.paragraph3;
  }

  /* ================= CONTACTO / SETTINGS ================= */
  async function renderSettings() {
    const s = await JJStore.getSettings();
    document.querySelectorAll('[data-field="whatsapp"]').forEach((el) => {
      el.textContent = s.whatsapp;
    });
    document.querySelectorAll('[data-field="email"]').forEach((el) => {
      el.textContent = s.email;
    });
    document.querySelectorAll('[data-field="address"]').forEach((el) => {
      el.textContent = s.address;
    });

    const waLink = document.getElementById('contact-whatsapp-link');
    if (waLink) waLink.href = `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}`;

    const emailLink = document.getElementById('contact-email-link');
    if (emailLink) emailLink.href = `mailto:${s.email}`;

    const igLink = document.getElementById('contact-instagram-link');
    if (igLink && s.instagram) {
      igLink.href = `https://instagram.com/${s.instagram.replace('@', '')}`;
    }
  }

  async function renderAll() {
    await Promise.all([renderCars(), renderTestimonials(), renderAbout(), renderSettings()]);
  }

  window.JJRender = { renderAll, renderCars, renderTestimonials, renderAbout, renderSettings };
  document.addEventListener('DOMContentLoaded', renderAll);
})();
