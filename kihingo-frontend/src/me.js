return (
  <div className="feed-container">
    <div className="sidebar">
      <div className="user-profile">
        <img
          src={userProfileImage}
          alt="User Profile"
          className="profile-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-profile.png';
          }}
        />
        <h3 className="user-name">{user.name || 'Guest'}</h3>
        <p className="user-info">@{user.username || 'guest'}</p>
      </div>
      <div className="notifications-pane">
        <h3 className="notifications-title">
          <Bell size={20} /> Notifications
          {notifications.length > 0 && (
            <span className="notification-count">{notifications.length}</span>
          )}
        </h3>
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="notification-item"
            onClick={() => {
              if (notification.postId) {
                navigate(/feed/${notification.postId});
              }
            }}
          >
            <p className="notification-content">{notification.content}</p>
            <small className="notification-time">
              {formatTimeElapsed(notification.createdAt)}
            </small>
          </div>
        ))}
      </div>
    </div>

    <div className="main-content">
      <button className="back-home-button" onClick={() => navigate('/')}>
        Back Home
      </button>

      <div className="bible-verse-container">
        <div className="bible-verse-scroll">
          <p
            ref={verseRef}
            className="scrolling-verse"
            onAnimationEnd={handleScrollEnd}
          >
            {bibleVerse || 'Loading verse...'}
          </p>
        </div>
      </div>

      <h2 className="feed-title">Feed</h2>

      {renderPostForm()}

      {feeds.map((feed) => (
        feed && (
          <div key={feed._id} className="feed-item">
            <div className="feed-header">
              <div className="author-info">
                <span className="author-name">{feed.user.name}</span>
                <span
                  className="author-username"
                  onClick={(e) => handleAuthorClick(e, feed.user.username)}
                  style={{ cursor: 'pointer' }}
                >
                  @{feed.user.username}
                </span>
                <span className="feed-time">{formatTimeElapsed(feed.createdAt)}</span>
              </div>
              {user && (user._id === feed.user._id || user.role === 'admin') && (
                <div className="post-actions">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === feed._id ? null : feed._id)}
                    className="action-button"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {renderDropdownMenu(feed)}
                </div>
              )}
            </div>
            <p onClick={() => handlePostClick(feed._id)} className="feed-content">
              {feed.content}
            </p>
            <div className="reactions">
              <button
                onClick={() => handleReaction(feed._id)}
                className="reaction-button"
              >
                <ThumbsUp size={18} /> {feed.reactions?.length || 0}
              </button>
              <button
                onClick={() => handlePostClick(feed._id)}
                className="comment-button"
              >
                <MessageCircle size={18} /> {feed.comments?.length || 0}
              </button>
            </div>
          </div>
        )
      ))}
      if (notification.postId) {
                  navigate(`/feed/${notification.postId}`);
                }

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  </div>
);