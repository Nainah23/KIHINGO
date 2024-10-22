import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MoreVertical } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/auth/profile/${username}`);
      setUser(res.data);
    } catch (err) {
      console.error(err);
      navigate('/feed');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/feed/user/${username}`);
      setUserPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/feed/${postId}`);
  };

  const toggleDropdown = (postId) => {
    setActiveDropdown(activeDropdown === postId ? null : postId);
  };

  const handleDelete = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/feed/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container" style={styles.container}>
      <div className="profile-header" style={styles.header}>
        <img 
          src={user.profileImage || '/CHURCH.jpg'} 
          alt="Profile"
          style={styles.profileImage}
        />
        <h2 style={styles.name}>{user.name}</h2>
        <p style={styles.username}>@{user.username}</p>
        <p style={styles.email}>{user.email}</p>
        <p style={styles.role}>{user.role}</p>
        {user.contact && <p style={styles.contact}>{user.contact}</p>}
      </div>

      <div className="posts-section" style={styles.postsSection}>
        <h3 style={styles.sectionTitle}>Posts</h3>
        {userPosts.map(post => (
          <div key={post._id} style={styles.post}>
            <div style={styles.postHeader}>
              <span style={styles.postDate}>
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              {currentUser && (currentUser._id === user._id || currentUser.role === 'admin') && (
                <div style={styles.postActions}>
                  <button onClick={() => toggleDropdown(post._id)} style={styles.actionButton}>
                    <MoreVertical size={20} />
                  </button>
                  {activeDropdown === post._id && (
                    <div style={styles.dropdown}>
                      <button 
                        onClick={() => navigate(`/feed/${post._id}/edit`)}
                        style={styles.dropdownButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(post._id)}
                        style={styles.dropdownButton}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div 
              onClick={() => handlePostClick(post._id)}
              style={styles.postContent}
            >
              <p>{post.content}</p>
              {post.attachments && post.attachments.length > 0 && (
                <div style={styles.attachments}>
                  {post.attachments.map((attachment, index) => (
                    <img 
                      key={index} 
                      src={attachment} 
                      alt="Attachment"
                      style={styles.attachmentImage}
                    />
                  ))}
                </div>
              )}
              <div style={styles.postStats}>
                <span>👍 {post.reactions.length}</span>
                <span>💬 {post.comments.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  profileImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '20px',
    border: '3px solid #cbbad4',
  },
  name: {
    color: '#a1626a',
    marginBottom: '5px',
  },
  username: {
    color: '#666',
    marginBottom: '10px',
  },
  email: {
    color: '#666',
    marginBottom: '5px',
  },
  role: {
    color: '#a1626a',
    textTransform: 'capitalize',
    marginBottom: '5px',
  },
  contact: {
    color: '#666',
  },
  postsSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    color: '#a1626a',
    marginBottom: '20px',
  },
  post: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postDate: {
    color: '#666',
    fontSize: '0.9em',
  },
  postActions: {
    position: 'relative',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  dropdownButton: {
    display: 'block',
    width: '100%',
    padding: '10px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#333',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  postContent: {
    cursor: 'pointer',
  },
  attachments: {
    marginTop: '10px',
  },
  attachmentImage: {
    maxWidth: '100%',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  postStats: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
    color: '#666',
  },
};

export default Profile;