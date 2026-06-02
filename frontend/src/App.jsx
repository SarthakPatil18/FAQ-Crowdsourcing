import { useEffect, useState } from "react";

function App() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  const fetchQuestions = () => {
    fetch("http://localhost:5000/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;

    await fetch("http://localhost:5000/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: newQuestion,
      }),
    });

    setNewQuestion("");
    fetchQuestions();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>FAQ Crowdsourcing Platform</h1>

      <input
        type="text"
        placeholder="Enter a question"
        value={newQuestion}
        onChange={(e) => setNewQuestion(e.target.value)}
      />

      <button onClick={handleSubmit}>
        Submit Question
      </button>

      <hr />

      {questions.map((q) => (
        <div key={q.id}>
          <h3>{q.question}</h3>
          <p>{q.answer}</p>
        </div>
      ))}
    </div>
  );
}

export default App;