const supabase = require("../config/supabase");

const DEFAULT_RADIUS = 5000;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * GET /guides
 * Busca guías cercanos usando PostGIS sobre tours.start_lat / tours.start_lng
 * Llama a la función RPC search_guides_by_location definida en Supabase.
 */
async function getGuides({ lat, lng, radius, language, min_rating, max_rate, limit, offset }) {
    const radiusMeters = radius ?? DEFAULT_RADIUS;
    const delta = radiusMeters / 111000;

    let query = supabase
        .from('guides')
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
            ),
            tours (
                start_lat,
                start_lng
            )
        `)
        .eq('available', true);

    if (language) query = query.contains('languages', [language]);
    if (min_rating) query = query.gte('rating_avg', parseFloat(min_rating));
    if (max_rate) query = query.lte('hourly_rate', parseFloat(max_rate));

    const { data, error } = await query.limit(limit ?? DEFAULT_LIMIT);

    if (error) throw new Error(`Error al buscar guías: ${error.message}`);

    // Calcular distancia basada en el tour más cercano
    const results = (data ?? [])
        .map(guide => {
            const { tours, users, ...guideFields } = guide;

            // Encontrar el tour más cercano al punto buscado
            let minDistance = Infinity;
            (tours ?? []).forEach(tour => {
                if (!tour.start_lat || !tour.start_lng) return;
                const dLat = tour.start_lat - parseFloat(lat);
                const dLng = tour.start_lng - parseFloat(lng);
                const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
                if (dist < minDistance) minDistance = dist;
            });

            return {
                ...guideFields,
                name: users?.name ?? null,
                photo_url: users?.photo_url ?? null,
                distance_m: minDistance === Infinity ? null : Math.round(minDistance),
            };
        })
        .filter(g => g.distance_m !== null && g.distance_m <= radiusMeters)
        .sort((a, b) => a.distance_m - b.distance_m);

    return results;
}

/**
 * GET /guides/:id
 * Retorna el perfil completo del guía + sus tours activos con sus places.
 * Retorna null si no existe
 */
async function getGuideById(id) {
    // 1. Perfil del guía con datos públicos del usuario
    const { data: guide, error: guideError } = await supabase
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
    const { data: tours, error: toursError } = await supabase
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