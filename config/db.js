require("dotenv").config();
const mongoose = require("mongoose");
function connectDB() {
  //db connection

  mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const connection = mongoose.connection;

  connection
    .once("open", () => {
      console.log("db connected");
    })
    .on("error", function (err) {
      console.log(err);
    });
}

module.exports = connectDB;
