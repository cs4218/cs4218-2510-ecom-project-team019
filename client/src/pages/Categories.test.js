/* eslint-disable testing-library/no-node-access */
/* eslint-disable no-restricted-globals */
import { render, screen } from '@testing-library/react';
import Categories from './Categories';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import useCategory from '../hooks/useCategory';
import { describe } from 'node:test';

jest.mock('../hooks/useCategory')
jest.mock('../components/Layout', () => ({ children, title }) => (
    <div>
        <h1>{title}</h1>
        {children}
    </div>
));

describe('Categories Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the title and list of category links', () => {
        // Mock the useCategory hook to return sample categories
        const mockCategories = [
            { _id: '1', name: 'Category 1', slug: 'category-1' },
            { _id: '2', name: 'Category 2', slug: 'category-2' },
        ];
        useCategory.mockReturnValue(mockCategories);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        // Check if title is rendered
        expect(screen.getByText('All Categories')).toBeInTheDocument();

        // Check if category names are rendered
        expect(screen.getByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Category 2')).toBeInTheDocument();
        // Check if category links have correct href attributes
        expect(screen.getByText('Category 1').closest('a')).toHaveAttribute('href', '/category/category-1');
        expect(screen.getByText('Category 2').closest('a')).toHaveAttribute('href', '/category/category-2');
    });

    it('should render the title and no categories when useCategory returns an empty array', () => {
        // Mock the useCategory hook to return an empty array
        useCategory.mockReturnValue([]);

        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        // Check if title is rendered
        expect(screen.getByText('All Categories')).toBeInTheDocument();

        const links = screen.queryAllByRole('link');
        expect(links).toHaveLength(0); // No category links should be rendered

    });
});