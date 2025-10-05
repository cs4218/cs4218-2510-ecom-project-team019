import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking dependencies
jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
const mockSetAuth = jest.fn();
const mockUseLocation = jest.fn();
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
}));

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{ user: null, token: "" }, mockSetAuth]) // Mock useAuth hook to return proper auth state and mock setAuth function
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

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseLocation.mockReturnValue({ state: null });
    });

    afterAll(() => { consoleLogSpy.mockRestore() });

    describe('Rendering', () => {
        it('renders login form with all elements', () => {
            const { getByText, getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
        
            expect(getByText('LOGIN FORM')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
            expect(getByText('LOGIN')).toBeInTheDocument();
            expect(getByText('Forgot Password')).toBeInTheDocument();
        });

        it('renders email input with correct attributes', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
        
            const emailInput = getByPlaceholderText('Enter Your Email');
            expect(emailInput).toHaveAttribute('type', 'email');
            expect(emailInput).toHaveAttribute('required');
            expect(emailInput).toHaveClass('form-control');
        });

        it('renders password input with correct attributes', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
        
            const passwordInput = getByPlaceholderText('Enter Your Password');
            expect(passwordInput).toHaveAttribute('type', 'password');
            expect(passwordInput).toHaveAttribute('required');
            expect(passwordInput).toHaveClass('form-control');
        });
    });

    describe('Form Input Handling', () => {
        it('inputs should be initially empty', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
        
            expect(getByPlaceholderText('Enter Your Email').value).toBe('');
            expect(getByPlaceholderText('Enter Your Password').value).toBe('');
        });
    
        it('should allow typing email and password', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
            
            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            
            expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
            expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
        });

        it('should update email state when typing', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
            
            const emailInput = getByPlaceholderText('Enter Your Email');
            fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
            
            expect(emailInput.value).toBe('new@email.com');
        });

        it('should update password state when typing', () => {
            const { getByPlaceholderText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );
            
            const passwordInput = getByPlaceholderText('Enter Your Password');
            fireEvent.change(passwordInput, { target: { value: 'newPassword123' } });
            
            expect(passwordInput.value).toBe('newPassword123');
        });
    });

    describe('Forgot Password Navigation', () => {
        it('should navigate to forgot-password page when button is clicked', () => {
            const { getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            const forgotPasswordBtn = getByText('Forgot Password');
            fireEvent.click(forgotPasswordBtn);

            expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
        });
    });

    describe('Successful Login', () => {
        it('should login the user successfully with message', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Login successful',
                    user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                    token: 'mockToken'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
                    email: 'test@example.com',
                    password: 'password123'
                });
            });

            expect(toast.success).toHaveBeenCalledWith('Login successful', {
                duration: 5000,
                icon: '🙏',
                style: {
                    background: 'green',
                    color: 'white'
                }
            });
        });

        it('should set auth context on successful login', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Login successful',
                    user: { id: 1, name: 'John Doe', email: 'test@example.com', role: 1 },
                    token: 'mockToken123'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(mockSetAuth).toHaveBeenCalledWith({
                    user: mockResponse.data.user,
                    token: mockResponse.data.token
                });
            });
        });

        it('should store auth data in localStorage on successful login', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Login successful',
                    user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                    token: 'mockToken'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(window.localStorage.setItem).toHaveBeenCalledWith(
                    'auth',
                    JSON.stringify(mockResponse.data)
                );
            });
        });

        it('should navigate to home page after successful login', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Login successful',
                    user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                    token: 'mockToken'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/');
            });
        });

        it('should navigate to location state if present after successful login', async () => {
            mockUseLocation.mockReturnValue({ state: '/dashboard' });

            const mockResponse = {
                data: {
                    success: true,
                    message: 'Login successful',
                    user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                    token: 'mockToken'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
            });
        });
    });

    describe('Failed Login', () => {
        it('should display error message when success is false', async () => {
            const mockResponse = {
                data: {
                    success: false,
                    message: 'Invalid credentials'
                }
            };
            
            axios.post.mockResolvedValueOnce(mockResponse);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'wrongpassword' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
            });
        });

        it('should display generic error message on network error', async () => {
            axios.post.mockRejectedValueOnce(new Error('Network Error'));

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            });
        });

        it('should handle 401 unauthorized error', async () => {
            const mockError = {
                response: { status: 401 },
                message: 'Unauthorized'
            };
            
            axios.post.mockRejectedValueOnce(mockError);

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'wrongpassword' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            });
            
            // Verify the error response has status 401
            expect(axios.post).toHaveBeenCalled();
            try {
                await axios.post.mock.results[axios.post.mock.results.length - 1].value;
            } catch (error) {
                expect(error.response.status).toBe(401);
            }
        });
    });

    describe('Form Submission', () => {
        it('should prevent default form submission', async () => {
            axios.post.mockResolvedValueOnce({
                data: {
                    success: true,
                    user: { id: 1, name: 'John Doe' },
                    token: 'mockToken'
                }
            });

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            
            // Click the submit button (which triggers form submission)
            fireEvent.click(getByText('LOGIN'));

            // Verify that axios.post was called (indicating the form was handled by JavaScript, not default browser submission)
            await waitFor(() => {
                expect(axios.post).toHaveBeenCalled();
            });
        });

        it('should call axios with correct endpoint and data', async () => {
            axios.post.mockResolvedValueOnce({
                data: {
                    success: true,
                    user: { id: 1, name: 'John Doe' },
                    token: 'mockToken'
                }
            });

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'user@test.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'testpass' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
                    email: 'user@test.com',
                    password: 'testpass'
                });
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty response data', async () => {
            axios.post.mockResolvedValueOnce({});

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalled();
            });
        });

        it('should handle response with missing message', async () => {
            axios.post.mockResolvedValueOnce({
                data: {
                    success: true,
                    user: { id: 1, name: 'John Doe' },
                    token: 'mockToken'
                }
            });

            const { getByPlaceholderText, getByText } = render(
                <MemoryRouter initialEntries={['/login']}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </MemoryRouter>
            );

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
            fireEvent.click(getByText('LOGIN'));

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith(undefined, {
                    duration: 5000,
                    icon: '🙏',
                    style: {
                        background: 'green',
                        color: 'white'
                    }
                });
            });
        });
    });
});