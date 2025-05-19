import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../Notifications.css'; 

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                await axios.post(
                    `http://localhost:8000/api/notifications/${notification.id}/mark-as-read`,
                    {},
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                fetchUnreadCount();
                // Update the notification in the list
                setNotifications(notifications.map(n => 
                    n.id === notification.id ? { ...n, read: true } : n
                ));
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        // Handle navigation to the relevant task/project
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post(
                'http://localhost:8000/api/notifications/mark-all-as-read',
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:8000/api/notifications/${notificationId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            // Update notifications list by removing the deleted notification
            setNotifications(notifications.filter(n => n.id !== notificationId));
            if (!notifications.find(n => n.id === notificationId)?.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const toggleNotifications = () => {
        if (!showNotifications) {
            fetchNotifications();
        }
        setShowNotifications(!showNotifications);
    };

    return (
        <div className="notifications-container">
            <button 
                className="notifications-button" 
                onClick={toggleNotifications}
            >
                <i className="bi bi-bell-fill"></i> {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            
            {showNotifications && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h6 className="mb-0">Notifications</h6>
                        {unreadCount > 0 && (
                            <button 
                                className="btn btn-link btn-sm"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <span className="notification-message">{notification.message}</span>                                        <button 
                                            className="btn btn-link btn-sm text-danger"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering notification click
                                                handleDelete(notification.id);
                                            }}
                                            title="Delete notification"
                                        >
                                            <i className="bi bi-trash"></i> 
                                        </button>
                                    </div>
                                    <span className="notification-time">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="no-notifications">No notifications</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Notifications;
