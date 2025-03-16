import express from "express";
import {
	registerTenant,
	getTenantByOwnerName,
	getTenantById,
	getTenantByOwnerId,
	getTenantByName,
	getAllTenants,
	deleteTenant,
	updateTenant,
} from "../controllers/tenant.controller.mjs"; // Ensure the correct path

const router = express.Router();

router.post("/tenants/register", registerTenant);
router.get("/tenants/", getAllTenants);
router.get("/tenants/search", getTenantByName);
router.get("/tenants/search/owner", getTenantByOwnerName);
router.get("/tenants/:tenantId", getTenantById);
router.get("/tenants/owner/:ownerId", getTenantByOwnerId);
router.put("/tenants/:tenantId", updateTenant);
router.delete("/tenants/:tenantId", deleteTenant);

export default router;
