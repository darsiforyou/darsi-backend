const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

// 🔹 GOOGLE LOGIN
router.get(
  "api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;

    // Full payload for frontend
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        user_code: user.user_code,
        
    
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/google-success?token=${token}`);
  }
);

module.exports = router;
