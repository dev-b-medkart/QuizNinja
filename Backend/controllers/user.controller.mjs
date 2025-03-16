// controllers\user.controller.mjs
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import xlsx from "xlsx";
import User from "../models/user.model.mjs";
import Tenant from "../models/tenant.model.mjs";
import { REGEX, ROLES } from "../constants/constants.mjs";

// Configure Multer to store file in memory

const registerTeacher = async (req, res) => {
	const { name, email, phone_number, password } = req.body;
	if (!name || !email || !phone_number) {
		return res.status(400).json({ message: "Please fill in all fields" });
	}
	// Trim inputs
	const trimmedName = name.trim();
	const trimmedEmail = email.trim().toLowerCase();
	const trimmedPhoneNumber = phone_number.trim();
	const trimmedPassword = password.trim();

	const tenantId = req.user.tenantId;

	// Validate name
	if (!trimmedName) {
		return res.status(400).json({ message: "Name is required" });
	}

	// Validate email
	if (!trimmedEmail || !REGEX.EMAIL.test(trimmedEmail)) {
		return res.status(400).json({ error: "Invalid email format" });
	}
	// Validate phone number
	if (!phone_number || !REGEX.PHONE.test(phone_number)) {
		return res
			.status(400)
			.json({ error: "Invalid phone number. Must be 10 digits." });
	}
	// Hash the password before saving
	const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
	// Create a new Teacher
	const newTeacher = await User.create({
		name: trimmedName,
		email: trimmedEmail,
		phone_number: trimmedPhoneNumber,
		role: ROLES.TEACHER,
		tenantId: tenantId,
		password: hashedPassword,
	});

	// TODO: Add logic to mail the email address that he/she is registered at the tenant as a teacher
	// Return a success message
	res.status(201).json({ message: "Teacher created successfully" });
};

const registerMultipleTeachers = async (req, res) => {
	try {
		// Check if file is uploaded
		if (!req.file) {
			return res
				.status(400)
				.json({ error: "Please upload an Excel file" });
		}

		// Read the uploaded Excel file from buffer
		const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
		const sheet = workbook.Sheets[sheetName];

		// Convert Excel sheet to JSON
		const teachersData = xlsx.utils.sheet_to_json(sheet);

		// Check if file contains valid data
		if (!teachersData.length) {
			return res.status(400).json({ error: "The Excel file is empty" });
		}

		const tenantId = req.user.tenantId;
		const teachersToCreate = [];
		const passwordHashPromises = [];
		const skippedRows = []; // Store skipped rows and reasons

		// Sets to track duplicates (within Excel)
		const uniqueEntries = new Set();
		const allEmails = new Set();
		const allPhoneNumbers = new Set();

		// Extract emails & phone numbers from uploaded data
		for (const row of teachersData) {
			if (row.email) {
				const email = row.email.trim().toLowerCase();
				if (allEmails.has(email)) continue; // Skip duplicate email in Excel
				allEmails.add(email);
			}
			if (row.phone_number) {
				const phone = row.phone_number.toString().trim();
				if (allPhoneNumbers.has(phone)) continue; // Skip duplicate phone in Excel
				allPhoneNumbers.add(phone);
			}
		}

		// Fetch existing users (emails or phone numbers)
		const existingUsers = await User.find({
			tenantId,
			$or: [
				{ email: { $in: [...allEmails] } },
				{ phone_number: { $in: [...allPhoneNumbers] } },
			],
		});

		// Store existing users in a Map for faster lookups
		const existingUsersMap = new Map();
		for (const user of existingUsers) {
			existingUsersMap.set(
				user.email,
				"Email already exists in database"
			);
			existingUsersMap.set(
				user.phone_number,
				"Phone number already exists in database"
			);
		}

		// Process each row
		for (const row of teachersData) {
			let { name, email, phone_number, password } = row;

			// Trim inputs
			const trimmedName = name?.trim();
			const trimmedEmail = email?.trim().toLowerCase();
			const trimmedPhoneNumber = phone_number?.toString().trim();
			const trimmedPassword = password?.trim();

			// Validate required fields
			if (
				!trimmedName ||
				!trimmedEmail ||
				!trimmedPhoneNumber ||
				!trimmedPassword
			) {
				skippedRows.push({
					row: row,
					reason: "Missing required fields (name, email, phone_number, password)",
				});
				continue;
			}

			// Validate email format
			if (!REGEX.EMAIL.test(trimmedEmail)) {
				skippedRows.push({
					row: row,
					reason: `Invalid email format: ${trimmedEmail}`,
				});
				continue;
			}

			// Validate phone number format
			if (!REGEX.PHONE.test(trimmedPhoneNumber)) {
				skippedRows.push({
					row: row,
					reason: `Invalid phone number: ${trimmedPhoneNumber}`,
				});
				continue;
			}

			// Skip duplicates (both from database & repeated in Excel)
			const uniqueKey = `${trimmedEmail}|${trimmedPhoneNumber}`;
			if (existingUsersMap.has(trimmedEmail)) {
				skippedRows.push({
					row: row,
					reason: existingUsersMap.get(trimmedEmail),
				});
				continue;
			}
			if (existingUsersMap.has(trimmedPhoneNumber)) {
				skippedRows.push({
					row: row,
					reason: existingUsersMap.get(trimmedPhoneNumber),
				});
				continue;
			}
			if (uniqueEntries.has(uniqueKey)) {
				skippedRows.push({
					row: row,
					reason: "Duplicate entry in Excel",
				});
				continue;
			}
			uniqueEntries.add(uniqueKey);

			// Hash password (store the promise for parallel processing)
			const hashPromise = bcrypt.hash(trimmedPassword, 10);
			passwordHashPromises.push(hashPromise);

			// Prepare teacher object (password will be added later)
			teachersToCreate.push({
				name: trimmedName,
				email: trimmedEmail,
				phone_number: trimmedPhoneNumber,
				role: ROLES.TEACHER,
				tenantId: tenantId,
			});
		}

		// Hash all passwords in parallel and assign to respective teachers
		const hashedPasswords = await Promise.all(passwordHashPromises);
		teachersToCreate.forEach((teacher, index) => {
			teacher.password = hashedPasswords[index];
		});

		// Insert only unique teachers
		if (teachersToCreate.length > 0) {
			await User.insertMany(teachersToCreate);
		}

		// Send final response
		res.status(201).json({
			message: `${teachersToCreate.length} unique teachers registered successfully.`,
			skipped: skippedRows.length,
			skippedDetails: skippedRows,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
const registerStudent = async (req, res) => {
	const { name, email, phone_number, password } = req.body;
	if (!name || !email || !phone_number || !password) {
		return res.status(400).json({ message: "Please fill in all fields" });
	}

	// Trim inputs
	const trimmedName = name.trim();
	const trimmedEmail = email.trim().toLowerCase();
	const trimmedPhoneNumber = phone_number.trim();
	const trimmedPassword = password.trim();

	const tenantId = req.user.tenantId;

	// Validate email
	if (!REGEX.EMAIL.test(trimmedEmail)) {
		return res.status(400).json({ error: "Invalid email format" });
	}

	// Validate phone number
	if (!REGEX.PHONE.test(trimmedPhoneNumber)) {
		return res
			.status(400)
			.json({ error: "Invalid phone number. Must be 10 digits." });
	}

	// Hash the password before saving
	const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

	// Create a new Student
	const newStudent = await User.create({
		name: trimmedName,
		email: trimmedEmail,
		phone_number: trimmedPhoneNumber,
		role: ROLES.STUDENT,
		tenantId: tenantId,
		password: hashedPassword,
	});

	res.status(201).json({ message: "Student created successfully" });
};

const registerMultipleStudents = async (req, res) => {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ error: "Please upload an Excel file" });
		}

		const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const studentsData = xlsx.utils.sheet_to_json(sheet);

		if (!studentsData.length) {
			return res.status(400).json({ error: "The Excel file is empty" });
		}

		const tenantId = req.user.tenantId;
		const studentsToCreate = [];
		const passwordHashPromises = [];
		const skippedRows = [];
		const uniqueEntries = new Set();
		const allEmails = new Set();
		const allPhoneNumbers = new Set();

		for (const row of studentsData) {
			if (row.email) {
				const email = row.email.trim().toLowerCase();
				if (allEmails.has(email)) continue;
				allEmails.add(email);
			}
			if (row.phone_number) {
				const phone = row.phone_number.toString().trim();
				if (allPhoneNumbers.has(phone)) continue;
				allPhoneNumbers.add(phone);
			}
		}

		const existingUsers = await User.find({
			tenantId,
			$or: [
				{ email: { $in: [...allEmails] } },
				{ phone_number: { $in: [...allPhoneNumbers] } },
			],
		});

		const existingUsersMap = new Map();
		for (const user of existingUsers) {
			existingUsersMap.set(
				user.email,
				"Email already exists in database"
			);
			existingUsersMap.set(
				user.phone_number,
				"Phone number already exists in database"
			);
		}

		for (const row of studentsData) {
			let { name, email, phone_number, password } = row;

			const trimmedName = name?.trim();
			const trimmedEmail = email?.trim().toLowerCase();
			const trimmedPhoneNumber = phone_number?.toString().trim();
			const trimmedPassword = password?.trim();

			if (
				!trimmedName ||
				!trimmedEmail ||
				!trimmedPhoneNumber ||
				!trimmedPassword
			) {
				skippedRows.push({ row, reason: "Missing required fields" });
				continue;
			}

			if (!REGEX.EMAIL.test(trimmedEmail)) {
				skippedRows.push({ row, reason: "Invalid email format" });
				continue;
			}

			if (!REGEX.PHONE.test(trimmedPhoneNumber)) {
				skippedRows.push({ row, reason: "Invalid phone number" });
				continue;
			}

			const uniqueKey = `${trimmedEmail}|${trimmedPhoneNumber}`;
			if (
				existingUsersMap.has(trimmedEmail) ||
				existingUsersMap.has(trimmedPhoneNumber) ||
				uniqueEntries.has(uniqueKey)
			) {
				skippedRows.push({
					row,
					reason: "Duplicate entry or already exists",
				});
				continue;
			}
			uniqueEntries.add(uniqueKey);

			const hashPromise = bcrypt.hash(trimmedPassword, 10);
			passwordHashPromises.push(hashPromise);

			studentsToCreate.push({
				name: trimmedName,
				email: trimmedEmail,
				phone_number: trimmedPhoneNumber,
				role: ROLES.STUDENT,
				tenantId: tenantId,
			});
		}

		const hashedPasswords = await Promise.all(passwordHashPromises);
		studentsToCreate.forEach((student, index) => {
			student.password = hashedPasswords[index];
		});

		if (studentsToCreate.length > 0) {
			await User.insertMany(studentsToCreate);
		}

		res.status(201).json({
			message: `${studentsToCreate.length} unique students registered successfully.`,
			skipped: skippedRows.length,
			skippedDetails: skippedRows,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

const login = async (req, res) => {
	const { username, email, phone_number, password } = req.body;

	const trimmedUsername = username?.trim().toLowerCase();
	const trimmedEmail = email?.trim().toLowerCase();
	const trimmedPhoneNumber = phone_number?.trim();
	const trimmedPassword = password.trim();

	if (
		(!trimmedEmail && !trimmedPhoneNumber && !trimmedUsername) ||
		!trimmedPassword
	) {
		return res.status(400).json({
			error: "(Email or phone number or username) and password are required",
		});
	}
	console.log(req.body);
	console.log("\n\n\n-------------\n\n\n");

	try {
		const user = await User.findOne({
			$or: [
				{ email: trimmedEmail },
				{ phone_number: trimmedPhoneNumber },
			],
		});
		if (!user) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		console.log(user);

		const isMatch = await bcrypt.compare(trimmedPassword, user.password);
		if (!isMatch) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{
				userId: user._id,
				role: user.role,
				tenantId: user.tenantId,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		res.status(200).json({
			message: "Login successful",
			token: token,
			userId: user._id,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Login failed" });
	}
};

const getUserById = async (req, res) => {
	try {
		const { id } = req.params; // Extract user ID from request parameters
		const user = await User.findById(id).select("-password"); // Exclude password field

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
const getStudents = async (req, res) => {
	try {
		const tenantId = req.user.tenantId;
		const users = await User.find({
			role: ROLES.STUDENT,
			tenantId: tenantId,
		}).select("-password"); // Exclude password field

		if (!users) {
			return res
				.status(404)
				.json({ success: false, message: "Students not found" });
		}

		res.status(200).json({ success: true, users });
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
const getTeachers = async (req, res) => {
	try {
		const tenantId = req.user.tenantId;
		const users = await User.find({
			role: ROLES.TEACHER,
			tenantId: tenantId,
		}).select("-password"); // Exclude password field

		if (!users) {
			return res
				.status(404)
				.json({ success: false, message: "Teachers not found" });
		}

		res.status(200).json({ success: true, users });
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// const getUserByUsername = async (req, res) => {
// 	try {
// 		const { username } = req.params; // Extract user ID from request parameters
// 		const user = await User.findOne({ username: username }).select(
// 			"-password"
// 		); // Exclude password field

// 		if (!user) {
// 			return res
// 				.status(404)
// 				.json({ success: false, message: "User not found" });
// 		}

// 		res.status(200).json({ success: true, user });
// 	} catch (error) {
// 		console.error("Error fetching user:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: "Internal server error",
// 		});
// 	}
// };

const updateUser = async (req, res) => {
	try {
		const { id } = req.params; // Extract user ID from request parameters
		const updates = req.body; // Get update fields from request body
		console.log(updates);
		const tenantId = req.user.tenantId;

		if (updates.password) {
			return res.status(400).json({
				success: false,
				message: "Password cannot be updated here",
			});
		}

		// if (updates._id) {
		// 	return res.status(400).json({
		// 		success: false,
		// 		message: "_id cannot be updated as it is immutable",
		// 	});
		// }

		// Find user by ID and update
		const updatedUser = await User.findOneAndUpdate(
			{
				_id: id,
				tenantId: tenantId,
			},
			{ ...updates, updated_at: Date.now() }, // Set updated timestamp
			{ new: true, runValidators: true, select: "-password" } // Return updated document & exclude password
		);

		if (!updatedUser) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		res.status(200).json({
			success: true,
			message: "User updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const deleteUser = async (req, res) => {
	const { userId } = req.params;
	const tenantId = req.user.tenantId;

	try {
		// Check if user exists
		const user = await User.findOneAndDelete({
			_id: userId,
			tenantId: tenantId,
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.role == ROLES.HOD) {
			const tenant = await Tenant.findById(tenantId);
			tenant.owner = null;
			await tenant.save();
		}

		res.status(200).json({ message: "User deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error deleting user" });
	}
};

export {
	registerTeacher,
	registerMultipleTeachers,
	registerStudent,
	registerMultipleStudents,
	login,
	getUserById,
	updateUser,
	deleteUser,
	getStudents,
	getTeachers,
};
