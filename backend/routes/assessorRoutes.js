const express = require("express");
const router = express.Router();
const assessorController = require("../controllers/assessorController");
const { assessorAuthMiddleware } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", assessorController.register);
router.post("/login", assessorController.login);

// Protected routes
router.get("/auth-status", assessorController.authStatus);
router.post("/logout", assessorController.logout);
router.get("/applicants", assessorAuthMiddleware, assessorController.getAssignedApplicants);
router.get("/applicants/:id", assessorAuthMiddleware, assessorController.getApplicantDetails);
router.get(
  "/applicant-documents/:applicantId",
  assessorAuthMiddleware,
  assessorController.getApplicantDocuments
);
router.get("/evaluations", assessorAuthMiddleware, assessorController.getEvaluations);
router.post("/evaluations", assessorAuthMiddleware, assessorController.saveEvaluation);
router.post(
  "/evaluations/finalize",
  assessorAuthMiddleware,
  assessorController.finalizeEvaluation
);

module.exports = router;