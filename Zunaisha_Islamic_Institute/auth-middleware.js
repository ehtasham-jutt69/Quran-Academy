const crypto = require('crypto');
const offlineDb = require('./offline-db');

/**
 * Creates authentication middleware for securing admin routes.
 * Supports both MongoDB Admin collection and offlineDb cached admin authentication.
 */
module.exports = function createAuthMiddleware(mongoose, connectToDatabase) {
  const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    token: { type: String }
  });

  const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

  return async function requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Authentication token is required to access this resource.'
        });
      }

      const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!rawToken) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid token format.'
        });
      }

      // Check offline DB first if operating in offline mode
      if (offlineDb.isOffline()) {
        if (offlineDb.checkAdminToken(rawToken)) {
          req.isAdmin = true;
          return next();
        }
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or expired admin session token.'
        });
      }

      // Connect to MongoDB and verify token
      await connectToDatabase();
      const admin = await Admin.findOne({ token: rawToken });
      if (!admin) {
        // Fallback to offlineDb check in case server transitioned or local session was stored
        if (offlineDb.checkAdminToken(rawToken)) {
          req.isAdmin = true;
          return next();
        }
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or expired admin session token.'
        });
      }

      req.isAdmin = true;
      req.admin = admin;
      next();
    } catch (err) {
      console.error('requireAuth Error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error validating administrative credentials.'
      });
    }
  };
};
