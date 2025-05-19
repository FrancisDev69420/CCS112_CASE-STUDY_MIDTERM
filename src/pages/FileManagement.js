import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import '../FileManagement.css';

const FileManagement = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [file, setFile] = useState(null);
    const [accessLevel, setAccessLevel] = useState('restricted');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [assignedUserIds, setAssignedUserIds] = useState([]); // Updated to handle multiple user IDs
    const [users, setUsers] = useState([]);
    const [fileMembers, setFileMembers] = useState([]); // State to store members of a file
    const [uploadAssignedUserIds, setUploadAssignedUserIds] = useState([]); // State to store assigned users during upload

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files`, { headers })
            .then(response => setFiles(response.data))
            .catch(error => console.error('Error fetching files:', error));
    }, [projectId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch project members
        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/members`, { headers })
            .then(response => {
                const teamMembers = response.data.filter(user => user.role === 'Team Member');
                setUsers(teamMembers);
            })
            .catch(error => console.error('Error fetching members:', error));
    }, [projectId]);

    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleAccessChange = (e) => setAccessLevel(e.target.value);

    const handleUpload = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const formData = new FormData();
        formData.append('file', file);
        formData.append('access_level', accessLevel);
        formData.append('assigned_user_ids', JSON.stringify(uploadAssignedUserIds)); // Include assigned users during upload

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/files`, formData, { headers })
            .then(response => {
                setFiles([...files, response.data]);
                setShowUploadModal(false);
                setFile(null);
                setAccessLevel('restricted');
                fetchFileMembers(response.data.id); // Fetch members after upload
            })
            .catch(error => alert('Error uploading file'));
    };

    const handleDelete = (fileId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}`, { headers })
            .then(() => setFiles(files.filter(file => file.id !== fileId)))
            .catch(error => alert('Error deleting file'));
    };

    const handleDownload = (fileId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/download`, { headers, responseType: 'blob' })
            .then(response => {
                const contentDisposition = response.headers['content-disposition'];
                const fileName = contentDisposition ? contentDisposition.split('filename=')[1] : 'downloaded_file';
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch(error => alert('Error downloading file'));
    };

    const handleEditAccess = (file) => {
        setSelectedFile(file);
        setAccessLevel(file.access_level);
        setAssignedUserIds(file.assigned_user_ids || []);
        fetchFileMembers(file.id); // Fetch members when opening the modal
        setShowEditModal(true);
    };

    const handleSaveAccess = () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/files/${selectedFile.id}`, {
            access_level: accessLevel,
            assigned_user_ids: accessLevel === 'restricted' ? assignedUserIds : [], // Send multiple user IDs
        }, { headers })
            .then(response => {
                setFiles(files.map(file => file.id === response.data.id ? response.data : file));
                setShowEditModal(false);
                setSelectedFile(null);
            })
            .catch(error => alert('Error updating access level'));
    };

    const handleUserSelection = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setAssignedUserIds(selectedOptions);
    };

    const handleUploadUserSelection = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setUploadAssignedUserIds(selectedOptions);
    };

    const fetchFileMembers = (fileId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, { headers })
            .then(response => {
                console.log('Fetched file members:', response.data); // Debugging log
                setFileMembers(response.data);
            })
            .catch(error => console.error('Error fetching file members:', error));
    };

    const addFileMember = (fileId, userId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, { user_ids: [userId] }, { headers })
            .then(() => fetchFileMembers(fileId))
            .catch(error => console.error('Error adding file member:', error));
    };

    const removeFileMember = (fileId, userId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, {
            headers,
            data: { user_ids: [userId] },
        })
            .then(() => fetchFileMembers(fileId))
            .catch(error => console.error('Error removing file member:', error));
    };

    return (
        <div className="file-management">
            <div className="header">
                <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
                <h1>File Management</h1>
                <Button variant="primary" onClick={() => setShowUploadModal(true)}>Upload File</Button>
            </div>

            <ul className="file-list">
                {files.map(file => (
                    <li key={file.id} className="file-item">
                        <span>{file.name}</span>
                        <span>{file.access_level}</span>
                        <div className="actions">
                            <Button variant="info" onClick={() => handleDownload(file.id)}>Download</Button>
                            <Button variant="warning" onClick={() => handleEditAccess(file)}>Edit Access</Button>
                            <Button variant="danger" onClick={() => handleDelete(file.id)}>Delete</Button>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload File</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpload}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>File</Form.Label>
                            <Form.Control type="file" onChange={handleFileChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Access Level</Form.Label>
                            <Form.Select value={accessLevel} onChange={handleAccessChange}>
                                <option value="restricted">Restricted</option>
                                <option value="everyone">Everyone</option>
                            </Form.Select>
                        </Form.Group>
                        {accessLevel === 'restricted' && (
                            <>
                                <Form.Group>
                                    <Form.Label>Share member</Form.Label>
                                    <Form.Select onChange={(e) => {
                                        const userId = e.target.value;
                                        if (userId && !uploadAssignedUserIds.includes(userId)) {
                                            setUploadAssignedUserIds([...uploadAssignedUserIds, userId]);
                                        }
                                    }}>
                                        <option value="">Select a user</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                <div>
                                    <h5>People with access</h5>
                                    <ul className="list-group">
                                        {uploadAssignedUserIds.map(userId => {
                                            const user = users.find(u => u.id === userId);
                                            return (
                                                <li key={userId} className="list-group-item d-flex justify-content-between align-items-center">
                                                    {user?.name || 'Unknown User'}
                                                    <Button variant="danger" size="sm" onClick={() => {
                                                        setUploadAssignedUserIds(uploadAssignedUserIds.filter(id => id !== userId));
                                                    }}>
                                                        Remove
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Upload</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Access Level</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Access Level</Form.Label>
                        <Form.Select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}>
                            <option value="restricted">Restricted</option>
                            <option value="everyone">Everyone</option>
                        </Form.Select>
                    </Form.Group>
                    {accessLevel === 'restricted' && (
                        <>
                            <Form.Group>
                                <Form.Label>Share member</Form.Label>
                                <Form.Select onChange={(e) => addFileMember(selectedFile.id, e.target.value)}>
                                    <option value="">Select a user</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <div>
                                <h5>People with access</h5>
                                <ul className="list-group">
                                    {fileMembers.map(member => (
                                        <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            {member.name}
                                            <Button variant="danger" size="sm" onClick={() => removeFileMember(selectedFile.id, member.id)}>
                                                Remove
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveAccess}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FileManagement;
