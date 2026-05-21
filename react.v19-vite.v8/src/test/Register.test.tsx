// RUN : npx vitest Register.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import Register from '../components/Register';
import axios from 'axios';

vi.mock('axios', () => {
    const mockPost = vi.fn();
    return {
      default: {
        create: vi.fn(() => ({
          post: mockPost,
        })),
      },
    };
  });

describe('Register Component', () => {

    const mockPost = vi.mocked(axios.create()).post as Mock; 
    mockPost.mockResolvedValue({ data: { message: 'Registration Successful!' } });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders registration form correctly', () => {
        render(<Register />);
        expect(screen.getByText('Account Registration')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('enter First Name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i, hidden: true })).toBeInTheDocument();
    });

    it('submits form successfully and shows message', async () => {        
        const user = userEvent.setup(); 
                
        mockPost.mockResolvedValue({ data: { message: 'Registration Successful!' } });
        render(
            <Register />
        );
        
        await user.type(screen.getByPlaceholderText('enter First Name'), 'John');
        await user.type(screen.getByPlaceholderText('enter Last Name'), 'Doe');
        await user.type(screen.getByPlaceholderText('enter Email Address'), 'john@example.com');
        await user.type(screen.getByPlaceholderText('enter Mobile No.'), '1234567890');
        await user.type(screen.getByPlaceholderText('enter Username'), 'johndoe');
        await user.type(screen.getByPlaceholderText('enter Password'), 'password123');

        const submitButton = await screen.getByRole('button', { name: /register/i, hidden: true });
        await user.click(submitButton);    
    
        expect(mockPost).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
        });

    });

    it('resets form fields on close', async () => {
        const user = userEvent.setup(); 

        render(
            <Register />
        );

        const input = screen.getByPlaceholderText('enter First Name');
        await user.type(input, 'John');
        expect(input).toHaveValue('John');

        const submitReset = await screen.findByRole('button', { name: /reset/i, hidden: true });
        expect(submitReset).toBeInTheDocument();
        user.click(submitReset);    

    });
});
