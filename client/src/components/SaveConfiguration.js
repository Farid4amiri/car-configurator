import React, { useState } from 'react';
import axios from 'axios';

const SaveConfiguration = () => {
  const [carModelId, setCarModelId] = useState('');
  const [accessories, setAccessories] = useState('');
  const [error, setError] = useState('');

  const saveConfiguration = async (e) => {
    e.preventDefault();
    if (!carModelId || !accessories) {
      setError('Car Model ID and Accessories are required.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/configurations', {
        car_model_id: carModelId,
        accessories: accessories.split(',').map(Number),
      }, { withCredentials: true });
      console.log('Configuration saved:', response.data);
      setError('');
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Error saving configuration. Please try again.');
    }
  };

  return (
    <div>
      <h2>Save Configuration</h2>
      <form onSubmit={saveConfiguration}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <label>
          Car Model ID:
          <input
            type="text"
            value={carModelId}
            onChange={(e) => setCarModelId(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Accessories (comma separated IDs):
          <input
            type="text"
            value={accessories}
            onChange={(e) => setAccessories(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default SaveConfiguration;
