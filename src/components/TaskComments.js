import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TaskComments.css'; 

function TaskComments({ taskId, projectId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch current user info
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/user', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch comments for the task
    const fetchComments = useCallback(async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [taskId, projectId]);

    // Load comments when component mounts or taskId changes
    useEffect(() => {
        if (taskId && projectId) {
            fetchComments();
        }
    }, [fetchComments, taskId, projectId]);

    // Handle adding a new comment
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!newComment.trim() && selectedFiles.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('content', newComment);
        selectedFiles.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        
        try {
            await axios.post(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            setNewComment('');
            setSelectedFiles([]);
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
            fetchComments();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    // Handle editing a comment
    const handleEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent.trim()) return;

        setLoading(true);
        try {
            await axios.put(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
                { content: editContent },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setEditingCommentId(null);
            setEditContent('');
            fetchComments(); // Refresh comments after update
        } catch (error) {
            console.error('Error updating comment:', error);
        } finally {
            setLoading(false);
        }
    };    
    
    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchComments(); // Refresh comments after deletion
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEditComment = (comment) => {
        return currentUser && (
            comment.user_id === currentUser.id 
        );
    };

    return (
        <div className="task-comments">
            <h6 className="mb-3">💬 Comments</h6>
            <div className="comments-list mb-3">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item p-2 mb-2">
                            <div className="d-flex justify-content-between">
                                <small className="fw-bold">
                                    {comment.user?.name || 'Anonymous'} 
                                    <span className={`badge ms-2 ${
                                        comment.user?.role === 'Project Manager' ? 'bg-primary' : 
                                        comment.user?.role === 'Team Member' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                        {comment.user?.role || 'Unknown Role'}
                                    </span>
                                </small>
                                <small className="text-muted">
                                    {new Date(comment.created_at).toLocaleString()}
                                </small>
                            </div>
                            {editingCommentId === comment.id ? (
                                <div className="mt-2">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleUpdateComment(comment.id)}
                                            disabled={loading || !editContent.trim()}
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="mb-1 mt-1">{comment.content}</p>
                                    {comment.file_names && comment.file_names.length > 0 && comment.file_urls && comment.file_urls.length > 0 && (
                                        <div className="attachment-section mt-1">
                                            <small className="text-muted">
                                                📎 Attachments:
                                                <ul className="mb-0 ps-3">
                                                    {comment.file_names.map((name, idx) => (
                                                        <li key={idx}>
                                                            <a
                                                                href={`http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${comment.id}/download/${idx}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-link btn-sm p-0 ms-1"
                                                            >
                                                                {name}
                                                            </a>
                                                            {comment.file_sizes && comment.file_sizes[idx] && (
                                                                <> ({(comment.file_sizes[idx] / 1024).toFixed(1)} KB)</>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </small>
                                        </div>
                                    )}
                                    {canEditComment(comment) && (
                                        <div className="mt-1 d-flex gap-3">
                                            <button
                                                className="btn btn-link btn-sm text-primary p-0"
                                                onClick={() => handleEdit(comment)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-link btn-sm text-danger p-0"
                                                onClick={() => handleDelete(comment.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-muted">No comments yet</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="comment-form">
                <div className="input-group mb-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={loading}
                    />                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading || (!selectedFiles.length && !newComment.trim())}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
                <div className="file-upload">
                    <div className="input-group">
                        <input
                            type="file"
                            className="form-control form-control-sm"
                            onChange={handleFileSelect}
                            disabled={loading}
                            multiple
                        />
                    </div>
                    {selectedFiles.length > 0 && (
                        <div className="selected-files mt-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="selected-file d-flex align-items-center gap-2">
                                    <small className="text-muted">
                                        📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </small>
                                    <button 
                                        type="button"
                                        className="btn btn-outline-danger btn-sm py-0 px-1"
                                        onClick={() => handleRemoveFile(index)}
                                        disabled={loading}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

export default TaskComments;