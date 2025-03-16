import express from "express";
import {
	createSubject,
	getAllSubjects,
	getSubjectBySubjectCode,
	updateSubject,
	deleteSubject,
} from "../controllers/subject.controller.mjs";
import { authenticate, authorize } from "../middlewares/auth.mjs";
import { ROLES } from "../constants/constants.mjs";

const router = express.Router();

router.post(
	"/subjects",
	authenticate,
	authorize([ROLES.HOD, ROLES.TEACHER]),
	createSubject
);
router.get("/subjects", authenticate, getAllSubjects);
router.get("/subjects/code/:code", authenticate, getSubjectBySubjectCode);
router.put(
	"/subjects/code/:code",
	authenticate,
	authorize([ROLES.HOD, ROLES.TEACHER]),
	updateSubject
);
router.delete(
	"/subjects/code/:code",
	authenticate,
	authorize([ROLES.HOD, ROLES.TEACHER]),
	deleteSubject
);

export default router;
