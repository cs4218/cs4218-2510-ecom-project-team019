import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Orders from './Orders';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

const mockAuth = {
    token: 'mockToken',
};

jest.mock('axios');
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [mockAuth, null]),
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));
jest.mock('../../hooks/useCategory', () => {
    return jest.fn(() => []); // Mock useCategory hook to an empty array
});

describe('Orders component', () => {
    it('should fetch and display orders', async () => {
        const mockOrders = [
            {
                id: 1,
                status: 'Delivered',
                buyer: { name: 'John Doe' },
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

        // Wait for the order status to appear in the document
        await waitFor(() => {
            expect(screen.getByText('Delivered')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Success')).toBeInTheDocument();
            expect(screen.getByText('Product 1')).toBeInTheDocument();
        });

        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
    });
});
