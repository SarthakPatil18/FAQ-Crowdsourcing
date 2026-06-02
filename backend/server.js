const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let questions = [
  {
    id: 1,
    question: "What is IIT Ropar VLED?",
    answer: "A virtual learning and internship initiative."
  }
];

app.get("/questions", (req, res) => {
  res.json(questions);
});

app.post("/questions", (req, res) => {
  const newQuestion = {
    id: questions.length + 1,
    question: req.body.question,
    answer: req.body.answer || ""
  };

  questions.push(newQuestion);

  res.json(newQuestion);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});