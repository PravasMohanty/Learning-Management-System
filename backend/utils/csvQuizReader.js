const fs = require("fs");
const csv = require("csv-parser");

// ======================================================
// READ QUIZ CSV
// ======================================================

const readQuizCSV = async (filePath) => {
  try {
    const questions = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())

        .on("data", (row) => {
          /*
                EXPECTED FORMAT:

                question,option1,option2,option3,option4,answer
            */

          const values = Object.values(row);

          if (values.length < 6) {
            return;
          }

          const questionText = values[0] ? values[0].trim() : "";
          const optA = values[1] ? values[1].trim() : "";
          const optB = values[2] ? values[2].trim() : "";
          const optC = values[3] ? values[3].trim() : "";
          const optD = values[4] ? values[4].trim() : "";
          const answerText = values[5] ? values[5].trim() : "";

          let correctOption = "A";
          if (answerText.toLowerCase() === optA.toLowerCase()) {
            correctOption = "A";
          } else if (answerText.toLowerCase() === optB.toLowerCase()) {
            correctOption = "B";
          } else if (answerText.toLowerCase() === optC.toLowerCase()) {
            correctOption = "C";
          } else if (answerText.toLowerCase() === optD.toLowerCase()) {
            correctOption = "D";
          } else {
            const ansUpper = answerText.toUpperCase();
            if (["A", "B", "C", "D"].includes(ansUpper)) {
              correctOption = ansUpper;
            }
          }

          questions.push({
            question: questionText,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_option: correctOption,
            marks: 1
          });
        })

        .on("end", resolve)

        .on("error", reject);
    });

    return questions;
  } catch (error) {
    console.error("[CSV READER ERROR]", error);

    throw error;
  }
};

module.exports = readQuizCSV;