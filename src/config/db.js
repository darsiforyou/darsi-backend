const mongoose = require("mongoose");

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

module.exports = connectDB;
