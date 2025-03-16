import Tenant from "../models/tenant.model.mjs";
import User from "../models/user.model.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerTenant = async (req, res) => {
    try {
        const { name, ownerName, username, email, password, phone_number } =
            req.body;

        // Check if tenant already exists

        const existingTenant = await Tenant.findOne({ name });
        if (existingTenant) {
            return res.status(400).json({ error: "Institute already exists." });
        }

        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        console.log(existingUser);
        
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "Username is already taken." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create tenant with owner as HOD
        const newTenant = await Tenant.create({
            name,
            owner: null,
        });
        // Create HOD user
        const newHOD = await User.create({
            name: ownerName,
            username, // Accept username from request body
            email,
            phone_number,
            tenantId: newTenant._id,
            password: hashedPassword,
            role: "hod",
        });

        newTenant.owner = newHOD._id;
        await newTenant.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: newHOD._id, tenantId: newTenant._id, role: "hod" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Institute registered successfully",
            token,
        });
    } catch (error) {
        res.status(500).json({
            error: "Error registering institute",
            details: error,
        });
    }
};

// ✅ Update Tenant
const updateTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const updates = req.body;

        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedTenant) {
            return res.status(404).json({ error: "Tenant not found." });
        }

        res.status(200).json({
            message: "Tenant updated successfully",
            tenant: updatedTenant,
        });
    } catch (error) {
        res.status(500).json({
            error: "Error updating tenant",
            details: error,
        });
    }
};

// ✅ Delete Tenant
const deleteTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const deletedTenant = await Tenant.findByIdAndDelete(tenantId);

        if (!deletedTenant) {
            return res.status(404).json({ error: "Tenant not found." });
        }

        res.status(200).json({ message: "Tenant deleted successfully" });
    } catch (error) {
        res.status(500).json({
            error: "Error deleting tenant",
            details: error,
        });
    }
};

// ✅ Get All Tenants
const getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().populate("owner", "name email");

        res.status(200).json(tenants);
    } catch (error) {
        res.status(500).json({
            error: "Error fetching tenants",
            details: error,
        });
    }
};

// ✅ Get Tenant by Name (LIKE search)
const getTenantByName = async (req, res) => {
    try {
        const { name } = req.query;

        const tenants = await Tenant.find({
            name: { $regex: name, $options: "i" },
        }).populate("owner", "name email");

        res.status(200).json(tenants);
    } catch (error) {
        res.status(500).json({
            error: "Error searching tenant by name",
            details: error,
        });
    }
};

// ✅ Get Tenant by Owner Name (LIKE search)
const getTenantByOwnerName = async (req, res) => {
    try {
        const { ownerName } = req.query;

        const owners = await User.find({
            name: { $regex: ownerName, $options: "i" },
            role: "hod",
        }).select("_id");

        const ownerIds = owners.map((owner) => owner._id);

        const tenants = await Tenant.find({
            owner: { $in: ownerIds },
        }).populate("owner", "name email");

        res.status(200).json(tenants);
    } catch (error) {
        res.status(500).json({
            error: "Error searching tenant by owner name",
            details: error,
        });
    }
};

// ✅ Get Tenant by ID
const getTenantById = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const tenant = await Tenant.findById(tenantId).populate(
            "owner",
            "name email"
        );

        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found." });
        }

        res.status(200).json(tenant);
    } catch (error) {
        res.status(500).json({
            error: "Error fetching tenant by ID",
            details: error,
        });
    }
};

// ✅ Get Tenant by Owner ID
const getTenantByOwnerId = async (req, res) => {
    try {
        const { ownerId } = req.params;

        const tenant = await Tenant.findOne({ owner: ownerId }).populate(
            "owner",
            "name email"
        );

        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found." });
        }

        res.status(200).json(tenant);
    } catch (error) {
        res.status(500).json({
            error: "Error fetching tenant by owner ID",
            details: error,
        });
    }
};

export {
    registerTenant,
    getTenantByOwnerName,
    getTenantById,
    getTenantByOwnerId,
    getTenantByName,
    getAllTenants,
    deleteTenant,
    updateTenant,
};
