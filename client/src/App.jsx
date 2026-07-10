import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import ResumeUpload from "./pages/ResumeUpload.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/upload" element={<ResumeUpload />} />
    </Routes>
  );
}
