import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Exam.css';

const Exam = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);

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
                // Bật toàn màn hình
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
                const res = await axios.get(`http://localhost:5000/api/exams/${code}`);
                let questions = res.data.questions;

                // Thêm chỉ số gốc cho mỗi đáp án
                questions = questions.map(q => ({
                    ...q,
                    answers: q.answers.map((ans, idx) => ({
                        ...ans,
                        originalIndex: idx,
                    })),
                }));

                // Trộn câu hỏi nếu shuffleQuestions = true
                if (res.data.shuffleQuestions) {
                    questions = shuffleArray(questions);
                }

                // Trộn đáp án nếu shuffleAnswers = true
                if (res.data.shuffleAnswers) {
                    questions = questions.map(q => ({
                        ...q,
                        answers: shuffleArray(q.answers),
                    }));
                }

                setExam(res.data);
                setShuffledQuestions(questions);
                setAnswers(questions.map(() => null));
                setLoading(false);
            } catch (error) {
                alert(error.response.data.message);
                setLoading(false);
            }
        };
        fetchExam();
    }, [code]);

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

    const handleSubmit = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn nộp bài không?')) {
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
            <p style={{ color: 'red' }}>Số lần vi phạm: {violationCount} / 3</p>

            <div className="progress-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress.percent}%` }}
                    ></div>
                </div>
                <div className="progress-text">
                    Đã trả lời {progress.answered}/{progress.total} câu hỏi
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
            </div>

            <div className="navigation-buttons">
                <button
                    className="nav-button prev"
                    onClick={goToPrevQuestion}
                    disabled={currentQuestion === 0}
                >
                    Câu trước
                </button>
                <button
                    className="nav-button next"
                    onClick={goToNextQuestion}
                    disabled={currentQuestion === shuffledQuestions.length - 1}
                >
                    Câu tiếp theo
                </button>
            </div>

            {!isLocked && (
                <button className="submit-button" onClick={handleSubmit}>Nộp bài thi</button>
            )}

            {showAlert && (
                <div style={{
                    position: 'fixed',
                    top: '30%',
                    left: '30%',
                    backgroundColor: 'white',
                    border: '2px solid red',
                    padding: '20px',
                    zIndex: 9999,
                    textAlign: 'center'
                }}>
                    <h2>Cảnh báo!</h2>
                    <p>Chuyển tab hoặc thoát màn hình quá 3 lần. Bài thi kết thúc.</p>
                    <button onClick={handleConfirmCheating}>OK</button>
                </div>
            )}
            {/* <button className="submit-button" onClick={handleSubmit}>
                Nộp bài
            </button> */}
        </div>
    );
};

export default Exam;