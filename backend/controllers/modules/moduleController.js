const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// CREATE MODULE
// ======================================================

const createModule = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const {
      title,
      content,
      video_url,
      lesson_order,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Module title is required",
      });
    }

    // ==================================================
    // CHECK COURSE EXISTS
    // ==================================================

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // CREATE MODULE
    // ==================================================

    const { data: newModule, error } = await supabase
      .from("course_modules")
      .insert([
        {
          course_id: courseId,
          title,
          content: content || null,
          video_url: video_url || null,
          lesson_order: lesson_order || 1,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      data: newModule,
    });
  } catch (error) {
    console.error("[CREATE MODULE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create module",
    });
  }
};

// ======================================================
// GET ALL MODULES OF COURSE
// ======================================================

const getCourseModules = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // ==================================================
    // CHECK COURSE EXISTS
    // ==================================================

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // FETCH MODULES
    // ==================================================

    const { data: modules, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_order", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error("[GET MODULES ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch modules",
    });
  }
};

// ======================================================
// UPDATE MODULE
// ======================================================

const updateModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    const {
      title,
      content,
      video_url,
      lesson_order,
    } = req.body;

    // ==================================================
    // CHECK MODULE EXISTS
    // ==================================================

    const { data: existingModule } = await supabase
      .from("course_modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // ==================================================
    // UPDATE MODULE
    // ==================================================

    const { data: updatedModule, error } = await supabase
      .from("course_modules")
      .update({
        title: title !== undefined ? title : existingModule.title,
        content: content !== undefined ? content : existingModule.content,
        video_url: video_url !== undefined ? video_url : existingModule.video_url,
        lesson_order: lesson_order !== undefined ? lesson_order : existingModule.lesson_order,
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Module updated successfully",
      data: updatedModule,
    });
  } catch (error) {
    console.error("[UPDATE MODULE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update module",
    });
  }
};

// ======================================================
// DELETE MODULE
// ======================================================

const deleteModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    // ==================================================
    // CHECK MODULE EXISTS
    // ==================================================

    const { data: existingModule } = await supabase
      .from("course_modules")
      .select("id")
      .eq("id", moduleId)
      .single();

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // ==================================================
    // DELETE MODULE
    // ==================================================

    const { error } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", moduleId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE MODULE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete module",
    });
  }
};

module.exports = {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
};
