import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Exam.css';

const formatVietnamTime = (utcDate) =>
    new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).format(new Date(utcDate));

const Exam = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeUsed, setTimeUsed] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef();

    const [violationCount, setViolationCount] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [isLocked, setIsLocked] = useState(false);



    // Hàm trộn mảng (Fisher-Yates shuffle)
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    useEffect(() => {
        const fetchExam = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/exams/${code}`);
                const now = new Date();
                const start = new Date(res.data.startTime);
                const end = new Date(res.data.endTime);

                // Kiểm tra thời gian truy cập
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    alert('Thời gian bài thi không hợp lệ!');
                    navigate('/');
                    return;
                }
                if (now < start) {
                    alert('Bài thi chưa bắt đầu!');
                    navigate('/');
                    return;
                }
                if (now > end) {
                    alert('Bài thi đã kết thúc!');
                    navigate('/');
                    return;
                }

                let questions = res.data.questions.map(q => ({
                    ...q,
                    answers: q.answers.map((ans, idx) => ({
                        ...ans,
                        originalIndex: idx,
                    })),
                }));

                if (res.data.shuffleQuestions) {
                    questions = shuffleArray(questions);
                }
                if (res.data.shuffleAnswers) {
                    questions = questions.map(q => ({
                        ...q,
                        answers: shuffleArray(q.answers),
                    }));
                }

                setExam(res.data);
                setShuffledQuestions(questions);
                setAnswers(questions.map(() => null));

                // Kiểm tra duration
                const duration = Number(res.data.duration);
                if (!duration || isNaN(duration) || duration <= 0) {
                    console.warn('Invalid duration, using default 40 minutes');
                    alert('Thời gian làm bài không hợp lệ, sử dụng mặc định 40 phút.');
                }

                // Khởi tạo timer từ duration
                const durationInSeconds = (duration || 40) * 60;
                const timeToEnd = Math.floor((end - now) / 1000);
                const timeRemaining = Math.min(durationInSeconds, timeToEnd); // Bắt đầu từ duration, giới hạn bởi endTime

                console.log({
                    durationMinutes: duration || 40,
                    durationSeconds: durationInSeconds,
                    timeToEndSeconds: timeToEnd,
                    timeLeftSeconds: timeRemaining,
                    now: now.toISOString(),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    code: res.data.code
                });

                setTimeLeft(timeRemaining);
                setTimeUsed(0); // Bắt đầu từ 0
                setLoading(false);
            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi tải bài thi');
                setLoading(false);
                navigate('/');
            }
        };
        fetchExam();
    }, [code, navigate]);

    useEffect(() => {
        if (loading || timeLeft <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true); // Tự động nộp
                    return 0;
                }
                return prev - 1;
            });
            setTimeUsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [loading, timeLeft]);

    // Phát hiện chuyển tab 
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolationCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        setShowAlert(true);
                        setIsLocked(true);
                    }
                    return newCount;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Phát hiện thoát màn hình
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setViolationCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        setShowAlert(true);
                        setIsLocked(true);
                    }
                    return newCount;
                });
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);


    const handleConfirmCheating = () => {
        navigate(`/result/${exam._id}`);
    };

    const handleAnswer = (questionIndex, answerIndex) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = answerIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm('Bạn có chắc chắn muốn nộp bài không?')) {
            return;
        }

        try {
            // Map lại chỉ số đáp án theo thứ tự gốc
            const submissionAnswers = shuffledQuestions.map((q, i) => {
                const selectedAnswer = answers[i];
                return {
                    questionId: q._id,
                    selectedAnswer: selectedAnswer === null
                        ? null
                        : exam.shuffleAnswers
                            ? q.answers[selectedAnswer].originalIndex
                            : selectedAnswer,
                };
            });

            const submission = {
                examId: exam._id,
                answers: submissionAnswers,
                timeUsed
            };
            await axios.post('http://localhost:5000/api/submissions', submission);
            navigate(`/result/${exam._id}`);
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestion < shuffledQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const goToPrevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const goToQuestion = (index) => {
        setCurrentQuestion(index);
    };

    const calculateProgress = () => {
        const answeredCount = answers.filter(a => a !== null).length;
        return {
            percent: (answeredCount / shuffledQuestions.length) * 100,
            answered: answeredCount,
            total: shuffledQuestions.length
        };
    };
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <span>Đang tải bài thi...</span>
            </div>
        );
    }

    if (!exam || !shuffledQuestions.length) {
        return (
            <div className="loading-container">
                <p>Không tìm thấy bài thi hoặc bài thi không có câu hỏi.</p>
            </div>
        );
    }

    const progress = calculateProgress();
    const currentQuestionData = shuffledQuestions[currentQuestion];

    return (
        <div className="exam-container">
            <h2 className="exam-title">{exam.title}</h2>
            <div className="exam-times">
                <p>Bắt đầu: {formatVietnamTime(exam.startTime)}</p>
                <p>Kết thúc: {formatVietnamTime(exam.endTime)}</p>
            </div>
            <div className="timer">
                Thời gian còn lại: <span style={{ color: timeLeft < 60 ? 'red' : 'inherit', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
            </div>
            <p style={{ color: 'red' }}>Số lần vi phạm: {violationCount} / 3</p>            <div className="progress-container">
                <div className="progress-info">
                    <div className="progress-label">Tiến độ làm bài:</div>
                    <div className="progress-text">
                        <i className="fas fa-check-circle"></i> Đã trả lời {progress.answered}/{progress.total} câu hỏi
                    </div>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress.percent}%` }}
                    ></div>
                </div>
            </div>

            <div className="pagination">
                {shuffledQuestions.map((_, index) => (
                    <div
                        key={index}
                        className={`pagination-item ${index === currentQuestion ? 'active' : ''} ${answers[index] !== null ? 'answered' : ''}`}
                        onClick={() => goToQuestion(index)}
                    >
                        {index + 1}
                    </div>
                ))}
            </div>            <div className="question-card">
                <div className="question-header">
                    <i className="fas fa-question-circle"></i> Câu hỏi {currentQuestion + 1}/{shuffledQuestions.length}
                </div>
                <div className="question-content">
                    <div className="question-text">{currentQuestionData.content}</div>

                    {currentQuestionData.media && (
                        <div className="media-container">
                            {currentQuestionData.media.endsWith('.mp3') ? (
                                <audio
                                    className="audio-control"
                                    controls
                                    src={`http://localhost:5000${currentQuestionData.media}`}
                                />
                            ) : (
                                <img
                                    className="question-image"
                                    src={`http://localhost:5000${currentQuestionData.media}`}
                                    alt="Hình ảnh câu hỏi"
                                />
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
                                            <audio
                                                className="audio-control"
                                                controls
                                                src={`http://localhost:5000${answer.media}`}
                                            />
                                        ) : (
                                            <img
                                                src={`http://localhost:5000${answer.media}`}
                                                alt="Hình ảnh đáp án"
                                                style={{ maxWidth: '200px' }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>            <div className="navigation-buttons">
                <button
                    className="nav-button prev"
                    onClick={goToPrevQuestion}
                    disabled={currentQuestion === 0}
                >
                    <i className="fas fa-chevron-left"></i> Câu trước
                </button>
                <button
                    className="nav-button next"
                    onClick={goToNextQuestion}
                    disabled={currentQuestion === shuffledQuestions.length - 1}
                >
                    Câu tiếp theo <i className="fas fa-chevron-right"></i>
                </button>
            </div>            {!isLocked && (
                <button className="submit-button" onClick={() => handleSubmit(false)}>
                    <i className="fas fa-paper-plane"></i> Nộp bài thi
                </button>
            )}{showAlert && (
                <div className="warning-dialog">
                    <div className="warning-content">
                        <div className="warning-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2>Cảnh báo!</h2>
                        <p>Chuyển tab hoặc thoát màn hình quá 3 lần. Bài thi đã kết thúc.</p>
                        <button className="warning-button" onClick={handleConfirmCheating}>
                            <i className="fas fa-check"></i> Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exam;