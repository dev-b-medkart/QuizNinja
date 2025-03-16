import mongoose from "mongoose";
import optionSchema from "./option.model.mjs";

// Define the main question schema that uses the OptionSchema
const questionSchema = new mongoose.Schema(
	{
		tenantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tenant",
			required: true,
		},
		question: { type: String, required: true, trim: true },
		subject_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "Subject",
		},
		created_by: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		reference_book_or_source: { type: String, default: "" },
		image_url: { type: String, default: "" },
		// Use the OptionSchema as an embedded subdocument
		options: [optionSchema],
		correct_option_ids: { type: [Number], required: true },
		difficulty: { type: Number, min: 1, max: 5, default: 1 },
		chapter: { type: String, default: "" },
	},
	{ timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
