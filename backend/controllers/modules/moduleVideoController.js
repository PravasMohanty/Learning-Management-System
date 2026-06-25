const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// ADD VIDEO TO MODULE
// ======================================================
const addVideo = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { title, video_url, video_order } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({
        success: false,
        message: "Title and video_url are required",
      });
    }

    let order = video_order;
    if (!order) {
      const { data: existing } = await supabase
        .from("module_videos")
        .select("video_order")
        .eq("module_id", moduleId)
        .order("video_order", { ascending: false })
        .limit(1);
      order = existing && existing.length > 0 ? existing[0].video_order + 1 : 1;
    }

    const { data: newVideo, error } = await supabase
      .from("module_videos")
      .insert([
        {
          module_id: moduleId,
          title,
          video_url,
          video_order: order,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Video added successfully",
      data: newVideo,
    });
  } catch (error) {
    console.error("[ADD MODULE VIDEO ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add video",
    });
  }
};

// ======================================================
// UPDATE VIDEO
// ======================================================
const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const { title, video_url, video_order } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (video_url !== undefined) updates.video_url = video_url;
    if (video_order !== undefined) updates.video_order = video_order;
    updates.updated_at = new Date();

    const { data: updatedVideo, error } = await supabase
      .from("module_videos")
      .update(updates)
      .eq("id", videoId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: updatedVideo,
    });
  } catch (error) {
    console.error("[UPDATE MODULE VIDEO ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update video",
    });
  }
};

// ======================================================
// DELETE VIDEO
// ======================================================
const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;

    const { error } = await supabase
      .from("module_videos")
      .delete()
      .eq("id", videoId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE MODULE VIDEO ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete video",
    });
  }
};

module.exports = {
  addVideo,
  updateVideo,
  deleteVideo,
};
