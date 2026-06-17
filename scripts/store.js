/* ============================================================
   JJGARAGE — DATA STORE
   ------------------------------------------------------------
   Esta capa simula una base de datos usando localStorage.
   Está diseñada para que el día de mañana se pueda reemplazar
   por llamadas a Supabase/Firebase SIN tocar el resto de la app:
   solo hay que reimplementar los métodos de JJStore manteniendo
   la misma firma (mismos nombres de función, mismos shapes de
   datos entrando y saliendo).

   Cómo migrar a Supabase (resumen):
   1. Crear tablas: cars, testimonials, about_content (1 fila), settings.
   2. Reemplazar cada método (get, save, delete) por un await a
      supabase.from('tabla') con select(), insert(), update() o delete().
   3. Mantener el resto del código (UI) intacto: todo consume
      estos métodos, nunca accede a localStorage directamente.
   ============================================================ */

const JJStore = (() => {
  const KEYS = {
    cars: 'jjgarage_cars',
    testimonials: 'jjgarage_testimonials',
    about: 'jjgarage_about',
    settings: 'jjgarage_settings',
    auth: 'jjgarage_admin_auth',
  };

  /* ---- Datos semilla (ficticios) — se cargan solo la primera vez ---- */
  const SEED_CARS = [
    {
      id: 'car-1',
      brand: 'Porsche',
      model: '911 Carrera S',
      year: 2022,
      price: 145000,
      currency: 'USD',
      mileage: '8.200 km',
      transmission: 'Automática PDK',
      fuel: 'Nafta',
      description: 'Un ícono atemporal. Motor bóxer de 6 cilindros, suspensión adaptativa y un interior artesanal que redefine lo que significa manejar un deportivo todos los días.',
      tag: 'Recién ingresado',
      colorArt: 'linear-gradient(135deg, #3a2f1c, #0f0f0d)',
      images: [],
    },
    {
      id: 'car-2',
      brand: 'Mercedes-Benz',
      model: 'S 500 4MATIC',
      year: 2021,
      price: 98500,
      currency: 'USD',
      mileage: '21.400 km',
      transmission: 'Automática 9G-Tronic',
      fuel: 'Nafta',
      description: 'La referencia mundial en confort ejecutivo. Equipamiento full, asientos con masaje y un sistema de sonido Burmester que transforma cada viaje en una experiencia.',
      tag: 'Único dueño',
      colorArt: 'linear-gradient(135deg, #1f1f24, #0a0a0c)',
      images: [],
    },
    {
      id: 'car-3',
      brand: 'BMW',
      model: 'M340i xDrive',
      year: 2023,
      price: 76900,
      currency: 'USD',
      mileage: '5.100 km',
      transmission: 'Automática 8 vel.',
      fuel: 'Nafta',
      description: 'Deportividad alemana sin compromisos. Tracción integral, motor de 6 en línea y un equilibrio perfecto entre uso diario y pasión por la conducción.',
      tag: 'Como nuevo',
      colorArt: 'linear-gradient(135deg, #2a2a2e, #0c0c0e)',
      images: [],
    },
  ];

  const SEED_TESTIMONIALS = [
    {
      id: 't-1',
      name: 'Martín Ferreyra',
      detail: 'Compró un Porsche 911',
      rating: 5,
      quote: 'El proceso fue impecable de principio a fin. Me explicaron cada detalle del auto, la documentación estuvo lista antes de lo prometido y la atención fue cercana sin perder la formalidad.',
    },
    {
      id: 't-2',
      name: 'Lucía Santangelo',
      detail: 'Vendió su Audi A4',
      rating: 5,
      quote: 'Tasaron mi auto en el momento y me pagaron al instante. Después de cotizar en varios lugares, JJGarage fue por lejos la opción más seria y transparente.',
    },
    {
      id: 't-3',
      name: 'Gonzalo Iturri',
      detail: 'Compró un Mercedes-Benz Clase S',
      rating: 5,
      quote: 'Se nota que entienden de autos premium. La curaduría de la flota es excelente y el seguimiento post-venta superó lo que esperaba de una concesionaria boutique.',
    },
  ];

  const SEED_ABOUT = {
    title: 'Más de una década curando los autos que merecen una segunda historia',
    paragraph1: 'JJGarage nació de una convicción simple: comprar o vender un auto premium no debería sentirse como una transacción, sino como un proceso a la altura del vehículo mismo.',
    paragraph2: 'Trabajamos con una flota reducida y cuidadosamente seleccionada, porque preferimos la calidad sobre el volumen. Cada auto que pasa por nuestras manos es inspeccionado, documentado y preparado con el mismo estándar que esperaríamos para el nuestro.',
    paragraph3: 'Nuestro equipo combina experiencia técnica con un trato cercano: te acompañamos en cada paso, desde la tasación inicial hasta la entrega de la documentación final, con total transparencia.',
  };

  const SEED_SETTINGS = {
    whatsapp: '+54 9 11 5555-0123',
    email: 'contacto@jjgarage.com.ar',
    instagram: '@jjgarage.ar',
    address: 'Av. Figueroa Alcorta 1234, CABA',
    adminPassword: 'jjgarage2024',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('JJStore: error leyendo', key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('JJStore: error guardando', key, e);
      return false;
    }
  }

  function init() {
    if (!localStorage.getItem(KEYS.cars)) writeJSON(KEYS.cars, SEED_CARS);
    if (!localStorage.getItem(KEYS.testimonials)) writeJSON(KEYS.testimonials, SEED_TESTIMONIALS);
    if (!localStorage.getItem(KEYS.about)) writeJSON(KEYS.about, SEED_ABOUT);
    if (!localStorage.getItem(KEYS.settings)) writeJSON(KEYS.settings, SEED_SETTINGS);
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /* ================= CARS ================= */
  function getCars() {
    return readJSON(KEYS.cars, []);
  }

  function getCar(id) {
    return getCars().find((c) => c.id === id) || null;
  }

  function saveCar(car) {
    const cars = getCars();
    if (car.id) {
      const idx = cars.findIndex((c) => c.id === car.id);
      if (idx >= 0) {
        cars[idx] = { ...cars[idx], ...car };
      } else {
        cars.push(car);
      }
    } else {
      car.id = uid('car');
      cars.unshift(car);
    }
    writeJSON(KEYS.cars, cars);
    return car;
  }

  function deleteCar(id) {
    const cars = getCars().filter((c) => c.id !== id);
    writeJSON(KEYS.cars, cars);
  }

  /* ================= TESTIMONIALS ================= */
  function getTestimonials() {
    return readJSON(KEYS.testimonials, []);
  }

  function saveTestimonial(t) {
    const items = getTestimonials();
    if (t.id) {
      const idx = items.findIndex((i) => i.id === t.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...t };
      else items.push(t);
    } else {
      t.id = uid('t');
      items.unshift(t);
    }
    writeJSON(KEYS.testimonials, items);
    return t;
  }

  function deleteTestimonial(id) {
    const items = getTestimonials().filter((i) => i.id !== id);
    writeJSON(KEYS.testimonials, items);
  }

  /* ================= ABOUT ================= */
  function getAbout() {
    return readJSON(KEYS.about, SEED_ABOUT);
  }

  function saveAbout(data) {
    writeJSON(KEYS.about, data);
    return data;
  }

  /* ================= SETTINGS ================= */
  function getSettings() {
    return readJSON(KEYS.settings, SEED_SETTINGS);
  }

  function saveSettings(data) {
    const current = getSettings();
    const merged = { ...current, ...data };
    writeJSON(KEYS.settings, merged);
    return merged;
  }

  /* ================= AUTH ================= */
  function checkPassword(password) {
    const settings = getSettings();
    return password === settings.adminPassword;
  }

  function setSession(isActive) {
    if (isActive) sessionStorage.setItem(KEYS.auth, '1');
    else sessionStorage.removeItem(KEYS.auth);
  }

  function hasSession() {
    return sessionStorage.getItem(KEYS.auth) === '1';
  }

  /* ================= UTILS ================= */
  function resetAllData() {
    writeJSON(KEYS.cars, SEED_CARS);
    writeJSON(KEYS.testimonials, SEED_TESTIMONIALS);
    writeJSON(KEYS.about, SEED_ABOUT);
    writeJSON(KEYS.settings, SEED_SETTINGS);
  }

  return {
    init,
    getCars, getCar, saveCar, deleteCar,
    getTestimonials, saveTestimonial, deleteTestimonial,
    getAbout, saveAbout,
    getSettings, saveSettings,
    checkPassword, setSession, hasSession,
    resetAllData,
  };
})();

JJStore.init();
