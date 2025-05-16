import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashBoard';
import TeacherDashboard from './components/TeacherDashBoard';
import CreateExam from './components/CreateExam';
import Exam from './components/Exam';
import Result from './components/Result';
import ExamList from './components/ExamList';
import HomePage from './components/HomePage';
import SelectRole from './components/SelectRole';


const DashboardRedirect = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    const role = new URLSearchParams(location.search).get("role");
    console.log("DashboardRedirect - Token and Role from query:", {
      token,
      role,
    }); // Debug
    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ role }));
      setUser({ role });
    } else {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      console.log(
        "DashboardRedirect - Stored user from localStorage:",
        storedUser
      ); // Debug
      if (storedUser && storedUser.role) {
        setUser(storedUser);
      }
    }
  }, [location]);

  if (!user) {
    console.log("DashboardRedirect - No user, redirecting to /login"); // Debug
    return <Navigate to="/login" />;
  }

  console.log("DashboardRedirect - User role:", user.role); // Debug
  if (user.role === "student") {
    console.log("DashboardRedirect - Navigating to /student"); // Debug
    return <Navigate to="/student" />;
  } else if (user.role === "teacher") {
    console.log("DashboardRedirect - Navigating to /teacher"); // Debug
    return <Navigate to="/teacher" />;
  } else {
    console.log("DashboardRedirect - Invalid role, redirecting to /login"); // Debug
    return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-role" element={<SelectRole />} /> {/* Add this */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/create-exam" element={<CreateExam />} />
        <Route path="/exam/:code" element={<Exam />} />
        <Route path="/result/:examId" element={<Result />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/exam-list" element={<ExamList />} />
      </Routes>
    </Router>
  );
};

export default App;