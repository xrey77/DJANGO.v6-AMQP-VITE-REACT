import axios from 'axios';
import React, { useState, useEffect } from 'react';


interface Product {
  id: number;
  descriptions: string;
  qty: number,
  unit: string;
  sellprice: number;
}

export default function Prodlist() {
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json'}
  });
  
  const toDecimal = (val: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(val);
  };

    const [page, setPage] = useState<number>(1);
    const [totpage, setTotpage] = useState<number>(0);
    const [totalrecs, setTotalrecs] = useState<number>(0);
    const [message, setMessage] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);

    const fetchProducts = async (pg: number) => {
      await api.get(`api/products/list/${pg}/`).then((res) => {
        setProducts(res.data.products);
        setTotpage(res.data.totpage);
        setTotalrecs(res.data.totalrecords);
        setPage(res.data.page);
      }, (error) => {
        if (error.response) {
          setMessage(error.response.data.message);            
        } else {
          setMessage(error.message);            
        }
        setTimeout(() => {
          setMessage('')
        }, 3000);        
        return;
      });      
    }

    useEffect(() => {
      fetchProducts(page);
   },[]);

    const firstPage = (event: React.MouseEvent<HTMLAnchorElement>) => {      
        event.preventDefault();    
        setPage(1)
        fetchProducts(page);
        return;    
      }
    
      const nextPage = (event: React.MouseEvent<HTMLAnchorElement>) => {  
        event.preventDefault();    
        if (page == totpage) {
            setPage(totpage);
            return;
        }
        let pg: number = page;
        pg++;
        return fetchProducts(pg);
      }
    
      const prevPage = (event: React.MouseEvent<HTMLAnchorElement>) => {    
        event.preventDefault();    
        if (page === 1) {
          return;
          }
          let pg: number = page;
          pg--;
          return fetchProducts(pg);
      }
    
      const lastPage = (event: React.MouseEvent<HTMLAnchorElement>) => {     
        event.preventDefault();
        let pg: number = page;
        pg = totpage;
        return fetchProducts(pg);
      }  
  
  return (
    <div className="container">
            <h1 className='text-warning embossed mt-3'>Products List</h1>

            <table className="table table-danger table-striped">
            <thead>
                <tr>
                <th className="bg-primary text-white" scope="col">#</th>
                <th className="bg-primary text-white" scope="col">Descriptions</th>
                <th className="bg-primary text-white" scope="col">Qty</th>
                <th className="bg-primary text-white" scope="col">Unit</th>
                <th className="bg-primary text-white" scope="col">Price</th>
                </tr>
            </thead>
            <tbody>

            {products.map((item) => {
            return (
              <tr key={item['id']}>
                 <td>{item['id']}</td>
                 <td>{item['descriptions']}</td>
                 <td>{item['qty']}</td>
                 <td>{item['unit']}</td>
                 <td>&#8369;{toDecimal(item['sellprice'])}</td>
               </tr>
              );
            })}

            </tbody>
            </table>

            <nav aria-label="Page navigation example">
        <ul className="pagination sm">
          <li className="page-item"><a onClick={lastPage} className="page-link sm" href="/#">Last</a></li>
          <li className="page-item"><a onClick={prevPage} className="page-link sm" href="/#">Previous</a></li>
          <li className="page-item"><a onClick={nextPage} className="page-link sm" href="/#">Next</a></li>
          <li className="page-item"><a onClick={firstPage} className="page-link sm" href="/#">First</a></li>
          <li className="page-item page-link text-danger sm">Page&nbsp;{page} of&nbsp;{totpage}</li>

        </ul>
      </nav>
      <div className='text-warning'><strong>Total Records : {totalrecs}</strong></div>
      <div className='text-warning'>{message}</div>
    </div>    
  )
}
