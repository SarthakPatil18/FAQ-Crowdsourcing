const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    keywords: {
      type: [String],
      default: []
    },
    sourceQueryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserQuery",
      default: null
    }
  },
  {
    timestamps: true
  }
);

faqSchema.index({
  question: "text",
  answer: "text",
  keywords: "text"
});

module.exports = mongoose.model("FAQ", faqSchema);
