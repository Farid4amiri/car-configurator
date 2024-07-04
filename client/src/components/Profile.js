import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const Profile = ({ user }) => {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const response = await axios.get('http://localhost:3001/configurations', { withCredentials: true });
        if (Array.isArray(response.data)) {
          setConfigurations(response.data);
        } else if (response.data) {
          setConfigurations([response.data]);
        } else {
          setConfigurations([]);
        }
      } catch (error) {
        setError('Error fetching configurations');
        console.error('Error fetching configurations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/configurations/${id}`, { withCredentials: true });
      setConfigurations(configurations.filter(config => config.id !== id));
    } catch (error) {
      setError('Error deleting configuration');
      console.error('Error deleting configuration:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Container>
      <h1 className="my-4">Profile</h1>
      <p>Username: {user.username}</p>
      <p>Good Client: {user.good_client ? 'Yes' : 'No'}</p>
      <h2 className="my-4">Saved Configurations</h2>
      {configurations.length > 0 ? (
        <Row>
          {configurations.map(config => (
            <Col key={config.id} md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Configuration ID: {config.id}</Card.Title>
                  <Card.Text>Model: {config.car_model_id}</Card.Text>
                  <Card.Text>Accessories: {JSON.parse(config.accessories).join(', ')}</Card.Text>
                  <Card.Text>Estimation: {config.estimation} days</Card.Text>
                  <Button variant="danger" onClick={() => handleDelete(config.id)}>Delete</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p>No configurations saved.</p>
      )}
    </Container>
  );
};

export default Profile;
