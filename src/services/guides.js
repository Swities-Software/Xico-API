const { supabaseAdmin } = require("../config/supabase"); // verificar nombre de como lo importa

const DEFAULT_RADIUS = 5000;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * GET /guides
 * Busca guías cercanos usando PostGIS sobre tours.start_lat / tours.start_lng
 * Llama a la función RPC search_guides_by_location definida en Supabase.
 */
async function getGuides({ lat, lng, radius, language, min_rating, max_rate, limit, offset }) {
    const { data, error } = await supabaseAdmin.rpc("search_guides_by_location", {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radius ?? DEFAULT_RADIUS,
        p_language: language ?? null,
        p_min_rating: min_rating ?? null,
        p_max_rate: max_rate ?? null,
        p_limit: limit ?? DEFAULT_LIMIT,
        p_offset: offset ?? DEFAULT_OFFSET,
    });

    if (error) throw new Error(`Error al buscar guías: ${error.message}`);

    return data ?? [];
}

/**
 * GET /guides/:id
 * Retorna el perfil completo del guía + sus tours activos con sus places.
 * Retorna null si no existe
 */
async function getGuideById(id) {
    // 1. Perfil del guía con datos públicos del usuario
    const { data: guide, error: guideError } = await supabaseAdmin
        .from("guides")
        .select(`
      id,
      bio,
      languages,
      hourly_rate,
      certification,
      rating_avg,
      reviews_count,
      available,
      user_id,
      users (
        name,
        photo_url
      )
    `)
        .eq("id", id)
        .single();

    if (guideError) {
        // PGRST116 = fila no encontrada
        if (guideError.code === "PGRST116") return null;
        throw new Error(`Error al obtener guía: ${guideError.message}`);
    }

    // 2. Tours activos del guía con sus places
    const { data: tours, error: toursError } = await supabaseAdmin
        .from("tours")
        .select(`
      id,
      name,
      description,
      duration_min,
      price,
      start_point,
      start_lat,
      start_lng,
      available_schedules,
      rating_avg,
      reviews_count,
      created_at,
      tour_places (
        places (
          id,
          name,
          type,
          subtype,
          photo_url,
          rating_avg,
          address
        )
      )
    `)
        .eq("guide_id", id)
        .eq("available", true);

    if (toursError) throw new Error(`Error al obtener tours: ${toursError.message}`);

    // 3. Limpiar shape — aplanar users y tour_places
    const { users, ...guideFields } = guide;

    return {
        ...guideFields,
        name: users?.name ?? null,
        photo_url: users?.photo_url ?? null,
        tours: (tours ?? []).map(({ tour_places, ...tour }) => ({
            ...tour,
            places: (tour_places ?? []).map((tp) => tp.places),
        })),
    };
}

module.exports = { getGuides, getGuideById };