return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
    {/* Sticky Navigation */}
    <nav>...</nav>

    <main>...</main>

    {/* Mobile Menu - Move this inside the main div */}
    {isMenuOpen && (
      <div className="lg:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-50">
        {/* ... rest of mobile menu code ... */}
      </div>
    )}
  </div>
);