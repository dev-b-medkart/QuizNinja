import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
	tenantId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Tenant",
		required: true, // Ensures subjects are unique per coaching center
	},
	subject_name: { type: String, required: true, trim: true },
	subject_code: { type: String, unique: true, sparse: true, trim: true },
	subject_description: { type: String, default: "" },
});

export default mongoose.model("Subject", subjectSchema);
