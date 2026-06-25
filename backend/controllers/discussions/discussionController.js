const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// CREATE DISCUSSION
// ======================================================

const createDiscussion = async (req, res) => {
  try {
    const authorId = req.user.id;
    const { course_id, module_id, title, body } = req.body;

    if (!course_id || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "course_id, title, and body are required",
      });
    }

    const { data, error } = await supabase
      .from("discussions")
      .insert([
        {
          course_id,
          module_id: module_id || null,
          author_id: authorId,
          title,
          body,
          status: "open",
          is_locked: false,
        },
      ])
      .select(
        `
        *,
        profiles:author_id (
          id, name, role
        )
      `
      )
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Discussion created",
      discussion: data,
    });
  } catch (error) {
    console.error("[CREATE DISCUSSION ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET COURSE DISCUSSIONS
// ======================================================

const getCourseDiscussions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { module_id, status, search } = req.query;

    let query = supabase
      .from("discussions")
      .select(
        `
        *,
        profiles:author_id (
          id, name, role
        )
      `
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (module_id) {
      query = query.eq("module_id", module_id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      discussions: data,
    });
  } catch (error) {
    console.error("[GET DISCUSSIONS ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET DISCUSSION BY ID (with replies)
// ======================================================

const getDiscussionById = async (req, res) => {
  try {
    const { discussionId } = req.params;

    // Fetch discussion
    const { data: discussion, error: dError } = await supabase
      .from("discussions")
      .select(
        `
        *,
        profiles:author_id (
          id, name, role
        ),
        courses:course_id (
          id, title
        ),
        course_modules:module_id (
          id, title
        )
      `
      )
      .eq("id", discussionId)
      .single();

    if (dError) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Fetch replies
    const { data: replies, error: rError } = await supabase
      .from("discussion_replies")
      .select(
        `
        *,
        profiles:author_id (
          id, name, role
        )
      `
      )
      .eq("discussion_id", discussionId)
      .order("created_at", { ascending: true });

    if (rError) throw rError;

    return res.status(200).json({
      success: true,
      discussion,
      replies: replies || [],
    });
  } catch (error) {
    console.error("[GET DISCUSSION ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE DISCUSSION (author only)
// ======================================================

const updateDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user.id;
    const { title, body } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from("discussions")
      .select("author_id")
      .eq("id", discussionId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (existing.author_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own discussions",
      });
    }

    const updateData = { updated_at: new Date() };
    if (title) updateData.title = title;
    if (body) updateData.body = body;

    const { data, error } = await supabase
      .from("discussions")
      .update(updateData)
      .eq("id", discussionId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Discussion updated",
      discussion: data,
    });
  } catch (error) {
    console.error("[UPDATE DISCUSSION ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE DISCUSSION (author or admin)
// ======================================================

const deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from("discussions")
      .select("author_id")
      .eq("id", discussionId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (existing.author_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own discussions",
      });
    }

    const { error } = await supabase
      .from("discussions")
      .delete()
      .eq("id", discussionId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Discussion deleted",
    });
  } catch (error) {
    console.error("[DELETE DISCUSSION ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADD REPLY
// ======================================================

const addReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const authorId = req.user.id;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        message: "Reply body is required",
      });
    }

    // Check if discussion exists and is not locked
    const { data: discussion } = await supabase
      .from("discussions")
      .select("id, is_locked")
      .eq("id", discussionId)
      .single();

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (discussion.is_locked) {
      return res.status(403).json({
        success: false,
        message: "This discussion is locked",
      });
    }

    const { data, error } = await supabase
      .from("discussion_replies")
      .insert([
        {
          discussion_id: discussionId,
          author_id: authorId,
          body,
        },
      ])
      .select(
        `
        *,
        profiles:author_id (
          id, name, role
        )
      `
      )
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Reply added",
      reply: data,
    });
  } catch (error) {
    console.error("[ADD REPLY ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE REPLY (author or admin)
// ======================================================

const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from("discussion_replies")
      .select("author_id")
      .eq("id", replyId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    if (existing.author_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own replies",
      });
    }

    const { error } = await supabase
      .from("discussion_replies")
      .delete()
      .eq("id", replyId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Reply deleted",
    });
  } catch (error) {
    console.error("[DELETE REPLY ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MARK RESOLVED (admin only)
// ======================================================

const markResolved = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const { data, error } = await supabase
      .from("discussions")
      .update({
        status: "resolved",
        updated_at: new Date(),
      })
      .eq("id", discussionId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Discussion marked as resolved",
      discussion: data,
    });
  } catch (error) {
    console.error("[MARK RESOLVED ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// TOGGLE LOCK (admin only)
// ======================================================

const toggleLock = async (req, res) => {
  try {
    const { discussionId } = req.params;

    // Get current state
    const { data: current } = await supabase
      .from("discussions")
      .select("is_locked")
      .eq("id", discussionId)
      .single();

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const { data, error } = await supabase
      .from("discussions")
      .update({
        is_locked: !current.is_locked,
        updated_at: new Date(),
      })
      .eq("id", discussionId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: data.is_locked
        ? "Discussion locked"
        : "Discussion unlocked",
      discussion: data,
    });
  } catch (error) {
    console.error("[TOGGLE LOCK ERROR]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDiscussion,
  getCourseDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  deleteReply,
  markResolved,
  toggleLock,
};
