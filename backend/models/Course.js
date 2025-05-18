const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseId: { 
    type: String, 
    unique: true, 
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  courseName: { 
    type: String, 
  },


}, { collection: "Course" });

module.exports = mongoose.model("Course", CourseSchema);