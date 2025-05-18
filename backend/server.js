require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fs = require("fs");

const connectDB = require("./config/db");
const { PORT } = require("./config/constants");
const routes = require("./routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: true,
  credentials: true,
  exposedHeaders: ['set-cookie']
}));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Database connection
connectDB();

// Routes
app.use("/", routes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});