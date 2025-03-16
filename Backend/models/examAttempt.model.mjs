// File: Backend/models/examAttempt.model.mjs
import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema(
	{
		tenantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tenant",
			required: true,
		},
		exam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Exam",
			required: true,
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		answers: [
			{
				question: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Question",
					required: true,
				},
				selectedOptionIds: { type: [Number], required: true },
			},
		],
		score: { type: Number, default: 0 },
		timeStarted: { type: Date, default: Date.now },
		timeEnded: { type: Date },
		isSubmitted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

export default mongoose.model("ExamAttempt", examAttemptSchema);
