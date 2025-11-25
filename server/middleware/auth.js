const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];

    if (!header) {
        return res.status(401).json({ message: "Missing Authorization header." });
    }

    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ message: "Invalid Authorization format." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next(); // Continue to the real route
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
};