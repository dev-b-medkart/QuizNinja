// File: Backend/controllers/exam.controller.mjs
import Exam from "../models/exam.model.mjs";
import ExamAttempt from "../models/examAttempt.model.mjs";
import Question from "../models/question.model.mjs";
import redisClient from "../utils/redisClient";

// Create a new exam (teacher/HOD only)
export const createExam = async (req, res) => {
	try {
		const { title, description, subject, questions, duration } = req.body;
		const exam = new Exam({
			tenantId: req.user.tenantId,
			title,
			description,
			subject,
			created_by: req.user.id,
			questions, // expect an array of question IDs
			duration,
		});
		await exam.save();
		res.status(201).json(exam);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Get exam details with caching (for performance)
export const getExam = async (req, res) => {
	try {
		const examId = req.params.id;
		// Check if exam data is in cache
		const cachedExam = await redisClient.get(`exam:${examId}`);
		if (cachedExam) {
			return res.json(JSON.parse(cachedExam));
		}
		const exam = await Exam.findById(examId).populate("questions");
		if (!exam) return res.status(404).json({ error: "Exam not found" });

		// Cache exam data for 60 seconds
		await redisClient.setEx(`exam:${examId}`, 60, JSON.stringify(exam));
		res.json(exam);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Start an exam: create an exam attempt record
export const startExam = async (req, res) => {
	try {
		const examId = req.params.id;
		const exam = await Exam.findById(examId);
		if (!exam) return res.status(404).json({ error: "Exam not found" });

		const attempt = new ExamAttempt({
			tenantId: req.user.tenantId,
			exam: exam._id,
			student: req.user.id,
			timeStarted: new Date(),
		});
		await attempt.save();
		res.status(201).json({
			attemptId: attempt._id,
			message: "Exam started",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Save partial exam progress (allows students to save answers without final submission)
export const saveProgress = async (req, res) => {
	try {
		const { attemptId, answers } = req.body; // answers: array of { question, selectedOptionIds }
		const attempt = await ExamAttempt.findById(attemptId);
		if (!attempt)
			return res.status(404).json({ error: "Exam attempt not found" });
		if (attempt.student.toString() !== req.user.id)
			return res.status(403).json({ error: "Not authorized" });
		if (attempt.isSubmitted)
			return res.status(400).json({ error: "Exam already submitted" });

		// Update answers (this can be a merge with previous answers if you prefer)
		attempt.answers = answers;
		await attempt.save();
		res.json({ message: "Progress saved" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Final exam submission with auto-submit and score calculation
export const submitExam = async (req, res) => {
	try {
		const examId = req.params.id;
		const { attemptId, answers } = req.body;
		const exam = await Exam.findById(examId);
		if (!exam) return res.status(404).json({ error: "Exam not found" });

		const attempt = await ExamAttempt.findById(attemptId);
		if (!attempt)
			return res.status(404).json({ error: "Exam attempt not found" });
		if (attempt.student.toString() !== req.user.id)
			return res.status(403).json({ error: "Not authorized" });
		if (attempt.isSubmitted)
			return res.status(400).json({ error: "Exam already submitted" });

		// Finalize answers and mark end time
		attempt.answers = answers;
		attempt.timeEnded = new Date();

		// Check if the student exceeded the allotted exam duration
		const examDurationMs = exam.duration * 60 * 1000;
		const timeTaken = attempt.timeEnded - attempt.timeStarted;
		if (timeTaken > examDurationMs) {
			console.log("Time exceeded: auto-submitting exam attempt");
			// You can optionally adjust answers or notify the student here.
		}

		// Score calculation: iterate through answers and compare with correct options
		let score = 0;
		for (const answer of answers) {
			const question = await Question.findById(answer.question);
			if (
				question &&
				arraysEqual(
					answer.selectedOptionIds,
					question.correct_option_ids
				)
			) {
				score++;
			}
		}
		attempt.score = score;
		attempt.isSubmitted = true;
		await attempt.save();
		res.json({ score, timeTaken });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Helper function: compares two arrays (order-insensitive)
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	let sortedA = [...a].sort();
	let sortedB = [...b].sort();
	return sortedA.every((val, index) => val === sortedB[index]);
}
