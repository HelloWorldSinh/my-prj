import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "../CSS/Dashboard.css";
import logo from "../../assets/logo.svg";

const StudentDashboard = () => {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState("Học viên");
    const [currentTime, setCurrentTime] = useState("");
    const [activeTab, setActiveTab] = useState("home");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        // Cập nhật thời gian hiện tại
        const updateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentTime(now.toLocaleDateString('vi-VN', options));
        };

        updateTime();

        // Lấy tên người dùng từ email
        if (user && user.email) {
            const emailName = user.email.split("@")[0];
            setUserName(emailName);
        }
    }, [user]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            alert("Vui lòng nhập mã bài kiểm tra!");
            return;
        }

        setIsLoading(true);
        try {
            // First, check if the exam exists
            const examRes = await axios.get(
                `http://localhost:5000/api/exams/${code}`
            );
            // Check if the student has already submitted this exam
            const submissionRes = await axios.get(
                `http://localhost:5000/api/submissions/check-submission/${code}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (submissionRes.data.hasSubmitted) {
                alert("Bạn đã thi bài này rồi!");
                navigate("/student"); // Redirect to dashboard
                return;
            }

            // If no submission exists, proceed to the exam
            navigate(`/exam/${examRes.data.code}`);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Không tìm thấy bài kiểm tra với mã này"
            );
        } finally {
            setIsLoading(false);
        }
    };


    const handleLogout = async () => {
        await logout(navigate);
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    // Hàm hiển thị nội dung theo tab được chọn
    const renderContent = () => {
        switch (activeTab) {
            case "history":
                return renderHistoryTab();
            case "results":
                return renderResultsTab();
            case "settings":
                return renderSettingsTab();
            default:
                return renderHomeTab();
        }
    };

    // Tab trang chủ
    const renderHomeTab = () => (
        <>
            <div className="join-exam-card">
                <div className="card-header">
                    <h3><i className="fas fa-pen"></i> Tham gia bài kiểm tra</h3>
                </div>
                <div className="card-body">
                    <p>Nhập mã bài kiểm tra để bắt đầu làm bài</p>
                    <form onSubmit={handleJoin} className="join-form">
                        <div className="input-group code-input-group">
                            <i className="fas fa-key"></i>
                            <input
                                type="text"
                                placeholder="Nhập mã bài kiểm tra"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                disabled={isLoading}
                                className={`code-input ${code ? 'has-value' : ''}`}
                                autoComplete="off"
                                maxLength="10"
                            />
                            <span className="input-focus-effect"></span>
                            {code && (
                                <span className="clear-input" onClick={() => setCode("")}>
                                    <i className="fas fa-times-circle"></i>
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary join-btn"
                            disabled={isLoading || !code.trim()}
                        >                            <span className="btn-content">
                                {isLoading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        <span>Đang tìm...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-sign-in-alt"></i>
                                        <span>Tham gia</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="recent-exams-section">
                <h3><i className="fas fa-history"></i> Bài kiểm tra gần đây</h3>

                <div className="recent-exams-list">
                    <div className="no-exams">
                        <i className="far fa-clipboard"></i>
                        <p>Chưa có bài kiểm tra nào</p>
                    </div>
                </div>
            </div>
        </>
    );

    // Tab lịch sử bài kiểm tra
    const renderHistoryTab = () => (
        <div className="recent-exams-section">
            <h3><i className="fas fa-history"></i> Bài kiểm tra đã làm</h3>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Số bài đã tham gia</h4>
                        <p>0</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Đã hoàn thành</h4>
                        <p>0</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-trophy"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Điểm trung bình</h4>
                        <p>0</p>
                    </div>
                </div>
            </div>

            <div className="exams-table">
                <div className="table-header">
                    <div className="th-title">Tên bài kiểm tra</div>
                    <div className="th-date">Ngày thực hiện</div>
                    <div className="th-status">Trạng thái</div>
                    <div className="th-score">Điểm số</div>
                    <div className="th-actions">Xem chi tiết</div>
                </div>

                <div className="no-exams">
                    <i className="far fa-clipboard"></i>
                    <p>Chưa có bài kiểm tra nào</p>
                </div>
            </div>
        </div>
    );

    // Tab kết quả học tập
    const renderResultsTab = () => (
        <div className="recent-exams-section">
            <h3><i className="fas fa-chart-bar"></i> Kết quả học tập</h3>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-trophy"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Điểm cao nhất</h4>
                        <p>0</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Tỉ lệ đúng</h4>
                        <p>0%</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Thời gian trung bình</h4>
                        <p>0 phút</p>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h4><i className="fas fa-chart-line"></i> Biểu đồ tiến độ</h4>
                <div className="empty-chart">
                    <i className="far fa-chart-bar"></i>
                    <p>Chưa có dữ liệu để hiển thị biểu đồ</p>
                </div>
            </div>
        </div>
    );

    // Tab cài đặt tài khoản
    const renderSettingsTab = () => (
        <div className="settings-section">
            <h3><i className="fas fa-user-cog"></i> Cài đặt tài khoản</h3>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h3>{userName}</h3>
                        <p>{user?.email || "email@example.com"}</p>
                    </div>
                </div>

                <div className="form-section">
                    <h4><i className="fas fa-user"></i> Thông tin cá nhân</h4>
                    <div className="form-group">
                        <label>Họ và tên</label>
                        <input type="text" className="form-control" placeholder="Nhập họ và tên" />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={user?.email || ""} disabled />
                    </div>
                </div>

                <div className="form-section">
                    <h4><i className="fas fa-bell"></i> Cài đặt thông báo</h4>

                    <div className="toggle-option">
                        <span>Nhận email thông báo khi có bài kiểm tra mới</span>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="toggle-option">
                        <span>Nhận email thông báo kết quả bài kiểm tra</span>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button className="btn btn-secondary">Hủy thay đổi</button>
                    <button className="btn btn-primary">Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="dashboard-sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                    <span className="sidebar-title">Quiz App</span>
                </div>

                <div className="sidebar-menu">
                    <div
                        className={`menu-item ${activeTab === "home" ? "active" : ""}`}
                        onClick={() => setActiveTab("home")}
                    >
                        <i className="fas fa-home"></i>
                        <span>Trang chủ</span>
                    </div>                    <div
                        className={`menu-item ${activeTab === "history" ? "active" : ""}`}
                        onClick={() => navigate('/submissions-list')}
                    >
                        <i className="fas fa-clipboard-list"></i>
                        <span>Bài kiểm tra đã làm</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === "results" ? "active" : ""}`}
                        onClick={() => setActiveTab("results")}
                    >
                        <i className="fas fa-chart-bar"></i>
                        <span>Kết quả học tập</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === "settings" ? "active" : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        <i className="fas fa-user-cog"></i>
                        <span>Cài đặt tài khoản</span>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="logout-button" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                <div className="dashboard-header">
                    <div className="header-welcome">
                        <h2>Xin chào, {userName}!</h2>
                        <p>{currentTime}</p>
                    </div>
                    <div className="header-actions">
                        <div className="user-profile" onClick={toggleProfileDropdown}>
                            <div className="avatar">
                                {userName.charAt(0).toUpperCase()}
                            </div>

                            {showProfileDropdown && (
                                <div className="profile-dropdown">
                                    <div className="profile-header">
                                        <h4>{userName}</h4>
                                        <p>{user?.email || "email@example.com"}</p>
                                    </div>
                                    <div className="profile-menu">
                                        <div className="profile-menu-item" onClick={() => setActiveTab("settings")}>
                                            <i className="fas fa-user-cog"></i>
                                            <span>Cài đặt tài khoản</span>
                                        </div>
                                        <div className="profile-menu-item" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt"></i>
                                            <span>Đăng xuất</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
