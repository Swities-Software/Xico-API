const { Router } = require("express");
const bookingsController = require("../controllers/bookings");
const { createBookingValidator, bookingIdValidator } = require("../validators/bookings");
// const { authMiddleware } = require("../middlewares/auth");

const router = Router();

router.post("/", createBookingValidator, bookingsController.createBooking);
router.get("/tourist", bookingsController.getBookingsByTourist);
router.get("/guide", bookingsController.getBookingsByGuide);
router.patch("/:id/accept", bookingIdValidator, bookingsController.acceptBooking);
router.patch("/:id/reject", bookingIdValidator, bookingsController.rejectBooking);
router.patch("/:id/cancel", bookingIdValidator, bookingsController.cancelBooking);

module.exports = router;