const mongoose = require("mongoose");

const assessorSchema = new mongoose.Schema({
  email: { 
    type: String, 
    unique: true, 
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8,
  },
  assessorId: { 
    type: String, 
    unique: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: true
  },
  expertise: {
    type: String,
    required: true,
    enum: ["engineering", 
            "education", "business", "information_technology", 
           "health_sciences", "arts_sciences", "architecture", 
           "industrial_technology", "hospitality_management", "other"]
  },
  assessorType: {
    type: String,
    required: true,
    enum: ["external", "internal"]
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: Date
}, { collection: "Assessors" });

module.exports = mongoose.model("Assessor", assessorSchema);