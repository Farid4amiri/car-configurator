import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Configurations = () => {
  const [configurations, setConfigurations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const response = await axios.get('http://localhost:3001/configurations', { withCredentials: true });
        setConfigurations(response.data);
      } catch (error) {
        console.error('Error fetching configurations', error);
        setError('Error fetching configurations');
      }
    };

    fetchConfigurations();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!configurations.length) {
    return <div>No configurations found</div>;
  }

  return (
    <div>
      <h2>Saved Configurations</h2>
      <ul>
        {configurations.map((config) => (
          <li key={config.id}>
            Car Model ID: {config.car_model_id} <br />
            Accessories: {config.accessories}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Configurations;
