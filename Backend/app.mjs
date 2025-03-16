import express from "express";
import authRoutes from "./routes/user.routes.mjs";
import subjectRoutes from "./routes/subject.routes.mjs";
import questionsRoutes from "./routes/question.route.mjs";
import tenantRoutes from "./routes/tenant.route.mjs";
import connectDB from "./db/database.mjs";
// import interactionRoutes from "./routes/interaction.routes.mjs";

const app = express();
connectDB();
// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // If using form data
app.use("/api", authRoutes);
app.use("/api", subjectRoutes);
app.use("/api", questionsRoutes);
app.use("/api", tenantRoutes); // Prefix all routes with /api/tenants

// app.use("/api/questions", interactionRoutes);

export { app };
