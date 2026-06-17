/* ============================================================
   JJGARAGE — DATA STORE (Supabase)
   Reemplaza los valores de SUPABASE_URL y SUPABASE_ANON_KEY
   con los de tu proyecto en supabase.com → Settings → API.
   ============================================================ */

const JJStore = (() => {
  const SUPABASE_URL = 'https://ojqdphlljouhfnjcpnry.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcWRwaGxsam91aGZuamNwbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjIzNzEsImV4cCI6MjA5NzI5ODM3MX0.KEy_r83vokXp5xrc_pRtfR9v5tZaevV1ZozZtTcDel4';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /* ---- Mapeo cars: DB (snake_case) ↔ JS (camelCase) ---- */
  function dbCarToJs(row) {
    return {
      id: row.id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      price: row.price,
      currency: row.currency,
      mileage: row.mileage,
      transmission: row.transmission,
      fuel: row.fuel,
      description: row.description,
      tag: row.tag,
      colorArt: row.color_art,
      images: row.images || [],
    };
  }

  function jsCarToDb(car) {
    return {
      id: car.id || uid('car'),
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      currency: car.currency,
      mileage: car.mileage,
      transmission: car.transmission,
      fuel: car.fuel,
      description: car.description,
      tag: car.tag,
      color_art: car.colorArt,
      images: car.images || [],
    };
  }

  /* ---- Mapeo settings: DB ↔ JS ---- */
  function dbSettingsToJs(row) {
    return {
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      instagram: row.instagram || '',
      address: row.address || '',
      adminPassword: row.admin_password || '',
      cloudinaryCloudName: row.cloudinary_cloud_name || '',
      cloudinaryUploadPreset: row.cloudinary_upload_preset || '',
    };
  }

  function jsSettingsToDb(s) {
    return {
      id: 1,
      whatsapp: s.whatsapp,
      email: s.email,
      instagram: s.instagram,
      address: s.address,
      admin_password: s.adminPassword,
      cloudinary_cloud_name: s.cloudinaryCloudName,
      cloudinary_upload_preset: s.cloudinaryUploadPreset,
    };
  }

  /* ================= CARS ================= */
  async function getCars() {
    const { data, error } = await sb.from('cars').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getCars:', error); return []; }
    return data.map(dbCarToJs);
  }

  async function getCar(id) {
    const { data, error } = await sb.from('cars').select('*').eq('id', id).single();
    if (error) { console.error('getCar:', error); return null; }
    return dbCarToJs(data);
  }

  async function saveCar(car) {
    const row = jsCarToDb(car);
    const { data, error } = await sb.from('cars').upsert(row).select().single();
    if (error) { console.error('saveCar:', error); return null; }
    return dbCarToJs(data);
  }

  async function deleteCar(id) {
    const { error } = await sb.from('cars').delete().eq('id', id);
    if (error) console.error('deleteCar:', error);
  }

  /* ================= TESTIMONIALS ================= */
  async function getTestimonials() {
    const { data, error } = await sb.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getTestimonials:', error); return []; }
    return data;
  }

  async function saveTestimonial(t) {
    const row = { ...t };
    if (!row.id) row.id = uid('t');
    const { data, error } = await sb.from('testimonials').upsert(row).select().single();
    if (error) { console.error('saveTestimonial:', error); return null; }
    return data;
  }

  async function deleteTestimonial(id) {
    const { error } = await sb.from('testimonials').delete().eq('id', id);
    if (error) console.error('deleteTestimonial:', error);
  }

  /* ================= ABOUT ================= */
  async function getAbout() {
    const { data, error } = await sb.from('about').select('*').eq('id', 1).single();
    if (error) { console.error('getAbout:', error); return {}; }
    return data;
  }

  async function saveAbout(about) {
    const { data, error } = await sb.from('about').upsert({ id: 1, ...about }).select().single();
    if (error) { console.error('saveAbout:', error); return null; }
    return data;
  }

  /* ================= SETTINGS ================= */
  async function getSettings() {
    const { data, error } = await sb.from('settings').select('*').eq('id', 1).single();
    if (error) { console.error('getSettings:', error); return {}; }
    return dbSettingsToJs(data);
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const merged = { ...current, ...partial };
    const row = jsSettingsToDb(merged);
    const { data, error } = await sb.from('settings').upsert(row).select().single();
    if (error) { console.error('saveSettings:', error); return null; }
    return dbSettingsToJs(data);
  }

  /* ================= AUTH ================= */
  async function checkPassword(password) {
    const s = await getSettings();
    return password === s.adminPassword;
  }

  function setSession(isActive) {
    if (isActive) sessionStorage.setItem('jjgarage_admin_auth', '1');
    else sessionStorage.removeItem('jjgarage_admin_auth');
  }

  function hasSession() {
    return sessionStorage.getItem('jjgarage_admin_auth') === '1';
  }

  return {
    getCars, getCar, saveCar, deleteCar,
    getTestimonials, saveTestimonial, deleteTestimonial,
    getAbout, saveAbout,
    getSettings, saveSettings,
    checkPassword, setSession, hasSession,
  };
})();
