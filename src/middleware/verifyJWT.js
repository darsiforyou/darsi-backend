// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization || req.headers.Authorization;
//   if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) return res.sendStatus(403); //invalid token
//     req.userId = decoded.UserInfo.id;
//     req.user = decoded.UserInfo.email;
//     req.roles = decoded.UserInfo.role;
//     next();
//   });
// };
//  module.exports = verifyJWT;

// const jwt = require("jsonwebtoken");

// function verifyToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: "Invalid token" });
//     req.user = user; // attach decoded user to request
//     next();
//   });
// }

// module.exports = verifyToken;


const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // invalid token

    // Support both formats: { UserInfo: {...} } or flat { id, email, role }
    if (decoded.UserInfo) {
      req.userId = decoded.UserInfo.id;
      req.user = decoded.UserInfo.email;
      req.roles = decoded.UserInfo.role;
    } else {
      req.userId = decoded.id;
      req.user = decoded.email;
      req.roles = decoded.role;
    }

    next();
  });
};

module.exports = verifyJWT;
