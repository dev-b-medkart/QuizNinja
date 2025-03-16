import mongoose from "mongoose";
import { ROLES } from "../constants/constants.mjs"; // Import roles from constants

const userSchema = new mongoose.Schema(
	{
		tenantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Tenant",
			required: false, // Change to "true" if every user must belong to a tenant
		},
		name: { type: String, required: true, minlength: 2 },
		username: {
			type: String,
			required: false, // Ensure it's always provided if it's unique
			default:"",
			lowercase: true,
			match: [
				/^[a-z_]*$/,
				"Username can only contain lowercase letters and underscores",
			],
		},
		role: {
			type: String,
			enum: Object.values(ROLES), // Use predefined roles
			default: ROLES.STUDENT, // Use constant
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			match: [
				/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
				"Please provide a valid email address",
			],
		},
		phone_number: {
			type: String,
			required: true,
			match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
		},
	},
	{
		timestamps: true, // Automatically handles createdAt & updatedAt
	}
);

const User = mongoose.model("User", userSchema);
export default User;
