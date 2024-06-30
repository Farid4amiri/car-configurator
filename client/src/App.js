import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Profile from './components/Profile';
import CarModels from './components/CarModels';
import Accessories from './components/Accessories';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="content">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/car-models" element={<CarModels />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
