import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import axios from 'axios';

function ExpenditureManagement({ project, onUpdate }) {
    const [showModal, setShowModal] = useState(false);
    const [expenditures, setExpenditures] = useState([]);
    const [newExpenditure, setNewExpenditure] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [categories] = useState([
        'Labor',
        'Materials',
        'Equipment',
        'Software',
        'Travel',
        'Other'
    ]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const fetchExpenditures = useCallback(async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/projects/${project.id}/expenditures`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setExpenditures(response.data);
        } catch (error) {
            console.error('Error fetching expenditures:', error);
        }
    }, [project.id]);

    useEffect(() => {
        fetchExpenditures();
    }, [fetchExpenditures]);

    const handleAddExpenditure = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/projects/${project.id}/expenditures`,
                newExpenditure,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setExpenditures([...expenditures, response.data]);
            setShowModal(false);
            setNewExpenditure({
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
            onUpdate(); // Notify parent component to update project budget
        } catch (error) {
            console.error('Error adding expenditure:', error);
            alert('Failed to add expenditure: ' + error.response?.data?.message);
        }
    };

    const calculateTotalSpent = () => {
        return expenditures.reduce((total, exp) => total + parseFloat(exp.amount), 0);
    };

    const calculateRemainingBudget = () => {
        return project.budget - calculateTotalSpent();
    };

    return (
        <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Expenditure Management</h5>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    Add Expenditure
                </Button>
            </div>
            <div className="card-body">
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6 className="card-title">Total Budget</h6>
                                <p className="card-text h4">
                                    ₱{project.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6 className="card-title">Total Spent</h6>
                                <p className="card-text h4">
                                    ₱{calculateTotalSpent().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6 className="card-title">Remaining Budget</h6>
                                <p className="card-text h4">
                                    ₱{calculateRemainingBudget().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenditures.map((expenditure, index) => (
                            <tr key={index}>
                                <td>{formatDateForDisplay(expenditure.date)}</td>
                                <td>{expenditure.description}</td>
                                <td>{expenditure.category}</td>
                                <td>₱{parseFloat(expenditure.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Expenditure</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddExpenditure}>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={newExpenditure.description}
                                onChange={(e) => setNewExpenditure({ ...newExpenditure, description: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={newExpenditure.category}
                                onChange={(e) => setNewExpenditure({ ...newExpenditure, category: e.target.value })}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={newExpenditure.amount}
                                onChange={(e) => setNewExpenditure({ ...newExpenditure, amount: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={newExpenditure.date}
                                onChange={(e) => setNewExpenditure({ ...newExpenditure, date: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Add Expenditure
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default ExpenditureManagement;