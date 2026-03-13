const { supabaseAdmin } = require("../config/supabase");

/**
 * Limpia el shape de tour_places → places → businesses
 * para exponer una lista plana de "places" con business data embebida si existe.
 */
function formatPlaces(tourPlaces = []) {
  return tourPlaces.map(({ places: place }) => {
    if (!place) return null;

    const { businesses: business, ...placeFields } = place;

    return {
      // Campos de places (requeridos por el enunciado: foto, nombre, tipo, calificación)
      id:         placeFields.id,
      name:       placeFields.name,
      type:       placeFields.type,
      subtype:    placeFields.subtype,
      photo_url:  placeFields.photo_url,
      rating_avg: placeFields.rating_avg,
      address:    placeFields.address,
      lat:        placeFields.lat,
      lng:        placeFields.lng,
      // Datos del negocio aliado (null si el place no está reclamado por ningún negocio)
      business: business
        ? {
            id:          business.id,
            logo_url:    business.logo_url,
            description: business.description,
            price_range: business.price_range,
            rating_avg:  business.rating_avg,
          }
        : null,
    };
  }).filter(Boolean); // quitar nulls si algún place fue eliminado en cascada
}

/**
 * GET /tours/:guideId
 * Retorna todos los tours activos del guía con sus places y negocios aliados.
 * Solo retorna tours con available = true (vista pública).
 */
async function getToursByGuideId(guideId) {
  const { data: tours, error } = await supabaseAdmin
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
          lng,
          businesses (
            id,
            logo_url,
            description,
            price_range,
            rating_avg
          )
        )
      )
    `)
    .eq("guide_id", guideId)
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error al obtener tours del guía: ${error.message}`);

  // Formatear cada tour: aplanar tour_places → places con business embebido
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
  const { data: tour, error } = await supabaseAdmin
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
          lng,
          businesses (
            id,
            logo_url,
            description,
            history,
            price_range,
            rating_avg,
            photos
          )
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

  // Aplanar datos del guía
  const { users, ...guideFields } = guideData ?? {};

  return {
    ...tourFields,
    // available_schedules ya viene como TEXT[] de PostgreSQL → array JS
    available_schedules: tourFields.available_schedules ?? [],
    guide: guideData
      ? {
          ...guideFields,
          name:      users?.name      ?? null,
          photo_url: users?.photo_url ?? null,
        }
      : null,
    places: formatPlaces(tour_places),
  };
}

module.exports = { getToursByGuideId, getTourDetail };