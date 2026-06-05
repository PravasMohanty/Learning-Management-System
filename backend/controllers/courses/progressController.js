const { supabase } = require("../config/supabase");
const certificateService = require("../services/certificateService");

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
          completed: false,
          certificate_issued: false
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
    if (
      completed &&
      !data.certificate_issued
    ) {

      await certificateService.generateCertificate(
        studentId,
        courseId
      );

      await supabase
        .from("course_progress")
        .update({
          certificate_issued: true
        })
        .eq("id", data.id);
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

    const { data, error } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .single();

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

module.exports = {
  initializeProgress,
  updateProgress,
  getCourseProgress,
  getMyProgress
};