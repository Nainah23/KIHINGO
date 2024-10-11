import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // For getting route params

const Comments = () => {
  const { id } = useParams(); // Get the post ID from the URL
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPostWithComments = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/feed/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPostWithComments();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:8000/api/feed/${id}/comment`, 
        { content: newComment },
        { headers: { 'x-auth-token': token } }
      );
      setPost(res.data); // Update post with the new comment
      setNewComment(''); // Clear the input
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {post ? (
        <>
          <h2>{post.content}</h2>
          <h3>Comments:</h3>
          {post.comments.map(comment => (
            <div key={comment._id}>
              <p>{comment.content} - <strong>{comment.user.name}</strong></p>
            </div>
          ))}
          <form onSubmit={handleCommentSubmit}>
            <input 
              type="text" 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder="Add a comment..."
            />
            <button type="submit">Submit</button>
          </form>
        </>
      ) : (
        <p>Loading post...</p>
      )}
    </div>
  );
};

export default Comments;
