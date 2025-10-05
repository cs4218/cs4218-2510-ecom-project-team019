import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post and react-hot-toast
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  

jest.mock('../../hooks/useCategory', () => ({
    __esModule: true,
    default: jest.fn(() => []) // Mock useCategory hook to return empty array
}));

Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
});

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
};

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  beforeEach(() => { jest.clearAllMocks() });

  describe('Component Rendering', () => {
    it('should render the register form with all input fields', () => {
      const { getByPlaceholderText, getByText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
      expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
      expect(getByText('REGISTER')).toBeInTheDocument();
    });

    it('should render the form title', () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      expect(getByText('REGISTER FORM')).toBeInTheDocument();
    });

    it('should render all input fields with correct types', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      expect(getByPlaceholderText('Enter Your Name')).toHaveAttribute('type', 'text');
      expect(getByPlaceholderText('Enter Your Email')).toHaveAttribute('type', 'email');
      expect(getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');
      expect(getByPlaceholderText('Enter Your Phone')).toHaveAttribute('type', 'text');
      expect(getByPlaceholderText('Enter Your Address')).toHaveAttribute('type', 'text');
      expect(getByPlaceholderText('Enter Your DOB')).toHaveAttribute('type', 'Date');
      expect(getByPlaceholderText('What is Your Favorite sports')).toHaveAttribute('type', 'text');
    });

    it('should render all required fields with required attribute', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      expect(getByPlaceholderText('Enter Your Name')).toBeRequired();
      expect(getByPlaceholderText('Enter Your Email')).toBeRequired();
      expect(getByPlaceholderText('Enter Your Password')).toBeRequired();
      expect(getByPlaceholderText('Enter Your Phone')).toBeRequired();
      expect(getByPlaceholderText('Enter Your Address')).toBeRequired();
      expect(getByPlaceholderText('Enter Your DOB')).toBeRequired();
      expect(getByPlaceholderText('What is Your Favorite sports')).toBeRequired();
    });
  });

  describe('Form Input Handling', () => {
    it('should update name input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const nameInput = getByPlaceholderText('Enter Your Name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      expect(nameInput.value).toBe('John Doe');
    });

    it('should update email input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const emailInput = getByPlaceholderText('Enter Your Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const passwordInput = getByPlaceholderText('Enter Your Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput.value).toBe('password123');
    });

    it('should update phone input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const phoneInput = getByPlaceholderText('Enter Your Phone');
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      expect(phoneInput.value).toBe('1234567890');
    });

    it('should update address input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const addressInput = getByPlaceholderText('Enter Your Address');
      fireEvent.change(addressInput, { target: { value: '123 Street' } });
      expect(addressInput.value).toBe('123 Street');
    });

    it('should update DOB input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const dobInput = getByPlaceholderText('Enter Your DOB');
      fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
      expect(dobInput.value).toBe('2000-01-01');
    });

    it('should update answer input field value on change', () => {
      const { getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const answerInput = getByPlaceholderText('What is Your Favorite sports');
      fireEvent.change(answerInput, { target: { value: 'Football' } });
      expect(answerInput.value).toBe('Football');
    });
  });

  describe('Form Submission - Successful Registration', () => {
    it('should register the user successfully and navigate to login', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Street',
          DOB: '2000-01-01',
          answer: 'Football'
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should call axios.post with correct endpoint and data', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Smith' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'jane@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'securePass456' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '456 Avenue' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '1995-05-15' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Basketball' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'securePass456',
          phone: '9876543210',
          address: '456 Avenue',
          DOB: '1995-05-15',
          answer: 'Basketball'
        });
      });
    });
  });

  describe('Form Submission - Failed Registration', () => {
    it('should display error message when registration fails with error response', async () => {
      axios.post.mockRejectedValueOnce({ message: 'User already exists' });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('should display custom error message when success is false', async () => {
      axios.post.mockResolvedValueOnce({ 
        data: { 
          success: false, 
          message: 'Email already registered' 
        } 
      });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'existing@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Email already registered');
    });

    it('should not navigate to login page when registration fails', async () => {
      axios.post.mockRejectedValueOnce({ message: 'Network error' });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation and Edge Cases', () => {
    it('should prevent form submission with default browser validation when fields are empty', () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const submitButton = getByText('REGISTER');
      fireEvent.click(submitButton);

      // axios.post should not be called because HTML5 validation prevents submission
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle form submission with preventDefault', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      const form = getByText('REGISTER FORM').closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

      fireEvent.submit(form);

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
    });

    it('should handle special characters in input fields', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: "O'Connor-Smith" } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test+tag@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'P@ssw0rd!#$' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '+1-234-567-8900' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street, Apt #4B' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-12-31' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Soccer & Tennis' } });

      fireEvent.click(getByText('REGISTER'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: "O'Connor-Smith",
          email: 'test+tag@example.com',
          password: 'P@ssw0rd!#$',
          phone: '+1-234-567-8900',
          address: '123 Street, Apt #4B',
          DOB: '2000-12-31',
          answer: 'Soccer & Tennis'
        });
      });
    });
  });
});
