import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SubmissionList = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/submissions', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setSubmissions(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching submissions');
                setLoading(false);
                navigate('/login');
            }
        };
        fetchSubmissions();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (submissions.length === 0) return <div>No submissions found.</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Danh sách bài thi đã làm</h2>
            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Tên bài thi</th>
                        <th className="py-2 px-4 border-b">Thời gian làm bài</th>
                        <th className="py-2 px-4 border-b">Số câu đúng</th>
                        <th className="py-2 px-4 border-b">Ngày nộp</th>
                        <th className="py-2 px-4 border-b">Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => {
                        const minutes = Math.floor(sub.timeUsed / 60);
                        const seconds = sub.timeUsed % 60;
                        const timeUsedStr = `${minutes} phút ${seconds} giây`;
                        return (
                            <tr key={sub.examId}>
                                <td className="py-2 px-4 border-b">{sub.examTitle}</td>
                                <td className="py-2 px-4 border-b">{timeUsedStr}</td>
                                <td className="py-2 px-4 border-b">{sub.score}/{sub.totalQuestions}</td>
                                <td className="py-2 px-4 border-b">
                                    {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    <Link
                                        to={`/result/${sub.examId}/${sub._id}`}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SubmissionList;