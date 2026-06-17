/* ============================================================
   JJGARAGE — PANEL ADMINISTRADOR
   Maneja: autenticación simple por contraseña, navegación de
   tabs del dashboard, y los formularios CRUD para autos,
   testimonios, "quiénes somos" y datos de contacto.
   ============================================================ */

(() => {
  const el = (id) => document.getElementById(id);
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ================= TOAST ================= */
  let toastTimer = null;
  function showToast(message) {
    const toast = el('admin-toast');
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  /* ================= LOGIN OVERLAY ================= */
  const adminTrigger = el('admin-trigger');
  const loginOverlay = el('admin-login-overlay');
  const loginForm = el('admin-login-form');
  const loginError = el('admin-login-error');
  const loginClose = el('admin-login-close');
  const dashboard = el('admin-dashboard');

  function openLogin() {
    if (JJStore.hasSession()) {
      openDashboard();
      return;
    }
    loginOverlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
    setTimeout(() => qs('input[name="password"]', loginForm)?.focus(), 100);
  }

  function closeLogin() {
    loginOverlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    loginError.classList.remove('is-visible');
    loginForm.reset();
  }

  function openDashboard() {
    closeLogin();
    dashboard.classList.add('is-open');
    document.body.classList.add('no-scroll');
    refreshAllPanels();
  }

  function closeDashboard() {
    dashboard.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  adminTrigger?.addEventListener('click', openLogin);
  loginClose?.addEventListener('click', closeLogin);
  loginOverlay?.addEventListener('click', (e) => {
    if (e.target === loginOverlay) closeLogin();
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = qs('input[name="password"]', loginForm).value;
    if (JJStore.checkPassword(password)) {
      JJStore.setSession(true);
      openDashboard();
    } else {
      loginError.classList.add('is-visible');
    }
  });

  el('admin-logout')?.addEventListener('click', () => {
    JJStore.setSession(false);
    closeDashboard();
  });

  el('admin-dashboard-close')?.addEventListener('click', closeDashboard);

  el('admin-view-site')?.addEventListener('click', closeDashboard);

  /* ================= TABS ================= */
  const tabs = qsa('.admin-tab');
  const panels = qsa('.admin-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      el(tab.dataset.target)?.classList.add('is-active');
    });
  });

  function refreshAllPanels() {
    renderCarsAdmin();
    renderTestimonialsAdmin();
    fillAboutForm();
    fillSettingsForm();
  }

  /* Escape key cierra modales/overlays abiertos */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (carFormOverlay.classList.contains('is-open')) closeCarForm();
    else if (testimonialFormOverlay.classList.contains('is-open')) closeTestimonialForm();
    else if (loginOverlay.classList.contains('is-open')) closeLogin();
  });

  /* ============================================================
     GESTIÓN DE AUTOS
     ============================================================ */
  const carFormOverlay = el('car-form-overlay');
  const carForm = el('car-form');
  const carFormTitle = el('car-form-title');
  const carImageInput = el('car-image-input');
  const carImagePreview = el('car-image-preview');
  let carImagesBuffer = [];
  let editingCarId = null;

  function renderCarsAdmin() {
    const root = el('admin-cars-list');
    const cars = JJStore.getCars();
    if (cars.length === 0) {
      root.innerHTML = `<div class="admin-empty">No hay autos cargados todavía. Hacé clic en "Agregar auto" para crear el primero.</div>`;
      return;
    }
    root.innerHTML = cars.map((car) => {
      const thumbStyle = car.images && car.images.length
        ? `background-image:url('${car.images[0]}');background-size:cover;background-position:center;`
        : `background:${car.colorArt || 'linear-gradient(135deg,#2a2a26,#0f0f0d)'};`;
      return `
      <div class="admin-item-card">
        <div class="admin-item-thumb" style="${thumbStyle}">
          ${(!car.images || !car.images.length) ? carIconSVG() : ''}
        </div>
        <div class="admin-item-info">
          <div class="title">${car.brand} ${car.model} · ${car.year}</div>
          <div class="meta">US$ ${Number(car.price).toLocaleString('es-AR')} · ${car.mileage || 'sin km informado'}</div>
        </div>
        <div class="admin-item-actions">
          <button class="icon-btn" data-edit-car="${car.id}" aria-label="Editar auto">${editIconSVG()}</button>
          <button class="icon-btn danger" data-delete-car="${car.id}" aria-label="Eliminar auto">${trashIconSVG()}</button>
        </div>
      </div>`;
    }).join('');

    qsa('[data-edit-car]', root).forEach((btn) => {
      btn.addEventListener('click', () => openCarForm(btn.dataset.editCar));
    });
    qsa('[data-delete-car]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este auto del catálogo? Esta acción no se puede deshacer.')) {
          JJStore.deleteCar(btn.dataset.deleteCar);
          renderCarsAdmin();
          JJRender.renderCars();
          showToast('Auto eliminado');
        }
      });
    });
  }

  function openCarForm(carId) {
    editingCarId = carId || null;
    carImagesBuffer = [];
    carForm.reset();
    carImagePreview.innerHTML = '';

    if (carId) {
      const car = JJStore.getCar(carId);
      carFormTitle.textContent = 'Editar auto';
      carForm.brand.value = car.brand || '';
      carForm.model.value = car.model || '';
      carForm.year.value = car.year || '';
      carForm.price.value = car.price || '';
      carForm.currency.value = car.currency || 'USD';
      carForm.mileage.value = car.mileage || '';
      carForm.transmission.value = car.transmission || '';
      carForm.fuel.value = car.fuel || '';
      carForm.tag.value = car.tag || '';
      carForm.description.value = car.description || '';
      carImagesBuffer = car.images ? [...car.images] : [];
      renderImagePreview();
    } else {
      carFormTitle.textContent = 'Agregar auto';
      carForm.currency.value = 'USD';
    }
    carFormOverlay.classList.add('is-open');
  }

  function closeCarForm() {
    carFormOverlay.classList.remove('is-open');
    editingCarId = null;
  }

  function renderImagePreview() {
    carImagePreview.innerHTML = carImagesBuffer.map((src, i) =>
      `<img src="${src}" class="image-preview" alt="Foto ${i + 1}" />`
    ).join('');
  }

  carImageInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const { cloudinaryCloudName, cloudinaryUploadPreset } = JJStore.getSettings();

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      showToast('Configurá Cloudinary en "Contacto y acceso" antes de subir fotos');
      return;
    }

    const uploadBtn = carForm.querySelector('[type="submit"]');
    uploadBtn.disabled = true;
    uploadBtn.textContent = `Subiendo fotos (0/${files.length})…`;

    let done = 0;
    const uploadOne = async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', cloudinaryUploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        { method: 'POST', body: fd }
      );
      if (!res.ok) throw new Error(`Error al subir ${file.name}`);
      const json = await res.json();
      return json.secure_url;
    };

    const results = await Promise.allSettled(files.map(uploadOne));

    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        carImagesBuffer.push(r.value);
      } else {
        showToast(r.reason?.message || 'Error al subir una foto');
      }
    });

    done = results.filter((r) => r.status === 'fulfilled').length;
    renderImagePreview();
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Guardar auto';
    if (done) showToast(`${done} foto${done > 1 ? 's' : ''} subida${done > 1 ? 's' : ''} correctamente`);
  });

  el('car-form-add')?.addEventListener('click', () => openCarForm(null));
  el('car-form-cancel')?.addEventListener('click', closeCarForm);
  carFormOverlay?.addEventListener('click', (e) => {
    if (e.target === carFormOverlay) closeCarForm();
  });

  carForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const wasEditing = !!editingCarId;
    const data = {
      id: editingCarId,
      brand: carForm.brand.value.trim(),
      model: carForm.model.value.trim(),
      year: Number(carForm.year.value),
      price: Number(carForm.price.value),
      currency: carForm.currency.value,
      mileage: carForm.mileage.value.trim(),
      transmission: carForm.transmission.value.trim(),
      fuel: carForm.fuel.value.trim(),
      tag: carForm.tag.value.trim(),
      description: carForm.description.value.trim(),
      images: carImagesBuffer,
      colorArt: editingCarId ? (JJStore.getCar(editingCarId)?.colorArt) : randomCarGradient(),
    };
    JJStore.saveCar(data);
    closeCarForm();
    renderCarsAdmin();
    JJRender.renderCars();
    showToast(wasEditing ? 'Auto actualizado' : 'Auto agregado');
  });

  function randomCarGradient() {
    const palettes = [
      'linear-gradient(135deg, #3a2f1c, #0f0f0d)',
      'linear-gradient(135deg, #1f1f24, #0a0a0c)',
      'linear-gradient(135deg, #2a2a2e, #0c0c0e)',
      'linear-gradient(135deg, #332518, #0d0d0b)',
      'linear-gradient(135deg, #20221f, #0a0b09)',
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  /* ============================================================
     GESTIÓN DE TESTIMONIOS
     ============================================================ */
  const testimonialFormOverlay = el('testimonial-form-overlay');
  const testimonialForm = el('testimonial-form');
  const testimonialFormTitle = el('testimonial-form-title');
  const starsInput = el('testimonial-stars-input');
  let editingTestimonialId = null;
  let currentRating = 5;

  function renderStarsInput() {
    starsInput.innerHTML = Array.from({ length: 5 }).map((_, i) => `
      <button type="button" data-star="${i + 1}" class="${i < currentRating ? 'is-active' : ''}" aria-label="${i + 1} estrellas">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 20.9l1.7-7L2 9.2l7.1-.6L12 2z"/></svg>
      </button>`).join('');
    qsa('[data-star]', starsInput).forEach((btn) => {
      btn.addEventListener('click', () => {
        currentRating = Number(btn.dataset.star);
        renderStarsInput();
      });
    });
  }

  function renderTestimonialsAdmin() {
    const root = el('admin-testimonials-list');
    const items = JJStore.getTestimonials();
    if (items.length === 0) {
      root.innerHTML = `<div class="admin-empty">No hay testimonios todavía.</div>`;
      return;
    }
    root.innerHTML = items.map((t) => `
      <div class="admin-item-card">
        <div class="admin-item-thumb" style="background:var(--color-gold-glass);">${userIconSVG()}</div>
        <div class="admin-item-info">
          <div class="title">${t.name} · ${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
          <div class="meta">${t.detail || ''}</div>
        </div>
        <div class="admin-item-actions">
          <button class="icon-btn" data-edit-testimonial="${t.id}" aria-label="Editar testimonio">${editIconSVG()}</button>
          <button class="icon-btn danger" data-delete-testimonial="${t.id}" aria-label="Eliminar testimonio">${trashIconSVG()}</button>
        </div>
      </div>`).join('');

    qsa('[data-edit-testimonial]', root).forEach((btn) => {
      btn.addEventListener('click', () => openTestimonialForm(btn.dataset.editTestimonial));
    });
    qsa('[data-delete-testimonial]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este testimonio?')) {
          JJStore.deleteTestimonial(btn.dataset.deleteTestimonial);
          renderTestimonialsAdmin();
          JJRender.renderTestimonials();
          showToast('Testimonio eliminado');
        }
      });
    });
  }

  function openTestimonialForm(id) {
    editingTestimonialId = id || null;
    testimonialForm.reset();
    currentRating = 5;

    if (id) {
      const items = JJStore.getTestimonials();
      const t = items.find((i) => i.id === id);
      testimonialFormTitle.textContent = 'Editar testimonio';
      testimonialForm.name.value = t.name;
      testimonialForm.detail.value = t.detail || '';
      testimonialForm.quote.value = t.quote;
      currentRating = t.rating;
    } else {
      testimonialFormTitle.textContent = 'Agregar testimonio';
    }
    renderStarsInput();
    testimonialFormOverlay.classList.add('is-open');
  }

  function closeTestimonialForm() {
    testimonialFormOverlay.classList.remove('is-open');
    editingTestimonialId = null;
  }

  el('testimonial-form-add')?.addEventListener('click', () => openTestimonialForm(null));
  el('testimonial-form-cancel')?.addEventListener('click', closeTestimonialForm);
  testimonialFormOverlay?.addEventListener('click', (e) => {
    if (e.target === testimonialFormOverlay) closeTestimonialForm();
  });

  testimonialForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const wasEditing = !!editingTestimonialId;
    const data = {
      id: editingTestimonialId,
      name: testimonialForm.name.value.trim(),
      detail: testimonialForm.detail.value.trim(),
      quote: testimonialForm.quote.value.trim(),
      rating: currentRating,
    };
    JJStore.saveTestimonial(data);
    closeTestimonialForm();
    renderTestimonialsAdmin();
    JJRender.renderTestimonials();
    showToast(wasEditing ? 'Testimonio actualizado' : 'Testimonio agregado');
  });

  /* ============================================================
     QUIÉNES SOMOS
     ============================================================ */
  const aboutForm = el('about-form');

  function fillAboutForm() {
    if (!aboutForm) return;
    const about = JJStore.getAbout();
    aboutForm.title.value = about.title || '';
    aboutForm.paragraph1.value = about.paragraph1 || '';
    aboutForm.paragraph2.value = about.paragraph2 || '';
    aboutForm.paragraph3.value = about.paragraph3 || '';
  }

  aboutForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    JJStore.saveAbout({
      title: aboutForm.title.value.trim(),
      paragraph1: aboutForm.paragraph1.value.trim(),
      paragraph2: aboutForm.paragraph2.value.trim(),
      paragraph3: aboutForm.paragraph3.value.trim(),
    });
    JJRender.renderAbout();
    showToast('Sección "Quiénes somos" actualizada');
  });

  /* ============================================================
     CONFIGURACIÓN / CONTACTO
     ============================================================ */
  const settingsForm = el('settings-form');

  function fillSettingsForm() {
    if (!settingsForm) return;
    const s = JJStore.getSettings();
    settingsForm.whatsapp.value = s.whatsapp || '';
    settingsForm.email.value = s.email || '';
    settingsForm.instagram.value = s.instagram || '';
    settingsForm.address.value = s.address || '';
    const cf = el('cloudinary-form');
    if (cf) {
      cf.cloudinaryCloudName.value = s.cloudinaryCloudName || '';
      cf.cloudinaryUploadPreset.value = s.cloudinaryUploadPreset || '';
    }
  }

  settingsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    JJStore.saveSettings({
      whatsapp: settingsForm.whatsapp.value.trim(),
      email: settingsForm.email.value.trim(),
      instagram: settingsForm.instagram.value.trim(),
      address: settingsForm.address.value.trim(),
    });
    JJRender.renderSettings();
    showToast('Datos de contacto actualizados');
  });

  el('cloudinary-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    JJStore.saveSettings({
      cloudinaryCloudName: form.cloudinaryCloudName.value.trim(),
      cloudinaryUploadPreset: form.cloudinaryUploadPreset.value.trim(),
    });
    showToast('Configuración de Cloudinary guardada');
  });

  el('password-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const newPass = form.newPassword.value.trim();
    if (newPass.length < 4) {
      showToast('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    JJStore.saveSettings({ adminPassword: newPass });
    form.reset();
    showToast('Contraseña actualizada');
  });

  /* ================= ICONOS SVG REUTILIZABLES ================= */
  function editIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  }
  function trashIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
  }
  function carIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="3" y="13" width="18" height="5" rx="1.5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>`;
  }
  function userIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`;
  }

  /* ---- Si ya hay sesión activa (volvió a entrar a la página), no forzamos re-login ---- */
  // La sesión se guarda en sessionStorage y se limpia al cerrar la pestaña.
})();
