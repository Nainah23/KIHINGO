import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Upload } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('member');
  const [contact, setContact] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('contact', contact);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    try {
      await axios.post('http://localhost:8000/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        alert(err.response.data.msg);
      } else {
        alert('Registration failed');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-200 to-teal-200 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-500 ease-in-out hover:scale-105">
        <h2 className="text-4xl font-semibold text-center text-gray-800 mb-8">Create Your Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300 pr-10"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-9 text-teal-400 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300 pr-10"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-gray-700 text-sm font-medium mb-2">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300"
              required
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="reverend">Reverend</option>
              <option value="evangelist">Evangelist</option>
            </select>
          </div>
          <div>
            <label htmlFor="contact" className="block text-gray-700 text-sm font-medium mb-2">Contact</label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="profileImage" className="block text-gray-700 text-sm font-medium mb-2">Profile Image</label>
            <div className="flex items-center space-x-2">
              <input
                id="profileImage"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <label
                htmlFor="profileImage"
                className="cursor-pointer bg-teal-400 text-white py-2 px-4 rounded-md hover:bg-teal-500 focus:outline-none transition-all duration-300 flex items-center"
              >
                <Upload size={20} className="mr-2" />
                Upload Image
              </label>
              {profileImage && <span className="text-teal-400">{profileImage.name}</span>}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-400 to-teal-500 text-white py-3 px-4 rounded-lg hover:from-teal-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-700">
          Already a member? <Link to="/login" className="text-teal-400 hover:underline font-semibold">Sign In Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;