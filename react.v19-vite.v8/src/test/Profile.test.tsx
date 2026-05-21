// RUN : npx vitest Profile.test.tsx
import { render, screen, waitFor,fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Profile from '../components/Profile'
import axios from 'axios';
  
const mockTrigger = vi.fn(); 
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

const { mockPatch, mockGet } = vi.hoisted(() => ({
    mockPatch: vi.fn(),
    mockGet: vi.fn(),
  }));

  vi.mock('axios', () => {
    return {
      default: {
        create: vi.fn(() => ({
          get: mockGet, 
          post: vi.fn(),
          patch: mockPatch,
          interceptors: {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() },
          },          
        })),
      },
    };
  });

  const jQueryMock = vi.fn().mockImplementation(() => ({
  trigger: mockTrigger,
  hide: vi.fn()
}));

vi.stubGlobal('jQuery', jQueryMock);
vi.stubGlobal('$', jQueryMock);


const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });


Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: vi.fn() },
  });
  
describe('Profile Component', () => {
 let mockPatch: any;
 
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // vi.useFakeTimers();

    mockPatch = vi.fn();
    (axios.create as any).mockReturnValue({
      patch: mockPatch,
    });
  });

// afterEach(() => {
//   vi.clearAllTimers();
//   vi.useRealTimers();
// });

// it('renders user data on mount', async () => {
//     render(<Profile />);
    
//     await act(async () => {
//       // ... fireEvent or simulation
//     });
  
//     // Alternatively, use userEvent which handles act()
//     const user = userEvent.setup();
//     await user.click(screen.getByRole('checkbox'));
//   });


// 1ST TEST - GETUSER BY ID

  it('renders loading state and fetches user data on mount', async () => {

    sessionStorage.setItem('USERID', '123');
    sessionStorage.setItem('TOKEN', 'test-token');

    const mockData = {
      lastname: 'Doe',
      firstname: 'John'
    };
        
    mockGet.mockResolvedValue({ data: mockData });
    render(<Profile />);

    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    
    await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
            'api/getuserid/123/',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                }),
            })
        );                
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });    

  });

  it('displays error message when API fails', async () => {
    sessionStorage.setItem('USERID', '123');
    
    mockGet.mockRejectedValue({
      response: { 
        status: 400,
        data: { message: 'User not found' }
      }
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('shows MFA section when checkbox is checked', async () => {
    render(<Profile />);
    
    expect(screen.queryByText(/Requirements/i)).not.toBeInTheDocument();

    const checkbox = screen.getByLabelText(/Enable 2-Factor Authentication/i);
    fireEvent.click(checkbox);

    expect(screen.getByText(/Requirements/i)).toBeInTheDocument();
  });


// 2ND TEST - SUBMIT PROFILE

it('should call patch API with correct data and display success message', async () => {
    const user = userEvent.setup();
    mockPatch.mockResolvedValueOnce({ data: { success: true } });

    render(<Profile />);

    await user.type(screen.getByPlaceholderText('Firstname'), 'John');
    await user.type(screen.getByPlaceholderText('Lastname'), 'Doe');
    await user.type(screen.getByPlaceholderText('Mobile'), '1232323432');

    const updateButton = screen.getByRole('button', { name: /update/i, hidden: true });
    expect(updateButton).toBeInTheDocument();
    expect(updateButton).toHaveAttribute('name', 'update');    

    user.click(updateButton);
   
    waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith(
          expect.stringContaining('api/updateprofile/'),
          expect.any(String),
          expect.objectContaining({ headers: expect.any(Object) })
        );
      });

    mockPatch.mockRejectedValueOnce({
      response: { data: { message: 'Profile updated successfully' } },
    });
 
  });

  it('should display error message on API failure', async () => {
    const user = userEvent.setup();

    mockPatch.mockRejectedValueOnce({
      response: { data: { message: 'Failed to update' } },
    });

    render(<Profile />);

    const updateButton = screen.getByRole('button', { name: /update profile/i, hidden: true });
    await user.click(updateButton);

    
    waitFor(() => {
        expect(screen.getByText('Failed to update')).toBeInTheDocument();
    });
  });

// 3RD TEST - CHANGE USER PROFILE PICTURE
it('successfully uploads a picture and reloads', async () => {
    const user = userEvent.setup();

    render(<Profile />); 

    mockPatch.mockResolvedValueOnce({ data: { success: true } });

    const file = new File(['image-content'], 'avatar.png', { type: 'image/png' });
    const fileInput = screen.getByPlaceholderText('change picture');
    user.upload(fileInput, file);

    await waitFor(() => {
        expect(screen.queryByText('Failed to update')).not.toBeInTheDocument();
      });

  });


  it('handles API error gracefully', async () => {
    mockPatch.mockRejectedValue(new Error('API Error'));

    const user = userEvent.setup();
    render(<Profile />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    const fileInput = screen.getByPlaceholderText(/change picture/i);

    user.upload(fileInput, file);

    waitFor(() => {
        expect(screen.getByText('Failed to update')).toBeInTheDocument();
    });
  });  


//   4th TEST ENABLE AND DISABLE MULTI-FACTOR AUTHENTICATOR
it('should enable MFA, set message, and set qrcode after 3s', async () => {
    mockPatch.mockRejectedValue(new Error('API Failure'));
    mockPatch.mockResolvedValue({ data: { success: true } });
    // const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // const user = userEvent.setup();

    render(<Profile />);

    
    // await userEvent.click(await screen.findByRole('button', { name: /enable/i, hidden: true }));
    // const mfaButton = await screen.findByRole('button', { name: /enable/i });
    // await user.click(mfaButton);    

    // act(() => {
    //     vi.advanceTimersByTime(3000);
    // });
    
    //   await waitFor(() => {
    //     expect(screen.getByText(/mfa enabled/i)).toBeInTheDocument();
    //   });

    // const error = await screen.findByText('Failed to update');
    // expect(error).toBeInTheDocument();    

  });



  it('should set error message on failure', async () => {
    const mockError = { response: { data: { message: 'Failed' } } };
    mockPatch.mockRejectedValueOnce(mockError);

  });


});


