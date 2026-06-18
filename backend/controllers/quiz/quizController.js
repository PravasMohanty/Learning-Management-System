const fs = require("fs");

const { supabaseAdmin: supabase } = require("../../config/supabase");

const readQuizCSV = require("../../utils/csvQuizReader");

// ======================================================
// CREATE QUIZ FROM CSV
// ======================================================

const createQuizFromCSV = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    const {
      title,
      description,
      pass_percentage,
      time_limit,
    } = req.body;

    // ==================================================
    // VALIDATE FILE
    // ==================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    // ==================================================
    // CHECK MODULE EXISTS
    // ==================================================

    const { data: module, error: moduleError } = await supabase
      .from("course_modules")
      .select("id")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // ==================================================
    // CREATE QUIZ
    // ==================================================

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert([
        {
          module_id: moduleId,

          title,

          description: description || null,

          pass_percentage: pass_percentage || 40,

          time_limit: time_limit || null,
        },
      ])
      .select()
      .single();

    if (quizError) {
      return res.status(500).json({
        success: false,
        message: quizError.message,
      });
    }

    // ==================================================
    // READ CSV
    // ==================================================

    const parsedQuestions = await readQuizCSV(
      req.file.path
    );

    // ==================================================
    // ATTACH QUIZ ID
    // ==================================================

    const questions = parsedQuestions.map((question) => ({
      ...question,

      quiz_id: quiz.id,
    }));

    // ==================================================
    // INSERT QUESTIONS
    // ==================================================

    if (questions.length > 0) {
      const { error: questionError } = await supabase
        .from("quiz_questions")
        .insert(questions);

      if (questionError) {
        return res.status(500).json({
          success: false,
          message: questionError.message,
        });
      }
    }

    // ==================================================
    // DELETE TEMP FILE
    // ==================================================

    fs.unlinkSync(req.file.path);

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message: "Quiz created successfully",

      data: {
        quiz,

        total_questions: questions.length,
      },
    });
  } catch (error) {
    console.error("[CREATE QUIZ ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create quiz",
    });
  }
};

module.exports = {
  createQuizFromCSV,
};