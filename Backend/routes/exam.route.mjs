// File: Backend/routes/exam.routes.mjs
import express from "express";
import {
	createExam,
	getExam,
	startExam,
	saveProgress,
	submitExam,
} from "../controllers/exam.controller.mjs";
import { authenticate, authorize } from "../middlewares/auth.mjs";
import { ROLES } from "../constants/constants.mjs";

const router = express.Router();

// Create exam (only teacher/HOD)
router.post(
	"/exams",
	authenticate,
	authorize([ROLES.HOD, ROLES.TEACHER]),
	createExam
);

// Get exam details (accessible by authenticated users)
router.get("/exams/:id", authenticate, getExam);

// Student starts an exam (creates an exam attempt)
router.post(
	"/exams/:id/start",
	authenticate,
	authorize([ROLES.STUDENT]),
	startExam
);

// Save partial progress during an exam
router.put(
	"/exams/:id/save-progress",
	authenticate,
	authorize([ROLES.STUDENT]),
	saveProgress
);

// Final exam submission (with auto-submit and score calculation)
router.post(
	"/exams/:id/submit",
	authenticate,
	authorize([ROLES.STUDENT]),
	submitExam
);

export default router;
