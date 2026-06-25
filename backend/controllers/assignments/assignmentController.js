const { supabaseAdmin: supabase } = require("../../config/supabase");

const createAssignment = async (req, res) => {
    try {
        const {
            title,
            description,
            course_id,
            due_date,
            max_marks,
            attachment_url
        } = req.body;

        const { data, error } = await supabase
            .from("assignments")
            .insert([
                {
                    title,
                    description,
                    course_id,
                    due_date,
                    max_marks,
                    attachment_url,
                    created_by: req.user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;

        const { data, error } = await supabase
            .from("assignments")
            .select("*")
            .eq("course_id", courseId)
            .order("created_at", { ascending: false });

        if (error) {
            if (error.code === 'PGRST205') {
                return res.status(200).json({ success: true, data: [] });
            }
            throw error;
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const { data, error } = await supabase
            .from("assignments")
            .select("*")
            .eq("id", assignmentId)
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const { data, error } = await supabase
            .from("assignments")
            .update({
                ...req.body,
                updated_at: new Date()
            })
            .eq("id", assignmentId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const { error } = await supabase
            .from("assignments")
            .delete()
            .eq("id", assignmentId);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Assignment deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const {
            submission_url,
            remarks
        } = req.body;

        const { data, error } = await supabase
            .from("assignment_submissions")
            .insert([
                {
                    assignment_id: assignmentId,
                    student_id: req.user.id,
                    submission_url,
                    remarks
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: "Assignment submitted successfully",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const { data, error } = await supabase
            .from("assignment_submissions")
            .select("*")
            .eq("assignment_id", assignmentId);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const {
            marks,
            feedback
        } = req.body;

        const { data, error } = await supabase
            .from("assignment_submissions")
            .update({
                marks,
                feedback
            })
            .eq("id", submissionId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Submission graded successfully",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    createAssignment,
    updateAssignment,
    deleteAssignment,

    getAssignment,
    getAssignments,

    submitAssignment,

    getAssignmentSubmissions: getSubmissions,

    gradeAssignmentSubmission: gradeSubmission
};