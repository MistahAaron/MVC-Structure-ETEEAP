const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const Applicant = require("../models/Applicant");
const { JWT_SECRET } = require("../config/constants");
const upload = require("../middlewares/fileUpload");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await Applicant.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newApplicant = new Applicant({ email, password: hashedPassword });

    await newApplicant.save();
    res.json({ 
      success: true, 
      message: "Registration successful!",
      userId: newApplicant._id 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const applicant = await Applicant.findOne({ email });
    if (!applicant) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, applicant.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const token = jwt.sign(
      { 
        userId: applicant._id, 
        role: "applicant",
        email: applicant.email
      }, 
      JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.cookie("applicantToken", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/"
    });

    res.json({ 
      success: true, 
      message: "Login successful",
      data: {
        userId: applicant._id,
        email: applicant.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
};

exports.updatePersonalInfo = async (req, res) => {
  const { userId, personalInfo } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const applicant = await Applicant.findById(userId);
    if (!applicant) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    applicant.personalInfo = JSON.parse(personalInfo);

    if (req.files) {
      applicant.files = req.files.map(file => ({
        path: path.join('uploads', path.basename(file.path)),
        name: file.originalname,
        type: path.extname(file.originalname).substring(1).toLowerCase()
      }));
    }

    await applicant.save();

    res.status(200).json({ 
      success: true,
      message: 'Personal information updated successfully' 
    });
  } catch (error) {
    console.error("Error updating personal info:", error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating personal info' 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID' 
      });
    }

    const applicant = await Applicant.findById(userId).select('-password');
    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      data: applicant 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

exports.authStatus = async (req, res) => {
  try {
    const token = req.cookies.applicantToken;
    
    if (!token) {
      return res.status(200).json({ 
        authenticated: false,
        message: "No token found"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const applicant = await Applicant.findOne({ _id: decoded.userId }).select('-password');
    
    if (!applicant) {
      return res.status(200).json({ 
        authenticated: false,
        message: "Applicant not found"
      });
    }

    res.status(200).json({ 
      authenticated: true,
      user: {
        _id: applicant._id,
        email: applicant.email,
        personalInfo: applicant.personalInfo,
        files: applicant.files,
        status: applicant.status
      }
    });
  } catch (err) {
    console.error("Applicant auth status error:", err);
    res.status(200).json({ 
      authenticated: false,
      message: "Invalid token"
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("applicantToken");
  res.json({ success: true, message: "Logged out successfully" });
};