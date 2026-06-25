const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// HELPER — Upload thumbnail to Supabase Storage
// ======================================================

const uploadThumbnail = async (file, courseId) => {
  const ext = file.mimetype === "image/png" ? "png" : "jpg";
  const fileName = `${courseId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("course-thumbnails")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("course-thumbnails")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// ======================================================
// HELPER — Delete old thumbnail from Supabase Storage
// ======================================================

const deleteThumbnail = async (thumbnailUrl) => {
  if (!thumbnailUrl) return;

  try {
    // Extract the file name from the public URL
    const parts = thumbnailUrl.split("/course-thumbnails/");
    if (parts.length < 2) return;

    const filePath = parts[1];
    await supabase.storage.from("course-thumbnails").remove([filePath]);
  } catch (err) {
    console.warn("[DELETE THUMBNAIL WARN]", err.message);
  }
};

// ======================================================
// CREATE COURSE
// ======================================================

const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
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
    // CREATE COURSE (without thumbnail first to get ID)
    // ==================================================

    const { data: course, error } = await supabase
      .from("courses")
      .insert([
        {
          title,
          slug,
          description,
          thumbnail_url: null,
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
    // UPLOAD THUMBNAIL (if file provided)
    // ==================================================

    if (req.file) {
      try {
        const thumbnailUrl = await uploadThumbnail(req.file, course.id);

        const { data: updatedCourse, error: updateError } = await supabase
          .from("courses")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", course.id)
          .select()
          .single();

        if (!updateError) {
          return res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: updatedCourse,
          });
        }
      } catch (uploadErr) {
        console.error("[THUMBNAIL UPLOAD ERROR]", uploadErr.message);
        // Course was created, but thumbnail failed — return course anyway
      }
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
    const courseId = req.params.courseId;

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
    const courseId = req.params.courseId;

    const {
      title,
      description,
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
    // UPLOAD NEW THUMBNAIL (if file provided)
    // ==================================================

    let thumbnailUrl = existingCourse.thumbnail_url;

    if (req.file) {
      // Delete old thumbnail from storage
      await deleteThumbnail(existingCourse.thumbnail_url);

      // Upload new thumbnail
      thumbnailUrl = await uploadThumbnail(req.file, courseId);
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

        thumbnail_url: thumbnailUrl,

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
    const courseId = req.params.courseId;

    // ==================================================
    // CHECK COURSE EXISTS

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id, thumbnail_url")
      .eq("id", courseId)
      .single();

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==================================================
    // DELETE THUMBNAIL FROM STORAGE
    // ==================================================

    await deleteThumbnail(existingCourse.thumbnail_url);

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
    const courseId = req.params.courseId;

    // ==================================================
    // CHECK COURSE EXISTS

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