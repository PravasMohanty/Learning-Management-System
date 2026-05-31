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

          questions.push({
            question: values[0],

            options: [
              values[1],
              values[2],
              values[3],
              values[4],
            ],

            correct_answer: values[5],

            points: PROCESS.env.QUIZ_POINTS_PER_QUESTION || 10,
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