import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DollarSign, PieChart, Wallet } from 'lucide-react';

const MasterDashboardFinance = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminAPI.getFinancialData().then(res => {
      if(res.data.success) setData(res.data.data);
    });
  }, []);

  if (!data) return <div>Loading Financial Data...</div>;

  return (
    <div className="fade-in">
      <div className="content-header">
        <h1>Financial Overview</h1>
        <p>Revenue distribution and commission tracking</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header"><div className="icon-box"><DollarSign/></div></div>
          <div className="kpi-value">${data.gross_revenue.toLocaleString()}</div>
          <div className="kpi-label">Total Gross Revenue</div>
        </div>
        
        <div className="kpi-card" style={{borderLeft: '4px solid #10b981'}}>
          <div className="kpi-header"><div className="icon-box"><Wallet/></div></div>
          <div className="kpi-value">${data.aurelia_commission.toLocaleString()}</div>
          <div className="kpi-label">Platform Profit (15%)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><div className="icon-box"><PieChart/></div></div>
          <div className="kpi-value">${data.hotel_payouts.toLocaleString()}</div>
          <div className="kpi-label">Hotel Payouts (85%)</div>
        </div>
      </div>
    </div>
  );
};

export default MasterDashboardFinance;