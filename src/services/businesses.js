const supabase = require('../config/supabase');

const DEFAULT_RADIUS = 5000;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * GET /businesses
 * Busca negocios cercanos usando PostGIS sobre places.lat / places.lng
 * Llama a la función RPC search_businesses_by_location definida en Supabase.
 */
async function getBusinesses({ lat, lng, radius, type, subtype, price_range, limit, offset }) {
    // Convertir radio a grados aproximados (1 grado ≈ 111km)
    const radiusMeters = radius ?? DEFAULT_RADIUS;
    const delta = radiusMeters / 111000;

    let query = supabase
        .from('businesses')
        .select(`
            id,
            description,
            logo_url,
            price_range,
            rating_avg,
            place_id,
            places!businesses_place_id_fkey (
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
        .eq('active', true)
        .gte('places.lat', parseFloat(lat) - delta)
        .lte('places.lat', parseFloat(lat) + delta)
        .gte('places.lng', parseFloat(lng) - delta)
        .lte('places.lng', parseFloat(lng) + delta);

    if (type) query = query.eq('places.type', type);
    if (subtype) query = query.eq('places.subtype', subtype);
    if (price_range) query = query.eq('price_range', price_range);

    const { data, error } = await query
        .limit(limit ?? DEFAULT_LIMIT)
        .range(offset ?? DEFAULT_OFFSET, (offset ?? DEFAULT_OFFSET) + (limit ?? DEFAULT_LIMIT) - 1);

    if (error) throw new Error(`Error al buscar negocios: ${error.message}`);

    // Calcular distancia real y ordenar
    const results = (data ?? [])
        .filter(b => b.places) // filtrar los que no tienen place
        .map(b => {
            const dLat = b.places.lat - parseFloat(lat);
            const dLng = b.places.lng - parseFloat(lng);
            const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
            return { ...b, distance_m: Math.round(distance) };
        })
        .filter(b => b.distance_m <= radiusMeters)
        .sort((a, b) => a.distance_m - b.distance_m);

    return results;
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
    const { data: business, error: businessError } = await supabase
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
      users!businesses_user_id_fkey (
        name
      ),
      places!businesses_place_id_fkey (
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
    const { data: tourPlaces, error: toursError } = await supabase
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
          users!guides_user_id_fkey (
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