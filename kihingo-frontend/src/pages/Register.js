// src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Upload } from 'lucide-react';
import "../styles/Register.css";

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
    <div className="min-h-screen bg-gradient-to-br from-[#a1626a] to-[#cbbad4] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md transform hover:scale-105 transition-transform duration-300">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#a1626a]">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-[#a1626a] text-sm font-semibold mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-[#a1626a] text-sm font-semibold mb-2">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[#a1626a] text-sm font-semibold mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-[#a1626a] text-sm font-semibold mb-2">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300 pr-10"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a1626a] focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-[#a1626a] text-sm font-semibold mb-2">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300 pr-10"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-[#a1626a] text-sm font-semibold mb-2">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300"
              required
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="reverend">Reverend</option>
              <option value="evangelist">Evangelist</option>
            </select>
          </div>
          <div>
            <label htmlFor="contact" className="block text-[#a1626a] text-sm font-semibold mb-2">Contact</label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-2 border border-[#cbbad4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a1626a] transition-all duration-300"
              required
            />
          </div>
          <div>
            <label htmlFor="profileImage" className="block text-[#a1626a] text-sm font-semibold mb-2">Profile Image</label>
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
                className="cursor-pointer bg-[#a1626a] text-white py-2 px-4 rounded-md hover:bg-[#8d5459] focus:outline-none focus:ring-2 focus:ring-[#a1626a] focus:ring-opacity-50 transition-all duration-300 flex items-center"
              >
                <Upload size={20} className="mr-2" />
                Upload Image
              </label>
              {profileImage && <span className="text-[#a1626a]">{profileImage.name}</span>}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#a1626a] to-[#cbbad4] text-white py-2 px-4 rounded-md hover:from-[#8d5459] hover:to-[#b9a6c2] focus:outline-none focus:ring-2 focus:ring-[#a1626a] focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#a1626a]">
          Already a member? <Link to="/login" className="text-[#cbbad4] hover:underline font-semibold">Sign In Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;