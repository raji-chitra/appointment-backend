const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Keep both fields for compatibility; require at least one via custom validator
  speciality: { type: String, default: '' },
  specialization: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  fees: { type: Number, required: true },
  image: { type: String, default: '' },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  active: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure at least one specialization field is set and keep them in sync
doctorSchema.pre('validate', function(next) {
  if (!this.specialization && this.speciality) {
    this.specialization = this.speciality;
  }
  if (!this.speciality && this.specialization) {
    this.speciality = this.specialization;
  }
  if (!this.specialization && !this.speciality) {
    return next(new Error('Specialization is required'));
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);


