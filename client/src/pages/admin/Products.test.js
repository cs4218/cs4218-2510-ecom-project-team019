import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import Products from './Products';

// Mock axios
jest.mock('axios');

// Mock react-router
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ slug: 'test-slug' }),
    useNavigate: () => jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
    const original = jest.requireActual('react-hot-toast');
    return {
        __esModule: true,
        ...original,
        default: {
            ...original, // keep Toaster + other exports
            error: jest.fn(),
            success: jest.fn(),
        },
    };
});

// Mock contexts and hooks
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => [])); // Mock useCategory hook to an empty array

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

describe('Products component', () => {
    it('logs error on fetch failure', async () => {
        // Spy on console.log to verify error logging
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        axios.get.mockRejectedValueOnce(new Error('Fetch error'));

        render(
            <MemoryRouter>
                <Products />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        });

        consoleSpy.mockRestore();
    });
});
