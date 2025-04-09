import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Failure from './pages/Failure';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Checkout />} />
        <Route path="/payment-success" element={<Success />} />
        <Route path="/payment-failure" element={<Failure />} />
      </Routes>
    </Router>
  );
}

export default App;
