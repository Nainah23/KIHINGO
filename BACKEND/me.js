.header {
  display: flex;
  justify-content: space-between; /* Keeps logo and menu in their positions */
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 80px;
}

.logo-link {
  margin-left: 1rem; /* Logo stays on the left */
}

.user-greeting {
  position: absolute; /* Position greeting relative to the header */
  left: 50%; /* Horizontally center based on the header */
  transform: translateX(-50%); /* Correct centering by shifting half of its width */
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #feca57, #1dd1a1, #5f27cd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-menu {
  margin-right: 1rem; /* Dropdown menu stays on the right */
}