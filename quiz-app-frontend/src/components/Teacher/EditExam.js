import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../CSS/CreateExam.css'; // Tái sử dụng CSS từ CreateExam.js

const EditExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState('');
    const [examCode, setExamCode] = useState('');
    const [questions, setQuestions] = useState([]);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);
    const [loading, setLoading] = useState(true);

    // Lấy dữ liệu bài thi khi component mount
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/exams/id/${examId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                const exam = response.data;
                setTitle(exam.title);
                setStartTime(new Date(exam.startTime).toISOString().slice(0, 16));
                setEndTime(new Date(exam.endTime).toISOString().slice(0, 16));
                setDuration(exam.duration);
                setExamCode(exam.code);
                setShuffleQuestions(exam.shuffleQuestions);
                setShuffleAnswers(exam.shuffleAnswers);
                setQuestions(
                    exam.questions.map((q) => ({
                        _id: q._id,
                        content: q.content,
                        answers: q.answers,
                        media: null,
                        mediaURL: q.media ? `http://localhost:5000${q.media}` : null,
                        mediaType: q.media ? (q.media.endsWith('.mp3') ? 'audio' : 'image') : null,
                        isEditing: false,
                    }))
                );
                setLoading(false);
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    toast.error('Session expired. Please log in again.');
                } else {
                    toast.error(error.response?.data?.message || 'Error fetching exam');
                }
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, navigate]);

    const getAnswerLabel = (index) => String.fromCharCode(65 + index); // 65 = 'A'

    const handleAddAnswer = (index) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].answers = [
            ...updatedQuestions[index].answers,
            { content: '', isCorrect: false },
        ];
        setQuestions(updatedQuestions);
    };

    const handleRemoveAnswer = (index, ansIndex) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[index].answers.length <= 1) {
            toast.error('At least one answer is required');
            return;
        }
        updatedQuestions[index].answers = updatedQuestions[index].answers.filter((_, i) => i !== ansIndex);
        setQuestions(updatedQuestions);
    };

    const handleAddQuestion = (index) => {
        const currentQuestion = questions[index];
        if (!currentQuestion.content || currentQuestion.answers.some(ans => !ans.content)) {
            toast.error('Please fill in all fields for the current question');
            return;
        }
        if (!currentQuestion.answers.some(ans => ans.isCorrect)) {
            toast.error('Each question must have at least one correct answer');
            return;
        }
        const updatedQuestions = questions.map((q, i) =>
            i === index ? { ...q, isEditing: false } : q
        );
        setQuestions([
            ...updatedQuestions,
            { content: '', answers: [{ content: '', isCorrect: false }], media: null, mediaURL: null, mediaType: null, isEditing: true },
        ]);
    };

    const handleRemoveQuestion = async (index) => {
        const question = questions[index];
        if (question._id) {
            try {
                await axios.delete(`http://localhost:5000/api/exams/questions/${question._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error deleting question');
                return;
            }
        }
        if (question.mediaURL && !question._id) {
            URL.revokeObjectURL(question.mediaURL);
        }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleEditQuestion = (index) => {
        const updatedQuestions = questions.map((q, i) => ({
            ...q,
            isEditing: i === index,
        }));
        setQuestions(updatedQuestions);
    };

    const handleUpdateQuestion = (index, field, value) => {
        const updatedQuestions = [...questions];
        if (field === 'content') {
            updatedQuestions[index][field] = value;
        } else if (field === 'media') {
            if (updatedQuestions[index].mediaURL && !updatedQuestions[index]._id) {
                URL.revokeObjectURL(updatedQuestions[index].mediaURL);
            }
            let mediaURL = null;
            let mediaType = null;
            if (value) {
                if (value.type.startsWith('image/')) {
                    mediaType = 'image';
                    mediaURL = URL.createObjectURL(value);
                } else if (value.type.startsWith('audio/')) {
                    mediaType = 'audio';
                    mediaURL = URL.createObjectURL(value);
                }
            }
            updatedQuestions[index].media = value;
            updatedQuestions[index].mediaURL = mediaURL;
            updatedQuestions[index].mediaType = mediaType;
        } else if (field === 'answers') {
            updatedQuestions[index].answers = value;
        }
        setQuestions(updatedQuestions);
    };

    const handleSaveChanges = async () => {
        const durationInMinutes = parseInt(duration);
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
            toast.error('Duration must be a positive integer (in minutes)');
            return;
        }
        if (end <= start) {
            toast.error('End time must be after start time');
            return;
        }
        if (questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }
        try {
            // Cập nhật thông tin bài thi
            await axios.patch(`http://localhost:5000/api/exams/${examId}`, {
                title,
                startTime,
                endTime,
                duration: durationInMinutes,
                shuffleQuestions,
                shuffleAnswers,
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            // Cập nhật hoặc thêm câu hỏi
            for (const question of questions) {
                if (!question.content || question.answers.some(ans => !ans.content)) {
                    toast.error('Please fill in all fields for all questions');
                    return;
                }
                if (!question.answers.some(ans => ans.isCorrect)) {
                    toast.error('Each question must have at least one correct answer');
                    return;
                }
                const formData = new FormData();
                formData.append('examId', examId);
                formData.append('content', question.content);
                formData.append('answers', JSON.stringify(question.answers));
                if (question.media) {
                    formData.append('media', question.media);
                }
                if (question._id) {
                    // Cập nhật câu hỏi hiện có
                    await axios.patch(`http://localhost:5000/api/exams/questions/${question._id}`, formData, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                } else {
                    // Thêm câu hỏi mới
                    await axios.post(`http://localhost:5000/api/exams/questions`, formData, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                }
            }

            // Thu hồi tất cả mediaURL
            questions.forEach(q => {
                if (q.mediaURL && !q._id) {
                    URL.revokeObjectURL(q.mediaURL);
                }
            });

            toast.success('Exam updated successfully');
            navigate('/exam-list'); // Chuyển hướng về danh sách bài thi
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
                toast.error('Session expired. Please log in again.');
            } else {
                toast.error(error.response?.data?.message || 'Error saving exam');
            }
        }
    };
    const handleCancel = () => {
        if (window.confirm('Bạn có chắc muốn hủy bỏ? Mọi thay đổi sẽ không được lưu.')) {
            questions.forEach(q => {
                if (q.mediaURL && !q._id) {
                    URL.revokeObjectURL(q.mediaURL);
                }
            });
            navigate('/exam-list');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="exam-creator">
            <h2 className="exam-title">Chỉnh sửa bài kiểm tra</h2>
            <div className="exam-code">
                <h3>Mã bài kiểm tra:</h3>
                <span className="exam-code-value">{examCode}</span>
            </div>
            <form className="exam-form">
                <input
                    type="text"
                    placeholder="Nhập tiêu đề bài kiểm tra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                />
                <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Thời lượng (phút)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    min="1"
                    step="1"
                />
            </form>
            {questions.map((question, index) => (
                <div
                    key={question._id || `new-${index}`}
                    className="question-card"
                    onClick={() => !question.isEditing && handleEditQuestion(index)}
                >
                    <div className="question-header">
                        <h4><i className="fas fa-question-circle"></i> Câu hỏi {index + 1}</h4>
                    </div>
                    {question.isEditing ? (
                        <div className="question-content">
                            <input
                                type="text"
                                className="question-input"
                                placeholder="Nhập nội dung câu hỏi"
                                value={question.content}
                                onChange={(e) => handleUpdateQuestion(index, 'content', e.target.value)}
                            />
                            <div className="file-input-container">
                                <label className="file-input-label">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <input
                                        type="file"
                                        className="file-input"
                                        accept="image/*,audio/*"
                                        onChange={(e) => handleUpdateQuestion(index, 'media', e.target.files[0])}
                                    />
                                    {question.media || question.mediaURL ? 'Đổi tệp' : 'Tải lên tệp đa phương tiện'}
                                </label>
                                <span className="file-name">{question.media ? question.media.name : ''}</span>
                            </div>
                            {question.mediaURL && question.mediaType === 'image' && (
                                <div className="media-preview">
                                    <img src={question.mediaURL} alt="Selected media" />
                                </div>
                            )}
                            {question.mediaURL && question.mediaType === 'audio' && (
                                <div className="media-preview">
                                    <audio controls src={question.mediaURL}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                            <div className="answer-list">
                                {question.answers.map((answer, ansIndex) => (
                                    <div key={ansIndex} className="answer-item">
                                        <div className="answer-label">{getAnswerLabel(ansIndex)}</div>
                                        <input
                                            type="text"
                                            className="answer-input"
                                            placeholder="Nhập nội dung đáp án"
                                            value={answer.content}
                                            onChange={(e) => {
                                                const newAnswers = [...question.answers];
                                                newAnswers[ansIndex].content = e.target.value;
                                                handleUpdateQuestion(index, 'answers', newAnswers);
                                            }}
                                        />
                                        <label className="correct-checkbox">
                                            Đáp án đúng
                                            <input
                                                type="checkbox"
                                                checked={answer.isCorrect}
                                                onChange={(e) => {
                                                    const newAnswers = [...question.answers];
                                                    newAnswers[ansIndex].isCorrect = e.target.checked;
                                                    handleUpdateQuestion(index, 'answers', newAnswers);
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-small"
                                            onClick={() => handleRemoveAnswer(index, ansIndex)}
                                        >
                                            <i className="fas fa-trash-alt"></i> Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="action-buttons">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handleAddAnswer(index)}
                                >
                                    <i className="fas fa-plus"></i> Thêm đáp án
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => handleAddQuestion(index)}
                                >
                                    <i className="fas fa-question-circle"></i> Thêm câu hỏi
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="question-view">
                            <div className="question-title">{question.content}</div>
                            {question.mediaURL && question.mediaType === 'image' && (
                                <div className="media-preview">
                                    <img src={question.mediaURL} alt="Question media" />
                                </div>
                            )}
                            {question.mediaURL && question.mediaType === 'audio' && (
                                <div className="media-preview">
                                    <audio controls src={question.mediaURL}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                            <ul className="answer-list-view">
                                {question.answers.map((ans, ansIndex) => (
                                    <li
                                        key={ansIndex}
                                        className={`answer-list-item ${ans.isCorrect ? 'correct' : ''}`}
                                    >
                                        <div className="answer-label-view">{getAnswerLabel(ansIndex)}</div>
                                        <div className="answer-content">{ans.content}</div>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQuestion(index);
                                }}
                                className="btn btn-danger"
                            >
                                <i className="fas fa-trash"></i> Xóa
                            </button>
                        </div>
                    )}
                </div>
            ))}
            <div className="shuffle-options">
                <label className="shuffle-option">
                    <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                    />
                    <i className="fas fa-random"></i> Trộn câu hỏi
                </label>
                <label className="shuffle-option">
                    <input
                        type="checkbox"
                        checked={shuffleAnswers}
                        onChange={(e) => setShuffleAnswers(e.target.checked)}
                    />
                    <i className="fas fa-random"></i> Trộn đáp án
                </label>
            </div>            <div className="buttons-container">
                <button onClick={handleCancel} className="cancel-btn">
                    <i className="fas fa-times"></i> Hủy bỏ
                </button>
                <button onClick={handleSaveChanges} className="complete-btn">
                    <i className="fas fa-save"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    );
};

export default EditExam;