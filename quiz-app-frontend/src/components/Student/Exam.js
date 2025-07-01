import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/Exam.css';

// Hàm định dạng thời gian theo múi giờ Việt Nam
const formatVietnamTime = (utcDate) => {
    const date = new Date(utcDate);
    if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).format(date);
};

const Exam = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeUsed, setTimeUsed] = useState(0);
    const [violationCount, setViolationCount] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [submissionId, setSubmissionId] = useState(null);
    const timerRef = useRef();

    // Hàm trộn mảng
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // useEffect chính để tải và bắt đầu bài thi
    useEffect(() => {
        const fetchExam = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/exams/${code}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const examData = res.data;

                const now = new Date();
                const start = new Date(examData.startTime);
                const end = new Date(examData.endTime);

                if (now < start) {
                    alert('Bài thi chưa bắt đầu!');
                    navigate('/student');
                    return;
                }
                if (now > end) {
                    alert('Bài thi đã kết thúc!');
                    navigate('/student');
                    return;
                }

                // Gọi API /start để tạo hoặc lấy submission đã có
                try {
                    const startResponse = await axios.post(
                        'http://localhost:5000/api/submissions/start',
                        { examId: examData._id },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    setSubmissionId(startResponse.data._id);
                } catch (startError) {
                    if (startError.response && startError.response.data.submission) {
                        setSubmissionId(startError.response.data.submission._id);
                    } else {
                        throw new Error("Không thể bắt đầu phiên làm bài.");
                    }
                }

                let processedQuestions = examData.questions.map((q) => ({
                    ...q,
                    answers: q.answers.map((ans, idx) => ({ ...ans, originalIndex: idx })),
                }));
                if (examData.shuffleQuestions) processedQuestions = shuffleArray(processedQuestions);
                if (examData.shuffleAnswers) {
                    processedQuestions = processedQuestions.map((q) => ({ ...q, answers: shuffleArray(q.answers) }));
                }

                setExam(examData);
                setShuffledQuestions(processedQuestions);
                setAnswers(processedQuestions.map(() => null));

                const durationInSeconds = (Number(examData.duration) || 0) * 60;
                const timeToEnd = Math.floor((end - now) / 1000);
                setTimeLeft(Math.min(durationInSeconds, timeToEnd));
                setTimeUsed(0);

            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi tải bài thi');
                navigate('/student');
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [code, navigate]);

    // useEffect đếm ngược thời gian
    useEffect(() => {
        if (loading || timeLeft <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
            setTimeUsed((prev) => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timerRef.current);
        };
    }, [loading, timeLeft]);

    // useEffect xử lý vi phạm
    useEffect(() => {
        const reportViolationAPI = async () => {
            if (!submissionId) return;
            try {
                const token = localStorage.getItem('token');
                await axios.patch(
                    `http://localhost:5000/api/submissions/report-violation/${submissionId}`,
                    {}, { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } catch (err) {
                console.error("Failed to report violation:", err);
            }
        };

        const handleViolation = () => {
            setViolationCount((prev) => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                    setShowAlert(true); //hiện cảnh báo
                    setIsLocked(true); // khóa giao diện

                }
                return newCount;
            });
            reportViolationAPI();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [submissionId]);


    useEffect(() => {
        // Nếu bài thi bị khóa do vi phạm
        if (isLocked && showAlert) {
            // Tạo một khoảng trễ 3 giây để người dùng đọc cảnh báo
            const autoSubmitTimer = setTimeout(() => {
                handleSubmit(true); // Sau 3 giây, tự động nộp bài
            }, 3000);

            // Dọn dẹp timer nếu component bị hủy
            return () => clearTimeout(autoSubmitTimer);
        }
    }, [isLocked, showAlert]); // useEffect này sẽ chạy khi isLocked hoặc showAlert thay đổi

    // Hàm xử lý khi chọn đáp án
    const handleAnswer = (questionIndex, answerIndex) => {
        if (isLocked) return;

        if (submissionId) {
            const token = localStorage.getItem('token');
            const originalAnswerIndex = shuffledQuestions[questionIndex].answers[answerIndex].originalIndex;
            axios.patch('http://localhost:5000/api/submissions/update-answer', {
                submissionId,
                questionId: shuffledQuestions[questionIndex]._id,
                selectedAnswer: originalAnswerIndex,
            }, { headers: { 'Authorization': `Bearer ${token}` } })
                .catch(err => console.error("Update answer failed:", err));
        }

        setAnswers((prev) => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = answerIndex;
            return newAnswers;
        });
    };

    // Hàm xử lý nộp bài
    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm('Bạn có chắc chắn muốn nộp bài không?')) return;

        setIsLocked(true); // Khóa không cho thao tác nữa
        clearInterval(timerRef.current);

        try {
            const token = localStorage.getItem('token');
            const submissionAnswers = shuffledQuestions.map((q, i) => ({
                questionId: q._id,
                selectedAnswer: answers[i] === null ? null : (exam.shuffleAnswers ? q.answers[answers[i]].originalIndex : answers[i]),
            }));

            const res = await axios.post('http://localhost:5000/api/submissions/submit', {
                submissionId: submissionId,
                answers: submissionAnswers,
                timeUsed,
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            alert(`Bạn đã nộp bài thành công! Điểm số: ${res.data.score}/${res.data.total}`);
            navigate('/submissions-list');

        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi nộp bài');
        }
    };

    // Các hàm phụ trợ và JSX
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const progress = () => {
        if (!shuffledQuestions || shuffledQuestions.length === 0) {
            return { percent: 0, answered: 0, total: 0 };
        }
        const answeredCount = answers.filter((a) => a !== null).length;
        return {
            percent: (answeredCount / shuffledQuestions.length) * 100,
            answered: answeredCount,
            total: shuffledQuestions.length,
        };
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div>Đang tải bài thi...</div>;

    if (!exam || !shuffledQuestions.length) return <div className="loading-container">Không tìm thấy bài thi hoặc bài thi không có câu hỏi.</div>;

    const currentQuestionData = shuffledQuestions[currentQuestion];

    return (
        <div className={`exam-container ${isLocked ? 'locked' : ''}`}>
            <h2 className="exam-title">{exam.title}</h2>
            <div className="exam-times">
                <p>Bắt đầu: {formatVietnamTime(exam.startTime)}</p>
                <p>Kết thúc: {formatVietnamTime(exam.endTime)}</p>
            </div>
            <div className="timer">
                Thời gian còn lại: <span style={{ color: timeLeft < 60 ? 'red' : 'inherit', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
            </div>
            <p style={{ color: 'red' }}>Số lần vi phạm: {violationCount} / 3</p>

            <div className="progress-container">
                <div className="progress-info">
                    <div className="progress-label">Tiến độ làm bài:</div>
                    <div className="progress-text">
                        Đã trả lời {progress().answered}/{progress().total} câu hỏi
                    </div>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress().percent}%` }}></div>
                </div>
            </div>

            <div className="pagination">
                {shuffledQuestions.map((_, index) => (
                    <div
                        key={index}
                        className={`pagination-item ${index === currentQuestion ? 'active' : ''} ${answers[index] !== null ? 'answered' : ''}`}
                        onClick={() => !isLocked && setCurrentQuestion(index)}
                    >
                        {index + 1}
                    </div>
                ))}
            </div>

            <div className="question-card">
                <div className="question-header">
                    Câu hỏi {currentQuestion + 1}/{shuffledQuestions.length}
                </div>
                <div className="question-content">
                    <div className="question-text">{currentQuestionData.content}</div>
                    {currentQuestionData.media && (
                        <div className="media-container">
                            {currentQuestionData.media.endsWith('.mp3') ? (
                                <audio className="audio-control" controls src={`http://localhost:5000${currentQuestionData.media}`} />
                            ) : (
                                <img className="question-image" src={`http://localhost:5000${currentQuestionData.media}`} alt="Hình ảnh câu hỏi" />
                            )}
                        </div>
                    )}
                    <div className="answers-container">
                        {currentQuestionData.answers.map((answer, aIndex) => (
                            <div
                                key={aIndex}
                                className={`answer-item ${answers[currentQuestion] === aIndex ? 'selected' : ''}`}
                                onClick={() => handleAnswer(currentQuestion, aIndex)}
                            >
                                <div className="answer-radio"></div>
                                <div className="answer-text">{answer.content}</div>
                                {answer.media && (
                                    <div className="answer-media">
                                        {answer.media.endsWith('.mp3') ? (
                                            <audio className="audio-control" controls src={`http://localhost:5000${answer.media}`} />
                                        ) : (
                                            <img src={`http://localhost:5000${answer.media}`} alt="Hình ảnh đáp án" style={{ maxWidth: '200px' }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="navigation-buttons">
                <button className="nav-button prev" onClick={() => setCurrentQuestion((prev) => prev - 1)} disabled={isLocked || currentQuestion === 0}>
                    Câu trước
                </button>
                <button className="nav-button next" onClick={() => setCurrentQuestion((prev) => prev + 1)} disabled={isLocked || currentQuestion === shuffledQuestions.length - 1}>
                    Câu tiếp theo
                </button>
            </div>

            {!isLocked && (
                <button className="submit-button" onClick={() => handleSubmit(false)}>
                    Nộp bài thi
                </button>
            )}

            {showAlert && (
                <div className="warning-dialog">
                    <div className="warning-content">
                        <h2>Cảnh báo!</h2>
                        <p>Bạn đã vi phạm quy chế thi quá 3 lần. Bài thi sẽ được tự động nộp.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exam;