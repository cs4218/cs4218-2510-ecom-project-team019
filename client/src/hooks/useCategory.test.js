import { describe } from "node:test";
import axios from "axios";
import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";

jest.mock('axios');

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('useCategory Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch categories and update state on successful API call', async () => {
        const mockCategories = [
            { _id: '1', name: 'Category 1' },
            { _id: '2', name: 'Category 2' },
        ];
        const response = { data: { category: mockCategories } };
        axios.get.mockResolvedValue(response);

        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        })
        expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(mockConsoleLog).not.toHaveBeenCalled();
    
    });

    it('should log error on failed API call', async () => {
        const errorMessage = 'Network Error';
        axios.get.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useCategory());

        await new Promise(resolve => setTimeout(resolve, 0)); // wait for useEffect to run

        expect(result.current).toEqual([]);

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.any(Error));
        expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});