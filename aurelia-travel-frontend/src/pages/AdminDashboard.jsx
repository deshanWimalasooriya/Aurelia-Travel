import { useState, useEffect } from 'react';
import './styles/AdminDashboard.css';

// --- MOCK DATA (Replace with API calls) ---
const MOCK_STATS = [
  { title: "Total Revenue", value: "$124,500", change: "+12%", icon: "💰", color: "green" },
  { title: "Occupancy Rate", value: "84%", change: "-2%", icon: "🏨", color: "blue" },
  { title: "Check-ins Today", value: "12", change: "4 Pending", icon: "🛎️", color: "purple" },
  { title: "Available Rooms", value: "8", change: "Low Stock", icon: "🔑", color: "orange" },
];

const MOCK_BOOKINGS = [
  { id: "BK-789", guest: "John Doe", room: "Deluxe 101", checkIn: "2023-10-24", status: "Confirmed", payment: "Paid" },
  { id: "BK-790", guest: "Sarah Smith", room: "Suite 404", checkIn: "2023-10-25", status: "Pending", payment: "Pending" },
  { id: "BK-791", guest: "Mike Ross", room: "Single 202", checkIn: "2023-10-26", status: "Checked-in", payment: "Paid" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- RENDER HELPERS ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'hotel': return <HotelManagementView />;
      case 'rooms': return <RoomManagementView />;
      case 'bookings': return <BookingManagementView />;
      case 'guests': return <GuestManagementView />;
      case 'pricing': return <PricingView />;
      case 'payments': return <PaymentsView />;
      case 'staff': return <StaffView />;
      case 'housekeeping': return <HousekeepingView />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className={`admin-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🏨</div>
          <h2>LuxeAdmin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <p className="menu-label">CORE</p>
          <NavItem id="dashboard" icon="📊" label="Dashboard" active={activeTab} set={setActiveTab} />
          <NavItem id="bookings" icon="📅" label="Bookings" active={activeTab} set={setActiveTab} />
          <NavItem id="rooms" icon="🔑" label="Rooms" active={activeTab} set={setActiveTab} />
          <NavItem id="guests" icon="👥" label="Guests" active={activeTab} set={setActiveTab} />
          
          <p className="menu-label">OPERATIONS</p>
          <NavItem id="hotel" icon="🏢" label="Hotel & Property" active={activeTab} set={setActiveTab} />
          <NavItem id="housekeeping" icon="🧹" label="Housekeeping" active={activeTab} set={setActiveTab} />
          <NavItem id="staff" icon="id-card" label="Staff" active={activeTab} set={setActiveTab} />
          
          <p className="menu-label">FINANCE</p>
          <NavItem id="pricing" icon="🏷️" label="Pricing & Rates" active={activeTab} set={setActiveTab} />
          <NavItem id="payments" icon="💳" label="Payments" active={activeTab} set={setActiveTab} />
          
          <p className="menu-label">SYSTEM</p>
          <NavItem id="reports" icon="📈" label="Reports" active={activeTab} set={setActiveTab} />
          <NavItem id="settings" icon="⚙️" label="Settings" active={activeTab} set={setActiveTab} />
import { useState } from 'react'
import './styles/AdminDashboard.css' // Adjusted path to match your structure

// Mock Data for visualization
const MOCK_STATS = [
  { label: 'Total Bookings', value: '1,240', icon: '📅', change: '+12%' },
  { label: 'Total Revenue', value: '$84,300', icon: '💰', change: '+8%' },
  { label: 'Check-ins Today', value: '24', icon: 'bell', change: '5 Pending' },
  { label: 'Occupancy Rate', value: '85%', icon: '🏨', change: '-2%' },
]

const MOCK_BOOKINGS = [
  { id: '#BK-1001', guest: 'John Doe', room: 'Deluxe Suite', date: '2023-10-24', status: 'confirmed', amount: '$450' },
  { id: '#BK-1002', guest: 'Sarah Smith', room: 'Standard Double', date: '2023-10-25', status: 'pending', amount: '$120' },
  { id: '#BK-1003', guest: 'Michael Brown', room: 'Ocean View', date: '2023-10-26', status: 'checked-in', amount: '$340' },
  { id: '#BK-1004', guest: 'Emily Davis', room: 'Family Suite', date: '2023-10-27', status: 'cancelled', amount: '$0' },
]

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button 
            className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Rooms & Inventory
          </button>
          <button className="nav-item">Settings</button>
        </nav>

        <div className="sidebar-footer">
            <button className="logout-btn">↪ Logout</button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* TOP BAR */}
        <header className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search bookings, guests, rooms..." />
          </div>

          <div className="top-right">
            <button className="icon-btn">🔔<span className="badge">3</span></button>
            <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" />
              <div className="user-info">
                <span className="name">Alexander P.</span>
                <span className="role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <div className="content-wrapper">
          {renderContent()}
        </div>

      {/* Main Content Area */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Overview</h1>
          <div className="admin-profile">
            <span>Admin User</span>
            <div className="avatar">A</div>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              {MOCK_STATS.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-info">
                    <h3>{stat.value}</h3>
                    <p>{stat.label}</p>
                    <span className="stat-change">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Section */}
            <section className="recent-section">
              <div className="section-header">
                <h2>Recent Bookings</h2>
                <button className="btn-view-all">View All</button>
              </div>
              
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Guest</th>
                      <th>Room Type</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BOOKINGS.map((booking) => (
                      <tr key={booking.id}>
                        <td className="font-mono">{booking.id}</td>
                        <td>{booking.guest}</td>
                        <td>{booking.room}</td>
                        <td>{booking.date}</td>
                        <td>
                          <span className={`status-badge status-${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="font-bold">{booking.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS (VIEWS) ---

const NavItem = ({ id, icon, label, active, set }) => (
  <button 
    className={`nav-item ${active === id ? 'active' : ''}`} 
    onClick={() => set(id)}
  >
    <span className="icon">{icon === "id-card" ? "🪪" : icon}</span>
    {label}
  </button>
);

const DashboardView = () => (
  <div className="view-container fade-in">
    <div className="view-header">
      <h1>Dashboard Overview</h1>
      <button className="btn-primary">Download Report</button>
    </div>
    
    <div className="stats-grid">
      {MOCK_STATS.map((stat, i) => (
        <div key={i} className={`stat-card border-${stat.color}`}>
          <div className="stat-content">
            <p className="stat-title">{stat.title}</p>
            <h3 className="stat-value">{stat.value}</h3>
            <span className={`stat-change ${stat.change.includes('+') ? 'text-green' : 'text-red'}`}>
              {stat.change}
            </span>
          </div>
          <div className={`stat-icon bg-${stat.color}-light`}>{stat.icon}</div>
        </div>
      ))}
    </div>

    <div className="dashboard-split">
      <div className="card recent-bookings">
        <h3>Recent Bookings</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_BOOKINGS.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.guest}</td>
                <td>{b.room}</td>
                <td><span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="card occupancy-chart">
        <h3>Room Availability</h3>
        <div className="chart-placeholder">
          {/* Use Chart.js or Recharts here in production */}
          <div className="bar" style={{height: '60%'}}>Mon</div>
          <div className="bar" style={{height: '80%'}}>Tue</div>
          <div className="bar active" style={{height: '95%'}}>Wed</div>
          <div className="bar" style={{height: '40%'}}>Thu</div>
          <div className="bar" style={{height: '70%'}}>Fri</div>
        </div>
      </div>
    </div>
  </div>
);

const BookingManagementView = () => (
    <div className="view-container fade-in">
        <h1>Booking Management</h1>
        <div className="card">
            <div className="filters">
                <input type="text" placeholder="Search Booking ID..." />
                <select><option>All Status</option><option>Confirmed</option><option>Pending</option></select>
                <input type="date" />
                <button className="btn-primary">New Booking +</button>
            </div>
            <table className="table full-width">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Guest</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Room Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Map your full bookings data here */}
                    <tr>
                        <td>#BK-2024</td>
                        <td>Alice Wonderland</td>
                        <td>2024-01-10</td>
                        <td>2024-01-15</td>
                        <td>Ocean Suite</td>
                        <td>$1,200</td>
                        <td><span className="status-badge confirmed">Confirmed</span></td>
                        <td><button className="btn-text">Edit</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

const RoomManagementView = () => (
    <div className="view-container fade-in">
        <h1>Room Management</h1>
        <div className="room-grid-layout">
            {['101', '102', '103', '104', '201', '202'].map(room => (
                <div key={room} className="room-card-large">
                    <div className="room-img-placeholder">Image</div>
                    <div className="room-info">
                        <h3>Room {room}</h3>
                        <p>Deluxe King</p>
                        <div className="room-status-toggle">
                            <span className="dot available"></span> Available
                        </div>
                        <div className="room-actions">
                            <button>Edit</button>
                            <button>Maintenance</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const HotelManagementView = () => (
    <div className="view-container fade-in">
        <h1>Hotel & Property</h1>
        <div className="settings-layout">
            <div className="card">
                <h3>General Info</h3>
                <form className="form-grid">
                    <label>Hotel Name <input type="text" defaultValue="Grand Aurelia" /></label>
                    <label>Location <input type="text" defaultValue="Colombo, Sri Lanka" /></label>
                    <label>Description <textarea defaultValue="Luxury stay..." /></label>
                    <button className="btn-primary">Save Changes</button>
                </form>
            </div>
            <div className="card">
                <h3>Amenities</h3>
                <div className="checkbox-group">
                    <label><input type="checkbox" checked /> Free Wi-Fi</label>
                    <label><input type="checkbox" checked /> Swimming Pool</label>
                    <label><input type="checkbox" /> Gym</label>
                    <label><input type="checkbox" checked /> Spa</label>
                </div>
            </div>
        </div>
    </div>
);

const SettingsView = () => {
    const [subTab, setSubTab] = useState('system');
    return (
        <div className="view-container fade-in">
            <h1>System Settings</h1>
            <div className="tabs">
                {['System', 'Roles', 'Security', 'Notifications', 'CMS'].map(t => (
                    <button key={t} className={subTab === t.toLowerCase() ? 'active' : ''} onClick={() => setSubTab(t.toLowerCase())}>{t}</button>
                ))}
            </div>
            <div className="card settings-content">
                {subTab === 'system' && (
                    <form className="form-grid">
                        <label>Currency <select><option>USD ($)</option><option>LKR (Rs)</option></select></label>
                        <label>Time Zone <select><option>GMT +5:30</option></select></label>
                        <label>Tax Rate (%) <input type="number" defaultValue="10" /></label>
                    </form>
                )}
                {subTab === 'notifications' && <p>Email & SMS Template Configuration...</p>}
                {subTab === 'roles' && <p>Admin, Manager, Staff Access Control...</p>}
                {subTab === 'cms' && <p>Website Banner & Content Management...</p>}
            </div>
        </div>
    )
};

// Placeholders for other views to keep code concise but functional
const GuestManagementView = () => <div className="view-container"><h1>Guest Management</h1><p>VIP Tagging, History, and Blacklist</p></div>;
const PricingView = () => <div className="view-container"><h1>Pricing & Rates</h1><p>Seasonal Rates, Coupons, Weekend modifiers</p></div>;
const PaymentsView = () => <div className="view-container"><h1>Payments & Billing</h1><p>Invoices, Refunds, and Transaction Logs</p></div>;
const StaffView = () => <div className="view-container"><h1>Staff Management</h1><p>Shift Scheduling, Roles, and Activity Logs</p></div>;
const HousekeepingView = () => <div className="view-container"><h1>Housekeeping</h1><p>Cleaning Status, Inspections, and Assignments</p></div>;
const ReportsView = () => <div className="view-container"><h1>Reports & Analytics</h1><p>Export PDF/Excel, Revenue Graphs</p></div>;

export default AdminDashboard;
export default AdminDashboard
