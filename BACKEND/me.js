const SinglePost = () => {
  // ... existing imports and state ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ... Back button ... */}
        
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-500 hover:shadow-2xl animate-slideUp">
          {/* ... User info section ... */}
          
          <p className="text-lg text-gray-800 mb-6">{post.content}</p>

          <div className="flex items-center mb-6">
            <button 
              onClick={handleReaction}
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <span className="text-2xl">👍</span>
              <span className="font-medium">
                {post.reactions.length} {post.reactions.length === 1 ? 'reaction' : 'reactions'}
              </span>
            </button>
          </div>

          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              {/* ... Comment form ... */}
            </form>
          )}

          {/* ... Comments section ... */}
        </div>
      </div>
      
      {/* ... Edit modal ... */}
    </div>
  );
};