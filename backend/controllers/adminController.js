const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Applicant = require("../models/Applicant");
const Assessor = require("../models/Assessor");
const Admin = require("../models/Admin");
const Evaluation = require("../models/Evaluation");
const { JWT_SECRET } = require("../config/constants");

exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required" 
      });
    }

    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({
        success: false,
        error: "Password must be 8-16 characters"
      });
    }

    const adminCount = await Admin.countDocuments();
    let isSuperAdmin = false;

    if (adminCount > 0) {
      const token = req.cookies.adminToken;
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication required - please login first" 
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const requestingAdmin = await Admin.findById(decoded.userId);
        
        if (!requestingAdmin || !requestingAdmin.isSuperAdmin) {
          return res.status(403).json({ 
            success: false, 
            error: "Only super admins can register new admins" 
          });
        }
      } catch (err) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid authentication token" 
        });
      }
    } else {
      isSuperAdmin = true;
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already registered" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ 
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      isSuperAdmin
    });

    await newAdmin.save();

    return res.status(201).json({ 
      success: true, 
      message: "Admin registration successful. Please login.",
      data: {
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        isSuperAdmin: newAdmin.isSuperAdmin,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Admin registration failed - Server error"
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { 
        userId: admin._id, 
        role: "admin",
        email: admin.email,
        fullName: admin.fullName,
        isSuperAdmin: admin.isSuperAdmin
      }, 
      JWT_SECRET, 
      { expiresIn: "8h" }
    );

    res.cookie("adminToken", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 28800000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/"
    });

    res.json({ 
      success: true, 
      message: "Login successful",
      data: {
        email: admin.email,
        fullName: admin.fullName,
        isSuperAdmin: admin.isSuperAdmin
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
};

exports.authStatus = async (req, res) => {
  try {
    const token = req.cookies.adminToken;
    
    if (!token) {
      return res.status(200).json({ 
        authenticated: false,
        message: "No token found"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.userId }).select('-password');
    
    if (!admin) {
      return res.status(200).json({ 
        authenticated: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({ 
      authenticated: true,
      user: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        isSuperAdmin: admin.isSuperAdmin,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }
    });
  } catch (err) {
    console.error("Admin auth status error:", err);
    res.status(200).json({ 
      authenticated: false,
      message: "Invalid token"
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Admin logged out successfully" });
};

exports.getApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find({})
      .select('-password -files -__v')
      .sort({ createdAt: -1 });

    const formattedApplicants = applicants.map(applicant => {
      return {
        _id: applicant._id,
        applicantId: `APP${applicant._id.toString().substring(0, 8).toUpperCase()}`,
        name: applicant.personalInfo ? 
          `${applicant.personalInfo.lastname || ''}, ${applicant.personalInfo.firstname || ''} ${applicant.personalInfo.middlename || ''}`.trim() : 
          'No name provided',
        course: applicant.personalInfo?.firstPriorityCourse || 'Not specified',
        applicationDate: applicant.createdAt || new Date(),
        currentScore: applicant.finalScore || 0,
        status: applicant.status || 'Pending Review'
      };
    });

    res.status(200).json({ 
      success: true,
      data: formattedApplicants 
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applicants' 
    });
  }
};

exports.getApplicantDetails = async (req, res) => {
  try {
    const applicantId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const applicant = await Applicant.findById(applicantId)
      .select('-password -__v')
      .populate('assignedAssessors', 'assessorId fullName expertise')
      .populate('evaluations');

    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }

    const formattedApplicant = {
      _id: applicant._id,
      applicantId: `APP${applicant._id.toString().substring(0, 8).toUpperCase()}`,
      email: applicant.email,
      status: applicant.status,
      createdAt: applicant.createdAt,
      personalInfo: applicant.personalInfo,
      files: applicant.files,
      assignedAssessors: applicant.assignedAssessors,
      evaluations: applicant.evaluations,
      finalScore: applicant.finalScore,
      isPassed: applicant.isPassed,
      name: applicant.personalInfo ? 
        `${applicant.personalInfo.lastname || ''}, ${applicant.personalInfo.firstname || ''} ${applicant.personalInfo.middlename || ''}`.trim() : 
        'No name provided',
      course: applicant.personalInfo?.firstPriorityCourse || 'Not specified'
    };

    res.status(200).json({ 
      success: true,
      data: formattedApplicant 
    });
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applicant' 
    });
  }
};

exports.approveApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const updatedApplicant = await Applicant.findByIdAndUpdate(
      applicantId,
      { status: "Approved" },
      { new: true }
    ).select('-password -files -__v');

    if (!updatedApplicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Applicant approved successfully',
      data: updatedApplicant
    });
  } catch (error) {
    console.error('Error approving applicant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve applicant' 
    });
  }
};

exports.rejectApplicant = async (req, res) => {
  try {
    const applicantId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const updatedApplicant = await Applicant.findByIdAndUpdate(
      applicantId,
      { status: "Rejected" },
      { new: true }
    ).select('-password -files -__v');

    if (!updatedApplicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Applicant rejected successfully',
      data: updatedApplicant
    });
  } catch (error) {
    console.error('Error rejecting applicant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject applicant' 
    });
  }
};

exports.assignAssessor = async (req, res) => {
  try {
    const { applicantId, assessorId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId) || !mongoose.Types.ObjectId.isValid(assessorId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid IDs provided' 
      });
    }

    const assessor = await Assessor.findById(assessorId);
    if (!assessor || !assessor.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Assessor not found or not approved'
      });
    }

    const updatedApplicant = await Applicant.findByIdAndUpdate(
      applicantId,
      { 
        status: "Under Assessment",
        $addToSet: { assignedAssessors: assessorId }
      },
      { new: true }
    ).select('-password -__v');

    if (!updatedApplicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Assessor assigned successfully',
      data: {
        applicant: updatedApplicant,
        assessor: {
          _id: assessor._id,
          assessorId: assessor.assessorId,
          fullName: assessor.fullName
        }
      }
    });
  } catch (error) {
    console.error('Error assigning assessor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to assign assessor' 
    });
  }
};

exports.getAvailableAssessors = async (req, res) => {
  try {
    const assessors = await Assessor.find({ isApproved: true })
      .select('_id assessorId fullName expertise assessorType')
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      data: assessors
    });
  } catch (error) {
    console.error('Error fetching assessors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assessors'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalApplicants = await Applicant.countDocuments();
    const newApplicants = await Applicant.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const pendingReview = await Applicant.countDocuments({ status: "Pending Review" });
    const underAssessment = await Applicant.countDocuments({ status: "Under Assessment" });
    const evaluatedPassed = await Applicant.countDocuments({ status: "Evaluated - Passed" });
    const evaluatedFailed = await Applicant.countDocuments({ status: "Evaluated - Failed" });
    const rejected = await Applicant.countDocuments({ status: "Rejected" });

    res.status(200).json({
      success: true,
      data: {
        totalApplicants,
        newApplicants,
        pendingReview,
        underAssessment,
        evaluatedPassed,
        evaluatedFailed,
        rejected
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

exports.getAllAssessors = async (req, res) => {
  try {
    const assessors = await Assessor.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });

    const assessorsWithCounts = await Promise.all(assessors.map(async assessor => {
      const count = await Applicant.countDocuments({
        status: "Under Assessment",
        "assignedAssessors": assessor._id
      });
      return {
        ...assessor.toObject(),
        applicantsCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: assessorsWithCounts
    });
  } catch (error) {
    console.error('Error fetching assessors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assessors'
    });
  }
};

exports.getAssessor = async (req, res) => {
  try {
    const assessor = await Assessor.findById(req.params.id)
      .select('-password -__v');

    if (!assessor) {
      return res.status(404).json({
        success: false,
        error: 'Assessor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assessor
    });
  } catch (error) {
    console.error('Error fetching assessor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assessor'
    });
  }
};

exports.updateAssessor = async (req, res) => {
  try {
    const { fullName, email, assessorType, expertise, isApproved } = req.body;
    
    const updatedAssessor = await Assessor.findByIdAndUpdate(
      req.params.id,
      { fullName, email, assessorType, expertise, isApproved },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedAssessor) {
      return res.status(404).json({
        success: false,
        error: 'Assessor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessor updated successfully',
      data: updatedAssessor
    });
  } catch (error) {
    console.error('Error updating assessor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assessor'
    });
  }
};

exports.deleteAssessor = async (req, res) => {
  try {
    const deletedAssessor = await Assessor.findByIdAndDelete(req.params.id);

    if (!deletedAssessor) {
      return res.status(404).json({
        success: false,
        error: 'Assessor not found'
      });
    }

    // Remove this assessor from any assigned applicants
    await Applicant.updateMany(
      { assignedAssessors: deletedAssessor._id },
      { $pull: { assignedAssessors: deletedAssessor._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Assessor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assessor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assessor'
    });
  }
};

exports.getEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({})
      .populate('applicantId', 'personalInfo status')
      .populate('assessorId', 'assessorId fullName expertise')
      .sort({ finalizedAt: -1 });

    const formattedEvaluations = evaluations.map(eval => {
      const applicant = eval.applicantId;
      const assessor = eval.assessorId;
      
      return {
        _id: eval._id,
        applicantId: applicant._id,
        applicantName: applicant.personalInfo ? 
          `${applicant.personalInfo.lastname}, ${applicant.personalInfo.firstname}` : 
          'No name provided',
        applicantCourse: applicant.personalInfo?.firstPriorityCourse || 'Not specified',
        assessorId: assessor._id,
        assessorName: assessor.fullName,
        assessorExpertise: assessor.expertise,
        totalScore: eval.totalScore,
        isPassed: eval.isPassed,
        status: eval.status,
        evaluatedAt: eval.evaluatedAt,
        finalizedAt: eval.finalizedAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedEvaluations
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluations'
    });
  }
};

exports.getEvaluationDetails = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('applicantId', 'personalInfo files status')
      .populate('assessorId', 'assessorId fullName expertise assessorType');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluation'
    });
  }
};