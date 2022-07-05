const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 4000;
const dotenv = require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const boolParser = require("express-query-boolean");

// custom middleware logger
app.use(logger);

connectDB();

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors());

// built-in middleware to handle urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(boolParser());
// built-in middleware for json

//middleware for cookies
app.use(cookieParser());

//serve static files
app.use("/api-docs", swaggerUi.serve);
app.use("/", express.static(path.join(__dirname, "/public")));

// routes
app.use("/", require("./routes/root"));
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use("/users", require("./routes/api/user"));
app.use("/products", require("./routes/api/products"));
app.use("/categories", require("./routes/api/categories"));
app.use("/packages", require("./routes/api/referralPackages"));
app.use("/dashboard-setting", require("./routes/api/dashboard"));
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
