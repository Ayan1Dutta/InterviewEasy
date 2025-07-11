import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
  
  const token = jwt.sign({ _id: user._id, email: user.email, username: user.username } , process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("CodeSyncToken", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });
  return token;
};