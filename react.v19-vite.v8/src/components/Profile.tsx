import { useState, useEffect } from "react";
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
    const [userid, setUserid] = useState<string>('');;
    const [lname, setLname] = useState<string>('');
    const [fname, setFname] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [mobile, setMobile] = useState<string>('');
    const [userpicture, setUserpicture] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');
    const [newpassword, setNewPassword ] = useState<string>('');
    const [confnewpassword, setConfNewPassword ] = useState<string>('');    
    const [profileMsg, setProfileMsg] = useState<string | null>(null);
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



    const fetchUserData = (id: any, token: any) => {
        mfaapi.get(`api/getuserid/${id}/`,{headers: {
            Authorization: `Bearer ${token}`
        }})
        .then((res: any) => {
            setLname(res.data.lastname); 
            setFname(res.data.firstname); 
            setEmail(res.data.email);
            setMobile(res.data.mobile);
            let userpic: any = `/media/users/${res.data.userpic}`;
            setUserpicture(userpic);
            setQrcodeurl(res.data.qrcodeurl);     

            if (res.data.qrcodeurl != null) {
                // let qrcode: any = 'data:image/png;base64,' + res.data.qrcodeurl
                let qrcode: any = res.data.qrcodeurl
                setQrcodeurl(qrcode);
            } else {
                setQrcodeurl('/media/images/qrcode.png');
            }

        }, (error: any) => {
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

        const userId = sessionStorage.getItem('USERID');
        if (userId !== null) {
            setUserid(userId)
        } else {
            setUserid('')
        }
        const xtoken = sessionStorage.getItem('TOKEN');
        if (xtoken !== null) {
            setToken(xtoken);
        } else {
            setToken('');
        }
        setProfileMsg('please wait..');
        fetchUserData(userId, xtoken);    
        setTimeout(() => {
            setProfileMsg('');
        }, 2000);
    },[]) 

    const submitProfile = async (event: any) => {
        event.preventDefault();
        try {
            const jsondata =JSON.stringify({first_name: fname, last_name: lname, mobile: mobile });
            await mfaapi.patch(`api/updateprofile/${userid}/`, jsondata, { headers: {
                Authorization: `Bearer ${token}`
            }})
            .then((res: any) => {
                setProfileMsg(res.data.message);
                setTimeout(() => {
                    setProfileMsg('');
                },3000);
                return;
            }, (error: any) => {
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
        } catch (error: any) {
            setProfileMsg(error.response?.data?.message || "An error occurred");
        }            
    }

    const changePicture = (event: any) => {
        event.preventDefault();
        try {
            var pix = URL.createObjectURL(event.target.files[0]);
            jQuery('#userpic').attr('src', pix);
            const formData = new FormData();
            formData.append('userpic', event.target.files[0]);
            api.patch(`api/uploadpicture/${userid}`, formData, {headers: {
                Authorization: `Bearer ${token}`
            }})
            .then((res: any) => {
                setProfileMsg(res.data.message);
                setTimeout(() => {
                    let userpic: any = `/media/users/${res.data.userpic}`;
                    sessionStorage.setItem('USERPIC',userpic)
                    setProfileMsg('');
                    window.location.reload();
                },3000);
                return;
            }, (error: any) => {
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
        } catch (error: any) {
            setProfileMsg(error.response?.data?.message || "An error occurred");
        }            

    }

    const cpwdCheckbox = (e: any) => {
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

    const mfaCheckbox = (e: any) => {
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

    const changePassword = async (event: any) => {
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
        .then((res: any) => {
                setProfileMsg(res.data.message);
                setTimeout(() => {
                    setProfileMsg('');
                },3000);
        }, (error: any) => {
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
