import React, { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { 'Accept': 'application/pdf' }
});

const Productreport: React.FC = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await api.get('api/productreport', {
          responseType: 'blob',
        });
        
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (error) {
        console.error("Error fetching PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  if (loading) return <div className='mt-5 text-center'>wait..loading PDF...</div>;

  return (
    <div className='mt-3' style={{ height: '100vh', width: '100%' }}>
      {url ? (
        <object
          data={url}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          <p>
            Your browser does not support PDFs. 
            <a href={url} download="document.pdf">Download instead</a>.
          </p>
        </object>
      ) : (
        <p>Failed to load PDF.</p>
      )}
    </div>
  );
};

export default Productreport;
