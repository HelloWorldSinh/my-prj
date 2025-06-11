import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/SubmissionList.css';
import { FaSearch, FaArrowLeft, FaClipboardCheck, FaClock, FaCalendarAlt } from 'react-icons/fa';

const SubmissionList = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/submissions', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setSubmissions(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching submissions');
                setLoading(false);
                navigate('/login');
            }
        };
        fetchSubmissions();
    }, [navigate]);

    const handleBack = () => {
        navigate('/student');
    };

    const getScoreClass = (score, total) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'score-high';
        if (percentage >= 50) return 'score-medium';
        return 'score-low';
    };

    const filteredSubmissions = submissions.filter(sub => 
        sub.examTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="submissions-list-container">
            <div className="submissions-list-header">
                <h1 className="submissions-list-title">Bài kiểm tra đã làm</h1>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại trang chủ
                </button>
            </div>

            <div className="submissions-search-bar">
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài kiểm tra..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="search-icon" />
                </div>
            </div>

            {loading ? (
                <div className="no-submissions">
                    <FaClipboardCheck />
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : error ? (
                <div className="no-submissions">
                    <p>Lỗi: {error}</p>
                </div>
            ) : filteredSubmissions.length === 0 ? (
                <div className="no-submissions">
                    <FaClipboardCheck />
                    <p>{searchTerm ? 'Không tìm thấy bài kiểm tra phù hợp.' : 'Bạn chưa làm bài kiểm tra nào.'}</p>
                </div>
            ) : (
                <table className="submissions-table">
                    <thead>
                        <tr>
                            <th>Tên bài kiểm tra</th>
                            <th>Thời gian làm bài</th>
                            <th>Điểm số</th>
                            <th>Ngày nộp</th>
                            <th>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubmissions.map((sub) => {
                            const minutes = Math.floor(sub.timeUsed / 60);
                            const seconds = sub.timeUsed % 60;
                            const timeUsedStr = `${minutes} phút ${seconds} giây`;
                            const scoreClass = getScoreClass(sub.score, sub.totalQuestions);
                            
                            return (
                                <tr key={sub._id}>
                                    <td>{sub.examTitle}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FaClock style={{ color: 'var(--accent-color)' }} />
                                            {timeUsedStr}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="score-cell">
                                            <span className={`score-badge ${scoreClass}`}>
                                                {sub.score}/{sub.totalQuestions}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt style={{ color: 'var(--text-light)' }} />
                                            {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/result/${sub.examId}/${sub._id}`}
                                            className="view-details-button"
                                        >
                                            Xem chi tiết
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SubmissionList;