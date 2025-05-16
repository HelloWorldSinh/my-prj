import React, { useState } from "react";

const Register = () => {
    const [role, setRole] = useState("student");

    const handleGoogleRegister = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Tài Khoản Người Dùng</h2>
            <p>Đăng nhập hoặc tạo tài khoản để bắt đầu trải nghiệm</p>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ margin: "10px" }}
            >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
            <button
                onClick={handleGoogleRegister}
                style={{
                    background: "#4285F4",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                Đăng Ký
            </button>
            <div>
                <button
                    onClick={handleGoogleRegister}
                    style={{
                        background: "white",
                        border: "1px solid #d3d3d3",
                        padding: "10px",
                        cursor: "pointer",
                    }}
                >
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        style={{ width: "20px", marginRight: "10px" }}
                    />{" "}
                    Đăng Nhập
                </button>
            </div>
            <p style={{ color: "blue", cursor: "pointer" }}>Trợ Về Trang Chủ</p>
        </div>
    );
};

export default Register;
