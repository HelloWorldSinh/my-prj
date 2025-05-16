import React, { useContext } from "react"; // Thêm useContext
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Điều chỉnh đường dẫn đúng

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext); // Sử dụng useContext để lấy logout

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div>
            <h2>Teacher Dashboard</h2>
            <button
                onClick={handleLogout}
                style={{ margin: "10px", padding: "5px 10px", cursor: "pointer" }}
            >
                Logout
            </button>
            <button onClick={() => navigate("/create-exam")}>Create New Exam</button>
        </div>
    );
};

export default TeacherDashboard;
