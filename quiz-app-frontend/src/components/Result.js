import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Result = () => {
    const { examId, submissionId } = useParams();
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/submissions/${examId}/${submissionId}`);
                setResult(res.data);
            } catch (error) {
                alert(error.response?.data?.message || 'Error fetching result');
            }
        };
        fetchResult();
    }, [examId, submissionId]);

    if (!result || !result.exam || !result.submission) return <div>Loading...</div>;

    let timeUsedStr = '';
    if (result.submission.timeUsed !== undefined) {
        const minutes = Math.floor(result.submission.timeUsed / 60);
        const seconds = result.submission.timeUsed % 60;
        timeUsedStr = `${minutes} phút ${seconds} giây`;
    }

    return (
        <div>
            <h2>Result</h2>
            <p>Score: {result.submission.score}/{result.exam.questions.length}</p>
            {timeUsedStr && <p>Thời gian làm bài: {timeUsedStr}</p>}
            {result.exam.questions.map((question, index) => {
                const submissionAnswer = result.submission.answers.find(
                    ans => ans.questionId === question._id
                );

                return (
                    <div key={question._id}>
                        <p>{question.content}</p>
                        {question.media && (
                            <div>
                                {question.media.endsWith('.mp3') ? (
                                    <audio controls src={`http://localhost:5000${question.media}`} />
                                ) : (
                                    <img src={`http://localhost:5000${question.media}`} alt="question media" />
                                )}
                            </div>
                        )}
                        {question.answers.map((answer, aIndex) => (
                            <div key={aIndex}>
                                <span>{answer.content}</span>
                                {answer.isCorrect && <span> (Correct)</span>}
                                {submissionAnswer && submissionAnswer.selectedAnswer === aIndex && (
                                    <span> (Your choice)</span>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default Result;