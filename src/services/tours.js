const supabase = require("../config/supabase");

/**
 * Limpia el shape de tour_places → places → businesses
 * para exponer una lista plana de "places" con business data embebida si existe.
 */
function formatPlaces(tourPlaces = []) {
  return tourPlaces.map(({ places: place }) => {
    if (!place) return null;
    return {
      id: place.id,
      name: place.name,
      type: place.type,
      subtype: place.subtype,
      photo_url: place.photo_url,
      rating_avg: place.rating_avg,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      business: null, // temporal hasta resolver la FK con Mariana
    };
  }).filter(Boolean);
}

/**
 * GET /tours/:guideId
 * Retorna todos los tours activos del guía con sus places y negocios aliados.
 * Solo retorna tours con available = true (vista pública).
 */
async function getToursByGuideId(guideId) {
  const { data: tours, error } = await supabase
    .from("tours")
    .select(`
      id,
      guide_id,
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
      available,
      created_at,
      tour_places (
        places (
          id,
          name,
          type,
          subtype,
          photo_url,
          rating_avg,
          address,
          lat,
          lng
        )
      )
    `)
    .eq("guide_id", guideId)
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error al obtener tours del guía: ${error.message}`);

  return (tours ?? []).map(({ tour_places, ...tour }) => ({
    ...tour,
    places: formatPlaces(tour_places),
  }));
}

/**
 * GET /tours/:id/detail
 * Retorna el tour completo con:
 *  - Todos los campos del tour incluyendo available_schedules como array
 *  - Lista de places populada (foto, nombre, tipo, calificación, dirección)
 *  - Datos del negocio aliado embebidos en cada place si el place está reclamado
 */
async function getTourDetail(id) {
  const { data: tour, error } = await supabase
    .from("tours")
    .select(`
      id,
      guide_id,
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
      available,
      created_at,
      guides (
        id,
        bio,
        languages,
        hourly_rate,
        rating_avg,
        reviews_count,
        users (
          name,
          photo_url
        )
      ),
      tour_places (
        places (
          id,
          name,
          type,
          subtype,
          photo_url,
          rating_avg,
          address,
          phone,
          schedule,
          lat,
          lng
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error al obtener detalle del tour: ${error.message}`);
  }

  const { tour_places, guides: guideData, ...tourFields } = tour;
  const { users, ...guideFields } = guideData ?? {};

  return {
    ...tourFields,
    available_schedules: tourFields.available_schedules ?? [],
    guide: guideData
      ? {
          ...guideFields,
          name: users?.name ?? null,
          photo_url: users?.photo_url ?? null,
        }
      : null,
    places: formatPlaces(tour_places),
  };
}

module.exports = { getToursByGuideId, getTourDetail };