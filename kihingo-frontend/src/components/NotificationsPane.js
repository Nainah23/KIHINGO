// FRONTEND/src/components/NotificationsPane.js
import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPane = ({ notifications, formatTimeElapsed }) => {
  const navigate = useNavigate();
  
  const handleNotificationClick = (notification) => {
    if (notification.type === 'appointment') {
      navigate('/appointments');
    } else {
      navigate(`/feed/${notification.post}`);
    }
  };

  return (
    <div className="notifications-pane">
      <h3 className="notifications-title">
        <Bell size={20} /> Notifications
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="notification-count">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </h3>
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <p>{notification.content}</p>
                <small className="notification-time">
                  {formatTimeElapsed(notification.createdAt)}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="no-notifications">No notifications</p>
        )}
      </div>
    </div>
  );
};


export default NotificationsPane;