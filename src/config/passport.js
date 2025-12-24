const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const jwt = require("jsonwebtoken");

function generateRandomString(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}



function generateDynamicName(email) {
  // Example: "rahat528018@gmail.com" → firstName: Rahat, lastName: 528018
  const localPart = email.split("@")[0]; // @ ke pehle ka part
  const match = localPart.match(/([a-zA-Z]+)(\d*)/); // letters aur numbers alag kare

  const firstname = match?.[1]
    ? match[1].charAt(0).toUpperCase() + match[1].slice(1)
    : "User";

  const lastname = match?.[2] || Math.floor(Math.random() * 9000 + 1000); // number ya random 4 digit

  return { firstname, lastname };
}


passport.use(
  new GoogleStrategy(
    {
      clientID:'830093259348-cbrkof0msmlojh8264i8fs7f7evp1no8.apps.googleusercontent.com',
      clientSecret:'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',
      callbackURL:"/google/callback",
      
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();

        // Dynamic firstname & lastname if missing
        let firstname = profile.name?.givenName || generateDynamicName(email).firstname;
        let lastname = profile.name?.familyName || generateDynamicName(email).lastname;

        let user = await User.findOne({ email });

        if (user) {
          // Update missing info if any
          let updated = false;
          if (!user.firstname) { user.firstname = firstname; updated = true; }
          if (!user.lastname) { user.lastname = lastname; updated = true; }
          if (!user.googleId) { user.googleId = profile.id; user.authProvider = "google"; updated = true; }
          if (!user.user_code) { user.user_code = `${firstname}-${generateRandomString(4)}-${generateRandomString(4)}`; updated = true; }
          if (updated) await user.save();
          return done(null, user);
        }

        // New user
        const newUser = await User.create({
          firstname,
          lastname,
          email,
          googleId: profile.id,
          authProvider: "google",
          verified: true,
          status: true,
         
          role: "Customer",
          password: null,
          user_code: `${firstname}-${generateRandomString(4)}-${generateRandomString(4)}`,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
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
