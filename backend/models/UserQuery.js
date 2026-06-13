const mongoose = require("mongoose");

const userQuerySchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending"
    },
    source: {
      type: String,
      default: "frontend"
    },
    promoted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userQuerySchema.index({
  question: "text",
  answer: "text"
});

module.exports = mongoose.model("UserQuery", userQuerySchema);
