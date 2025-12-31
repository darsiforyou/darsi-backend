const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "https://www.darsi.pk/login",
  }),
  (req, res) => {
    try {
      // JWT generate (example)
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ FRONTEND REDIRECT
      res.redirect(
        `https://www.darsi.pk/userInfo?token=${token}`
      );
    } catch (error) {
      res.redirect("https://www.darsi.pk/login");
    }
  }
);


module.exports = router;




