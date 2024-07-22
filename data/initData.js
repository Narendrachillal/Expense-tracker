const mongoose = require("mongoose");

const User = require("../models/user");
const data = require("./expenses");

mongoose
  .connect("mongodb://127.0.0.1:27017/expenses")
  .then(() => console.log("Connected!"));

async function addData() {
  await User.deleteMany();
  await User.insertMany(data).then((result) => {
    console.log(result);
  });
}
addData();
