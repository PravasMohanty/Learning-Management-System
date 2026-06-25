const fs = require("fs");
const csv = require("csv-parser");

// ======================================================
// READ USER CSV
// ======================================================

const csvUserReader = async (filePath) => {
  try {
    const users = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())

        .on("data", (row) => {
          /*
                EXPECTED FORMAT:

                name,email,password
            */

          const values = Object.values(row);

          if (values.length < 3) {
            return;
          }

          users.push({
            name: values[0],
            email: values[1],
            password: values[2],
          });
        })

        .on("end", resolve)

        .on("error", reject);
    });

    return users;

  } catch (error) {
    console.error("[CSV USER READER ERROR]", error);

    throw error;
  }
};

module.exports = csvUserReader;