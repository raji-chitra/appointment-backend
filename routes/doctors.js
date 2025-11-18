const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Get all doctors
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .populate('user', 'name email phone')
            .select('-__v');
        
        res.json({
            success: true,
            doctors: doctors
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('user', 'name email phone');
        
        if (!doctor) {
            return res.status(404).json({ 
                success: false,
                error: 'Doctor not found' 
            });
        }
        
        res.json({
            success: true,
            doctor: doctor
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;