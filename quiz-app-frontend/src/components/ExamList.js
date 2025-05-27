import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/exams/teacher', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setExams(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching exams');
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    const handleDelete = async (examId) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/exams/${examId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setExams(exams.filter((exam) => exam._id !== examId));
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting exam');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>My Exams</h2>
            {exams.length === 0 ? (
                <p>No exams found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Code</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam) => (
                            <tr key={exam._id}>
                                <td>{exam.title}</td>
                                <td>{exam.code}</td>
                                <td>{new Date(exam.startTime).toLocaleString()}</td>
                                <td>{new Date(exam.endTime).toLocaleString()}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/exams/edit/${exam._id}`)}
                                        style={{ color: 'blue', cursor: 'pointer' }}
                                    >
                                        Edit
                                    </button>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(exam._id)}
                                        style={{ color: 'red', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ExamList;