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
      </aside>

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
  )
}

export default AdminDashboard