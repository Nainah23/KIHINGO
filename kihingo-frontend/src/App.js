// src/App.js;
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
// import Comments from './pages/Comments';
import ChurchGroups from './pages/Groups';
import SinglePost from './pages/SinglePost';
import SingleTestimonial from './pages/SingleTestimonial';
import Profile from './pages/Profile';
import Report from './pages/Report';


function App() {
  return (
    <AuthProvider>
      <Router>
       <Header />
       <div className="pt-20">
        <Routes> {/* Use Routes instead of Switch */}
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/appointments" element={<PrivateRoute component={Appointments} />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/events" element={<Events />} />
          <Route path="/livestream" element={<Livestream />} />
          <Route path="/login" element={<Login />} />
          <Route path="feed/:id" element={<SinglePost />} />
          <Route path="/testimonials:id" element={<SingleTestimonial />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report" element={<Report />} />
          <Route path="/church_groups" element={<ChurchGroups />} />
        </Routes>
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
