const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
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
  fullName: {
    type: String,
    required: true
  },
  accountStatus:{
    type:String,
  },

  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: "Admin" });

module.exports = mongoose.model("Admin", adminSchema);