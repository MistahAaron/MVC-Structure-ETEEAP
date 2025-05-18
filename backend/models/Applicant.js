const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  status: { 
    type: String, 
    default: "New Applicant",
    enum: [
      "New Applicant", 
      "No Assessor", 
      "Under Assessor", 
      "In-progress", 
      "Disapproved",
      "Approved"
    ]
  },
  assignedAssessors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assessor' 
  }],

  personalInfo: {
    firstname: String,
    middlename: String,
    lastname: String,
    suffix: String,
    gender: String,
    age: Number,
    occupation: String,
    nationality: String,
    civilstatus: String,
    birthDate: Date,
    birthplace: String,
    mobileNumber: String,
    telephoneNumber: String,
    emailAddress: String,
    country: String,
    province: String,
    city: String,
    street: String,
    zipCode: String,
    firstPriorityCourse: String,
    secondPriorityCourse: String,
    thirdPriorityCourse: String,
  },
  
  files: [{
    path: String,
    name: String,
    type: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
  ,
  Score: {
    type: Number,
    default: 0
  }
}, { collection: "Applicants" });

module.exports = mongoose.model("Applicant", applicantSchema);