require("dotenv").config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_here",
  PORT: process.env.PORT || 3000,
};