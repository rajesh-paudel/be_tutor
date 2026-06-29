import jwt from "jsonwebtoken";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";

export const verifyTokenAndRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      await dbConnect();

      // 1. Extract token from Authorization Header (Format: Bearer <token>)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Access denied. No token provided." });
      }

      const token = authHeader.split(" ")[1];

      // 2. Verify token identity
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch user details and ensure account status is valid
      const user = await User.findById(decoded.userId).select("-passwordHash");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User account no longer exists." });
      }

      if (user.isSuspended) {
        return res
          .status(403)
          .json({
            success: false,
            error: "This account has been suspended by an administrator.",
          });
      }

      // 4. Role Authorization Check
      // If allowedRoles array is empty, any valid authenticated user can pass
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({
            success: false,
            error: "Unauthorized. Forbidden resource access.",
          });
      }

      // Attach user details to request object for downstream controllers
      req.user = user;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Invalid or expired authentication token.",
        });
    }
  };
};
