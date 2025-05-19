import React from 'react';
import ActivityFeed from './ActivityFeed';
import '../ActivityFeed.css';
import { Button } from 'react-bootstrap';
import logo from "../assets/klick logo.png";

function ActivityFeedPage() {
    return (
        <div className="activity-feed-layout">
            <div className="activity-feed-page">
                <div className="activity-feed-container">                    
                
                <div className="activity-feed-header">
                        <div className="header-left">
                            <img 
                                src={logo} 
                                alt="Logo" 
                                className="logo-image" 
                                style={{ width: "auto", height: "80px" }} 
                            />
                            <h2 className="feed-title">Activity Feed</h2>
                        </div>
                        <Button 
                            variant='secondary' 
                            className='back-button'
                            onClick={() => window.history.back()}
                        >
                            Back
                        </Button>
                    </div>
                    <div className="activity-feed-wrapper">
                        <ActivityFeed />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityFeedPage;