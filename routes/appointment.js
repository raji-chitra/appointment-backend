const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const userAuth = require('../middleware/userAuth');

// Create appointment (POST /book) - frontend expects /appointments/book
const createAppointmentHandler = async (req, res) => {
    try {
        const { doctor, date, time, symptoms } = req.body;

        const appointment = new Appointment({
            patient: req.user._id, // Use authenticated user's ID
            doctor,
            date,
            time,
            symptoms
        });

        await appointment.save();
        await appointment.populate('doctor patient', 'name specialization');

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment: appointment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// POST /book - used by frontend
router.post('/book', userAuth, createAppointmentHandler);

// Keep root POST for backward compatibility
router.post('/', userAuth, createAppointmentHandler);

// Get user's appointments
router.get('/my-appointments', userAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate('doctor', 'name specialization consultationFee')
            .sort({ date: -1 });
        
        res.json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Cancel appointment
router.put('/:id/cancel', userAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        // Check if the appointment belongs to the user
        if (appointment.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this appointment'
            });
        }
        
        // Update appointment status to cancelled
        appointment.status = 'cancelled';
        await appointment.save();
        
        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment: appointment
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel appointment'
        });
    }
});

// Get doctor's appointments
router.get('/doctor/:doctorId', userAuth, async (req, res) => {
    try {
        const userId = req.params.doctorId;
        
        // First find the doctor document associated with this user
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ user: userId });
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found for this user'
            });
        }
        
        // Now fetch appointments using the doctor's ID
        const appointments = await Appointment.find({ doctor: doctor._id })
            .populate('patient', 'name email')
            .sort({ date: -1 });
        
        res.json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;