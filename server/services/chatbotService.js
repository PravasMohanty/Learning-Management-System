const Course = require("../models/Course");
exports.setCourseChatbot = (courseId, data) =>
  Course.findByIdAndUpdate(courseId, { chatbot: data }, { new: true });
exports.answer = async ({ courseId, message }) => {
  const course = await Course.findById(courseId);
  if (!course?.chatbot?.enabled) return { handled: false, answer: null };
  const found = course.chatbot.faq.find((f) =>
    message.toLowerCase().includes(f.question.toLowerCase()),
  );
  return {
    handled: !!found,
    answer:
      found?.answer ||
      "Thanks for your question. Our team will respond shortly.",
  };
};
