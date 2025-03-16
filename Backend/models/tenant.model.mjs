import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		contact_email: { type: String, trim: true }, // Optional contact email
		contact_phone: { type: String, trim: true }, // Optional phone number
		address: { type: String, trim: true, default: "" }, // Institute address
		logo_url: { type: String, default: "" }, // URL for institute logo
		created_at: { type: Date, default: Date.now },
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	}
);

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
