// client/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const Profile = ({ user }) => {
  const [configurations, setConfigurations] = useState([]);

  useEffect(() => {
    if (user) {
      axios.get('http://localhost:3001/configurations', { withCredentials: true })
        .then(response => setConfigurations(response.data))
        .catch(error => console.error('Error fetching configurations:', error));
    }
  }, [user]);

  const handleDeleteConfiguration = (id) => {
    axios.delete(`http://localhost:3001/configurations/${id}`, { withCredentials: true })
      .then(() => {
        setConfigurations(configurations.filter(config => config.id !== id));
      })
      .catch(error => console.error('Error deleting configuration:', error));
  };

  if (!user) {
    return <Container><p>You need to log in to view your profile.</p></Container>;
  }

  return (
    <Container>
      <h1 className="my-4">Profile</h1>
      <p>Username: {user.username}</p>
      <p>Good Client: {user.good_client ? 'Yes' : 'No'}</p>

      <h2 className="my-4">Saved Configurations</h2>
      <Row>
        {configurations.map((config, index) => (
          <Col key={config.id} md={4}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Configuration {index + 1}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Model: {config.car_model_id === 1 ? 'Model A' : config.car_model_id === 2 ? 'Model B' : 'Model C'}</Card.Subtitle>
                <Card.Text>Accessories: {JSON.parse(config.accessories).join(', ')}</Card.Text>
                <Button variant="danger" onClick={() => handleDeleteConfiguration(config.id)}>Delete</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Profile;
