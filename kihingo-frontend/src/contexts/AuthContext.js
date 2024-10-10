// src/contexts/AuthContext.js;
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8000/api/auth/user', {
        headers: { 'x-auth-token': token }
      })
        .then(res => {
          setUser(res.data); // Set user data from response
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token); // Store the token
    setUser(userData); // Set the user data
  };

  const logout = () => {
    localStorage.removeItem('token'); // Remove the token
    setUser(null); // Clear user data
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
