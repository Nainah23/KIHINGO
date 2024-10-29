.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Add this to create a container for the greeting and user menu */
.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto; /* This pushes the right section to the end */
}

.user-greeting {
  background: linear-gradient(45deg, #ff6b6b, #feca57, #1dd1a1, #5f27cd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 0; /* Remove the bottom margin */
  animation: colorShift 5s infinite alternate;
}