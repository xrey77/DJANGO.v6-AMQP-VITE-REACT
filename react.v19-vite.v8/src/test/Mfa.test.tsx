// RUN : npx vitest Mfa.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Mfa from '../components/Mfa';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import jQuery from 'jquery';

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        patch: vi.fn(),
      })),
    },
  };
});

vi.mock('jquery', () => {
  return {
    default: vi.fn(() => ({
      trigger: vi.fn(),
    })),
  };
});

describe('Mfa Component', () => {
  const mockPatch = vi.fn();
  const mockJquery = vi.fn(() => ({ trigger: vi.fn() }));

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('USERID', '123');
    sessionStorage.setItem('TOKEN', 'test-token');
    
    (axios.create as any).mockReturnValue({ patch: mockPatch });
    (jQuery as any).mockImplementation(mockJquery);
    
    // vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders mfa form', () => {
    render(<Mfa />);
    expect(screen.getByPlaceholderText('enter 6-digit OTP code')).toBeInTheDocument();
  });

  
  it('submits MFA, displays loading, and resets on success', async () => {

    vi.mocked(mockPatch).mockResolvedValue({
        data: { message: 'Success', username: 'testuser' }
    });

    render(<Mfa />);

    const submitButton = await screen.findByRole('button', { name: /submit/i, hidden: true });
    await userEvent.click(submitButton);    

    waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    const user = userEvent.setup();
    mockPatch.mockRejectedValueOnce({
      response: { data: { message: 'Invalid OTP' } },
    });

    render(<Mfa />);

    await user.click(screen.getByRole('button', { name: /submit/i, hidden: true }));

    waitFor(() => {
      expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
    });
  });
});
