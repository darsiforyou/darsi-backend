const mongoose = require("mongoose");



const bcrypt = require("bcrypt");
const User = require("../models/user"); 
const crypto = require("crypto"); // Node.js ka built-in module


const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost/Darsi";
    console.log("URI " + uri);
    await mongoose
      .connect(uri, {
        useNewUrlParser: true,
        // useCreateIndex: true,
        useUnifiedTopology: true,
        // useFindAndModify: false,
      })
      .catch((error) => console.log(error));
    const connection = mongoose.connection;
    console.log("MONGODB CONNECTED SUCCESSFULLY!");
  } catch (error) {
    console.log(error);
    return error;
  }
};



// async function createAdmin() {
//   try {
//     // Check agar admin already exist karta hai
//     // const existingAdmin = await User.findOne({ email: "admin-darsi@darsi.com" });
//     // if (existingAdmin) {
//     //   console.log("Admin already exists!");
//     //   return process.exit();
//     // }

//     // Password hash
//     const hashedPassword = bcrypt.hashSync("athar123", bcrypt.genSaltSync(10));

//     // Random refresh token generate
//     const refreshToken = crypto.randomBytes(64).toString("hex"); // 128 chars random string

//     const adminUser = new User({
//       firstname: "athar",
//       lastname: "hussain",
//       email: "athar1234@gmail.com",
//       password: hashedPassword,
//       role: "Admin",
//       status: true,
//       verified: true,
//       user_code: "athardarsi.com-5568-9806",
//       refreshToken: null, // ✅ add refresh token here
//     });

//     await adminUser.save();
//     console.log("✅ Admin user created successfully with refresh token!");
//     process.exit();
//   } catch (err) {
//     console.error("Error creating admin:", err);
//     process.exit(1);
//   }
// }

// createAdmin();






module.exports = connectDB;
