import express from "express";
import {
	deleteUser,
	getUserById,
	login,
	updateUser,
	registerTeacher,
	registerMultipleTeachers,
	registerStudent,
	registerMultipleStudents,
	getStudents,
	getTeachers,
} from "../controllers/user.controller.mjs";
import { authenticate, authorize } from "../middlewares/auth.mjs";
import {
	uploadStudentsExcel,
	uploadTeachersExcel,
} from "../middlewares/uploads.mjs"; // Middleware for handling file uploads
import { ROLES } from "../constants/constants.mjs";

const router = express.Router();

/* 🚀 AUTHENTICATION ROUTES */
router.post("/auth/login", login);

/* 👤 USER MANAGEMENT ROUTES */
router.get("/users/:id", authenticate, authorize([ROLES.ADMIN]), getUserById);
router.get("/users/students", authenticate, getStudents);
router.get("/users/teachers", authenticate, getTeachers);
router.put("/users/:id", authenticate, authorize([ROLES.HOD]), updateUser);
router.delete(
	"/users/:userId",
	authenticate,
	authorize([ROLES.HOD]),
	deleteUser
);

/* 🏫 TEACHER REGISTRATION ROUTES */
router.post(
	"/teachers/register",
	authenticate,
	authorize([ROLES.HOD]),
	registerTeacher
);
router.post(
	"/teachers/bulk-register",
	authenticate,
	authorize([ROLES.HOD]),
	uploadTeachersExcel, // Excel file upload middleware
	registerMultipleTeachers
);
// Register a single student
router.post("/students/register", authenticate, registerStudent);

// Register multiple students via Excel file upload
router.post(
	"/students/bulk-register",
	authenticate,
	authorize([ROLES.HOD, ROLES.TEACHER]),
	uploadStudentsExcel,
	registerMultipleStudents
);

// Export the router
export default router;
