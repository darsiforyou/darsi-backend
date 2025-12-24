const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
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
};

// ---------------- GOOGLE LOGIN ---------------- //

// Default login (uses last signed-in account)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Different account (forces Google to show account selection)
router.get(
  "/google/select",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

// ---------------- GOOGLE CALLBACK ---------------- //
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user);

    // Send token and user back to popup via postMessage
    res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify({ token, user })}, window.location.origin);
        window.close();
      </script>
    `);
  }
);

module.exports = router;
