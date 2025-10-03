import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CategoryProduct from './CategoryProduct';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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

jest.mock('../hooks/useCategory', () => jest.fn(() => [])); // Mock useCategory hook to an empty array

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

// Reusable render function to reduce boilerplate
const renderCategoryProduct = (overrides = {}) => {
    const defaultData = {
        products: [],
        category: { name: 'Electronics', slug: 'electronics' },
    };
    const data = { ...defaultData, ...overrides };

    axios.get.mockResolvedValueOnce({ data });

    return render(
        <MemoryRouter initialEntries={['/category/electronics']}>
            <Routes>
                <Route path="/category/:slug" element={<CategoryProduct />} />
            </Routes>
        </MemoryRouter>
    );
};

// Example product details
const tv = {
    _id: 'tv123',
    name: 'TV',
    description: 'Smart TV',
    price: 499.99,
    slug: 'tv',
    category: { name: 'Electronics', slug: 'electronics' },
    quantity: 1,
    photo: { data: Buffer.alloc(0), contentType: 'image/png' },
    shipping: true,
};

const laptop = {
    _id: 'laptop123',
    name: 'Laptop',
    description: 'Gaming Laptop',
    price: 1299.99,
    slug: 'laptop',
    category: { name: 'Electronics', slug: 'electronics' },
    quantity: 1,
    photo: { data: Buffer.alloc(0), contentType: 'image/png' },
    shipping: true,
};

describe('CategoryProduct component', () => {
    it('renders category from backend', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                products: [],
                category: { name: 'Electronics', slug: 'electronics' },
            },
        });

        render(
            <MemoryRouter initialEntries={['/category/electronics']}>
                <Routes>
                    <Route
                        path="/category/:slug"
                        element={<CategoryProduct />}
                    />
                </Routes>
            </MemoryRouter>
        );

        // heading should eventually include backend data
        await waitFor(() => {
            expect(
                screen.getByText('Category - Electronics')
            ).toBeInTheDocument();
        });
    });

    it('shows multiple results', async () => {
        renderCategoryProduct({
            products: [tv, laptop],
        });
        expect(await screen.findByText('2 results found')).toBeInTheDocument();
    });

    it('shows one result', async () => {
        renderCategoryProduct({
            products: [tv],
        });
        expect(await screen.findByText('1 result found')).toBeInTheDocument();
    });

    it('shows no results', async () => {
        renderCategoryProduct({
            products: [],
        });
        expect(await screen.findByText('No results found')).toBeInTheDocument();
    });

    it('renders a product card with name, price, and description', async () => {
        renderCategoryProduct({
            products: [
                {
                    _id: '1',
                    name: 'TV',
                    description: 'Smart TV with HDR',
                    price: 499.99,
                    slug: 'tv',
                    category: { name: 'Electronics' },
                    quantity: 1,
                    shipping: true,
                },
            ],
        });

        expect(await screen.findByText('TV')).toBeInTheDocument();
        expect(screen.getByText('$499.99')).toBeInTheDocument();
        expect(screen.getByText(/Smart TV with HDR/)).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'TV' })).toHaveAttribute(
            'src',
            '/api/v1/product/product-photo/1'
        );
        expect(
            screen.getByRole('button', { name: 'More Details' })
        ).toBeInTheDocument();
    });

    it('renders a product card with name, price greater than 1000, and description', async () => {
        renderCategoryProduct({
            products: [
                {
                    _id: '2',
                    name: 'Brand X Laptop',
                    description: 'Gaming Laptop with RTX',
                    price: 3499.99,
                    slug: 'laptop',
                    category: { name: 'Electronics' },
                    quantity: 1,
                    shipping: true,
                },
            ],
        });

        expect(await screen.findByText('Brand X Laptop')).toBeInTheDocument();
        expect(screen.getByText('$3,499.99')).toBeInTheDocument();
        expect(screen.getByText(/Gaming Laptop with RTX/)).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: 'Brand X Laptop' })
        ).toHaveAttribute('src', '/api/v1/product/product-photo/2');
        expect(
            screen.getByRole('button', { name: 'More Details' })
        ).toBeInTheDocument();
    });
});
