import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const SelectRole = () => {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const location = useLocation();
  const googleId = new URLSearchParams(location.search).get("googleId");

  // Debug: Kiểm tra khi component được render
  console.log("SelectRole - googleId from query:", googleId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("SelectRole - Submitting role:", { googleId, role }); // Debug
    try {
      const res = await axios.post("http://localhost:5000/api/auth/set-role", {
        googleId,
        role,
      });
      console.log("SelectRole - Response from API:", res.data); // Debug
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify({ role: res.data.role }));
      console.log("SelectRole - Stored in localStorage:", {
        token: res.data.token,
        user: JSON.stringify({ role: res.data.role }),
      }); // Debug
      alert("Bạn đã đăng kí thành công, chuyển hướng qua trang đăng nhập");
      navigate("/login");
    } catch (error) {
      console.error(
        "SelectRole - Error setting role:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Failed to set role");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Select Your Role</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ margin: "10px" }}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <button
          type="submit"
          style={{
            background: "#4285F4",
            color: "white",
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Confirm Role
        </button>
      </form>
    </div>
  );
};

export default SelectRole;
