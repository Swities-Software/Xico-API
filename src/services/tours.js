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
        users!guides_user_id_fkey (
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

/**
 * POST /tours
 * Crea un tour y asocia places en tour_places.
 */
async function createTour({ guide_id, name, description, duration_min, price, start_point, start_lat, start_lng, available_schedules, place_ids = [] }) {
  // 1. Crear el tour
  const { data: tour, error } = await supabase
    .from("tours")
    .insert({
      guide_id,
      name,
      description,
      duration_min,
      price,
      start_point,
      start_lat,
      start_lng,
      available_schedules,
      available: true,
    })
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al crear tour: ${error.message}` };

  // 2. Asociar places si vienen
  if (place_ids.length > 0) {
    const tourPlaces = place_ids.map(place_id => ({ tour_id: tour.id, place_id }));
    const { error: placesError } = await supabase.from("tour_places").insert(tourPlaces);
    if (placesError) throw { status: 500, message: `Error al asociar places: ${placesError.message}` };
  }

  return tour;
}

/**
 * PUT /tours/:id
 * Actualiza el tour y reemplaza sus places.
 */
async function updateTour(id, guide_id, { name, description, duration_min, price, start_point, start_lat, start_lng, available_schedules, place_ids }) {
  // 1. Verificar que el tour pertenece al guía
  const { data: existing, error: findError } = await supabase
    .from("tours")
    .select("id, guide_id")
    .eq("id", id)
    .single();

  if (findError || !existing) throw { status: 404, message: "Tour no encontrado" };
  if (existing.guide_id !== guide_id) throw { status: 403, message: "No tienes permisos para editar este tour" };

  // 2. Actualizar campos del tour
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (duration_min !== undefined) updates.duration_min = duration_min;
  if (price !== undefined) updates.price = price;
  if (start_point !== undefined) updates.start_point = start_point;
  if (start_lat !== undefined) updates.start_lat = start_lat;
  if (start_lng !== undefined) updates.start_lng = start_lng;
  if (available_schedules !== undefined) updates.available_schedules = available_schedules;

  const { data: tour, error } = await supabase
    .from("tours")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al actualizar tour: ${error.message}` };

  // 3. Reemplazar places si vienen
  if (place_ids !== undefined) {
    await supabase.from("tour_places").delete().eq("tour_id", id);
    if (place_ids.length > 0) {
      const tourPlaces = place_ids.map(place_id => ({ tour_id: id, place_id }));
      const { error: placesError } = await supabase.from("tour_places").insert(tourPlaces);
      if (placesError) throw { status: 500, message: `Error al actualizar places: ${placesError.message}` };
    }
  }

  return tour;
}

/**
 * DELETE /tours/:id — soft delete
 */
async function deleteTour(id, guide_id) {
  const { data: existing, error: findError } = await supabase
    .from("tours")
    .select("id, guide_id")
    .eq("id", id)
    .single();

  if (findError || !existing) throw { status: 404, message: "Tour no encontrado" };
  if (existing.guide_id !== guide_id) throw { status: 403, message: "No tienes permisos para eliminar este tour" };

  const { error } = await supabase
    .from("tours")
    .update({ available: false })
    .eq("id", id);

  if (error) throw { status: 500, message: `Error al desactivar tour: ${error.message}` };
  return { message: "Tour desactivado correctamente" };
}

module.exports = { getToursByGuideId, getTourDetail, createTour, updateTour, deleteTour };