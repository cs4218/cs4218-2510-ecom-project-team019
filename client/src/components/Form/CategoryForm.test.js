import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';

describe('CategoryForm Component', () => {
  const mockHandleSubmit = jest.fn();
  const mockSetValue = jest.fn();

  const initialValue = 'Initial Category';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the input field and submit button', () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={initialValue}
        setValue={mockSetValue}
      />
    );

    const inputElement = screen.getByPlaceholderText('Enter new category');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveValue(initialValue); // Check if initial value is displayed

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should call setValue when the input value changes', () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value="" // Start with an empty value
        setValue={mockSetValue}
      />
    );

    const inputElement = screen.getByPlaceholderText('Enter new category');
    const newCategoryName = 'New Category Name';

    fireEvent.change(inputElement, { target: { value: newCategoryName } });

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith(newCategoryName);
  });

  it('should call handleSubmit when the form is submitted', () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={initialValue}
        setValue={mockSetValue}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});