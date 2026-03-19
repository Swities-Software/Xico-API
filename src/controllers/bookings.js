const { validationResult } = require("express-validator");
const bookingsService = require("../services/bookings");

async function createBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    // TODO: reemplazar con req.user cuando auth esté listo
    const tourist_id = req.body.tourist_id;
    const { tour_id, date, time_slot, notes } = req.body;

    const booking = await bookingsService.createBooking({ tourist_id, tour_id, date, time_slot, notes });
    return res.status(201).json({ data: booking });
  } catch (error) {
    console.error("[createBooking]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function getBookingsByTourist(req, res) {
  try {
    // TODO: reemplazar con req.user.tourist_id cuando auth esté listo
    const tourist_id = req.query.tourist_id;
    const bookings = await bookingsService.getBookingsByTourist(tourist_id);
    return res.status(200).json({ data: bookings, meta: { count: bookings.length } });
  } catch (error) {
    console.error("[getBookingsByTourist]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function getBookingsByGuide(req, res) {
  try {
    // TODO: reemplazar con req.user.guide_id cuando auth esté listo
    const guide_id = req.query.guide_id;
    const bookings = await bookingsService.getBookingsByGuide(guide_id);
    return res.status(200).json({ data: bookings, meta: { count: bookings.length } });
  } catch (error) {
    console.error("[getBookingsByGuide]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function acceptBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id; // TODO: req.user.guide_id
    const booking = await bookingsService.acceptBooking(req.params.id, guide_id);
    return res.status(200).json({ data: booking });
  } catch (error) {
    console.error("[acceptBooking]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function rejectBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id; // TODO: req.user.guide_id
    const booking = await bookingsService.rejectBooking(req.params.id, guide_id);
    return res.status(200).json({ data: booking });
  } catch (error) {
    console.error("[rejectBooking]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function cancelBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const tourist_id = req.query.tourist_id; // TODO: req.user.tourist_id
    const booking = await bookingsService.cancelBooking(req.params.id, tourist_id);
    return res.status(200).json({ data: booking });
  } catch (error) {
    console.error("[cancelBooking]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

module.exports = { createBooking, getBookingsByTourist, getBookingsByGuide, acceptBooking, rejectBooking, cancelBooking };