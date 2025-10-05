import React from 'react';
import {
    act,
    render,
    screen,
    waitFor,
    fireEvent,
} from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import CreateProduct from './CreateProduct';

// Mock axios
jest.mock('axios');

// Mock react-router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ slug: 'test-slug' }),
    useNavigate: () => mockNavigate,
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

// Stub Ant Design
jest.mock('antd', () => {
    const actual = jest.requireActual('antd');
    const MockSelect = ({ placeholder, onChange, children }) => (
        <select
            data-testid={placeholder || 'select'}
            onChange={(e) => onChange(e.target.value)}
        >
            {children}
        </select>
    );

    const MockOption = ({ value, children }) => (
        <option value={value}>{children}</option>
    );

    MockSelect.Option = MockOption;

    return {
        __esModule: true,
        ...actual,
        Select: MockSelect,
        Option: MockOption,
    };
});

// Clear mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

describe('CreateProduct component', () => {
    it('logs error on category fetch failure', async () => {
        // Spy on console.log to verify error logging
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        axios.get.mockRejectedValueOnce(new Error('Fetch error'));

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        // Since getAllCategory is called in useEffect, we wait for it
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            expect(toast.error).toHaveBeenCalledWith(
                'Something went wrong when getting categories'
            );
        });

        consoleSpy.mockRestore();
    });

    it('renders Create Product heading and button on success', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{}],
            },
        });

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
                'Create Product'
            );
            expect(
                screen.getByRole('button', { name: /CREATE PRODUCT/i })
            ).toBeInTheDocument();
        });
    });

    it('submits form and shows success message', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{ name: 'Cat1', slug: 'cat1', _id: 'cat123' }],
            },
        });

        axios.post.mockResolvedValueOnce({
            data: { success: true, message: 'Product Created' },
        });

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'Test Desc' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter price/i), {
            target: { value: '100' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter quantity/i), {
            target: { value: '5' },
        });

        await waitFor(() =>
            expect(screen.getByText('Cat1')).toBeInTheDocument()
        );

        // simulate selecting category + shipping
        // Open "Select a category"
        fireEvent.change(screen.getByTestId('Select a category'), {
            target: { value: 'cat123' },
        });

        // Open "Select Shipping"
        fireEvent.change(screen.getByTestId('Select shipping'), {
            target: { value: '1' },
        });

        // ensure select values are updated
        await waitFor(() => {
            expect(screen.getByTestId('Select a category').value).toBe(
                'cat123'
            );
            expect(screen.getByTestId('Select shipping').value).toBe('1');
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /create product/i })
            );
        });

        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/product/create-product',
            expect.any(FormData)
        );

        // verify that the FormData contains the correct fields
        const calledData = axios.post.mock.calls[0][1];
        const dataObj = {};
        for (const [key, value] of calledData.entries()) {
            dataObj[key] = value;
        }

        expect(dataObj).toEqual({
            name: 'Test Product',
            description: 'Test Desc',
            price: '100',
            quantity: '5',
            category: 'cat123',
            shipping: '1',
            photo: '',
        });

        // verify success toast shown
        expect(toast.success).toHaveBeenCalledWith(
            'Product created successfully'
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
    });

    it('shows error toast on form submission failure', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{ name: 'Cat1', slug: 'cat1', _id: 'cat123' }],
            },
        });

        axios.post.mockResolvedValueOnce({
            data: { success: false, message: 'Error in creating product' },
        });

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'Test Desc' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter price/i), {
            target: { value: '100' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter quantity/i), {
            target: { value: '5' },
        });

        await waitFor(() =>
            expect(screen.getByText('Cat1')).toBeInTheDocument()
        );

        // simulate selecting category + shipping
        // Open "Select a category"
        fireEvent.change(screen.getByTestId('Select a category'), {
            target: { value: 'cat123' },
        });

        // Open "Select Shipping"
        fireEvent.change(screen.getByTestId('Select shipping'), {
            target: { value: '1' },
        });

        // ensure select values are updated
        await waitFor(() => {
            expect(screen.getByTestId('Select a category').value).toBe(
                'cat123'
            );
            expect(screen.getByTestId('Select shipping').value).toBe('1');
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /create product/i })
            );
        });

        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/product/create-product',
            expect.any(FormData)
        );

        // verify error toast shown
        expect(toast.error).toHaveBeenCalledWith('Error in creating product');
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows error toast on form submission exception', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{ name: 'Cat1', slug: 'cat1', _id: 'cat123' }],
            },
        });

        axios.post.mockRejectedValueOnce(new Error('Server error'));

        // Spy on console.log to verify error logging
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        render(
            <MemoryRouter>
                <CreateProduct />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'Test Desc' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter price/i), {
            target: { value: '100' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter quantity/i), {
            target: { value: '5' },
        });

        await waitFor(() =>
            expect(screen.getByText('Cat1')).toBeInTheDocument()
        );

        // simulate selecting category + shipping
        // Open "Select a category"
        fireEvent.change(screen.getByTestId('Select a category'), {
            target: { value: 'cat123' },
        });

        // Open "Select Shipping"
        fireEvent.change(screen.getByTestId('Select shipping'), {
            target: { value: '1' },
        });

        // ensure select values are updated
        await waitFor(() => {
            expect(screen.getByTestId('Select a category').value).toBe(
                'cat123'
            );
            expect(screen.getByTestId('Select shipping').value).toBe('1');
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /create product/i })
            );
        });

        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/product/create-product',
            expect.any(FormData)
        );

        // verify error toast shown
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith(
            'Something went wrong when creating products'
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
