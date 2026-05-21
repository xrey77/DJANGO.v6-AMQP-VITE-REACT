import { useState, useEffect, useEffectEvent } from "react";
import axios from "axios";
import jQuery from 'jquery';
import { enableMFA, disableMFA } from "../services/mfaService"

const mfaapi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {'Accept': 'application/json',
            'Content-Type': 'application/json',}
})

const api = axios.create({
  baseURL: "http://localhost:9000",
  headers: {'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',}
})

export default function Profile() {    
    const [userid, setUserid] = useState<string>('');
    const [lname, setLname] = useState<string>('');
    const [fname, setFname] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [mobile, setMobile] = useState<string>('');
    const [userpicture, setUserpicture] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');
    const [newpassword, setNewPassword ] = useState<string>('');
    const [confnewpassword, setConfNewPassword ] = useState<string>('');    
    const [profileMsg, setProfileMsg] = useState<string>('');
    const [showmfa, setShowMfa] = useState<boolean>(false);
    const [showpwd, setShowPwd] = useState<boolean>(false);
    const [showupdate, setShowUpdate] = useState<boolean>(false);
    const [qrcodeurl, setQrcodeurl] = useState<string | null>(null);
      
    const handleEnableMfaClick = () => {
        enableMFA({
          userid,
          token,
          setProfileMsg,
          setQrcodeurl
        });
      };

      const handleDisableMfaClick = () => {
        disableMFA({
          userid,
          token,
          setProfileMsg,
          setQrcodeurl
        });
      };

    const fetchUserData = (id: string, token: string) => {
        mfaapi.get(`api/getuserid/${id}/`,{headers: {
            Authorization: `Bearer ${token}`
        }})
        .then((res) => {
            setLname(res.data.lastname); 
            setFname(res.data.firstname); 
            setEmail(res.data.email);
            setMobile(res.data.mobile);
            const userpic: string = `/media/users/${res.data.userpic}`;
            setUserpicture(userpic);
            setQrcodeurl(res.data.qrcodeurl);     

            if (res.data.qrcodeurl != null) {
                const qrcode: string = res.data.qrcodeurl
                setQrcodeurl(qrcode);
            } else {
                setQrcodeurl('/media/images/qrcode.png');
            }

        }, (error) => {
            if (error.response) {
                setProfileMsg(error.response.data.message);            
            } else {
                setProfileMsg(error.message);            
            }
            setTimeout(() => {
                setProfileMsg('');
            }, 3000);
        });
    };    

    useEffect(() => {
        jQuery("#password").prop('disabled', true);
        const savedUserId = sessionStorage.getItem('USERID') || '';
        // eslint-disable-next-line react-hooks/set-state-in-effect        
        setUserid(savedUserId);
        // eslint-disable-next-line react-hooks/set-state-in-effect        
        const xtoken: string = sessionStorage.getItem('TOKEN') || '';
        setToken(xtoken);
        setProfileMsg('please wait..');
        fetchUserData(savedUserId, xtoken);    
        setTimeout(() => {
            setProfileMsg('');
        }, 2000);
    },[]) 

    // const submitProfile = async (event: React.SubmitEvent<HTMLFormElement>) => {  
    //     event.preventDefault();
    //     try {
    //         const jsondata =JSON.stringify({first_name: fname, last_name: lname, mobile: mobile });
    //         await mfaapi.patch(`api/updateprofile/${userid}/`, jsondata, { headers: {
    //             Authorization: `Bearer ${token}`
    //         }})
    //         .then((res) => {
    //             setProfileMsg(res.data.message);
    //             setTimeout(() => {
    //                 setProfileMsg('');
    //             },3000);
    //             return;
    //         }, (error) => {
    //             if (error.response) {
    //                 setProfileMsg(error.response.data.message);            
    //             } else {
    //                 setProfileMsg(error.message);            
    //             }
    //             setTimeout(() => {
    //                 setProfileMsg('');
    //             },3000);
    //             return;
    //         });
    //     } catch (error) {
    //         if (error.response)  {
    //             setProfileMsg(error.response?.data?.message);
    //         } else {
    //             setProfileMsg(error.message);
    //         }
    //     }            
    // }
    const submitProfile = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const jsondata = JSON.stringify({ first_name: fname, last_name: lname, mobile: mobile });            
            const res = await mfaapi.patch(`api/updateprofile/${userid}/`, jsondata, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            setProfileMsg(res.data.message);
            setTimeout(() => setProfileMsg(''), 3000);
    
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    setProfileMsg(error.response.data?.message || 'Update failed');
                } else if (error.request) {
                    setProfileMsg('No response from server');
                } else {
                    setProfileMsg(error.message);
                }
            } else {
                setProfileMsg('An unexpected error occurred');
            }
            
            setTimeout(() => setProfileMsg(''), 3000);
        }
    };


    const changePicture = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const pix = URL.createObjectURL(event.target.files[0]);
            jQuery('#userpic').attr('src', pix);
            const formData = new FormData();
            formData.append('userpic', event.target.files[0]);
            api.patch(`api/uploadpicture/${userid}`, formData, {headers: {
                Authorization: `Bearer ${token}`
            }})
            .then((res) => {
                setProfileMsg(res.data.message);
                setTimeout(() => {
                    const userpic: string = `/media/users/${res.data.userpic}`;
                    sessionStorage.setItem('USERPIC',userpic)
                    setProfileMsg('');
                    window.location.reload();
                },3000);
                return;
            }, (error) => {
                if (error.response) {
                    setProfileMsg(error.response.data.message);            
                } else {
                    setProfileMsg(error.message);            
                }    
                setTimeout(() => {
                    setProfileMsg('');
                },3000);
                return;
            });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    setProfileMsg(error.response.data?.message || 'Update failed');
                } else if (error.request) {
                    setProfileMsg('No response from server');
                } else {
                    setProfileMsg(error.message);
                }
            } else {
                setProfileMsg('An unexpected error occurred');
            }
            
            setTimeout(() => setProfileMsg(''), 3000);
        }            

    }

    const cpwdCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setShowUpdate(true);
            setShowPwd(true);
            setShowMfa(false);
            jQuery('#checkTwoFactor').prop('checked', false);
            return;
        } else {
            setNewPassword('');
            setConfNewPassword('');
            setShowPwd(false);
            setShowUpdate(false)
        }
    }

    const mfaCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setShowMfa(true);
            setShowUpdate(true)
            setShowPwd(false);
            jQuery('#checkChangePassword').prop('checked', false);
        } else {
            setShowMfa(false);
            setShowUpdate(false)
        }
    }

    const changePassword = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setProfileMsg("please wait....");
        event.preventDefault();
        if (newpassword === '') {
            setProfileMsg("Please enter new Pasword.");
            setTimeout(() => {
                setProfileMsg('');
            },3000);
            return;
        }
        if (confnewpassword === '') {
            setProfileMsg("Please enter new Pasword confirmation.");
            setTimeout(() => {
                setProfileMsg('');
            },3000);
            return;            
        }

        if (newpassword !== confnewpassword) {
            setProfileMsg("new Password does not matched.");
            setTimeout(() => {
                setProfileMsg('');
            },3000);
            return;            
        }

        setProfileMsg("please wait...");
        const jsonData =JSON.stringify({password: newpassword });
        await mfaapi.patch(`api/changepassword/${userid}/`, jsonData, {headers: {
            Authorization: `Bearer ${token}`
        }})
        .then((res) => {
                setProfileMsg(res.data.message);
                setTimeout(() => {
                    setProfileMsg('');
                },3000);
        }, (error) => {
            if (error.response) {
                setProfileMsg(error.response.data.message);            
            } else {
                setProfileMsg(error.message);            
            }
            setTimeout(() => {
                setProfileMsg('');
            },3000);
            return;
        });        
    }

    return (
      <div className='profile-bg'>
        <div className="card card-profile mt-3">
        <div className="card-header bg-primary">
            <h3 className="text-white">User Profile ID No. {userid}</h3>
        </div>
        <div className="card-body">
        <form encType="multipart/form-data" autoComplete='false'>
                <div className='row'>
                    <div className='col'>
                        <input className="form-control bg-warning text-dark border-primary" id="firstname" name="firstname" type="text" value={fname} onChange={e => setFname(e.target.value)} placeholder="Firstname" required  />
                        <input className="form-control bg-warning text-dark border-primary mt-2" id="lastname" name="lastname" type="text" value={lname} onChange={e => setLname(e.target.value )} placeholder="Lastname" required />
                    </div>
                    <div className='col text-right'>

                    </div>
                </div>
                <div className='row'>
                    <div className='col'>
                        <input className="form-control bg-warning border-primary mt-2" id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} readOnly />
                    </div>
                    <div className='col'>
                        { userpicture !== null ? (
                            <img id="userpic" src={userpicture} className="userpic" alt="" />
                        ) : (
                            null
                        )}
                    </div>
                </div>


                <div className='row'>
                    <div className='col'>
                            <input className="form-control bg-warning border-primary mt-2" id="mobileno" name="mobileno" type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile" required />
                    </div>
                    <div className='col'>
                        <input className="userpicture mt-2" onChange={changePicture} type="file" name="upload" placeholder="change picture"/>
                    </div>
                </div>

                <div className='row'>
                    {/* 2-FACTOR AUTHENTICATION */}
                    <div className='col'>
                            <div className="form-check mt-2">
                                <input onChange={mfaCheckbox} className="form-check-input chkbox" type="checkbox" id="checkTwoFactor"/>
                                <label className="form-check-label" htmlFor="checkTwoFactor">
                                    Enable 2-Factor Authentication
                                </label>
                            </div>
                            {
                                showmfa === true ? (
                                    <div className='row'>
                                        <div className='col-5'>
                                            { qrcodeurl !== null ? (
                                                <img id="googleAuth" src={qrcodeurl} className="qrCode2" alt="QRCODE" />
                                            ) : (
                                                null
                                            )}
                                        </div>
                                        <div className='col-7'>
                                            <p className='text-danger mfa-pos-1'><strong>Requirements</strong></p>
                                            <p className="mfa-pos-2">You need to install <strong>Google or Microsoft Authenticator</strong> in your Mobile Phone, once installed, click Enable Button below, and <strong>SCAN QR CODE</strong>, next time you login, another dialog window will appear, then enter the <strong>OTP CODE</strong> from your Mobile Phone in order for you to login.</p>
                                            <button onClick={handleEnableMfaClick} type="button" name="enable" role="button" className='btn btn-primary mfa-btn-1 mx-1'>enable</button>
                                            <button onClick={handleDisableMfaClick} type="button" className='btn btn-secondary mfa-btn-2'>disable</button>
                                        </div>
                                    </div>
                                )
                                :
                                null
                            }

                    </div>
                    <div className='col'>
                            {/* CHANGE PASSWORD */}
                            <div className="form-check mt-2">
                            <input onChange={cpwdCheckbox} className="form-check-input chkbox" type="checkbox" id="checkChangePassword"/>
                            <label className="form-check-label" htmlFor="checkChangePassword">
                                Change Password
                            </label>
                        </div>
                        { showpwd === true ? (
                            <>
                              <input className="form-control text-dark border-primary mt-2" type="password" id="newPassword" value={newpassword} onChange={e => setNewPassword(e.target.value)} autoComplete="off" placeholder='enter new Password'/>
                              <input className="form-control text-dark border-primary mt-1" type="password" id="confNewPassword" value={confnewpassword} onChange={e => setConfNewPassword(e.target.value)} autoComplete="off" placeholder='confirm new Password'/>
                              <button onClick={changePassword} className='btn btn-primary mt-2' type="button">change password</button>
                            </>
                        )
                        :
                            null
                        }

                    </div>
                </div> 
                {
                    showupdate === false ? (
                        <button onClick={submitProfile} type='submit' className='btn btn-primary text-white mt-2' name="update">update profile</button>
                    )
                    :
                    null
                }
                </form>
        </div>
        <div className="card-footer text-danger">
            {profileMsg}
        </div>
        </div>
    </div>    
  )
}
