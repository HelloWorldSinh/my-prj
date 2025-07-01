import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../CSS/ExamDetails.css';
import { FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';

const socket = io('http://localhost:5000');

const MonitoringPage = () => {
    const { examId } = useParams();
    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // === SỬA LỖI TẠI ĐÂY: Thêm 'headers' chứa token vào các lệnh gọi API ===
                const token = localStorage.getItem('token');
                
                // Lấy thông tin chung của bài thi
                const examRes = await axios.get(`http://localhost:5000/api/exams/id/${examId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setExam(examRes.data);

                // Lấy danh sách những người đã bắt đầu làm bài
                const submissionsRes = await axios.get(`http://localhost:5000/api/submissions/exam/${examId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSubmissions(submissionsRes.data);
                
            } catch (err) {
                setError(err.response?.data?.message || "Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        socket.emit('join_exam_room', examId);

        socket.on('student_started', (newSubmission) => {
            setSubmissions(prev => [...prev, newSubmission]);
        });

        socket.on('progress_updated', ({ submissionId, answers }) => {
            setSubmissions(prev => prev.map(sub =>
                sub._id === submissionId ? { ...sub, answers } : sub
            ));
        });

        socket.on('violation_updated', ({ submissionId, violationCount }) => {
            setSubmissions(prev => prev.map(sub =>
                sub._id === submissionId ? { ...sub, violationCount } : sub
            ));
        });

        socket.on('submission_finished', ({ submissionId, status, score }) => {
            setSubmissions(prev => prev.map(sub =>
                sub._id === submissionId ? { ...sub, status, score } : sub
            ));
        });

        return () => {
            socket.off('student_started');
            socket.off('progress_updated');
            socket.off('violation_updated');
            socket.off('submission_finished');
        };
    }, [examId]);

    const handleBack = () => {
        navigate('/exam-list');
    };

    const filteredSubmissions = submissions.filter(sub =>
        sub.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="exam-details-container">
            <div className="no-submissions"><FaSpinner className="fa-spin" /><p>Đang tải dữ liệu giám sát...</p></div>
        </div>
    );

    if (error) return (
        <div className="exam-details-container">
            <div className="no-submissions">
                <p>Lỗi: {error}</p>
                <button className="back-button" onClick={handleBack}><FaArrowLeft /> Quay lại</button>
            </div>
        </div>
    );

    const totalQuestions = exam?.questions?.length || 0;

    return (
        <div className="exam-details-container">
            <div className="exam-details-header">
                <h1 className="exam-details-title">Giám sát thi trực tiếp</h1>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại danh sách đề thi
                </button>
            </div>

            {exam && (
                <div className="exam-info">
                    <div className="info-card primary"><h4>Tên bài kiểm tra</h4><p>{exam.title}</p></div>
                    <div className="info-card"><h4>Mã bài kiểm tra</h4><p>{exam.code}</p></div>
                    <div className="info-card"><h4>Số câu hỏi</h4><p>{totalQuestions}</p></div>
                    <div className="info-card"><h4>Số học viên tham gia</h4><p>{submissions.length}</p></div>
                </div>
            )}

            <div className="submissions-section">
                <div className="submissions-search-bar">
                    <div className="search-input-container">
                        <input type="text" placeholder="Tìm kiếm theo email học viên..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <FaSearch className="search-icon" />
                    </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                    <div className="no-submissions"><p>Chưa có học viên nào tham gia...</p></div>
                ) : (
                    <table className="submissions-table">
                        <thead>
                            <tr>
                                <th>Email học viên</th>
                                <th>Tiến độ</th>
                                <th>Số lỗi vi phạm</th>
                                <th>Trạng thái</th>
                                <th>Điểm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.map((sub) => (
                                <tr key={sub._id}>
                                    <td>{sub.studentId?.email || '...'}</td>
                                    <td><span className="score-badge score-medium">{`${sub.answers.length} / ${totalQuestions}`}</span></td>
                                    <td><span className={sub.violationCount > 0 ? 'score-badge score-low' : ''}>{sub.violationCount}</span></td>
                                    <td><span className={`exam-status ${sub.status === 'submitted' ? 'status-ended' : 'status-active'}`}>{sub.status === 'submitted' ? 'Đã nộp' : 'Đang làm bài'}</span></td>
                                    <td>{sub.status === 'submitted' ? (<span className="score-badge score-high">{`${sub.score}/${totalQuestions}`}</span>) : 'Chưa có'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MonitoringPage;