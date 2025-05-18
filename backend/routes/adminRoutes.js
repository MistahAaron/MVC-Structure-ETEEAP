const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminAuthMiddleware } = require("../middlewares/authMiddleware");

// Public routes
router.post("/login", adminController.login);

// Protected routes
router.get("/auth-status", adminController.authStatus);
router.post("/logout", adminController.logout);
router.get("/applicants", adminAuthMiddleware, adminController.getApplicants);
router.get("/applicants/:id", adminAuthMiddleware, adminController.getApplicantDetails);
router.post(
  "/applicants/:id/approve",
  adminAuthMiddleware,
  adminController.approveApplicant
);
router.post(
  "/applicants/:id/reject",
  adminAuthMiddleware,
  adminController.rejectApplicant
);
router.post(
  "/applicants/:id/assign-assessor",
  adminAuthMiddleware,
  adminController.assignAssessor
);
router.get(
  "/available-assessors",
  adminAuthMiddleware,
  adminController.getAvailableAssessors
);
router.get(
  "/dashboard-stats",
  adminAuthMiddleware,
  adminController.getDashboardStats
);
router.get("/assessor/all", adminAuthMiddleware, adminController.getAllAssessors);
router.get("/assessor/:id", adminAuthMiddleware, adminController.getAssessor);
router.put("/assessor/:id", adminAuthMiddleware, adminController.updateAssessor);
router.delete("/assessor/:id", adminAuthMiddleware, adminController.deleteAssessor);
router.get("/evaluations", adminAuthMiddleware, adminController.getEvaluations);
router.get("/evaluations/:id", adminAuthMiddleware, adminController.getEvaluationDetails);

module.exports = router;