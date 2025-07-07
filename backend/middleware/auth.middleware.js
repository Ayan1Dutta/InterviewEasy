import jwt, { decode } from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.CodeSyncToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log("Error in protectRoute middleware: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
