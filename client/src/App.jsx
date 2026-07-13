import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import ResumeUpload from "./pages/ResumeUpload.jsx";
import CareerPicker from "./pages/CareerPicker.jsx";
import ResumeOptimization from "./pages/ResumeOptimization.jsx";
import ReadinessReport from "./pages/ReadinessReport.jsx";
import React from "react";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/upload" element={<ResumeUpload />} />
      <Route path="/careers" element={<CareerPicker />} />
      <Route path="/optimize" element={<ResumeOptimization />} />
      <Route path="/report" element={<ReadinessReport />} />
    </Routes>
  );
}
