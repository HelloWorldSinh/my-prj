import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import axios from 'axios';

// Import các component
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import StudentDashboard from './components/Student/StudentDashBoard';
import TeacherDashboard from './components/Teacher/TeacherDashBoard';
import CreateExam from './components/Teacher/CreateExam';
import Exam from './components/Student/Exam';
import Result from './components/Result';
import ExamList from './components/Teacher/ExamList';
import HomePage from './components/Login/HomePage';
import SelectRole from './components/SelectRole';
import EditExam from './components/Teacher/EditExam';
import SubmissionList from './components/Student/SubmissionList';
import ExamDetails from './components/Teacher/ExamDetails';
import TeacherRoute from './components/TeacherRoute';
import MonitoringPage from './components/Teacher/MonitoringPage';


// =================================================================
// === CẤU HÌNH AXIOS TOÀN CỤC (HOÀN CHỈNH) ===

// 1. Interceptor cho REQUEST (Tự động đính kèm token VÀO MỌI YÊU CẦU)
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // Nếu có token, tự động thêm vào header Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Gửi request đi với config đã được cập nhật
  },
  error => {
    return Promise.reject(error);
  }
);

// 2. Interceptor cho RESPONSE (Xử lý khi token hết hạn)
axios.interceptors.response.use(
  response => {
    // Nếu response thành công, không làm gì cả
    return response;
  },
  error => {
    // Nếu có lỗi trả về
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

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
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/exam/:code" element={<Exam />} />
          <Route path="/result/:examId" element={<Result />} />
          <Route path="/exam-list" element={<ExamList />} />
          <Route path="/submissions-list" element={<SubmissionList />} />
          <Route path="/exams/edit/:examId" element={<EditExam />} />
          <Route path="/exams/details/:examId" element={<ExamDetails />} />
          <Route path="/result/:examId/:submissionId" element={<Result />} />

           <Route path="/monitor/exam/:examId" element={<TeacherRoute><MonitoringPage /></TeacherRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;