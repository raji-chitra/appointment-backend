const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email: (email || '').toLowerCase() });
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const ok = await admin.comparePassword(password || '');
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    res.json({ success: true, stats: { totalPatients, totalDoctors, totalAppointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doctors CRUD for admin panel
router.get('/doctors', adminAuth, async (_req, res) => {
  try {
    const docs = await Doctor.find();
    res.json({ success: true, doctors: docs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/doctors', adminAuth, upload.single('image'), async (req, res) => {
  try {
    let { name, email, password, specialization, experience, availability, bio, fees, address } = req.body;
    if (!name || !(specialization || '').trim() || fees == null) {
      return res.status(400).json({ success: false, message: 'Name, specialization and fees are required' });
    }
    if (!email) {
      // fallback: generate one from name
      email = `${String(name).replace(/\s+/g,'').toLowerCase()}@prescripto.com`;
    }
    const lower = String(email).trim().toLowerCase();

    const feesNum = Number(fees);
    const expNum = Number(experience || 0);
    if (Number.isNaN(feesNum) || feesNum < 0) {
      return res.status(400).json({ success: false, message: 'Fees must be a valid number' });
    }

    // If a user already exists with this email
    const existingUser = await User.findOne({ email: lower });

    let doctorUser = existingUser;
    if (existingUser) {
      if (existingUser.role !== 'doctor') {
        return res.status(400).json({ success: false, message: 'Email already in use by a non-doctor account' });
      }
      // If user is doctor, reuse the account
    } else {
      doctorUser = await User.create({ name, email: lower, password: password || 'doctor123', role: 'doctor' });
    }

    // If a Doctor profile already exists for this email, return informative message
    const existingDoctor = await Doctor.findOne({ email: lower });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: 'Doctor with this email already exists' });
    }

    const specialityValue = String(specialization).trim();
    const doctor = await Doctor.create({
      name,
      email: lower,
      user: doctorUser._id,
      specialization: specialityValue,
      speciality: specialityValue, // Set both fields for compatibility
      experience: expNum,
      availability: Array.isArray(availability) ? availability : [],
      bio: bio || '',
      image: req.file ? `/uploads/doctors/${req.file.filename}` : '',
      fees: feesNum,
      address: address || { line1: '', line2: '' }
    });
    res.status(201).json({ success: true, message: 'Doctor added', doctor });
  } catch (e) {
    console.error('Add doctor error:', e);
    // Provide mongoose validation feedback if present
    const msg = e?.message || 'Server error while adding doctor';
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/doctors/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updateData = {...req.body};
    if (req.file) {
      updateData.image = `/uploads/doctors/${req.file.filename}`;
    }
    const updated = await Doctor.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor updated', doctor: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/doctors/:id', adminAuth, async (req, res) => {
  try {
    const removed = await Doctor.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor removed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Appointments management
router.get('/appointments', adminAuth, async (_req, res) => {
  try {
    const list = await Appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .sort({ date: -1 });
    res.json({ success: true, appointments: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/appointments/:id/status', adminAuth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    appt.status = req.body.status;
    await appt.save();
    res.json({ success: true, message: 'Status updated', appointment: appt });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;