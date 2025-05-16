import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
const StudentDashboard = () => {
    const [code, setCode] = useState("");
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://localhost:5000/api/exams/${code}`);
            navigate(`/exam/${res.data.code}`);
        } catch (error) {
            alert(error.response.data.message);
        }
    };
    const handleLogout = () => {
        logout(); // Gọi hàm logout từ AuthContext
        navigate("/login");
    };
    return (
        <div>
            <h2>Student Dashboard</h2>
            <button
                onClick={handleLogout}
                style={{ margin: "10px", padding: "5px 10px", cursor: "pointer" }}
            >
                Logout
            </button>
            <form onSubmit={handleJoin}>
                <input
                    type="text"
                    placeholder="Enter exam code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <button type="submit">Join Exam</button>
            </form>
        </div>
    );
};
export default StudentDashboard;
