import Subject from "../models/subject.model.mjs";

// Create a new subject
const createSubject = async (req, res) => {
	try {
		const { subject_name, subject_code, subject_description } = req.body;
		const tenantId = req.user.tenantId;

		if (!subject_name || !subject_name.trim()) {
			return res.status(400).json({ error: "Subject name is required." });
		}

		if (!subject_code || !subject_code.trim()) {
			return res.status(400).json({ error: "Subject code is required." });
		}

		// Check if subject_code already exists
		const existingSubject = await Subject.findOne({ subject_code });
		if (existingSubject) {
			return res.status(400).json({
				error: `Subject with code '${subject_code}' already exists.`,
			});
		}

		const newSubject = new Subject({
			subject_name: subject_name,
			subject_code: subject_code,
			subject_description: subject_description,
			tenantId: tenantId,
		});

		await newSubject.save();
		res.status(201).json({
			message: "Subject created successfully.",
			newSubject,
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			error: "An unexpected error occurred. Please try again later.",
		});
	}
};

// Get all subjects
const getAllSubjects = async (req, res) => {
	try {
		const tenantId = req.user.tenantId;
		const subjects = await Subject.find({ tenantId: tenantId });
		res.json(subjects);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get a subject by ID
const getSubjectBySubjectCode = async (req, res) => {
	try {
		console.log(req.params.code);
		const tenantId = req.user.tenantId;

		const subject = await Subject.findOne({
			subject_code: req.params.code,
			tenantId: tenantId,
		});

		if (!subject)
			return res.status(404).json({ error: "Subject not found" });

		res.json(subject);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Update a subject
const updateSubject = async (req, res) => {
	try {
		const { subject_name, subject_code, subject_description } = req.body;
		const tenantId = req.user.tenantId;

		if (!subject_name || !subject_name.trim()) {
			return res.status(400).json({ error: "Subject name is required." });
		}
		const updatedSubject = await Subject.findOneAndUpdate(
			{
				subject_code: req.params.code,
				tenantId: tenantId,
			},
			{ subject_name, subject_code, subject_description },
			{ new: true }
		);

		if (!updatedSubject)
			return res.status(404).json({ error: "Subject not found" });

		res.json({ message: "Subject updated successfully", updatedSubject });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Delete a subject
const deleteSubject = async (req, res) => {
	try {
		const tenantId = req.user.tenantId;
		const subject = await Subject.findOneAndDelete({
			subject_code: req.params.code,
			tenantId: tenantId,
		});

		if (!subject)
			return res.status(404).json({ error: "Subject not found" });

		res.json({ message: "Subject deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export {
	createSubject,
	deleteSubject,
	getSubjectBySubjectCode,
	updateSubject,
	getAllSubjects,
};
