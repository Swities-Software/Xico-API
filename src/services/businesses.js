const { supabaseAdmin } = require("../config/supabase");

const DEFAULT_RADIUS = 5000;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * GET /businesses
 * Busca negocios cercanos usando PostGIS sobre places.lat / places.lng
 * Llama a la función RPC search_businesses_by_location definida en Supabase.
 */
async function getBusinesses({ lat, lng, radius, type, subtype, price_range, limit, offset }) {
    const { data, error } = await supabaseAdmin.rpc("search_businesses_by_location", {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radius ?? DEFAULT_RADIUS,
        p_type: type ?? null,
        p_subtype: subtype ?? null,
        p_price_range: price_range ?? null,
        p_limit: limit ?? DEFAULT_LIMIT,
        p_offset: offset ?? DEFAULT_OFFSET,
    });

    if (error) throw new Error(`Error al buscar negocios: ${error.message}`);

    return data ?? [];
}

/**
 * GET /businesses/:id
 * Retorna el negocio completo con:
 *  - Datos del place: horarios, fotos, dirección, teléfono (places)
 *  - Datos del negocio: descripción, historia, logo, photos[], price_range (businesses)
 *  - Guías que tienen este place en algún tour activo (tour_places -> tours -> guides)
 * Retorna null si no existe o está inactivo -> el controller responde 404.
 */
async function getBusinessById(id) {
    // 1. Negocio con su place y datos del usuario dueño
    const { data: business, error: businessError } = await supabaseAdmin
        .from("businesses")
        .select(`
      id,
      description,
      history,
      logo_url,
      photos,
      price_range,
      active,
      claimed_at,
      rating_avg,
      user_id,
      place_id,
      users (
        name
      ),
      places (
        id,
        name,
        type,
        subtype,
        lat,
        lng,
        address,
        phone,
        schedule,
        photo_url,
        rating_avg
      )
    `)
        .eq("id", id)
        .eq("active", true)
        .single();

    if (businessError) {
        if (businessError.code === "PGRST116") return null;
        throw new Error(`Error al obtener negocio: ${businessError.message}`);
    }

    // 2. Guías que tienen este place en algún tour activo
    const { data: tourPlaces, error: toursError } = await supabaseAdmin
        .from("tour_places")
        .select(`
      tours (
        id,
        name,
        available,
        guide_id,
        guides (
          id,
          rating_avg,
          languages,
          users (
            name,
            photo_url
          )
        )
      )
    `)
        .eq("place_id", business.place_id);

    if (toursError) throw new Error(`Error al obtener guías del negocio: ${toursError.message}`);

    // 3. Filtrar tours activos y deduplicar guías (un guía puede tener varios tours con el mismo place)
    const guidesMap = new Map();
    (tourPlaces ?? []).forEach(({ tours: tour }) => {
        if (!tour?.available) return;
        const guide = tour.guides;
        if (!guide || guidesMap.has(guide.id)) return;

        guidesMap.set(guide.id, {
            id: guide.id,
            name: guide.users?.name ?? null,
            photo_url: guide.users?.photo_url ?? null,
            rating_avg: guide.rating_avg,
            languages: guide.languages,
            tour_id: tour.id,
            tour_name: tour.name,
        });
    });

    // 4. Limpiar shape final — separar users del resto
    const { users, ...businessFields } = business;

    return {
        ...businessFields,
        owner_name: users?.name ?? null,
        guides: Array.from(guidesMap.values()),
    };
}

module.exports = { getBusinesses, getBusinessById };