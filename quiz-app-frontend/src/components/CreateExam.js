import React, { useState } from 'react';
import axios from 'axios';
import './CreateExam.css';

const CreateExam = () => {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [examId, setExamId] = useState(null);
    const [examCode, setExamCode] = useState('');
    const [questions, setQuestions] = useState([]);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleAnswers, setShuffleAnswers] = useState(false);
    const [duration, setDuration] = useState('');

    const getAnswerLabel = (index) => String.fromCharCode(65 + index); // 65 = 'A'

    const handleCreateExam = async (e) => {
        e.preventDefault();
        const durationInMinutes = parseInt(duration);
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
            alert('Thời gian làm bài phải là số nguyên dương (phút)');
            return;
        }
        if (end <= start) {
            alert('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/exams/create', {
                title,
                startTime,
                endTime,
                duration: durationInMinutes, // Gửi duration bằng phút
            });
            setExamId(res.data._id);
            setExamCode(res.data.code);
            setQuestions([{ content: '', answers: [{ content: '', isCorrect: false }], media: null, mediaURL: null, mediaType: null, isEditing: true }]);
            alert(`Exam created with code: ${res.data.code}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating exam');
        }
    };

    const handleAddAnswer = (index) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].answers = [
            ...updatedQuestions[index].answers,
            { content: '', isCorrect: false }
        ];
        setQuestions(updatedQuestions);
    };

    const handleRemoveAnswer = (index, ansIndex) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[index].answers.length <= 1) {
            alert('At least one answer is required');
            return;
        }
        updatedQuestions[index].answers = updatedQuestions[index].answers.filter((_, i) => i !== ansIndex);
        setQuestions(updatedQuestions);
    };

    const handleAddQuestion = (index) => {
        const currentQuestion = questions[index];
        if (!currentQuestion.content || currentQuestion.answers.some(ans => !ans.content)) {
            alert('Please fill in all fields for the current question');
            return;
        }
        const updatedQuestions = questions.map((q, i) =>
            i === index ? { ...q, isEditing: false } : q
        );
        setQuestions([
            ...updatedQuestions,
            { content: '', answers: [{ content: '', isCorrect: false }], media: null, mediaURL: null, mediaType: null, isEditing: true }
        ]);
    };

    const handleRemoveQuestion = (index) => {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        // Thu hồi mediaURL của câu hỏi bị xóa
        if (questions[index].mediaURL) {
            URL.revokeObjectURL(questions[index].mediaURL);
        }
        setQuestions(updatedQuestions);
    };

    const handleEditQuestion = (index) => {
        const updatedQuestions = questions.map((q, i) => ({
            ...q,
            isEditing: i === index
        }));
        setQuestions(updatedQuestions);
    };

    const handleUpdateQuestion = (index, field, value) => {
        const updatedQuestions = [...questions];
        if (field === 'content') {
            updatedQuestions[index][field] = value;
        } else if (field === 'media') {
            // Thu hồi mediaURL cũ nếu có
            if (updatedQuestions[index].mediaURL) {
                URL.revokeObjectURL(updatedQuestions[index].mediaURL);
            } let mediaURL = null;
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

    const handleCompleteExam = async () => {
        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }
        try {
            for (const question of questions) {
                if (!question.content || question.answers.some(ans => !ans.content)) {
                    alert('Please fill in all fields for all questions');
                    return;
                }
                const formData = new FormData();
                formData.append('examId', examId);
                formData.append('content', question.content);
                formData.append('answers', JSON.stringify(question.answers));
                if (question.media) formData.append('media', question.media);
                await axios.post('http://localhost:5000/api/exams/questions', formData);
            }
            //Cập nhật shuffleQuestions và shuffleAnswers
            await axios.patch(`http://localhost:5000/api/exams/${examId}`, {
                shuffleQuestions,
                shuffleAnswers
            });
            // Thu hồi tất cả mediaURL trước khi reset
            questions.forEach(q => {
                if (q.mediaURL) URL.revokeObjectURL(q.mediaURL);
            });
            alert('Exam completed and questions saved');
            setQuestions([]);
            setExamId(null);
            setExamCode('');
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    return (
        <div className="exam-creator">
            <h2 className="exam-title">Tạo bài kiểm tra</h2>
            {!examId ? (
                <form onSubmit={handleCreateExam} className="exam-form">                    <input
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
                        placeholder="Thời gian bắt đầu"
                    />
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        placeholder="Thời gian kết thúc"
                    />
                    <input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        min="1"
                        step="1"
                    />
                    <button type="submit" className="btn btn-primary">
                        <i className="fas fa-plus-circle"></i> Tạo bài kiểm tra
                    </button>
                </form>
            ) : (
                <div>                    <div className="exam-code">
                    <h3>Mã bài kiểm tra:</h3>
                    <span className="exam-code-value">{examCode}</span>
                </div>
                    {questions.map((question, index) => (
                        <div
                            key={index}
                            className="question-card"
                            onClick={() => !question.isEditing && handleEditQuestion(index)}
                        >                            <div className="question-header">
                                <h4><i className="fas fa-question-circle"></i> Câu hỏi {index + 1}</h4>
                            </div>
                            {question.isEditing ? (
                                <div className="question-content">                                    <input
                                    type="text"
                                    className="question-input"
                                    placeholder="Nhập nội dung câu hỏi"
                                    value={question.content}
                                    onChange={(e) => handleUpdateQuestion(index, 'content', e.target.value)}
                                /><div className="file-input-container">
                                        <label className="file-input-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <input
                                                type="file"
                                                className="file-input"
                                                accept="image/*,audio/*"
                                                onChange={(e) => handleUpdateQuestion(index, 'media', e.target.files[0])}
                                            />
                                            {question.media ? 'Đổi tệp' : 'Tải lên tệp đa phương tiện'}
                                        </label>
                                        <span className="file-name">{question.media ? question.media.name : ''}</span>
                                    </div>
                                    {question.mediaURL && question.mediaType === 'image' && (
                                        <div className="media-preview">
                                            <img
                                                src={question.mediaURL}
                                                alt="Selected media"
                                            />
                                        </div>
                                    )}
                                    {question.mediaURL && question.mediaType === 'audio' && (
                                        <div className="media-preview">
                                            <audio
                                                controls
                                                src={question.mediaURL}
                                            >
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    )}
                                    <div className="answer-list">
                                        {question.answers.map((answer, ansIndex) => (
                                            <div
                                                key={ansIndex}
                                                className="answer-item"
                                            >
                                                <div className="answer-label">{getAnswerLabel(ansIndex)}</div>                                                <input
                                                    type="text"
                                                    className="answer-input"
                                                    placeholder="Nhập nội dung đáp án"
                                                    value={answer.content}
                                                    onChange={(e) => {
                                                        const newAnswers = [...question.answers];
                                                        newAnswers[ansIndex].content = e.target.value;
                                                        handleUpdateQuestion(index, 'answers', newAnswers);
                                                    }}
                                                />                                                <label className="correct-checkbox">
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
                                                </label><button
                                                    type="button"
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => handleRemoveAnswer(index, ansIndex)}
                                                >
                                                    <i className="fas fa-trash-alt"></i> Xóa
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="action-buttons">                                        <button
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
                                            <img
                                                src={question.mediaURL}
                                                alt="Question media"
                                            />
                                        </div>
                                    )}
                                    {question.mediaURL && question.mediaType === 'audio' && (
                                        <div className="media-preview">
                                            <audio
                                                controls
                                                src={question.mediaURL}
                                            >
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
                                    </ul>                                    <button
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
                    ))}                    <div className="shuffle-options">
                        <label className="shuffle-option">
                            <input
                                type="checkbox"
                                checked={shuffleQuestions}
                                onChange={(e) => setShuffleQuestions(e.target.checked)}
                            />
                            <i className="fas fa-random"></i>
                            Trộn câu hỏi
                        </label>
                        <label className="shuffle-option">
                            <input
                                type="checkbox"
                                checked={shuffleAnswers}
                                onChange={(e) => setShuffleAnswers(e.target.checked)}
                            />
                            <i className="fas fa-random"></i>
                            Trộn đáp án
                        </label>
                    </div>                    <button
                        onClick={handleCompleteExam}
                        className="complete-btn"
                    >
                        <i className="fas fa-paper-plane"></i> Hoàn thành bài kiểm tra
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreateExam;