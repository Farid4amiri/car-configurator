import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

test('renders Login component', () => {
  render(<Login />);
  expect(screen.getByText(/Username/i)).toBeInTheDocument();
  expect(screen.getByText(/Password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
});

test('allows the user to login', async () => {
  render(<Login />);
  
  fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'user1' } });
  fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password1' } });
  fireEvent.click(screen.getByRole('button', { name: /Login/i }));

  // Add assertions based on expected behavior after login
});
