import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Update Switch to Routes
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Testimonials from './pages/Testimonials';
import Appointments from './pages/Appointments';
import Donations from './pages/Donations';
import Events from './pages/Events';
import Livestream from './pages/Livestream';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes> {/* Use Routes instead of Switch */}
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<PrivateRoute component={Feed} />} />
          <Route path="/testimonials" element={<PrivateRoute component={Testimonials} />} />
          <Route path="/appointments" element={<PrivateRoute component={Appointments} />} />
          <Route path="/donations" element={<PrivateRoute component={Donations} />} />
          <Route path="/events" element={<PrivateRoute component={Events} />} />
          <Route path="/livestream" element={<PrivateRoute component={Livestream} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
