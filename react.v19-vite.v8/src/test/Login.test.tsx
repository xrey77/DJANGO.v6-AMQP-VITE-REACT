import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import { MemoryRouter } from 'react-router-dom';

const mockTrigger = vi.fn(); 

const { postMock, createMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('axios', () => {
  return {
    default: {
      create: createMock.mockReturnValue({
        post: postMock,
      }),
    },
  };
});

const jQueryMock = vi.fn().mockImplementation(() => ({
  trigger: mockTrigger,
  hide: vi.fn()
}));

vi.stubGlobal('jQuery', jQueryMock);
vi.stubGlobal('$', jQueryMock);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./Mfa.tsx', () => ({ default: () => <div data-testid="mfa-component">Mfa</div> }));

describe('Login Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    getItem: vi.fn((key: string) => store[key] || null),

    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });

    let store: Record<string, string> = {};
    const sessionStorageMock = {
      setItem: vi.fn((key: string, value: any) => { 
        store[key] = value !== undefined && value !== null ? value.toString() : ""; 
      }),
      
      clear: vi.fn(() => { store = {}; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('enter Username')).toBeInTheDocument();
  });

  
  it('submits login form and navigates on success (No MFA)', async () => {

    const user = userEvent.setup(); 
    const mockResponse = {
      data: {
        id: '123',
        username: 'testuser',
        token: 'token123',
        roles: 'user',
        userpic: 'pic.jpg',
        qrcodeurl: null,
        message: 'Login Successful',
      },
    };
    
    postMock.mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('enter Username'), 'testuser');
    await user.type(screen.getByPlaceholderText('enter Password'), 'password123');
  
    const submitButton = await screen.findByRole('button', { name: /login/i, hidden: true });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('name', 'login');    
    await user.click(submitButton);    
  
    await waitFor(() => {
      expect(screen.getByText('Login Successful')).toBeInTheDocument();      
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');      
      expect(window.location.reload).toHaveBeenCalled();
    });    

  });

  it('triggers MFA modal when qrcodeurl exists', async () => {
    const user = userEvent.setup(); 

    const mockResponse = {
      data: {
        id: '123',
        userpic: 'pic.jpg',
        qrcodeurl: 'some-qr-url',
        message: 'MFA Needed',
      },
    };

    postMock.mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('enter Username'), 'testuser');
    await user.type(screen.getByPlaceholderText('enter Password'), 'password123');


    const submitButton = await screen.findByRole('button', { name: /login/i, hidden: true });
    await user.click(submitButton); 

    const mfaButton = await screen.findByRole('button', { name: /mfa/i, hidden: true });
    await user.click(mfaButton); 

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('USERID', '123');
  });


  it('handles login error', async () => {
    const user = userEvent.setup(); 

    const errorResponse = { response: { data: { message: 'Invalid Credentials' } } };
    postMock.mockRejectedValueOnce(errorResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    await user.type(screen.getByPlaceholderText('enter Username'), 'wronguser');
    await user.type(screen.getByPlaceholderText('enter Password'), 'wrongpass');
      
    const submitButton = await screen.findByRole('button', { name: /login/i, hidden: true });
    await user.click(submitButton); 

    const errorMessage = await screen.findByText(/invalid credentials/i);
    expect(errorMessage).toBeInTheDocument();    

  });
});
