// src/services/mfaService.ts
import axios from 'axios';

export const mfaapi = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

type EnableMfaParams = {
  userid: string;
  token: string;
  setProfileMsg: (msg: string) => void;
  setQrcodeurl: (url: string) => void;
};

export const enableMFA = async ({
  userid,
  token,
  setProfileMsg,
  setQrcodeurl
}: EnableMfaParams) => {
  const data = JSON.stringify({ TwoFactorEnabled: true });
  
  await mfaapi.patch(`api/mfa/activate/${userid}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((res: any) => {
      setProfileMsg(res.data.message);
      setTimeout(() => {
        let qrcode: any = res.data.qrcodeurl;
        setQrcodeurl(qrcode);
        setProfileMsg('');
      }, 3000);
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


export const disableMFA = async ({
    userid,
    token,
    setProfileMsg,
    setQrcodeurl
  }: EnableMfaParams) => {
  
    const jsonData =JSON.stringify({TwoFactorEnabled: false });      
    mfaapi.patch(`api/mfa/activate/${userid}/`, jsonData, {headers: {
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
            setQrcodeurl('/media/images/qrcode.png');
        },3000);
        return;
    });
};