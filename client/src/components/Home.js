// client/src/components/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Container, Row, Col, ListGroup } from 'react-bootstrap';

const Home = ({ user }) => {
  const [carModels, setCarModels] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const carModelsResponse = await axios.get('http://localhost:3001/car-models');
        setCarModels(carModelsResponse.data);

        const accessoriesResponse = await axios.get('http://localhost:3001/accessories');
        setAccessories(accessoriesResponse.data);
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setSelectedAccessories([]);
    setTotalPrice(model.cost);
  };

  const handleAccessoryToggle = (accessory) => {
    const alreadySelected = selectedAccessories.includes(accessory);

    let newAccessories;
    if (alreadySelected) {
      newAccessories = selectedAccessories.filter(acc => acc !== accessory);
      setTotalPrice(totalPrice - accessory.price);
    } else {
      newAccessories = [...selectedAccessories, accessory];
      setTotalPrice(totalPrice + accessory.price);
    }

    setSelectedAccessories(newAccessories);
  };

  const handleSaveConfiguration = () => {
    if (!user) {
      alert('You need to log in to save your configuration.');
      return;
    }

    const configuration = {
      car_model_id: selectedModel.id,
      accessories: selectedAccessories.map(acc => acc.name)
    };

    axios.post('http://localhost:3001/configurations', configuration, { withCredentials: true })
      .then(response => {
        alert('Configuration saved!');
      })
      .catch(error => console.error('Error saving configuration:', error));
  };

  const handleResetSelection = () => {
    setSelectedModel(null);
    setSelectedAccessories([]);
    setTotalPrice(0);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Container>
      <Row>
        <Col md={8}>
          <h1 className="my-4">Car Models</h1>
          {carModels.length > 0 ? (
            <Row>
              {carModels.map(model => (
                <Col key={model.id} md={4}>
                  <Card className="mb-4" onClick={() => handleModelSelect(model)} style={{ cursor: 'pointer' }}>
                    <Card.Body>
                      <Card.Title>{model.name}</Card.Title>
                      <Card.Text>€{model.cost}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p>No car models available.</p>
          )}

          {selectedModel && (
            <>
              <h2 className="my-4">Selected Model: {selectedModel.name}</h2>
              <h1 className="my-4">Accessories</h1>
              {accessories.length > 0 ? (
                <Row>
                  {accessories.map(accessory => (
                    <Col key={accessory.id} md={6}>
                      <Card className="mb-4" onClick={() => handleAccessoryToggle(accessory)} style={{ cursor: 'pointer' }}>
                        <Card.Body>
                          <Card.Title>{accessory.name}</Card.Title>
                          <Card.Text>€{accessory.price}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p>No accessories available.</p>
              )}
            </>
          )}
        </Col>

        <Col md={4}>
          {selectedModel && (
            <>
              <h2 className="my-4">Selected Accessories</h2>
              <ListGroup>
                {selectedAccessories.map(accessory => (
                  <ListGroup.Item key={accessory.id}>
                    {accessory.name} - €{accessory.price}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <h2>Total Price: €{totalPrice}</h2>
              <Button variant="primary" onClick={handleSaveConfiguration} className="mb-2">Save Configuration</Button>
              <Button variant="secondary" onClick={handleResetSelection}>Reset Selection</Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
