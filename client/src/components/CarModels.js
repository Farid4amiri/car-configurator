import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CarModels = () => {
  const [carModels, setCarModels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCarModels = async () => {
      try {
        const response = await axios.get('http://localhost:3001/car-models', { withCredentials: true });
        setCarModels(response.data);
      } catch (error) {
        console.error('Error fetching car models', error);
        setError('Error fetching car models');
      }
    };

    fetchCarModels();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!carModels.length) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Car Models</h2>
      <ul>
        {carModels.map((carModel) => (
          <li key={carModel.id}>
            {carModel.name} - {carModel.engine_power} KW - {carModel.cost} €
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CarModels;
