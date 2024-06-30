import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Accessories = () => {
  const [accessories, setAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        const response = await axios.get('http://localhost:3001/accessories', { withCredentials: true });
        setAccessories(response.data);
      } catch (error) {
        console.error('Error fetching accessories', error);
        setError('Error fetching accessories');
      }
    };

    fetchAccessories();
  }, []);

  const handleAccessoryChange = (accessoryId) => {
    setSelectedAccessories((prevSelected) =>
      prevSelected.includes(accessoryId)
        ? prevSelected.filter((id) => id !== accessoryId)
        : [...prevSelected, accessoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/configurations', {
        car_model_id: 1, // Example car model ID
        accessories: selectedAccessories,
      }, { withCredentials: true });
      setMessage('Configuration saved successfully');
      console.log('Configuration saved', response.data);
    } catch (error) {
      console.error('Error saving configuration', error);
      setError('Error saving configuration');
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Accessories</h2>
      <form onSubmit={handleSubmit}>
        <ul>
          {accessories.map((accessory) => (
            <li key={accessory.id}>
              <label>
                <input
                  type="checkbox"
                  value={accessory.id}
                  onChange={() => handleAccessoryChange(accessory.id)}
                />
                {accessory.name} - {accessory.price} €
              </label>
            </li>
          ))}
        </ul>
        <button type="submit">Save Configuration</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

export default Accessories;
