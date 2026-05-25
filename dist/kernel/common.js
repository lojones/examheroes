"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.authenticate = authenticate;
exports.getUser = getUser;
exports.requireRole = requireRole;
exports.parseDate = parseDate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signToken(config, payload, expiresIn) {
    return jsonwebtoken_1.default.sign(payload, config.jwtSecret, { expiresIn });
}
function verifyToken(config, token) {
    return jsonwebtoken_1.default.verify(token, config.jwtSecret);
}
function authenticate(config) {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        try {
            req.user = verifyToken(config, header.slice(7));
            next();
        }
        catch {
            res.status(401).json({ error: 'Invalid token' });
        }
    };
}
function getUser(store, userId) {
    if (!userId) {
        return undefined;
    }
    return store.users.get(userId);
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
}
function parseDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid date');
    }
    return parsed;
}
//# sourceMappingURL=common.js.map