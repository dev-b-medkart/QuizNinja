// Backend\middlewares\auth.mjs
import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs"; // Import User model

export const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        
        // Fetch full user details from DB to get tenantId
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        req.user = {
            id: user._id,
            role: user.role,
            tenantId: user.tenantId, // Attach tenant ID
        };

        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token", err });
    }
};

export const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: `Forbidden. You do not have access. Only ${roles} have access` });
    }
    next();
};
