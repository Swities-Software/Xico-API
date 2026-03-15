const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function generateTokens(userId, role) {
  const access = jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refresh = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { access, refresh };
}

/**
 * Crea usuario en Supabase Auth, inserta en tabla users con role,
 * y crea el perfil extendido según el role (tourists o guides).
 * Para role = 'business' el perfil se crea después al reclamar un place.
 * Requiere service_role key para bypasear RLS en users (INSERT solo via service_role).
 */
async function register({ name, email, password, role = 'tourist' }) {
  // 1. Crear en Supabase Auth via admin API (service_role, sin sesión de cliente)
  //    email_confirm: true omite el email de confirmación
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('No se pudo crear el usuario');

  const userId = authData.user.id;

  // 2. Hashear contraseña e insertar en tabla users (requiere service_role key por RLS)
  const password_hash = await bcrypt.hash(password, 10);

  const { error: userError } = await supabase
    .from('users')
    .insert({ id: userId, name, email, role, password_hash });

  if (userError) throw new Error(`Error al guardar usuario: ${userError.message}`);

  // 3. Crear perfil extendido según role
  //    - tourist → INSERT en tourists (user_id)
  //    - guide   → INSERT en guides   (user_id)
  //    - business → NO se crea aquí; el perfil se crea al reclamar un place
  if (role === 'tourist') {
    const { error } = await supabase.from('tourists').insert({ user_id: userId });
    if (error) throw new Error(`Error al crear perfil turista: ${error.message}`);
  } else if (role === 'guide') {
    const { error } = await supabase.from('guides').insert({ user_id: userId });
    if (error) throw new Error(`Error al crear perfil guía: ${error.message}`);
  }

  return generateTokens(userId, role);
}

/**
 * Verifica credenciales contra Supabase Auth,
 * obtiene el role desde la tabla users y retorna los tokens.
 */
async function login({ email, password }) {
  // 1. Verificar credenciales
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw new Error('Credenciales inválidas');

  const userId = authData.user.id;

  // 2. Obtener role desde la tabla users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError || !user) throw new Error('Usuario no encontrado');

  return generateTokens(userId, user.role);
}

/**
 * Retorna el perfil público del usuario.
 */
async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, photo_url')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
}

module.exports = { register, login, getProfile };
