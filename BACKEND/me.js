// In your reaction handler
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { type, action } = req.body; // 'like' or emoji
    const feed = await Feed.findById(req.params.id);

    if (!feed) return res.status(404).json({ msg: 'Feed post not found' });

    // Check if the user already reacted
    const existingReactionIndex = feed.reactions.findIndex(r => r.user.toString() === req.user.id);
    
    if (existingReactionIndex !== -1) {
      // Remove previous reaction if it's the same type or update it
      if (feed.reactions[existingReactionIndex].type === type) {
        feed.reactions.splice(existingReactionIndex, 1); // Remove reaction
      } else {
        feed.reactions[existingReactionIndex].type = type; // Update to new reaction type
      }
    } else {
      // Add the new reaction
      const reaction = { user: req.user.id, type };
      feed.reactions.push(reaction);

      // Create notification for post owner if it's a new reaction
      if (action === 'add' && feed.user.toString() !== req.user.id) {
        await Notification.create({
          user: feed.user,
          type: 'like',
          post: feed._id,
          postModel: 'Feed',
          creator: req.user.id
        });
      }
    }

    await feed.save();
    return res.json({ reactions: feed.reactions });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});