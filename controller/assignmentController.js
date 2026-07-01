import Assignment from "../models/Assignment.js";

// @desc    Create a new assignment task listing
// @route   POST /api/assignments
// @access  Private (Teacher Only)
export const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, instructions, subject, dueDate } = req.body;

    if (!title || !instructions || !subject || !dueDate) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required assignment fields." });
    }

    const assignment = await Assignment.create({
      teacherId,
      assignedStudentId: req.body.assignedStudentId || null,
      title,
      instructions,
      subject,
      dueDate: new Date(dueDate),
    });

    return res.status(201).json({
      success: true,
      message: "Assignment successfully published.",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit a solution to an assignment task
// @route   POST /api/assignments/:id/submit
// @access  Private (Student Only)
export const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user._id;
    const assignmentId = req.params.id;
    const { fileUrl } = req.body; // URL to completed work file/document

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        error: "Please provide a file URL for your submission.",
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Target assignment not found." });
    }

    // Check if deadline has already passed
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({
        success: false,
        error: "The deadline for this assignment has expired.",
      });
    }

    // Check if student has already submitted to avoid duplicates
    const alreadySubmitted = assignment.submissions.some(
      (sub) => sub.studentId.toString() === studentId.toString(),
    );

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        error: "You have already submitted a solution for this task.",
      });
    }

    // Append submission object to sub-document array layout safely
    assignment.submissions.push({
      studentId,
      fileUrl,
    });

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Your assignment submission has been successfully recorded.",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Grade a student's assignment submission
// @route   PUT /api/assignments/:id/grade
// @access  Private (Teacher Only)
export const gradeSubmission = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const assignmentId = req.params.id;
    const { studentId, grade, feedback } = req.body;

    if (!studentId || !grade) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required grading variables." });
    }

    // Find the assignment and verify ownership
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found or unauthorized access.",
      });
    }

    // Locate individual target submission within embedded list array
    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === studentId.toString(),
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "No submission found for the specified student.",
      });
    }

    // Update individual schema sub-document fields
    submission.grade = grade;
    submission.feedback = feedback || "";

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Submission has been graded successfully.",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get assignments (Filtered by role context)
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let assignments = [];

    if (role === "teacher") {
      assignments = await Assignment.find({ teacherId: userId })
        .populate("submissions.studentId", "name email")
        .populate("assignedStudentId", "name profileImage");
    } else if (role === "student") {
      assignments = await Assignment.find({
        $or: [{ assignedStudentId: null }, { assignedStudentId: userId }],
      })
        .populate("teacherId", "name profileImage")
        .populate("assignedStudentId", "name profileImage");
    }

    return res
      .status(200)
      .json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
