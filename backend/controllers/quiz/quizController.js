const fs = require("fs");
const { supabaseAdmin: supabase } = require("../../config/supabase");
const readQuizCSV = require("../../utils/csvQuizReader");

// ======================================================
// CREATE QUIZ FROM CSV (Admin Only)
// ======================================================

const createQuizFromCSV = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    const {
      title,
      description,
      pass_percentage, // support legacy
      passing_marks,
      time_limit,
    } = req.body;

    const limitMin = time_limit ? parseInt(time_limit) : null;
    const finalPassingMarks = passing_marks ? parseInt(passing_marks) : (pass_percentage ? parseInt(pass_percentage) : 40);

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
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // ==================================================
    // READ CSV
    // ==================================================

    let parsedQuestions = [];
    try {
      parsedQuestions = await readQuizCSV(req.file.path);
    } catch (csvErr) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Failed to parse CSV file: " + csvErr.message,
      });
    }

    if (parsedQuestions.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "CSV file contains no valid questions",
      });
    }

    // Calculate total marks (1 mark per question by default)
    const totalMarks = parsedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

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
          passing_marks: finalPassingMarks,
          total_marks: totalMarks,
          time_limit: limitMin,
        },
      ])
      .select()
      .single();

    if (quizError) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: quizError.message,
      });
    }

    // ==================================================
    // ATTACH QUIZ ID & INSERT QUESTIONS
    // ==================================================

    const questions = parsedQuestions.map((question) => ({
      ...question,
      quiz_id: quiz.id,
    }));

    const { error: questionError } = await supabase
      .from("quiz_questions")
      .insert(questions);

    if (questionError) {
      // Cleanup created quiz if question insert fails
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: questionError.message,
      });
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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create quiz",
    });
  }
};

// ======================================================
// GET QUIZZES BY MODULE
// ======================================================

const getQuizzesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET SINGLE QUIZ (Admin View — with answers)
// ======================================================

const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: true });

    if (questionsError) throw questionsError;

    return res.status(200).json({
      success: true,
      data: {
        ...quiz,
        questions: questions || [],
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET SINGLE QUIZ (Student View — without correct answers)
// ======================================================

const getQuizStudent = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, question, option_a, option_b, option_c, option_d, marks")
      .eq("quiz_id", quizId)
      .order("id", { ascending: true });

    if (questionsError) throw questionsError;

    return res.status(200).json({
      success: true,
      data: {
        ...quiz,
        questions: questions || [],
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// DELETE QUIZ
// ======================================================

const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// START QUIZ ATTEMPT (Student)
// ======================================================

const startQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert([
        {
          quiz_id: quizId,
          student_id: studentId,
          score: 0,
          completed: false,
          started_at: new Date(),
        },
      ])
      .select()
      .single();

    if (attemptError) throw attemptError;

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, question, option_a, option_b, option_c, option_d, marks")
      .eq("quiz_id", quizId)
      .order("id", { ascending: true });

    if (questionsError) throw questionsError;

    return res.status(201).json({
      success: true,
      message: "Quiz attempt started",
      data: {
        attempt,
        questions: questions || [],
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// SUBMIT QUIZ ATTEMPT (Student)
// ======================================================

const submitQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // [{ question_id, selected_option }]

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found",
      });
    }

    if (attempt.completed) {
      return res.status(400).json({
        success: false,
        message: "Attempt already completed",
      });
    }

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", attempt.quiz_id);

    if (questionsError) throw questionsError;

    let score = 0;
    const answerInserts = [];

    for (const question of questions) {
      const studentAns = (answers || []).find((a) => a.question_id === question.id);
      const selected = studentAns ? studentAns.selected_option : null;
      const isCorrect = selected === question.correct_option;

      if (isCorrect) {
        score += question.marks || 1;
      }

      answerInserts.push({
        attempt_id: attemptId,
        question_id: question.id,
        selected_option: selected,
        is_correct: isCorrect,
      });
    }

    if (answerInserts.length > 0) {
      const { error: answersError } = await supabase
        .from("quiz_answers")
        .insert(answerInserts);

      if (answersError) throw answersError;
    }

    const { data: updatedAttempt, error: updateError } = await supabase
      .from("quiz_attempts")
      .update({
        score,
        completed: true,
        submitted_at: new Date(),
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "Quiz attempt submitted successfully",
      data: updatedAttempt,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET QUIZ ATTEMPT RESULTS
// ======================================================

const getQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quiz:quizzes(*)
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", attempt.quiz_id)
      .order("id", { ascending: true });

    if (questionsError) throw questionsError;

    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("attempt_id", attemptId);

    if (answersError) throw answersError;

    const questionsWithAnswers = questions.map((q) => {
      const ans = (answers || []).find((a) => a.question_id === q.id);
      return {
        ...q,
        selected_option: ans ? ans.selected_option : null,
        is_correct: ans ? ans.is_correct : false,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        attempt,
        questions: questionsWithAnswers,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET STUDENT QUIZ ATTEMPTS
// ======================================================

const getQuizAttemptsForStudent = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("student_id", studentId)
      .order("started_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET ALL QUIZ ATTEMPTS (Admin View)
// ======================================================

const getQuizAttemptsForAdmin = async (req, res) => {
  try {
    const { quizId } = req.params;

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        student:profiles(id, name, email)
      `)
      .eq("quiz_id", quizId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createQuizFromCSV,
  getQuizzesByModule,
  getQuiz,
  getQuizStudent,
  deleteQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempt,
  getQuizAttemptsForStudent,
  getQuizAttemptsForAdmin,
};