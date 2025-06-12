import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/Exam.css';

// Hàm định dạng thời gian theo múi giờ Việt Nam, có kiểm tra tính hợp lệ
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
  const [violationCount, setviolationCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef();
  const saveTimeoutRef = useRef();

  // Hàm trộn mảng câu hỏi/đáp án
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Lưu trạng thái bài thi vào localStorage
  const saveExamState = useCallback(() => {
    if (!exam) return;
    const state = {
      answers,
      timeLeft,
      timeUsed,
      shuffledQuestions,
      examId: exam._id,
      endTime: exam.endTime,
      violationCount // lưu số lần vi phạm
    };
    try {
      localStorage.setItem(`exam_${code}`, JSON.stringify(state));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, [exam, answers, timeLeft, timeUsed, shuffledQuestions, violationCount, code]);

  // Xóa trạng thái cũ khỏi localStorage
  const clearExamState = useCallback(() => {
    try {
      localStorage.removeItem(`exam_${code}`);
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }, [code]);

  // Tải trạng thái từ localStorage (nếu có)
  const loadExamState = () => {
    try {
      const saved = localStorage.getItem(`exam_${code}`);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      return null;
    }
  };

  // Gọi API lấy thông tin bài thi
  useEffect(() => {
    let mounted = true;
    const fetchExam = async () => {
      setLoading(true);
      try {
        const savedState = loadExamState();
        const now = new Date();

        if (savedState && new Date(savedState.endTime) > now) {
          setExam({ _id: savedState.examId, endTime: savedState.endTime });
          setAnswers(savedState.answers);
          setShuffledQuestions(savedState.shuffledQuestions);
          setTimeLeft(savedState.timeLeft);
          setTimeUsed(savedState.timeUsed);
          setviolationCount(savedState.violationCount || 0); // Lấy số lần vi phạm từ trạng thái lưu
          setLoading(false);
          return;
        } else {
          clearExamState();
        }

        const res = await axios.get(`http://localhost:5000/api/exams/${code}`);
        if (!mounted) return;

        const { startTime, endTime, duration, questions, shuffleQuestions, shuffleAnswers } = res.data;
        const start = new Date(startTime);
        const end = new Date(endTime);

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

        // Xử lý câu hỏi/đáp án
        let processedQuestions = questions.map((q) => ({
          ...q,
          answers: q.answers.map((ans, idx) => ({ ...ans, originalIndex: idx })),
        }));
        if (shuffleQuestions) processedQuestions = shuffleArray(processedQuestions);
        if (shuffleAnswers) {
          processedQuestions = processedQuestions.map((q) => ({
            ...q,
            answers: shuffleArray(q.answers),
          }));
        }

        setExam(res.data);
        setShuffledQuestions(processedQuestions);
        setAnswers(processedQuestions.map(() => null));

        const durationInSeconds = (Number(duration) || 40) * 60;
        const timeToEnd = Math.floor((end - now) / 1000);
        setTimeLeft(Math.min(durationInSeconds, timeToEnd));
        setTimeUsed(0);
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi tải bài thi');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
    return () => { mounted = false; };
  }, [code, navigate, clearExamState]);
  // gọi saveState mỗi khi có thay đổi
  useEffect(() => {
    saveExamState();
  }, [violationCount, saveExamState]);

  // Đếm ngược thời gian & lưu trạng thái định kỳ
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(saveTimeoutRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeUsed((prev) => prev + 1);
    }, 1000);

    saveTimeoutRef.current = setInterval(saveExamState, 5000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(saveTimeoutRef.current);
    };
  }, [loading, timeLeft, saveExamState]);

  useEffect(() => {
    window.addEventListener('beforeunload', saveExamState);
    return () => window.removeEventListener('beforeunload', saveExamState);
  }, [saveExamState]);

  // Phát hiện hành vi gian lận (chuyển tab/thoát toàn màn hình)
  useEffect(() => {
    const handleViolation = () => {
      setviolationCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setShowAlert(true);
          setIsLocked(true);
        }
        return newCount;
      });
    };
    const handleVisibilityChange = () => document.hidden && handleViolation();
    const handleFullscreenChange = () => !document.fullscreenElement && handleViolation();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !window.confirm('Bạn có chắc chắn muốn nộp bài không?')) return;
    clearInterval(timerRef.current);
    clearInterval(saveTimeoutRef.current);
    clearExamState();
    try {
      const submissionAnswers = shuffledQuestions.map((q, i) => ({
        questionId: q._id,
        selectedAnswer:
          answers[i] === null ? null : exam.shuffleAnswers ? q.answers[answers[i]].originalIndex : answers[i],
      }));

      const res = await axios.post('http://localhost:5000/api/submissions', {
        examId: exam._id,
        answers: submissionAnswers,
        timeUsed,
      });
      navigate(`/result/${exam._id}/${res.data.submissionId}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi nộp bài');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = () => {
    const answeredCount = answers.filter((a) => a !== null).length;
    return {
      percent: (answeredCount / shuffledQuestions.length) * 100,
      answered: answeredCount,
      total: shuffledQuestions.length,
    };
  };

  // Hiển thị loading hoặc lỗi bài thi
  if (loading) return <div className="loading-container"><div className="loading-spinner"></div>Đang tải bài thi...</div>;
  if (!exam || !shuffledQuestions.length)
    return <div className="loading-container">Không tìm thấy bài thi hoặc bài thi không có câu hỏi.</div>;

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
      <p style={{ color: 'red' }}>Số lần vi phạm: {violationCount} / 3</p>

      {/* Tiến độ làm bài */}
      <div className="progress-container">
        <div className="progress-info">
          <div className="progress-label">Tiến độ làm bài:</div>
          <div className="progress-text">
            <i className="fas fa-check-circle"></i> Đã trả lời {progress().answered}/{progress().total} câu hỏi
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress().percent}%` }}></div>
        </div>
      </div>

      {/* Chuyển nhanh câu hỏi */}
      <div className="pagination">
        {shuffledQuestions.map((_, index) => (
          <div
            key={index}
            className={`pagination-item ${index === currentQuestion ? 'active' : ''} ${answers[index] !== null ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Hiển thị câu hỏi */}
      <div className="question-card">
        <div className="question-header">
          <i className="fas fa-question-circle"></i> Câu hỏi {currentQuestion + 1}/{shuffledQuestions.length}
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

      {/* Điều hướng câu hỏi */}
      <div className="navigation-buttons">
        <button className="nav-button prev" onClick={() => setCurrentQuestion((prev) => prev - 1)} disabled={currentQuestion === 0}>
          <i className="fas fa-chevron-left"></i> Câu trước
        </button>
        <button
          className="nav-button next"
          onClick={() => setCurrentQuestion((prev) => prev + 1)}
          disabled={currentQuestion === shuffledQuestions.length - 1}
        >
          Câu tiếp theo <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {!isLocked && (
        <button className="submit-button" onClick={() => handleSubmit(false)}>
          <i className="fas fa-paper-plane"></i> Nộp bài thi
        </button>
      )}

      {/* Hiển thị cảnh báo vi phạm */}
      {showAlert && (
        <div className="warning-dialog">
          <div className="warning-content">
            <div className="warning-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2>Cảnh báo!</h2>
            <p>Chuyển tab hoặc thoát màn hình quá 3 lần. Bài thi đã kết thúc.</p>
            <button className="warning-button" onClick={() => navigate(`/result/${exam._id}`)}>
              <i className="fas fa-check"></i> Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;