import { useState } from "react"
import jQuery from "jquery";
import axios from 'axios';

const api = axios.create({
   baseURL: "http://127.0.0.1:8000",
   headers: {'Accept': 'application/json',
             'Content-Type': 'application/json'}
})

export default function Mfa() {
  const [otp, setOtp] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isdisabled, setIsdisabled] = useState<boolean>(false)

  const submitMfa = async (event: any) => {
    event.preventDefault();
    setIsdisabled(true)
    const userid = sessionStorage.getItem('USERID');
    const token = sessionStorage.getItem('TOKEN');
    setMessage('please wait..');
    const jsonData =JSON.stringify({otp: otp });
    await api.patch(`api/mfa/verifytotp/${userid}/`, jsonData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res: any) => {
          setMessage(res.data.message);
            sessionStorage.setItem("USERNAME", res.data.username);
            window.setTimeout(() => {
              setMessage('');
              setIsdisabled(false);
              jQuery("#mfaReset").trigger('click');
              window.location.reload();
            }, 3000);
      }, (error: any) => {
        if (error.response) {
          setMessage(error.response.data.message);            
        } else {
            setMessage(error.message);            
        }
        window.setTimeout(() => {
              setMessage('');
              setIsdisabled(false);
            }, 3000);
            return;
    });        
  }

  const resetMfa = (event: any) => {
    event.preventDefault();
    setOtp('');
    setIsdisabled(false);
  }

  const closeMfa = (event: any) => {
    event.preventDefault();
    setMessage('');
    setOtp('');
    sessionStorage.removeItem('USERID');
    sessionStorage.removeItem('USERNAME');
    sessionStorage.removeItem('USERPIC');
    sessionStorage.removeItem('TOKEN');
    location.href="/";
    location.reload();
  }

  return (
    <div className="modal fade" id="staticMfa" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby="staticMfaLabel" aria-hidden="true">
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-info">
            <h1 className="modal-title fs-5 text-dark" id="staticMfaLabel">Multi-Factor Authenticator</h1>
            <button onClick={closeMfa} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
          <form onSubmit={submitMfa} autoComplete="off">
            <div className="mb-3">
              <input type="text" name="text" required value={otp} onChange={e => setOtp(e.target.value)} className="form-control border-dark" id="otp" placeholder="enter 6-digit OTP code" disabled={isdisabled}/>
            </div>          
            <div className="mb-3">
              <button type="submit" name="submit" role="button" className="btn btn-info mx-2 text-dark"  disabled={isdisabled}>submit</button>
              <button onClick={resetMfa} type="button" name="reset" role="button" className="btn btn-info text-dark">reset</button>
            </div>
          </form>            
          </div>
          <div className="modal-footer">
            <div className="w-100 text-center text-danger">{message}</div>
          </div>
        </div>
      </div>
    </div>    
  )
}
        
