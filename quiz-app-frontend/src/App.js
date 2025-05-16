import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/student"
          element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher"
          element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-exam"
          element={user?.role === 'teacher' ? <CreateExam /> : <Navigate to="/login" />}
        />
        <Route
          path="/exam-list"
          element={user?.role === 'teacher' ? <ExamList /> : <Navigate to="/login" />}
        />
        <Route
          path="/exam/:code"
          element={user?.role === 'student' ? <Exam /> : <Navigate to="/login" />}
        />
        <Route
          path="/result/:examId"
          element={user?.role === 'student' ? <Result /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;