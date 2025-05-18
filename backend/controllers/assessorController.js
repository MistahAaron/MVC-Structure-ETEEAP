const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const Applicant = require("../models/Applicant");
const Assessor = require("../models/Assessor");
const Evaluation = require("../models/Evaluation");
const { JWT_SECRET } = require("../config/constants");
const { getNextAssessorId } = require("../utils/helpers");

exports.register = async (req, res) => {
  const { email, password, fullName, expertise, assessorType } = req.body;

  try {
    if (!email || !password || !fullName || !expertise || !assessorType) {
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

    const assessorId = await getNextAssessorId();
    const existing = await Assessor.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already registered" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAssessor = new Assessor({ 
      email: email.toLowerCase(),
      password: hashedPassword,
      assessorId,
      fullName,
      expertise,
      assessorType
    });

    await newAssessor.save();

    res.status(201).json({ 
      success: true, 
      message: "Registration successful",
      data: {
        email: newAssessor.email,
        assessorId: newAssessor.assessorId,
        fullName: newAssessor.fullName,
        expertise: newAssessor.expertise,
        assessorType: newAssessor.assessorType
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Registration failed - Server error"
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const assessor = await Assessor.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!assessor) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    if (!assessor.isApproved) {
      return res.status(403).json({ 
        success: false, 
        error: "Account pending admin approval" 
      });
    }

    const isMatch = await bcrypt.compare(password, assessor.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    assessor.lastLogin = new Date();
    await assessor.save();

    const token = jwt.sign(
      { 
        userId: assessor._id, 
        role: "assessor",
        assessorId: assessor.assessorId,
        email: assessor.email,
        fullName: assessor.fullName,
        expertise: assessor.expertise,
        assessorType: assessor.assessorType
      }, 
      JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.cookie("assessorToken", token, { 
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
        assessorId: assessor.assessorId,
        email: assessor.email,
        fullName: assessor.fullName,
        expertise: assessor.expertise,
        assessorType: assessor.assessorType
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

exports.authStatus = async (req, res) => {
  try {
    const token = req.cookies.assessorToken;
    
    if (!token) {
      return res.status(200).json({ 
        authenticated: false,
        message: "No token found"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const assessor = await Assessor.findOne({ _id: decoded.userId }).select('-password');
    
    if (!assessor) {
      return res.status(200).json({ 
        authenticated: false,
        message: "Assessor not found"
      });
    }

    res.status(200).json({ 
      authenticated: true,
      user: {
        _id: assessor._id,
        assessorId: assessor.assessorId,
        email: assessor.email,
        fullName: assessor.fullName,
        expertise: assessor.expertise,
        assessorType: assessor.assessorType,
        isApproved: assessor.isApproved,
        createdAt: assessor.createdAt,
        lastLogin: assessor.lastLogin
      }
    });
  } catch (err) {
    console.error("Auth status error:", err);
    res.status(200).json({ 
      authenticated: false,
      message: "Invalid token"
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("assessorToken");
  res.json({ success: true, message: "Logged out successfully" });
};

exports.getAssignedApplicants = async (req, res) => {
  try {
    const assessorId = req.assessor.userId;
    
    const applicants = await Applicant.find({ 
      assignedAssessors: assessorId,
      status: "Under Assessment"
    })
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
        status: applicant.status || 'Under Assessment'
      };
    });

    res.status(200).json({ 
      success: true,
      data: formattedApplicants 
    });
  } catch (error) {
    console.error('Error fetching assigned applicants:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch assigned applicants' 
    });
  }
};

exports.getApplicantDetails = async (req, res) => {
  try {
    const applicantId = req.params.id;
    const assessorId = req.assessor.userId;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const applicant = await Applicant.findOne({
      _id: applicantId,
      assignedAssessors: assessorId
    })
    .select('-password -__v')
    .populate('assignedAssessors', 'assessorId fullName expertise');

    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found or not assigned to you' 
      });
    }

    const formattedApplicant = {
      _id: applicant._id,
      email: applicant.email,
      status: applicant.status,
      createdAt: applicant.createdAt,
      personalInfo: applicant.personalInfo || {},
      files: applicant.files || [],
      assignedAssessors: applicant.assignedAssessors,
      name: applicant.personalInfo ? 
        `${applicant.personalInfo.firstname || ''} ${applicant.personalInfo.lastname || ''}`.trim() : 
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

exports.getApplicantDocuments = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const assessorId = req.assessor.userId;
    const applicant = await Applicant.findOne({
      _id: applicantId,
      assignedAssessors: assessorId
    }).select('files personalInfo');

    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Applicant not found or not assigned to you' 
      });
    }

    const documents = applicant.files.map(file => ({
      name: file.name || path.basename(file.path),
      path: file.path,
      type: file.type || path.extname(file.path).substring(1).toLowerCase(),
      status: 'pending',
      uploadDate: file.uploadDate || new Date()
    }));

    res.status(200).json({ 
      success: true,
      data: {
        applicant: {
          name: applicant.personalInfo ? 
            `${applicant.personalInfo.firstname || ''} ${applicant.personalInfo.lastname || ''}`.trim() : 
            'No name provided',
          course: applicant.personalInfo?.firstPriorityCourse || 'Not specified'
        },
        documents
      }
    });
  } catch (error) {
    console.error('Error fetching applicant documents:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applicant documents' 
    });
  }
};

exports.getEvaluations = async (req, res) => {
  try {
    const { applicantId } = req.query;
    const assessorId = req.assessor.userId;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid applicant ID' 
      });
    }

    const evaluation = await Evaluation.findOne({
      applicantId,
      assessorId
    });

    if (!evaluation) {
      return res.status(200).json({ 
        success: true,
        data: null
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

exports.saveEvaluation = async (req, res) => {
  try {
    const { applicantId, scores } = req.body;
    const assessorId = req.assessor.userId;

    const applicant = await Applicant.findOne({
      _id: applicantId,
      assignedAssessors: assessorId,
      status: "Under Assessment"
    });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: "Applicant not found or not assigned to you"
      });
    }

    const totalScore = 
      (scores.educationalQualification?.score || 0) +
      (scores.workExperience?.score || 0) +
      (scores.professionalAchievements?.score || 0) +
      (scores.interview?.score || 0);

    const isPassed = totalScore >= 60;

    const evaluation = await Evaluation.findOneAndUpdate(
      { applicantId, assessorId },
      {
        ...scores,
        totalScore,
        isPassed,
        status: 'draft',
        evaluatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    if (!applicant.evaluations.includes(evaluation._id)) {
      await Applicant.findByIdAndUpdate(
        applicantId,
        { $addToSet: { evaluations: evaluation._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Evaluation saved successfully",
      data: evaluation
    });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save evaluation'
    });
  }
};

exports.finalizeEvaluation = async (req, res) => {
  try {
    const { applicantId, comments } = req.body;
    const assessorId = req.assessor.userId;

    const evaluation = await Evaluation.findOne({ 
      applicantId, 
      assessorId 
    });

    if (!evaluation) {
      return res.status(400).json({
        success: false,
        error: "No evaluation found to finalize"
      });
    }

    const newStatus = evaluation.totalScore >= 60 
      ? "Evaluated - Passed" 
      : "Evaluated - Failed";

    const finalizedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluation._id,
      { 
        status: 'finalized',
        finalComments: comments,
        finalizedAt: new Date()
      },
      { new: true }
    );

    const applicant = await Applicant.findByIdAndUpdate(
      applicantId,
      { 
        status: newStatus,
        $push: {
          evaluationComments: {
            assessorId: assessorId,
            comments: comments,
            date: new Date(),
            evaluationId: evaluation._id
          }
        },
        finalScore: evaluation.totalScore,
        isPassed: evaluation.isPassed
      },
      { new: true }
    ).populate('assignedAssessors', 'assessorId fullName expertise');

    res.status(200).json({
      success: true,
      message: "Evaluation finalized successfully",
      data: {
        applicant,
        evaluation: finalizedEvaluation
      }
    });
  } catch (error) {
    console.error('Error finalizing evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize evaluation'
    });
  }
};