import mongoose from "mongoose";

// Define a separate schema for options
const optionSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true }, // Auto-generated serial ID
		text: { type: String, required: true },
	},
	{ _id: false } // Disables automatic _id creation for subdocuments
);

export default optionSchema;
