require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const User = require('./models/User');
const validator = require('validator');

const app = express();

// Connect to MongoDB
connectDB();

/* ----------------------------------------------------
   ALLOW BOTH LOCALHOST AND RENDER FRONTEND
---------------------------------------------------- */
const allowedOrigins = [
    process.env.FRONTEND_URL,        // Hosted frontend
    'http://localhost:5173',         // Local Vite
    'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);   // Allow mobile apps / Postman

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());

// Serve uploads folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/admin', require('./routes/admin'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running!',
        database: 'MongoDB Connected'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    try {
        const adminEmail = ((process.env.DEFAULT_ADMIN_EMAIL || 'rajalakshmi@gmail.com') + '').trim().toLowerCase();
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123456';

        if (!validator.isEmail(adminEmail)) {
            throw new Error(`Invalid DEFAULT_ADMIN_EMAIL provided: ${adminEmail}`);
        }

        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Default admin created:', adminEmail);
        } else {
            console.log('ℹ Default admin already exists');
        }

    } catch (e) {
        console.error('❌ Failed to ensure default admin:', e.message);
    }
});
