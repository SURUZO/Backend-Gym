const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const membershipRoutes = require("./routes/membershipRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URI || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", trainerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/membership", membershipRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
