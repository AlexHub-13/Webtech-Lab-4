const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    console.log(req.headers);
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
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated." });
        }

        if (role !== req.user.role) {
            return res.status(403).json({ message: "Forbidden: insufficient role." });
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};