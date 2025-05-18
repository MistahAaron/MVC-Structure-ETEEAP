const express = require("express");
const router = express.Router();
const applicantController = require("../controllers/applicantController");
const { applicantAuthMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/fileUpload");

// Public routes
router.post("/register", applicantController.register);
router.post("/login", applicantController.login);

// Protected routes
router.post(
  "/update-personal-info",
  applicantAuthMiddleware,
  upload.array("files"),
  applicantController.updatePersonalInfo
);
router.get("/profile/:userId", applicantAuthMiddleware, applicantController.getProfile);
router.get("/auth-status", applicantController.authStatus);
router.post("/logout", applicantController.logout);

module.exports = router;