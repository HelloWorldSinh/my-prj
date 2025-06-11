import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/ExamList.css';
import { FaPlus, FaSearch, FaEye, FaPencilAlt, FaTrashAlt, FaSpinner, FaHome } from 'react-icons/fa';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/exams/teacher', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setExams(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching exams');
                setLoading(false);
                navigate("/login");
            }
        };

        fetchExams();
    }, [navigate]);

    const handleDelete = async (examId) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/exams/${examId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setExams(exams.filter((exam) => exam._id !== examId));
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting exam');
        }
    };    const handleViewDetails = (examId) => {
        navigate(`/exams/details/${examId}`);
    };
    
    const handleCreateExam = () => {
        navigate('/exams/create');
    };

    // Filter exams based on search term
    const filteredExams = exams.filter(exam => 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort exams based on selected option
    const sortedExams = [...filteredExams].sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'startTime') {
            return new Date(a.startTime) - new Date(b.startTime);
        } else if (sortBy === 'endTime') {
            return new Date(a.endTime) - new Date(b.endTime);
        } else {
            // Default sorting by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    // Determine exam status
    const getExamStatus = (startTime, endTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (now < start) {
            return { status: 'Sắp diễn ra', className: 'status-upcoming' };
        } else if (now > end) {
            return { status: 'Đã kết thúc', className: 'status-ended' };
        } else {
            return { status: 'Đang diễn ra', className: 'status-active' };
        }
    };

    if (loading) return <div className="loading-spinner"><FaSpinner size={40} style={{ animation: 'spin 1s linear infinite' }} /></div>;
    if (error) return <div className="error-message">Lỗi: {error}</div>;

    return (
        <div className="exam-list-container">            <div className="exam-list-header">
                <h2 className="exam-list-title">Danh sách đề thi của tôi</h2>                <div className="header-buttons">
                    <button className="back-home-button" onClick={() => navigate('/teacher')}>
                        <FaHome /> Quay về trang chủ
                    </button>
                    <button className="create-exam-button" onClick={handleCreateExam}>
                        <FaPlus /> Tạo đề thi mới
                    </button>
                </div>
            </div>
            
            <div className="exam-filter-section">
                <div className="search-exams">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề hoặc mã đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="exam-sort">
                    <label>Sắp xếp theo:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="createdAt">Mới nhất</option>
                        <option value="title">Tiêu đề</option>
                        <option value="startTime">Thời gian bắt đầu</option>
                        <option value="endTime">Thời gian kết thúc</option>
                    </select>
                </div>
            </div>
            
            {sortedExams.length === 0 ? (
                <div className="no-exams">
                    <p>Không tìm thấy đề thi nào. Hãy tạo đề thi đầu tiên của bạn!</p>
                </div>
            ) : (
                <table className="exam-table">
                    <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Mã đề</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedExams.map((exam) => {
                            const { status, className } = getExamStatus(exam.startTime, exam.endTime);
                            return (
                                <tr key={exam._id}>
                                    <td data-label="Tiêu đề">{exam.title}</td>
                                    <td data-label="Mã đề">{exam.code}</td>
                                    <td data-label="Thời gian">
                                        <div>Bắt đầu: {new Date(exam.startTime).toLocaleString('vi-VN')}</div>
                                        <div>Kết thúc: {new Date(exam.endTime).toLocaleString('vi-VN')}</div>
                                    </td>
                                    <td data-label="Trạng thái">
                                        <span className={`exam-status ${className}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td data-label="Thao tác">
                                        <div className="exam-actions">
                                            <button
                                                className="action-button view-button"
                                                onClick={() => handleViewDetails(exam._id)}
                                            >
                                                <FaEye /> Xem
                                            </button>
                                            <button
                                                className="action-button edit-button"
                                                onClick={() => navigate(`/exams/edit/${exam._id}`)}
                                            >
                                                <FaPencilAlt /> Sửa
                                            </button>
                                            <button
                                                className="action-button delete-button"
                                                onClick={() => handleDelete(exam._id)}
                                            >
                                                <FaTrashAlt /> Xóa
                                            </button>
                                        </div>                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
            
            {/* Phân trang (Có thể triển khai sau) */}
            {sortedExams.length > 0 && (
                <div className="pagination">
                    <button className="active">1</button>
                    <button>2</button>
                    <button>3</button>
                    <button>...</button>
                </div>
            )}
        </div>
    );
};

export default ExamList;