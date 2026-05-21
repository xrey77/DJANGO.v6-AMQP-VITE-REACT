// RUN : npx vitest Prodlist.test.tsx
import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import type { Mock } from 'vitest';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

describe('Prodlist Component', () => {    
  let mockGet: Mock;

  beforeEach(() => {
      vi.clearAllMocks();        
      const mockAxiosInstance = axios.create() as any;
      mockGet = mockAxiosInstance.get;      
  });
  

it('renders loading state, then fetches and displays products', async () => {
    
  const mockProducts = {
    data: {
      products: [
        { id: 1, descriptions: 'Product A', costprice: 100 },
        { id: 2, descriptions: 'Product B', costprice: 200 },
      ],
      totpage: 1,
      totalrecords: 2,
      page: 1,
    },
  };
  
  mockGet.mockResolvedValueOnce(mockProducts);

  waitFor(() => {
    expect(mockGet).toHaveBeenCalledWith('api/products/list/1/');    
  });

});

  it('displays error message on API failure', async () => {

    mockGet.mockRejectedValueOnce({
      response: { data: { message: 'Network Error' } },
    });

    waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('navigates to next page', async () => {
    mockGet.mockResolvedValueOnce({
      data: { products: [], totpage: 2, totalrecords: 2, page: 1 },
    });
    
    screen.findByText('Next'); 

    mockGet.mockResolvedValueOnce({
      data: { products: [], totpage: 2, totalrecords: 2, page: 2 },
    });

  });
});
