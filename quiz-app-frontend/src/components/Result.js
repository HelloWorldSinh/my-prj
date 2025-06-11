import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/Result.css';
import { FaArrowLeft, FaClock, FaCheck, FaTimes, FaTrophy, FaShare } from 'react-icons/fa';

const Result = () => {
    const { examId, submissionId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResult = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/submissions/${examId}/${submissionId}`);
                setResult(res.data);
                setLoading(false);
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching result');
                setLoading(false);
            }
        };
        fetchResult();
    }, [examId, submissionId]);

    const handleBack = () => {
        navigate(-1); // Quay lại trang trước đó
    };

    if (loading) return (
        <div className="result-container">
            <div className="no-submissions">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải kết quả...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="result-container">
            <div className="no-submissions">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Lỗi: {error}</p>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại
                </button>
            </div>
        </div>
    );

    if (!result || !result.exam || !result.submission) return (
        <div className="result-container">
            <div className="no-submissions">
                <p>Không tìm thấy kết quả</p>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại
                </button>
            </div>
        </div>
    );

    let timeUsedStr = '';
    if (result.submission.timeUsed !== undefined) {
        const minutes = Math.floor(result.submission.timeUsed / 60);
        const seconds = result.submission.timeUsed % 60;
        timeUsedStr = `${minutes} phút ${seconds} giây`;
    }

    // Tính tỷ lệ đúng
    const correctCount = result.submission.score || 0;
    const totalQuestions = result.exam.questions.length;
    const correctPercentage = Math.round((correctCount / totalQuestions) * 100);    return (
        <div className="result-container">
            <div className="result-header">
                <h1 className="result-title">Kết quả bài kiểm tra</h1>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại
                </button>
            </div>

            <div className="result-summary">
                <div className="summary-card primary">
                    <div className="summary-card-icon">
                        <i className="fas fa-trophy"></i>
                    </div>
                    <h3>Điểm số</h3>
                    <p>{result.submission.score}/{result.exam.questions.length}</p>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon">
                        <i className="fas fa-percentage"></i>
                    </div>
                    <h3>Tỷ lệ đúng</h3>
                    <p>{correctPercentage}%</p>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <h3>Thời gian làm bài</h3>
                    <p>{timeUsedStr}</p>
                </div>
            </div>

            <div className="questions-list">
                <h2>Chi tiết các câu hỏi</h2>
                
                {result.exam.questions.map((question, index) => {
                    const submissionAnswer = result.submission.answers.find(
                        ans => ans.questionId === question._id
                    );
                    
                    const isCorrect = submissionAnswer && 
                        question.answers[submissionAnswer.selectedAnswer]?.isCorrect;
                    
                    return (
                        <div key={question._id} className="question-card">
                            <div className="question-header">
                                <span className="question-number">Câu hỏi {index + 1}</span>
                                <span className={`question-status ${isCorrect ? 'status-correct' : 'status-incorrect'}`}>
                                    {isCorrect ? (
                                        <>
                                            <i className="fas fa-check-circle"></i> Đúng
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-times-circle"></i> Sai
                                        </>
                                    )}
                                </span>
                            </div>

                            <div className="question-content">{question.content}</div>
                            
                            {question.media && (
                                <div className="question-media">
                                    {question.media.endsWith('.mp3') ? (
                                        <audio controls src={`http://localhost:5000${question.media}`} />
                                    ) : (
                                        <img src={`http://localhost:5000${question.media}`} alt="Hình ảnh câu hỏi" />
                                    )}
                                </div>
                            )}

                            <ul className="answers-list">
                                {question.answers.map((answer, aIndex) => {
                                    let answerClass = '';
                                    
                                    if (answer.isCorrect) {
                                        answerClass = 'correct';
                                    } else if (submissionAnswer && submissionAnswer.selectedAnswer === aIndex && !answer.isCorrect) {
                                        answerClass = 'incorrect';
                                    }
                                    
                                    const isSelected = submissionAnswer && submissionAnswer.selectedAnswer === aIndex;
                                    
                                    return (
                                        <li 
                                            key={aIndex} 
                                            className={`answer-item ${answerClass} ${isSelected ? 'user-selected' : ''}`}
                                        >
                                            <div className={`answer-marker ${answerClass || 'default'}`}>
                                                {String.fromCharCode(65 + aIndex)}
                                            </div>
                                            
                                            <div className="answer-content">
                                                {answer.content}
                                            </div>
                                            
                                            {answer.isCorrect && (
                                                <div className="answer-status correct">
                                                    <i className="fas fa-check-circle"></i>
                                                    Đáp án đúng
                                                </div>
                                            )}
                                            
                                            {isSelected && !answer.isCorrect && (
                                                <div className="answer-status incorrect">
                                                    <i className="fas fa-times-circle"></i>
                                                    Bạn đã chọn
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Result;