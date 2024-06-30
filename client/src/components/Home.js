import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function Home() {
  const [configurations, setConfigurations] = useState([]);

  useEffect(() => {
    async function fetchConfigurations() {
      try {
        const response = await axios.get('/configurations');
        setConfigurations(response.data);
      } catch (error) {
        console.error('Error fetching configurations:', error);
      }
    }
    fetchConfigurations();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/configurations/${id}`);
      setConfigurations(configurations.filter((config) => config.id !== id));
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md="auto">
          <h1>Welcome to the Car Configurator</h1>
          <Card>
            <Card.Body>
              <Card.Title>Saved Configurations</Card.Title>
              {configurations.length > 0 ? (
                <ul>
                  {configurations.map((config) => (
                    <li key={config.id}>
                      <p>Car Model ID: {config.car_model_id}</p>
                      <p>Accessories: {JSON.parse(config.accessories).join(', ')}</p>
                      <Button variant="danger" onClick={() => handleDelete(config.id)}>Delete</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No configurations found</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
