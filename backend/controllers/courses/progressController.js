const { supabaseAdmin: supabase } = require("../../config/supabase");
const certificateService = require("../../services/certificateService");
const crypto = require("crypto");

/**
 * Create progress record
 */
const initializeProgress = async (req, res) => {
  try {

    const studentId = req.user.id;
    const { courseId } = req.params;

    const { data: existing } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Progress already exists"
      });
    }

    const { data, error } = await supabase
      .from("course_progress")
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          progress: 0,
          completed: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      progress: data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/**
 * Update progress
 */
const updateProgress = async (req, res) => {
  try {

    const studentId = req.user.id;
    const { courseId } = req.params;
    const { progress } = req.body;

    if (
      progress < 0 ||
      progress > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100"
      });
    }

    const completed = progress === 100;

    const { data, error } = await supabase
      .from("course_progress")
      .update({
        progress,
        completed,
        last_updated: new Date()
      })
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) throw error;

    // Auto certificate generation
    if (completed) {
      try {
        // Check assignments graded
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id")
          .eq("course_id", courseId);

        let canGenerate = true;
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("assignment_id, status")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds);

          const allGraded = assignmentIds.every(aId => {
            const sub = (submissions || []).find(s => s.assignment_id === aId);
            return sub && sub.status === "graded";
          });
          if (!allGraded) {
            canGenerate = false;
          }
        }

        if (canGenerate) {
          // Fetch student name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", studentId)
            .single();

          // Fetch course title
          const { data: course } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .single();

          if (profile && course) {
            const certificateId = `CERT-${Date.now()}`;
            const verificationHash = crypto.randomBytes(16).toString("hex");

            const pdfUrl = await certificateService.generateCertificatePdf({
              certificateId,
              studentName: profile.name,
              courseName: course.title,
              issueDate: new Date().toLocaleDateString(),
              verificationHash,
            });

            await supabase
              .from("certificates")
              .insert([{
                certificate_id: certificateId,
                student_id: studentId,
                course_id: courseId,
                issue_date: new Date(),
                pdf_url: pdfUrl,
                verification_hash: verificationHash,
                status: "active",
              }]);
          }
        }
      } catch (certError) {
        console.error(
          "[AUTO CERTIFICATE ERROR]",
          certError
        );
      }

      // Certificate generation logic finished.
    }

    return res.status(200).json({
      success: true,
      progress: data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/**
 * Get progress for one course
 */
const getCourseProgress = async (req, res) => {
  try {

    const studentId = req.user.id;
    const { courseId } = req.params;

    const { data: progressData, error } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (error) throw error;

    // Fetch module_progress for this student and course
    let moduleProgress = [];
    let passedQuizzes = [];
    if (progressData) {
      // First get all modules for course
      const { data: courseModules } = await supabase
        .from("course_modules")
        .select("id")
        .eq("course_id", courseId);
      
      const moduleIds = courseModules ? courseModules.map(m => m.id) : [];
      
      if (moduleIds.length > 0) {
        const { data: mpData } = await supabase
          .from("module_progress")
          .select("*")
          .eq("student_id", studentId)
          .in("module_id", moduleIds);
        
        moduleProgress = mpData || [];

        // Fetch passed quizzes
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, total_marks, passing_marks")
          .in("module_id", moduleIds);

        const quizIds = quizzes ? quizzes.map(q => q.id) : [];

        if (quizIds.length > 0) {
          const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("quiz_id, score")
            .eq("student_id", studentId)
            .eq("completed", true)
            .in("quiz_id", quizIds);

          passedQuizzes = (quizzes || []).filter(quiz => {
            const quizAttempts = (attempts || []).filter(a => a.quiz_id === quiz.id);
            const passingMarks = quiz.passing_marks ?? 40;
            const totalMarks = quiz.total_marks ?? 10;
            const threshold = (passingMarks / 100) * totalMarks;
            return quizAttempts.some(a => a.score >= threshold);
          }).map(quiz => quiz.id);
        }
      }
    }

    let allAssignmentsGraded = true;
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id")
      .eq("course_id", courseId);

    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);

      allAssignmentsGraded = assignmentIds.every(aId => {
        const sub = (submissions || []).find(s => s.assignment_id === aId);
        return sub && sub.status === "graded";
      });
    }

    return res.status(200).json({
      success: true,
      progress: progressData,
      moduleProgress,
      passedQuizzes,
      allAssignmentsGraded
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/**
 * Get all progress entries
 */
const getMyProgress = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("course_progress")
      .select(`
        *,
        courses(
          id,
          title
        )
      `)
      .eq("student_id", req.user.id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      progress: data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/**
 * Toggle module progress (completed or not)
 */
const toggleModuleProgress = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId, moduleId } = req.params;
    const { completed } = req.body; // true or false

    if (completed) {
      // Find quizzes for this module
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("id, title, total_marks, passing_marks")
        .eq("module_id", moduleId);

      if (quizzesError) throw quizzesError;

      if (quizzes && quizzes.length > 0) {
        for (const quiz of quizzes) {
          const { data: attempts, error: attemptsError } = await supabase
            .from("quiz_attempts")
            .select("score")
            .eq("quiz_id", quiz.id)
            .eq("student_id", studentId)
            .eq("completed", true);

          if (attemptsError) throw attemptsError;

          const passingMarks = quiz.passing_marks ?? 40;
          const totalMarks = quiz.total_marks ?? 10;
          const threshold = (passingMarks / 100) * totalMarks;
          const hasPassed = (attempts || []).some(a => a.score >= threshold);

          if (!hasPassed) {
            return res.status(400).json({
              success: false,
              message: `You must pass the quiz "${quiz.title}" (minimum ${passingMarks}%) before completing this module.`
            });
          }
        }
      }
    }

    // ACTUALLY, let's just do manual checking to be safe against constraint errors
    const { data: existingProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("module_id", moduleId)
        .maybeSingle();

    if (existingProgress) {
        await supabase
          .from("module_progress")
          .update({ completed, completed_at: completed ? new Date() : null })
          .eq("id", existingProgress.id);
    } else {
        await supabase
          .from("module_progress")
          .insert([{ student_id: studentId, module_id: moduleId, completed, completed_at: completed ? new Date() : null }]);
    }

    // 2. Recalculate course progress
    // Get all modules for course
    const { data: courseModules } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId);

    const totalModules = courseModules ? courseModules.length : 0;

    // Get all completed modules for this student and this course
    const moduleIds = courseModules ? courseModules.map(m => m.id) : [];
    
    let completedCount = 0;
    if (moduleIds.length > 0) {
      const { data: completedModules } = await supabase
        .from("module_progress")
        .select("id")
        .eq("student_id", studentId)
        .eq("completed", true)
        .in("module_id", moduleIds);
      
      completedCount = completedModules ? completedModules.length : 0;
    }

    const progressPercentage = totalModules === 0 ? 0 : Math.round((completedCount / totalModules) * 100);
    const courseCompleted = progressPercentage === 100;

    // Update course_progress
    const { data: updatedCourseProgress, error: cpError } = await supabase
      .from("course_progress")
      .update({
        progress: progressPercentage,
        completed: courseCompleted,
        last_updated: new Date()
      })
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (cpError) throw cpError;

    // Auto certificate logic if completed
    if (courseCompleted) {
      try {
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id")
          .eq("course_id", courseId);

        let canGenerate = true;
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("assignment_id, status")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds);

          const allGraded = assignmentIds.every(aId => {
            const sub = (submissions || []).find(s => s.assignment_id === aId);
            return sub && sub.status === "graded";
          });
          if (!allGraded) {
            canGenerate = false;
          }
        }

        if (canGenerate) {
          const { data: profile } = await supabase.from("profiles").select("name").eq("id", studentId).single();
          const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).single();

          if (profile && course) {
            const certificateId = `CERT-${Date.now()}`;
            const verificationHash = crypto.randomBytes(16).toString("hex");

            const pdfUrl = await certificateService.generateCertificatePdf({
              certificateId,
              studentName: profile.name,
              courseName: course.title,
              issueDate: new Date().toLocaleDateString(),
              verificationHash,
            });

            await supabase.from("certificates").insert([{
              certificate_id: certificateId,
              student_id: studentId,
              course_id: courseId,
              issue_date: new Date(),
              pdf_url: pdfUrl,
              verification_hash: verificationHash,
              status: "active",
            }]);
          }
        }
      } catch (certError) {
        console.error("[AUTO CERTIFICATE ERROR]", certError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Module progress updated",
      courseProgress: updatedCourseProgress,
      progressPercentage
    });
  } catch (error) {
    console.error("[TOGGLE MODULE PROGRESS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  initializeProgress,
  updateProgress,
  getCourseProgress,
  getMyProgress,
  toggleModuleProgress
};