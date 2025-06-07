import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";


const ExamDetails = () => {
    const { examId } = useParams();
    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                // Fetch exam details
                const examRes = await axios.get(
                    `http://localhost:5000/api/exams/id/${examId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setExam(examRes.data);


                // Fetch submissions for this exam
                const submissionsRes = await axios.get(
                    `http://localhost:5000/api/submissions/exam/${examId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setSubmissions(submissionsRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || "Error fetching exam details");
                setLoading(false);
            }
        };


        fetchExamDetails();
    }, [examId]);


    const handleDeleteSubmission = async (submissionId) => {
        if (!window.confirm("Are you sure you want to delete this submission?"))
            return;


        try {
            await axios.delete(
                `http://localhost:5000/api/submissions/${submissionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setSubmissions(submissions.filter((sub) => sub._id !== submissionId));
        } catch (err) {
            setError(err.response?.data?.message || "Error deleting submission");
        }
    };


    const handleViewDetails = (submissionId) => {
        console.log(
            "Navigating to result with examId:",
            examId,
            "submissionId:",
            submissionId
        );
        navigate(`/exam/result/${examId}/${submissionId}`);
    };


    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;


    return (
        <div>
            <h2>Exam Details</h2>
            {submissions.length === 0 ? (
                <p>No submissions found for this exam.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Exam Title</th>
                            <th>Email</th>
                            <th>Total Questions</th>
                            <th>Correct Answers</th>
                            <th>Start Time</th>
                            <th>Submission Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((submission) => {
                            const startTime = new Date(
                                new Date(submission.submittedAt).getTime() -
                                submission.timeUsed * 1000
                            );
                            const correctAnswers = submission.answers.reduce(
                                (count, answer) => {
                                    const question = exam.questions.find(
                                        (q) => q._id.toString() === answer.questionId.toString()
                                    );
                                    if (
                                        question &&
                                        question.answers[answer.selectedAnswer]?.isCorrect
                                    ) {
                                        return count + 1;
                                    }
                                    return count;
                                },
                                0
                            );


                            return (
                                <tr key={submission._id}>
                                    <td>{exam.title}</td>
                                    <td>{submission.studentId.email}</td>
                                    <td>{exam.questions.length}</td>
                                    <td>{correctAnswers}</td>
                                    <td>{startTime.toLocaleString()}</td>
                                    <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewDetails(submission._id)}
                                            style={{
                                                color: "green",
                                                cursor: "pointer",
                                                marginRight: "10px",
                                            }}
                                        >
                                            Details
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubmission(submission._id)}
                                            style={{ color: "red", cursor: "pointer" }}
                                        >
                                            Delete
                                        </button>
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


export default ExamDetails;
