import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Orders from './Orders';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/auth';

jest.mock('axios');
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(),
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));
jest.mock('../../hooks/useCategory', () => ({
    useCategory: jest.fn(() => [[]])
}));

describe('Orders component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and display orders', async () => {
        useAuth.mockReturnValue([{ token: 'mockToken' }, jest.fn()]);

        const mockOrders = [
            {
                id: 1,
                status: 'Delivered',
                buyer: { name: 'Alice' },
                createAt: new Date().toISOString(),
                payment: { success: true },
                products: [
                    {
                        _id: 'p1',
                        name: 'Product 1',
                        description: 'Description 1',
                        price: 100,
                    },
                ],
            },
        ];

        axios.get.mockResolvedValueOnce({ data: mockOrders });

        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        // Wait for the async API call and UI to update
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');

        // Assert key UI elements are rendered
        await waitFor(() => {
            expect(screen.getByText('All Orders')).toBeInTheDocument();
            expect(screen.getByText('Delivered')).toBeInTheDocument();
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.getByText('Success')).toBeInTheDocument();
            expect(screen.getByText('Product 1')).toBeInTheDocument();
        });
    });

    it('does not call API when user has no token', async () => {
        useAuth.mockReturnValue([{}, jest.fn()]);

        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        await new Promise((r) => setTimeout(r, 200)); // give useEffect time to run
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('enters the catch block when network error is faced when making API call', async () => {
        useAuth.mockReturnValue([{ token: 'mockToken' }, jest.fn()]);

        const mockError = new Error('Network Error');
        axios.get.mockRejectedValueOnce(mockError);

        // Spy on console.log
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

        expect(consoleSpy).toHaveBeenCalledWith(mockError);

        // Optionally assert no orders rendered
        expect(screen.queryByText('Delivered')).not.toBeInTheDocument();
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.queryByText('Success')).not.toBeInTheDocument();
        expect(screen.queryByText('Product 1')).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
