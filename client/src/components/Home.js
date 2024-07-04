import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Container, Row, Col, ListGroup, Modal } from 'react-bootstrap';

const Home = ({ user }) => {
  const [carModels, setCarModels] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [estimation, setEstimation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const carModelsResponse = await axios.get('http://localhost:3001/car-models');
        console.log('Car Models Response:', carModelsResponse.data); // Debugging line
        setCarModels(carModelsResponse.data);

        const accessoriesResponse = await axios.get('http://localhost:3001/accessories');
        console.log('Accessories Response:', accessoriesResponse.data); // Debugging line
        setAccessories(accessoriesResponse.data.accessories);
        setConstraints(accessoriesResponse.data.constraints);
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchConfiguration = async () => {
      try {
        const response = await axios.get('http://localhost:3001/configurations', { withCredentials: true });
        if (response.data) {
          const { car_model_id, accessories, estimation } = response.data;
          setSelectedModel(carModels.find(model => model.id === car_model_id));
          setSelectedAccessories(accessories.map(name => accessories.find(acc => acc.name === name)));
          setTotalPrice(response.data.totalPrice);
          setEstimation(estimation);
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };

    fetchData();
    if (user) fetchConfiguration();
  }, [user]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setSelectedAccessories([]);
    setTotalPrice(model.cost);
    setEstimation(null);
  };

  const handleAccessoryToggle = (accessory) => {
    const alreadySelected = selectedAccessories.includes(accessory);

    let newAccessories;
    if (alreadySelected) {
      // Check constraints before removing the accessory
      const dependentAccessories = constraints
        .filter(c => c.requires_accessory_id === accessory.id)
        .map(c => c.accessory_id);

      if (dependentAccessories.some(depId => selectedAccessories.some(acc => acc.id === depId))) {
        setModalMessage(`${accessory.name} cannot be removed because it is required by another selected accessory.`);
        return;
      }

      newAccessories = selectedAccessories.filter(acc => acc !== accessory);
      setTotalPrice(totalPrice - accessory.price);
    } else {
      // Check constraints before adding the accessory
      const accessoryConstraints = constraints.find(c => c.accessory_id === accessory.id);
      
      if (accessoryConstraints) {
        if (accessoryConstraints.requires_accessory_id && !selectedAccessories.some(acc => acc.id === accessoryConstraints.requires_accessory_id)) {
          const requiredAccessory = accessories.find(acc => acc.id === accessoryConstraints.requires_accessory_id);
          setModalMessage(`${accessory.name} requires ${requiredAccessory.name}`);
          return;
        }
        if (accessoryConstraints.incompatible_accessory_id && selectedAccessories.some(acc => acc.id === accessoryConstraints.incompatible_accessory_id)) {
          const incompatibleAccessory = accessories.find(acc => acc.id === accessoryConstraints.incompatible_accessory_id);
          setModalMessage(`${accessory.name} is incompatible with ${incompatibleAccessory.name}`);
          return;
        }
      }

      // Check the maximum number of accessories
      let maxAccessories;
      if (selectedModel.engine_power === 50) {
        maxAccessories = 4;
      } else if (selectedModel.engine_power === 100) {
        maxAccessories = 5;
      } else {
        maxAccessories = 7;
      }

      if (selectedAccessories.length >= maxAccessories) {
        setModalMessage(`You can only select up to ${maxAccessories} accessories for this model.`);
        return;
      }

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
      accessories: JSON.stringify(selectedAccessories.map(acc => acc.name))
    };

    axios.post('http://localhost:3001/configurations', configuration, { withCredentials: true })
      .then(response => {
        alert('Configuration saved!');
        // Update availability in local state
        setCarModels(carModels.map(model => model.id === selectedModel.id ? { ...model, availability: model.availability - 1 } : model));
        setAccessories(accessories.map(acc => selectedAccessories.includes(acc) ? { ...acc, availability: acc.availability - 1 } : acc));
        setEstimation(response.data.estimation);
      })
      .catch(error => console.error('Error saving configuration:', error));
  };

  const handleResetSelection = () => {
    setSelectedModel(null);
    setSelectedAccessories([]);
    setTotalPrice(0);
    setEstimation(null);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Container>
      <Modal show={modalMessage !== ''} onHide={() => setModalMessage('')}>
        <Modal.Header closeButton>
          <Modal.Title>Selection Constraint</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalMessage('')}>Close</Button>
        </Modal.Footer>
      </Modal>
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
                      <Card.Text>Price: €{model.cost}</Card.Text>
                      <Card.Text>Engine Power: {model.engine_power} kW</Card.Text>
                      <Card.Text>Availability: {model.availability}</Card.Text> {/* Display availability */}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p>No car models available.</p>
          )}

          <h1 className="my-4">Accessories</h1>
          {accessories.length > 0 ? (
            <Row>
              {accessories.map(accessory => (
                <Col key={accessory.id} md={6}>
                  <Card className="mb-4" onClick={() => handleAccessoryToggle(accessory)} style={{ cursor: 'pointer' }}>
                    <Card.Body>
                      <Card.Title>{accessory.name}</Card.Title>
                      <Card.Text>€{accessory.price}</Card.Text>
                      <Card.Text>Availability: {accessory.availability}</Card.Text> {/* Display availability */}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p>No accessories available.</p>
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
              {estimation && <h3>Estimated Production Time: {estimation} days</h3>}
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
