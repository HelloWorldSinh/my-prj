import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";
import logo from "../assets/logo.svg";

const TeacherDashboard = () => {
    const [userName, setUserName] = useState("Giáo viên");
    const [currentTime, setCurrentTime] = useState("");
    const [activeTab, setActiveTab] = useState("home");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const stats = {
        totalExams: 0,
        activeExams: 0,
        totalSubmissions: 0
    };

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

    const handleCreateExam = () => {
        navigate("/create-exam");
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
            case "exams":
                return renderExamsTab();
            case "stats":
                return renderStatsTab();
            case "settings":
                return renderSettingsTab();
            default:
                return renderHomeTab();
        }
    };

    // Tab trang chủ
    const renderHomeTab = () => (
        <>
            {/* Stats Cards */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Tổng số bài kiểm tra</h4>
                        <p>{stats.totalExams}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Bài kiểm tra đang hoạt động</h4>
                        <p>{stats.activeExams}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Tổng số bài nộp</h4>
                        <p>{stats.totalSubmissions}</p>
                    </div>
                </div>
            </div>

            {/* Recent Exams */}
            <div className="exams-section">
                <h3><i className="fas fa-clipboard-list"></i> Danh sách bài kiểm tra gần đây</h3>
                <div className="no-exams">
                    <i className="far fa-clipboard"></i>
                    <p>Chưa có bài kiểm tra nào</p>
                    <button className="btn btn-primary create-exam-btn" onClick={handleCreateExam}>
                        <span className="btn-content">
                            <i className="fas fa-plus animated-icon"></i>
                            <span>Tạo bài kiểm tra mới</span>
                        </span>
                        <span className="btn-shine"></span>
                    </button>
                </div>
            </div>
        </>
    );

    // Tab quản lý bài kiểm tra
    const renderExamsTab = () => (
        <div className="exams-section">
            <h3><i className="fas fa-clipboard-list"></i> Quản lý bài kiểm tra</h3>
            <div className="exam-actions">
                <button className="btn btn-primary create-exam-btn" onClick={handleCreateExam}>
                    <span className="btn-content">
                        <i className="fas fa-plus animated-icon"></i>
                        <span>Tạo bài kiểm tra mới</span>
                    </span>
                    <span className="btn-shine"></span>
                </button>

                <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Tìm kiếm bài kiểm tra..." />
                </div>

                <div className="filter-dropdown">
                    <button className="btn btn-secondary">
                        <i className="fas fa-filter"></i> Lọc
                    </button>
                </div>
            </div>

            <div className="exams-table">
                <div className="table-header">
                    <div className="th-title">Tên bài kiểm tra</div>
                    <div className="th-code">Mã bài</div>
                    <div className="th-date">Ngày tạo</div>
                    <div className="th-status">Trạng thái</div>
                    <div className="th-submissions">Số bài nộp</div>
                    <div className="th-actions">Thao tác</div>
                </div>

                <div className="no-exams">
                    <i className="far fa-clipboard"></i>
                    <p>Chưa có bài kiểm tra nào</p>
                </div>
            </div>
        </div>
    );

    // Tab thống kê kết quả
    const renderStatsTab = () => (
        <div className="analytics-section">
            <h3><i className="fas fa-chart-bar"></i> Thống kê kết quả</h3>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Học viên đã làm bài</h4>
                        <p>0</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Điểm trung bình</h4>
                        <p>0</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-star"></i>
                    </div>
                    <div className="stat-details">
                        <h4>Bài kiểm tra phổ biến nhất</h4>
                        <p>-</p>
                    </div>
                </div>
            </div>

            <div className="chart-container">
                <h4><i className="fas fa-chart-line"></i> Phân tích kết quả</h4>
                <div className="empty-chart">
                    <i className="far fa-chart-bar"></i>
                    <p>Chưa có dữ liệu để hiển thị biểu đồ</p>
                </div>
            </div>

            <div className="recent-submissions">
                <h4><i className="fas fa-clipboard-list"></i> Bài nộp gần đây</h4>
                <div className="no-data">
                    <i className="far fa-list-alt"></i>
                    <p>Chưa có bài nộp nào</p>
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
                        <span className="role-badge">Giáo viên</span>
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
                    <div className="form-group">
                        <label>Môn giảng dạy</label>
                        <input type="text" className="form-control" placeholder="Nhập môn giảng dạy" />
                    </div>
                </div>

                <div className="form-section">
                    <h4><i className="fas fa-bell"></i> Cài đặt thông báo</h4>

                    <div className="toggle-option">
                        <span>Nhận email thông báo khi có học viên nộp bài</span>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="toggle-option">
                        <span>Nhận thông báo tổng kết hàng tuần</span>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="form-section">
                    <h4><i className="fas fa-cog"></i> Cài đặt bài kiểm tra</h4>

                    <div className="form-group">
                        <label>Thời gian mặc định cho bài kiểm tra (phút)</label>
                        <input type="number" className="form-control" placeholder="30" />
                    </div>

                    <div className="toggle-option">
                        <span>Hiển thị đáp án sau khi học viên nộp bài</span>
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
                    </div>
                    <div
                        className={`menu-item ${activeTab === "exams" ? "active" : ""}`}
                        onClick={() => setActiveTab("exams")}
                    >
                        <i className="fas fa-clipboard-list"></i>
                        <span>Quản lý bài kiểm tra</span>
                    </div>
                    <div
                        className={`menu-item ${activeTab === "stats" ? "active" : ""}`}
                        onClick={() => setActiveTab("stats")}
                    >
                        <i className="fas fa-chart-bar"></i>
                        <span>Thống kê kết quả</span>
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
                    <div className="header-actions">                        <button className="btn btn-create create-exam-btn" onClick={handleCreateExam}>
                        <span className="btn-content">
                            <i className="fas fa-plus animated-icon"></i>
                            <span>Tạo bài kiểm tra mới</span>
                        </span>
                        <span className="btn-shine"></span>
                    </button>
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

export default TeacherDashboard;
