// File: Backend/models/exam.model.mjs
import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
	{
		tenantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tenant",
			required: true,
		},
		title: { type: String, required: true },
		description: { type: String, default: "" },
		subject: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Subject",
			required: true,
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		questions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Question",
				required: true,
			},
		],
		duration: { type: Number, required: true }, // in minutes
	},
	{ timestamps: true }
);

export default mongoose.model("Exam", examSchema);
