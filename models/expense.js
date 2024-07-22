const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const expenseSchema = Schema({
  Category: {
    type: String,
  },
  Description: {
    type: String,
  },
  Amount: {
    type: Number,
  },
  Author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const expense = mongoose.model("expense", expenseSchema);

module.exports = expense;
