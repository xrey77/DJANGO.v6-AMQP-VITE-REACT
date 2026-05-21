import axios from 'axios';
import { useState } from 'react';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {'Accept': 'application/json',
            'Content-Type': 'application/json'}
})

const toDecimal = (val: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(val);
};

interface Product {
  id: number;
  descriptions: string;
  qty: number,
  unit: string;
  productpicture: string;
  sellprice: number;
}



export default function Prodsearch() {
  const [message, setMessage] = useState('');
  const [prodsearch, setProdsearch] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totpage, setTotpage] = useState<number>(0);
  const [totalrecords, setTotalrecords] = useState<number>(0);
  const [key, setSearchkey] = useState<string>('');

  const getProdsearch = async (event: React.SubmitEvent<HTMLFormElement>) => {   
      event.preventDefault();
      setMessage("please wait .");
      setSearchkey(key);
      await api.get(`api/products/search/${page}/${key}/`)
      .then((res) => {
          setProdsearch(res.data.products);
          setTotpage(res.data.totpage);
          setTotalrecords(res.data.totalrecords)
          setPage(res.data.page);
          setTimeout(() => {
            setMessage('');
          }, 1000);

      }, (error) => {     
        if (error.response){
          setMessage(error.response.data.message);
        } else {
          setMessage(error.message);
        }
        setProdsearch([]);
        setTotalrecords(0);
        setTimeout(() => {
            setMessage('');
        }, 3000);
          return;
      });  
  }

  const getProdPage = async (pg: number, xkey: string) => {
    setMessage("please wait .");
    await api.get(`api/products/search/${pg}/${xkey}`)
    .then((res) => {
      setProdsearch(res.data.products);
      // setTotpage(res.data.totpage);
      // setTotalrecords(res.data.totalrecords)
      setPage(res.data.page);
      setTimeout(() => {
          setMessage('');
        }, 1000);


    }, (error) => {        
      if (error.response){
        setMessage(error.response.data.message);
      } else {
        setMessage(error.message);
      }
      setProdsearch([]);
      // setTotalrecords(0);
      setTimeout(() => {
          setMessage('');
      }, 3000);
        return;
    });  
}

  const firstPage = (event: React.MouseEvent<HTMLAnchorElement>) => {  
    event.preventDefault();    
    setPage(1);
    getProdPage(page, key);
    return;
  }

  const nextPage = (event: React.MouseEvent<HTMLAnchorElement>) => {  
    event.preventDefault();    
    if (page === totpage) {
        setPage(totpage);
        return;
    }
    let pg: number = page;
    pg++;
    setPage(pg);
    getProdPage(pg, key);
    return;
  }

  const prevPage = (event: React.MouseEvent<HTMLAnchorElement>) => {  
    event.preventDefault();    
    if (page === 1) {
      setPage(1);
      return;
      }
      let pg: number = page;
      pg--;
      getProdPage(pg, key);
      return;
  }

  const lastPage = (event: React.MouseEvent<HTMLAnchorElement>) => {  
    event.preventDefault();
    setPage(totpage);
    return getProdPage(page, key);
  }  
   
return (
  <div className="container mb-10">
      <h2 className='text-warning embossed mt-3'>Products Search</h2>

      <form className="row g-3" onSubmit={getProdsearch} autoComplete='off'>
          <div className="col-auto">
            <input type="text" required className="form-control-sm" value={key} onChange={e => setSearchkey(e.target.value)} placeholder="enter Product keyword"/>
            <div className='searcMsg text-warning'>{message}</div>
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary btn-sm mb-3">search</button>
          </div>

      </form>
      <div className="container mb-9">
        <div className="card-group">
      {prodsearch.map((item) => {
              return (
              <div className='col-md-4'>
              <div key={item['id']} className="card mx-3 mt-3">
                  <img src={`http://127.0.0.1:8000/media/products/${item['productpicture']}`} className="card-img-top product-size" alt=""/>
                  <div className="card-body">
                    <h5 className="card-title">Descriptions</h5>
                    <p className="card-text desc-h">{item['descriptions']}</p>
                  </div>
                  <div className="card-footer">
                    <p className="card-text text-danger"><span className="text-dark">PRICE :</span>&nbsp;<strong>&#8369;{toDecimal(item['sellprice'])}</strong></p>
                  </div>  
              </div>
              
              </div>
        );    
      })}
        </div>          
        {
          totalrecords > 5 ? 
          <>
          <nav aria-label="Page navigation example">
            <ul className="pagination sm mt-3">
              <li className="page-item"><a onClick={lastPage} className="page-link sm" href="/#">Last</a></li>
              <li className="page-item"><a onClick={prevPage} className="page-link sm" href="/#">Previous</a></li>
              <li className="page-item"><a onClick={nextPage} className="page-link sm" href="/#">Next</a></li>
              <li className="page-item"><a onClick={firstPage} className="page-link sm" href="/#">First</a></li>
              <li className="page-item page-link text-danger sm">Page&nbsp;{page} of&nbsp;{totpage}</li>
            </ul>
          </nav>
          </>
        :
        null
        }
        {
          totalrecords > 0 ? 
            <div className='text-warning txt-left'><strong>Total Records Found : {totalrecords}</strong></div>
          :
          null
        }
        <br/><br/><br/>
      </div>
  </div>  
  )
}

