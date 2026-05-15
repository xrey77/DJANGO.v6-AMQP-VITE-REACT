import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  type ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';
import axios from 'axios';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {'Accept': 'application/json',
            'Content-Type': 'application/json'}
})

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const logo = new Image();
logo.src = '/media/images/logo.png';

const logoPlugin = {
  id: 'logoPlugin',
  beforeDraw: (chart: any) => {
    if (logo.complete) {
      const { ctx, width } = chart;
      const logoWidth = 180;
      const logoHeight = 30;
      const x = (width - logoWidth) / 2; 
      const y = 10; 
      
      ctx.drawImage(logo, x, y, logoWidth, logoHeight);
    } else {
      logo.onload = () => chart.draw();
    }
  }
};

const initialOptions: ChartOptions<'bar'> = {
  responsive: true,
  layout: { padding: { top: 40 } },
  scales: {
    x: {
      ticks: { color: 'black', font: { family: 'Arial' } },
      grid: { color: 'rgba(255, 255, 255, 0.1)' }
    },
    y: {
      ticks: { color: 'black' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' }
    }
  },  
  plugins: {
    legend: { 
      position: 'top' as const,
      labels: { color: 'black' } 
    },
    title: { 
      display: true,
      text: 'Barclays Bank',
      color: 'black',
      font: { size: 24, family: 'Arial', weight: 'bold' }
    },
  },
};

interface SalesData {
  salesdate: string;
  salesamount: number;
}

export default function Saleschart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const promiseResolveRef = useRef<(() => void) | null>(null);  
  const [options, setOptions] = useState<ChartOptions<'bar'>>(initialOptions);

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current();
      promiseResolveRef.current = null;
    }
  }, [isPrinting]);  

  const handlePrint = useReactToPrint({
    contentRef: chartRef,
    documentTitle: "Sales Chart Report",
    onBeforePrint: () => {
      return new Promise((resolve) => {
        promiseResolveRef.current = resolve;
        setIsPrinting(true);
        setOptions({
          ...initialOptions,
          scales: {
            x: { 
              ...initialOptions.scales?.x,
              title: { display: true, text: '2025 Fiscal Periods', color: 'black' },
              ticks: { ...initialOptions.scales?.x?.ticks, color: 'black' }
            },
            y: { 
              ...initialOptions.scales?.y, 
              title: { display: true, text: 'Revenue (USD)', color: 'black' },
              ticks: { ...initialOptions.scales?.y?.ticks, color: 'black' } 
            }
          }
        });        
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      setOptions(initialOptions);
    }
  });

  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  });
    
  const fetchSales = async () => {
    try {
      const res = await api.get<SalesData[]>("api/saleschart/");
      const apiData = res.data;
  
      setChartData({
        labels: apiData.map(item => 
          new Date(item.salesdate).toLocaleString('en-US', { month: 'short' })
        ),        
        datasets: [{
            label: 'Sales Amount',
            data: apiData.map(item => item.salesamount),
            backgroundColor: 'rgba(60, 179, 113)',  //bar green color          
        }],
      });
    } catch (error: any) {
      console.error("Error:", error.message);
    }
  };

  useEffect(() => {  
    fetchSales();
  },[]);

  return (
<div className='container rounded-2 bg-light border' style={{ backgroundColor: 'lightblue', minHeight: '100vh' }}>
  {/* This header is only visible during print */}
  <div className="print-header">
    <h1>Sale Report</h1>
    <p>Generated on: {new Date().toLocaleDateString()}</p>
  </div>

  <div ref={chartRef} style={{ padding: '20px' }}>
    {chartData.datasets.length > 0 ? (
      <Bar options={options} data={chartData} plugins={[logoPlugin]} />
    ) : (
      <p className="text-center text-dark">Loading chart data...</p>
    )}
  </div>
  
  <button className='btn btn-success mt-3' onClick={() => handlePrint()}>Print Chart</button>

  <style>{`
    /* Hide the header by default in the browser */
    .print-header {
      display: none;
      text-align: center;
      margin-bottom: 20px;
      
    }

    @media print {
      @page {
        margin-top: 50px; 
      }

      /* Show the header only when printing */
      .print-header {
        display: block;
      }

      .container { 
        margin: 0; 
      }

      /* Hide the print button so it doesn't appear on paper */
      button {
        display: none;
      }

      canvas { 
        max-width: 100% !important; 
        height: auto !important; 
      }
    }      
    body {
      background-color: 'yellow';
    }
  `}</style>
</div>
  );
}