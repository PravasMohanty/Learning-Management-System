const { supabase } = require("../config/supabase");

// ======================================================
// CREATE COURSE
// ======================================================

const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      thumbnail_url,
      price,
      level,
      category,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // ==================================================
    // GENERATE SLUG
    // ==================================================

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");

    // ==================================================
    // CHECK DUPLICATE SLUG
    // ==================================================

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "Course with similar title already exists",
      });
    }

    // ==================================================
    // CREATE COURSE
    // ==================================================

    const { data: course, error } = await supabase
      .from("courses")
      .insert([
        {
          title,
          slug,
          description,

          thumbnail_url: thumbnail_url || null,

          price: price || 0,

          level: level || "beginner",

          category: category || null,

          published: false,

          created_by: req.user.id,
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
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("[CREATE COURSE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// ======================================================
// GET ALL COURSES
// ======================================================

const getAllCourses = async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("[GET COURSES ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

// ======================================================
// GET COURSE BY ID
// ======================================================

const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error || !course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("[GET COURSE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};

// ======================================================
// UPDATE COURSE
// ======================================================

const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const {
      title,
      description,
      thumbnail_url,
      price,
      level,
      category,
    } = req.body;

    // ==================================================
    // CHECK COURSE EXISTS
    // ==================================================

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // UPDATE COURSE
    // ==================================================

    const { data: updatedCourse, error } = await supabase
      .from("courses")
      .update({
        title: title || existingCourse.title,

        description:
          description || existingCourse.description,

        thumbnail_url:
          thumbnail_url || existingCourse.thumbnail_url,

        price:
          price !== undefined
            ? price
            : existingCourse.price,

        level: level || existingCourse.level,

        category: category || existingCourse.category,

        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("[UPDATE COURSE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// ======================================================
// DELETE COURSE
// ======================================================

const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // ==================================================
    // CHECK COURSE EXISTS
    // ==================================================

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // DELETE COURSE
    // ==================================================

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE COURSE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

// ======================================================
// PUBLISH COURSE
// ======================================================

const publishCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // ==================================================
    // CHECK COURSE EXISTS
    // ==================================================

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // PUBLISH
    // ==================================================

    const { data: publishedCourse, error } = await supabase
      .from("courses")
      .update({
        published: true,

        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course published successfully",
      data: publishedCourse,
    });
  } catch (error) {
    console.error("[PUBLISH COURSE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to publish course",
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
};