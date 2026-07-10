const jwt = require("jsonwebtoken");
 
const secret = process.env.JWT_SECRET;
const expiration = process.env.JWT_EXPIRATION || "2h";
 
function authMiddleware(req, res, next) {
  let token = req.body?.token || req.query?.token || req.headers.authorization;
 
  if (req.headers.authorization) {
    token = token.split(" ").pop().trim();
  }
 
  if (!token) {
    return res.status(401).json({ message: "You must be logged in." });
  }
 
  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    req.user = data;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
 
  next();
}
 
function signToken({ id, username, email }) {
  const payload = { id, username, email };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}
 
module.exports = {
  authMiddleware,
  signToken,
};
