import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductDetails from './ProductDetails';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// Mock axios
jest.mock('axios');

// Mock react-router
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ slug: 'test-slug' }),
    useNavigate: () => jest.fn(),
}));

// Mock contexts and hooks
jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../hooks/useCategory', () => ({
    useCategory: jest.fn(() => [[]])
}));

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

describe('ProductDetails component', () => {
    it('renders heading', () => {
        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );
        expect(screen.getByText('Product Details')).toBeInTheDocument();
    });

    it('fetches and displays product details', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                product: {
                    _id: '123',
                    name: 'Test Product',
                    description: 'Nice item',
                    price: 99,
                    category: { _id: 'cat123', name: 'Category A' },
                },
            },
        });

        axios.get.mockResolvedValueOnce({
            data: { products: [] }, // related products
        });

        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );

        expect(axios.get).toHaveBeenCalledWith(
            '/api/v1/product/get-product/test-slug'
        );

        await waitFor(() =>
            expect(screen.getByText('Name: Test Product')).toBeInTheDocument()
        );
        expect(screen.getByText('Category: Category A')).toBeInTheDocument();
    });

    it('renders related products', async () => {
        axios.get
            .mockResolvedValueOnce({
                data: {
                    product: {
                        _id: '123',
                        name: 'Main Product',
                        description: 'Main',
                        price: 100,
                        category: { _id: 'cat1', name: 'Cat1' },
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    products: [
                        {
                            _id: 'r1',
                            name: 'Related Product',
                            description: 'Something cool',
                            price: 50,
                            slug: 'related-product',
                        },
                    ],
                },
            });

        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );

        await waitFor(() =>
            expect(screen.getByText('Related Product')).toBeInTheDocument()
        );
    });

    it('handles API error gracefully', async () => {
        axios.get.mockRejectedValueOnce(new Error('API failed'));

        render(
            <MemoryRouter>
                <ProductDetails />
            </MemoryRouter>
        );

        // Just check that it doesn’t crash
        expect(await screen.findByText('Product Details')).toBeInTheDocument();
    });
});
