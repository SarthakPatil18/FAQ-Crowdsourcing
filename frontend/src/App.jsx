import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Categories from "./pages/Categories";
import Contributors from "./pages/Contributors";
import Bookmarks from "./pages/Bookmarks";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/questions" element={<Questions />} />
      <Route path="/questions/:id" element={<QuestionDetail />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/contributors" element={<Contributors />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;