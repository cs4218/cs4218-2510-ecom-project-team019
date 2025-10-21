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
import UpdateProduct from './UpdateProduct';

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

jest.mock('../../hooks/useCategory', () => ({
    useCategory: jest.fn(() => [[]])
}));

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

describe('UpdateProduct component', () => {
    it('logs error on category fetch failure', async () => {
        // Spy on console.log to verify error logging
        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        axios.get.mockRejectedValueOnce(new Error('Fetch error'));

        render(
            <MemoryRouter>
                <UpdateProduct />
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

    it('renders Update Product heading and buttons on success', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                products: [],
                success: true,
            },
        });

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(document.title).toBe('Dashboard - Update Product');
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
                'Update Product'
            );
            expect(
                screen.getByRole('button', { name: /UPDATE PRODUCT/i })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('button', { name: /DELETE PRODUCT/i })
            ).toBeInTheDocument();
        });
    });

    it('submits update product form and shows success message', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.put.mockResolvedValueOnce({
            data: { success: true, message: 'Product updated successfully' },
        });

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText(/Enter name/i)
            ).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'New Name' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'New Desc' },
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
                screen.getByRole('button', { name: /update product/i })
            );
        });

        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/product/update-product/test-slug',
            expect.any(FormData)
        );

        // verify that the FormData contains the correct fields
        const calledData = axios.put.mock.calls[0][1];
        const dataObj = {};
        for (const [key, value] of calledData.entries()) {
            dataObj[key] = value;
        }

        expect(dataObj).toEqual({
            name: 'New Name',
            description: 'New Desc',
            price: '100',
            quantity: '5',
            category: 'cat123',
            shipping: '1',
        });

        // verify success toast shown
        expect(toast.success).toHaveBeenCalledWith(
            'Product updated successfully'
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
    });

    it('submits update product form but update fails', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.put.mockResolvedValueOnce({
            data: { success: false, message: 'Product could not be updated' },
        });

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText(/Enter name/i)
            ).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'New Name' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'New Desc' },
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
                screen.getByRole('button', { name: /update product/i })
            );
        });

        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/product/update-product/test-slug',
            expect.any(FormData)
        );

        // verify error toast shown
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Object));
        expect(toast.error).toHaveBeenCalledWith(
            'Product could not be updated'
        );

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('submits update product form but error in making update request', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.put.mockRejectedValueOnce(new Error('Update request failed'));

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText(/Enter name/i)
            ).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter name/i), {
            target: { value: 'New Name' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
            target: { value: 'New Desc' },
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
                screen.getByRole('button', { name: /update product/i })
            );
        });

        expect(axios.put).toHaveBeenCalledWith(
            '/api/v1/product/update-product/test-slug',
            expect.any(FormData)
        );

        // verify error toast shown
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith(
            'Something went wrong when updating product'
        );

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('submits delete product form and shows success message', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.delete.mockResolvedValueOnce({
            data: { success: true, message: 'Product deleted successfully' },
        });

        // Mock window.prompt to always confirm deletion
        jest.spyOn(window, 'prompt').mockImplementation(() => 'yes');

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /delete product/i })
            );
        });

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                '/api/v1/product/delete-product/test-slug'
            );
        });

        // verify success toast shown
        expect(toast.success).toHaveBeenCalledWith(
            'Product deleted successfully'
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
    });

    it('submits delete product form but deletion fails', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.delete.mockResolvedValueOnce({
            data: { success: false, message: 'Product could not be deleted' },
        });

        // Mock window.prompt to always confirm deletion
        jest.spyOn(window, 'prompt').mockImplementation(() => 'yes');

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /delete product/i })
            );
        });

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                '/api/v1/product/delete-product/test-slug'
            );
        });

        // verify error toast shown
        expect(toast.error).toHaveBeenCalledWith(
            'Product could not be deleted'
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('submits delete product form but error in making delete request', async () => {
        // Load categories and product details
        axios.get.mockImplementation((url) => {
            if (url.includes('/get-category')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        category: [
                            { name: 'Cat1', slug: 'cat1', _id: 'cat123' },
                            { name: 'Cat2', slug: 'cat2', _id: 'cat234' },
                        ],
                    },
                });
            }
            if (url.includes('/get-product/test-slug')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        product: {
                            _id: 'test-slug',
                            name: 'Old Name',
                            description: 'Old Desc',
                            price: '50',
                            quantity: '10',
                            category: {
                                name: 'Cat1',
                                slug: 'cat1',
                                _id: 'cat123',
                            },
                            shipping: '0',
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} }); // fallback to avoid undefined
        });

        axios.delete.mockRejectedValueOnce(new Error('Delete request failed'));

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        // Mock window.prompt to always confirm deletion
        jest.spyOn(window, 'prompt').mockImplementation(() => 'yes');

        render(
            <MemoryRouter>
                <UpdateProduct />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter name/i).value).toBe(
                'Old Name'
            );
        });

        await act(async () => {
            // click submit
            fireEvent.click(
                screen.getByRole('button', { name: /delete product/i })
            );
        });

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                '/api/v1/product/delete-product/test-slug'
            );
        });

        // verify error toast shown
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith(
            'Something went wrong when deleting product'
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
