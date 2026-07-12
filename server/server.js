// DEPENDENCIES
require("dotenv").config();
 
const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");

const routes = require("./routes");

const swaggerUi = require("swagger-ui-express");
const openApiDocument = require("./docs/openapi");

const app = express();
const PORT = process.env.PORT || 3000;
 
// MIDDLEWARE
app.use(
  cors({
    origin: process.env.FRONTEND_REDIRECT_URL || "http://localhost:3000",
    credentials: true,
  })
);
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
app.use(passport.initialize());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument)
);
 
 
// ROUTES
app.use(routes);
 
app.get("/", (req, res) => {
  res.send("The Per Scholian API is running.");
});
 
// PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
