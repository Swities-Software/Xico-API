const { validationResult } = require("express-validator");
const businessesService = require("../services/businesses");

/**
 * GET /businesses
 * Query params: lat*, lng*, radius, type, subtype, price_range, limit, offset
 */
async function getBusinesses(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, radius, type, subtype, price_range, limit, offset } = req.query;

    try {
        const businesses = await businessesService.getBusinesses({
            lat, lng, radius, type, subtype, price_range, limit, offset,
        });

        return res.status(200).json({
            data: businesses,
            meta: {
                count: businesses.length,
                limit: limit ?? 20,
                offset: offset ?? 0,
            },
        });
    } catch (error) {
        console.error("[getBusinesses]", error.message);
        return res.status(500).json({ error: "Error interno al buscar negocios" });
    }
}

/**
 * GET /businesses/:id
 * Retorna negocio completo con place (horarios, fotos, dirección) y guías que lo visitan.
 */
async function getBusinessById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const business = await businessesService.getBusinessById(req.params.id);

        if (!business) {
            return res.status(404).json({ error: "Negocio no encontrado" });
        }

        return res.status(200).json({ data: business });
    } catch (error) {
        console.error("[getBusinessById]", error.message);
        return res.status(500).json({ error: "Error interno al obtener el negocio" });
    }
}

module.exports = { getBusinesses, getBusinessById };