/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';

// Mock external dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../components/Layout', () => ({ children, title }) => (
    <div>
        <h1>{title}</h1>
        {children}
    </div>
));
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);
jest.mock('../../components/Form/CategoryForm', () => {
    // Mock CategoryForm to allow interaction and spying on props
    return ({ handleSubmit, value, setValue }) => (
        <form onSubmit={handleSubmit} data-testid="category-form">
            <input
                type="text"
                placeholder="Enter new category"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                data-testid="category-input"
            />
            <button type="submit">Submit</button>
        </form>
    );
});
jest.mock('antd', () => ({
    Modal: ({ children, visible, onCancel }) =>
        visible ? (
            <div data-testid="modal">
                <button onClick={onCancel}>Close Modal</button>
                {children}
            </div>
        ) : null,
}));

describe('CreateCategory Page - Create Functionality', () => {
    const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the page and initial categories', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        render(<CreateCategory />);

        // Check if main heading is present
        expect(screen.getByText('Manage Category')).toBeInTheDocument();
        // Check if AdminMenu is present
        expect(screen.getByText('Admin Menu')).toBeInTheDocument();
        // Check if the category form is present
        expect(screen.getByTestId('category-form')).toBeInTheDocument();

        // Wait for categories to load and appear in the table
        await waitFor(() => {
            expect(screen.getByText('Electronics')).toBeInTheDocument();
            expect(screen.getByText('Books')).toBeInTheDocument();
        });
    });

    it('should successfully create a new category', async () => {
        const newCategoryName = 'New Test Category';
        const newCategoryResponse = {
            _id: '3',
            name: newCategoryName,
            slug: 'new-test-category',
        };

        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        // Mock axios.post for creating a category
        axios.post.mockResolvedValueOnce({
            data: { success: true, category: newCategoryResponse },
        });
        // Mock axios.get for getAllCategory after creation
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [...mockCategories, newCategoryResponse],
            },
        });

        render(<CreateCategory />);

        // Wait for initial categories to load
        await screen.findByText('Electronics');

        // Simulate user input
        const categoryInput = screen.getByTestId('category-input');
        fireEvent.change(categoryInput, { target: { value: newCategoryName } });

        // Simulate form submission
        fireEvent.submit(screen.getByTestId('category-form'));

        // Assert axios.post was called with the correct data
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/category/create-category',
                { name: newCategoryName }
            );
        });

        // Assert toast.success was called
        expect(toast.success).toHaveBeenCalledWith(
            `${newCategoryName} is created`
        );

        // Assert getAllCategory was called to refresh the list
        expect(axios.get).toHaveBeenCalledTimes(2); // Once for initial load, once after creation

        // Assert the new category appears in the table
        await waitFor(() => {
            expect(screen.getByText(newCategoryName)).toBeInTheDocument();
        });
    });

    it('should show an error toast if category creation fails (backend message)', async () => {
        const newCategoryName = 'New Category';
        const errorMessage = 'Category unable to be created';

        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        // Mock axios.post to return a failure from the backend
        axios.post.mockRejectedValueOnce({
            response: { data: { message: errorMessage } },
        });

        render(<CreateCategory />);

        // Wait for initial categories to load
        await screen.findByText('Electronics');


        // Simulate user input and form submission
        const categoryInput = screen.getByTestId('category-input');
        fireEvent.change(categoryInput, { target: { value: newCategoryName } });
        fireEvent.submit(screen.getByTestId('category-form'));

        // Assert axios.post was called
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/category/create-category',
                { name: newCategoryName }
            );
        });

        // Assert toast.error was called with the backend message
        expect(toast.error).toHaveBeenCalledWith(errorMessage);

        // Assert getAllCategory was not called again (only initial load) - it should be 1 call
        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should show a generic error toast if category creation fails (network error)', async () => {
        const newCategoryName = 'Another Category';

        axios.get.mockResolvedValueOnce({ data: { success: true, category: mockCategories } });
        // Mock axios.post to throw a network error
        axios.post.mockRejectedValueOnce(new Error('Network Error'));

        render(<CreateCategory />);

        // Wait for initial categories to load
        await screen.findByText('Electronics');

        // Simulate user input and form submission
        const categoryInput = screen.getByTestId('category-input');
        fireEvent.change(categoryInput, { target: { value: newCategoryName } });
        fireEvent.submit(screen.getByTestId('category-form'));

        // Assert axios.post was called
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/category/create-category',
                { name: newCategoryName }
            );
        });

        // Assert toast.error was called with the generic message
        expect(toast.error).toHaveBeenCalledWith(
            'Something went wrong in input form'
        );

        // Assert getAllCategory was not called again (only initial load) - it should be 1 call
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});

describe('CreateCategory Page - getAllCategory Functionality', () => {
    const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and display categories on initial render', async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: mockCategories },
        });

        render(<CreateCategory />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                '/api/v1/category/get-category'
            );
            expect(screen.getByText('Electronics')).toBeInTheDocument();
            expect(screen.getByText('Books')).toBeInTheDocument();
        });
    });

    it('should show an error toast if fetching categories fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network Error'));

        render(<CreateCategory />);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                '/api/v1/category/get-category'
            );
            expect(toast.error).toHaveBeenCalledWith(
                'Something went wrong in getting category'
            );
        });
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
        expect(screen.queryByText('Books')).not.toBeInTheDocument();
    });
});

describe('CreateCategory Page - Update Functionality', () => {
    const initialCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
    ];
    const updatedCategoryName = 'Updated Electronics';
    const updatedCategoryResponse = {
        _id: '1',
        name: updatedCategoryName,
        slug: 'updated-electronics',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show updated category and success toast on successful update', async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: initialCategories } });
        axios.put.mockResolvedValueOnce({
            data: { success: true, category: updatedCategoryResponse },
        });
        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [
                    { ...initialCategories[0], name: updatedCategoryName },
                    initialCategories[1],
                ],
            },
        });

        render(<CreateCategory />);

        await screen.findByText('Electronics');

        // Open edit modal
        fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
        const modal = screen.getByTestId('modal');
        // Simulate typing new name
        const modalInput = within(modal).getByTestId('category-input');
        fireEvent.change(modalInput, {
            target: { value: updatedCategoryName },
        });

        // Simulate submitting update form in modal
        fireEvent.submit(within(modal).getByTestId('category-form'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                `/api/v1/category/update-category/${initialCategories[0]._id}`,
                { name: updatedCategoryName }
            );
        });

        expect(toast.success).toHaveBeenCalledWith(
            `${updatedCategoryName} is updated`
        );
        expect(axios.get).toHaveBeenCalledTimes(2); // Initial load + after update
        await waitFor(() => {
            expect(screen.queryByTestId('modal')).not.toBeInTheDocument(); // Modal should close
        });
        await waitFor(() => {
            expect(screen.getByText(updatedCategoryName)).toBeInTheDocument();
        });
    });

    it('should show error toast if update fails (backend message)', async () => {
        const errorMessage = 'Update failed';
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: initialCategories },
        });
        axios.post.mockRejectedValueOnce({
            response: { data: { message: errorMessage } },
        });

        render(<CreateCategory />);
        await screen.findByText('Electronics');

        fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
        const modal = screen.getByTestId('modal');
        // Simulate typing new name
        const modalInput = within(modal).getByTestId('category-input');
        fireEvent.change(modalInput, {
            target: { value: updatedCategoryName },
        });
        fireEvent.submit(within(modal).getByTestId('category-form'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
        });
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(axios.get).toHaveBeenCalledTimes(1); // No refresh
    });

    it('should show generic error toast if update fails (network error)', async () => {
        axios.put.mockRejectedValueOnce(new Error('Network Error'));
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: initialCategories },
        });

        render(<CreateCategory />);
        await screen.findByText('Electronics');

        fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
        const modal = screen.getByTestId('modal');
        // Simulate typing new name
        const modalInput = within(modal).getByTestId('category-input');
        fireEvent.change(modalInput, {
            target: { value: updatedCategoryName },
        });
        fireEvent.submit(within(modal).getByTestId('category-form'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledTimes(1);
        });
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        expect(axios.get).toHaveBeenCalledTimes(1); // No refresh
    });
});

describe('CreateCategory Page - Delete Functionality', () => {
    const initialCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
    ];
    const categoryToDelete = initialCategories[0];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete category and refresh list on successful delete', async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: initialCategories },
        });
        axios.delete.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [initialCategories[1]] },
        }); // Remaining category

        render(<CreateCategory />);

        await screen.findByText('Electronics');

        // Click delete button for the first category
        fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                `/api/v1/category/delete-category/${categoryToDelete._id}`
            );
        });

        expect(toast.success).toHaveBeenCalledWith('Category is deleted');
        expect(axios.get).toHaveBeenCalledTimes(2); // Initial load + after delete
        await waitFor(() => {
            expect(
                screen.queryByText(categoryToDelete.name)
            ).not.toBeInTheDocument();
            expect(screen.getByText('Books')).toBeInTheDocument();
        });
    });

    it('should show error toast if delete fails (backend message)', async () => {
        const errorMessage = 'Delete failed';
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: initialCategories },
        });
        axios.delete.mockResolvedValueOnce({
            data: { success: false, message: errorMessage },
        });

        render(<CreateCategory />);
        await screen.findByText('Electronics');

        fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledTimes(1);
        });
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
        expect(axios.get).toHaveBeenCalledTimes(1); // No refresh
    });

    it('should show generic error toast if delete fails (network error)', async () => {
        axios.delete.mockRejectedValueOnce(new Error('Network Error'));
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: initialCategories },
        });

        render(<CreateCategory />);
        await screen.findByText('Electronics');

        fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledTimes(1);
        });
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        expect(axios.get).toHaveBeenCalledTimes(1); // No refresh
    });
});
