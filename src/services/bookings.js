const supabase = require("../config/supabase");

/**
 * POST /bookings
 * Crea un booking validando disponibilidad del guía.
 */
async function createBooking({ tourist_id, tour_id, date, time_slot, notes }) {
  // Obtener el tour con datos del guía
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, guide_id, price, available, available_schedules")
    .eq("id", tour_id)
    .eq("available", true)
    .single();

  if (tourError || !tour) throw { status: 404, message: "Tour no encontrado o inactivo" };

  // Verificar que el time_slot existe en el tour
  if (!tour.available_schedules?.includes(time_slot)) {
    throw { status: 400, message: `El horario ${time_slot} no está disponible para este tour` };
  }

  // Verificar que el guía está disponible
  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id, available")
    .eq("id", tour.guide_id)
    .single();

  if (guideError || !guide) throw { status: 404, message: "Guía no encontrado" };
  if (!guide.available) throw { status: 409, message: "El guía no está disponible" };

  // Verificar que no hay conflicto de horario ese día
  const { data: conflict } = await supabase
    .from("bookings")
    .select("id")
    .eq("guide_id", tour.guide_id)
    .eq("date", date)
    .eq("time_slot", time_slot)
    .in("status", ["pending", "accepted"])
    .limit(1);

  if (conflict && conflict.length > 0) {
    throw { status: 409, message: "Guía no disponible en ese horario" };
  }

  // Verificar máximo 3 bookings activos simultáneos por guía
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("guide_id", tour.guide_id)
    .in("status", ["pending", "accepted"]);

  if (activeBookings && activeBookings.length >= 3) {
    throw { status: 409, message: "El guía tiene el máximo de reservas activas" };
  }

  // Crear el booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      tourist_id,
      guide_id: tour.guide_id,
      tour_id,
      date,
      time_slot,
      status: "pending",
      total_price: tour.price,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (bookingError) throw { status: 500, message: `Error al crear booking: ${bookingError.message}` };

  return booking;
}

/**
 * GET /bookings/tourist
 * Retorna todos los bookings del turista autenticado.
 */
async function getBookingsByTourist(tourist_id) {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      date,
      time_slot,
      status,
      total_price,
      notes,
      created_at,
      tours (
        id,
        name,
        duration_min,
        start_point
      ),
      guides (
        id,
        rating_avg,
        users (
          name,
          photo_url
        )
      )
    `)
    .eq("tourist_id", tourist_id)
    .order("date", { ascending: false });

  if (error) throw { status: 500, message: `Error al obtener bookings: ${error.message}` };

  return (data ?? []).map(({ guides, ...booking }) => ({
    ...booking,
    guide: guides ? {
      id: guides.id,
      rating_avg: guides.rating_avg,
      name: guides.users?.name ?? null,
      photo_url: guides.users?.photo_url ?? null,
    } : null,
  }));
}

/**
 * GET /bookings/guide
 * Retorna todos los bookings del guía autenticado.
 */
async function getBookingsByGuide(guide_id) {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      date,
      time_slot,
      status,
      total_price,
      notes,
      created_at,
      tours (
        id,
        name,
        duration_min
      ),
      tourists (
        id,
        users (
          name,
          photo_url
        )
      )
    `)
    .eq("guide_id", guide_id)
    .order("date", { ascending: false });

  if (error) throw { status: 500, message: `Error al obtener bookings: ${error.message}` };

  return (data ?? []).map(({ tourists, ...booking }) => ({
    ...booking,
    tourist: tourists ? {
      id: tourists.id,
      name: tourists.users?.name ?? null,
      photo_url: tourists.users?.photo_url ?? null,
    } : null,
  }));
}

/**
 * PATCH /bookings/:id/accept
 */
async function acceptBooking(bookingId, guide_id) {
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("id, guide_id, status")
    .eq("id", bookingId)
    .single();

  if (findError || !booking) throw { status: 404, message: "Booking no encontrado" };
  if (booking.guide_id !== guide_id) throw { status: 403, message: "No tienes permisos para aceptar este booking" };
  if (booking.status !== "pending") throw { status: 400, message: "Solo se pueden aceptar bookings en estado pending" };

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "accepted" })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al aceptar booking: ${error.message}` };
  return data;
}

/**
 * PATCH /bookings/:id/reject
 */
async function rejectBooking(bookingId, guide_id) {
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("id, guide_id, status")
    .eq("id", bookingId)
    .single();

  if (findError || !booking) throw { status: 404, message: "Booking no encontrado" };
  if (booking.guide_id !== guide_id) throw { status: 403, message: "No tienes permisos para rechazar este booking" };
  if (booking.status !== "pending") throw { status: 400, message: "Solo se pueden rechazar bookings en estado pending" };

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al rechazar booking: ${error.message}` };
  return data;
}

/**
 * PATCH /bookings/:id/cancel
 */
async function cancelBooking(bookingId, tourist_id) {
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("id, tourist_id, status, date")
    .eq("id", bookingId)
    .single();

  if (findError || !booking) throw { status: 404, message: "Booking no encontrado" };
  if (booking.tourist_id !== tourist_id) throw { status: 403, message: "No tienes permisos para cancelar este booking" };
  if (!["pending", "accepted"].includes(booking.status)) {
    throw { status: 400, message: "Solo se pueden cancelar bookings en estado pending o accepted" };
  }

  // Verificar 24h de anticipación
  const bookingDate = new Date(booking.date);
  const now = new Date();
  const diffHours = (bookingDate - now) / (1000 * 60 * 60);
  if (diffHours < 24) {
    throw { status: 400, message: "No se puede cancelar con menos de 24 horas de anticipación" };
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw { status: 500, message: `Error al cancelar booking: ${error.message}` };
  return data;
}

module.exports = {
  createBooking,
  getBookingsByTourist,
  getBookingsByGuide,
  acceptBooking,
  rejectBooking,
  cancelBooking,
};