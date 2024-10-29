{feeds.map(feed => (
  <div key={feed._id} className="feed-post">
    <span
      className="user-name"
      onClick={(e) => handleAuthorClick(e, feed.user.username)}
      style={{ cursor: 'pointer', color: 'blue' }}
    >
      {feed.user.name}
    </span>
    {/* Other post details like content and time */}
  </div>
))}
