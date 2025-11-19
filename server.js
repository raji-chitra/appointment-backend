require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const User = require("./models/User");
const validator = require("validator");

const app = express();

// Connect to MongoDB
connectDB();

/* ----------------------------------------------------
   SIMPLE + FIXED CORS (WORKS 100% ON RENDER)
---------------------------------------------------- */

app.use(
  cors({
    origin: process.env.FRONTEND_URL,   // your render frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Extra fallback headers for OPTIONS requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  next();
});

// Handle OPTIONS preflight globally (important!)
app.options("*", cors());

/* ----------------------------------------------------
   BODY PARSER
---------------------------------------------------- */
app.use(express.json());

/* ----------------------------------------------------
   STATIC FILES
---------------------------------------------------- */
app.use("/uploads", express.static("uploads"));

/* ----------------------------------------------------
   ROUTES
---------------------------------------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/appointments", require("./routes/appointment"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/admin", require("./routes/admin"));

/* ----------------------------------------------------
   TEST ROUTES
---------------------------------------------------- */
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    database: "MongoDB Connected",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ----------------------------------------------------
   SERVER START + DEFAULT ADMIN CREATION
---------------------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    const adminEmail = (
      process.env.DEFAULT_ADMIN_EMAIL || "rajalakshmi@gmail.com"
    )
      .trim()
      .toLowerCase();

    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "123456";

    if (!validator.isEmail(adminEmail)) {
      throw new Error(`Invalid DEFAULT_ADMIN_EMAIL provided: ${adminEmail}`);
    }

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });

      await admin.save();
      console.log("✅ Default admin created:", adminEmail);
    } else {
      console.log("ℹ Default admin already exists");
    }
  } catch (e) {
    console.error("❌ Failed to ensure default admin:", e.message);
  }
});
