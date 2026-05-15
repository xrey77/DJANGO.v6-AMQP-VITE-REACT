import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const pdfApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const Productcategory: React.FC = () => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        // 2. Request as a blob
        const res = await pdfApi.get('api/productscategory/', {
          responseType: 'blob',
          headers: { 'Accept': 'application/pdf' }
        });
        
        // 3. Ensure the blob type is correct
        const blob = new Blob([res.data], { type: 'application/pdf' });
        
        // 4. Create and store URL
        const newUrl = URL.createObjectURL(blob);
        objectUrlRef.current = newUrl;
        setUrl(newUrl);
        setError(null);
      } catch (err) {
          console.error("Error fetching PDF:", err);
          setError("Failed to load PDF. Check backend console.");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    // 5. Cleanup
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []); 

  if (loading) return <div className='mt-5 text-center'>Loading report...</div>;
  if (error) return <div className='mt-5 text-center text-red-500'>{error}</div>;

  return (
    <div className='mt-3' style={{ height: '90vh', width: '100%' }}>
      {url && (
        <iframe
          src={url}
          width="100%"
          height="100%"
          title="Product Category Report"
        />
      )}
    </div>
  );
};

export default Productcategory;
