const express = require('express');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all appointments
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get appointments for a specific doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .sort({ appointmentDate: 1 });
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get appointments for a specific patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId })
      .sort({ appointmentDate: 1 });
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, patientId, patientName, patientEmail, doctorName, appointmentDate, symptoms, status } = req.body;
    
    const appointment = new Appointment({
      doctorId,
      patientId,
      patientName,
      patientEmail,
      doctorName,
      appointmentDate,
      symptoms,
      status: status || 'pending'
    });
    
    await appointment.save();
    res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update appointment status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete an appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;