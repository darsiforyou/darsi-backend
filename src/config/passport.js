const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

// Random string generator
function generateRandomString(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Dynamic firstname/lastname
function generateDynamicName(email) {
  const localPart = email.split("@")[0];
  const match = localPart.match(/([a-zA-Z]+)(\d*)/);

  const firstname = match?.[1]
    ? match[1].charAt(0).toUpperCase() + match[1].slice(1)
    : "User";

  const lastname = match?.[2] || Math.floor(Math.random() * 9000 + 1000);

  return { firstname, lastname };
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false);

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            firstname: profile.name?.givenName || "User",
            lastname: profile.name?.familyName || "Google",
            email,
            googleId: profile.id,
            authProvider: "google",
            verified: true,
            status: true,
            role: "Customer",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
