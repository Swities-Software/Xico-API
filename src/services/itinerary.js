const supabase = require("../config/supabase");

/**
 * POST /itinerary/add
 * Agrega un place al itinerario del turista.
 */
async function addToItinerary({ tourist_id, place_id }) {
  // Verificar que el place existe
  const { data: place, error: placeError } = await supabase
    .from("places")
    .select("id")
    .eq("id", place_id)
    .single();

  if (placeError || !place) throw { status: 404, message: "Place no encontrado" };

  // Verificar que no está ya en el itinerario
  const { data: existing } = await supabase
    .from("itinerary_items")
    .select("id")
    .eq("tourist_id", tourist_id)
    .eq("place_id", place_id)
    .single();

  if (existing) throw { status: 409, message: "El lugar ya está en tu itinerario" };

  // Insertar
  const { data, error } = await supabase
    .from("itinerary_items")
    .insert({ tourist_id, place_id })
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al agregar al itinerario: ${error.message}` };

  return data;
}

/**
 * DELETE /itinerary/:placeId
 * Quita un place del itinerario del turista.
 */
async function removeFromItinerary({ tourist_id, place_id }) {
  const { data: existing } = await supabase
    .from("itinerary_items")
    .select("id")
    .eq("tourist_id", tourist_id)
    .eq("place_id", place_id)
    .single();

  if (!existing) throw { status: 404, message: "El lugar no está en tu itinerario" };

  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("tourist_id", tourist_id)
    .eq("place_id", place_id);

  if (error) throw { status: 500, message: `Error al quitar del itinerario: ${error.message}` };

  return { message: "Lugar eliminado del itinerario" };
}

/**
 * GET /itinerary
 * Retorna el itinerario completo del turista con datos del place y negocio aliado.
 * Si el place está reclamado por un negocio, incluye sus datos (foto, descripción,
 * price_range, rating_avg, fotos).
 */
async function getItinerary(tourist_id) {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select(`
      id,
      added_at,
      booking_id,
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
    `)
    .eq("tourist_id", tourist_id)
    .order("added_at", { ascending: true });

  if (error) throw { status: 500, message: `Error al obtener itinerario: ${error.message}` };

  return (data ?? []).map(({ places, ...item }) => ({
    ...item,
    place: places ? {
      ...places,
      business: null, // temporal hasta resolver FK con Mariana
    } : null,
  }));
}

/**
 * POST /itinerary/assign-guide
 * Asocia un guía al itinerario del turista y crea un booking.
 * Valida disponibilidad del guía y conflictos de horario.
 */
async function assignGuide({ tourist_id, guide_id, tour_id, date, time_slot }) {
  // 1. Verificar que el tour existe y pertenece al guía
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, guide_id, price, available, available_schedules")
    .eq("id", tour_id)
    .eq("guide_id", guide_id)
    .eq("available", true)
    .single();

  if (tourError || !tour) throw { status: 404, message: "Tour no encontrado o inactivo" };

  // 2. Verificar que el time_slot existe en el tour
  if (!tour.available_schedules?.includes(time_slot)) {
    throw { status: 400, message: `El horario ${time_slot} no está disponible para este tour` };
  }

  // 3. Verificar conflicto de horario
  const { data: conflict } = await supabase
    .from("bookings")
    .select("id")
    .eq("guide_id", guide_id)
    .eq("date", date)
    .eq("time_slot", time_slot)
    .in("status", ["pending", "accepted"])
    .limit(1);

  if (conflict && conflict.length > 0) {
    throw { status: 409, message: "Guía no disponible en ese horario" };
  }

  // 4. Crear el booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      tourist_id,
      guide_id,
      tour_id,
      date,
      time_slot,
      status: "pending",
      total_price: tour.price,
    })
    .select()
    .single();

  if (bookingError) throw { status: 500, message: `Error al crear booking: ${bookingError.message}` };

  // 5. Actualizar itinerary_items con el booking_id
  const { error: updateError } = await supabase
    .from("itinerary_items")
    .update({ booking_id: booking.id })
    .eq("tourist_id", tourist_id);

  if (updateError) throw { status: 500, message: `Error al actualizar itinerario: ${updateError.message}` };

  return { booking, message: "Guía asignado correctamente" };
}

module.exports = { addToItinerary, removeFromItinerary, getItinerary, assignGuide };