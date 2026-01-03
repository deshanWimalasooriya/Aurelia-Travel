import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles/AdminDashboard.css'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data States
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock Data for "Rooms" (usually fetched from /api/rooms)
  const [rooms, setRooms] = useState([
    { id: 101, type: 'Deluxe Suite', status: 'available', price: 450, clean: true },
    { id: 102, type: 'Standard Double', status: 'occupied', price: 120, clean: true },
    { id: 103, type: 'Ocean View', status: 'maintenance', price: 340, clean: false },
    { id: 104, type: 'Family Suite', status: 'available', price: 280, clean: false },
    { id: 105, type: 'Standard Single', status: 'available', price: 100, clean: true },
    { id: 106, type: 'Penthouse', status: 'occupied', price: 850, clean: true },
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch real data (Fail gracefully to mocks if API not ready)
      const [statsRes, bookingsRes, usersRes] = await Promise.allSettled([
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/bookings'),
        axios.get('http://localhost:5000/api/users') // Only works if admin
      ])

      // Handle Stats
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      else setStats(MOCK_STATS) // Fallback

      // Handle Bookings
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data)
      else setBookings(MOCK_BOOKINGS) // Fallback

      // Handle Users
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data)
      else setUsers(MOCK_USERS) // Fallback

    } catch (error) {
      console.error("Dashboard Load Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle Room Status (Optimistic UI update)
  const toggleRoomStatus = (id) => {
    setRooms(rooms.map(room => {
      if (room.id === id) {
        return { 
          ...room, 
          status: room.status === 'available' ? 'maintenance' : 'available' 
        }
      }
      return room
    }))
  }

  // Filter Logic for Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.id?.toString().includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || b.status?.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {/* 1. Professional Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">🏨</div>
          <h3>HotelAdmin</h3>
        </div>
        
        <nav className="sidebar-menu">
          <div className="menu-category">MAIN</div>
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <span>📊</span> Dashboard
          </button>
          <button onClick={() => setActiveTab('bookings')} className={activeTab === 'bookings' ? 'active' : ''}>
            <span>📅</span> Bookings
          </button>
          
          <div className="menu-category">INVENTORY</div>
          <button onClick={() => setActiveTab('rooms')} className={activeTab === 'rooms' ? 'active' : ''}>
            <span>🔑</span> Room Status
          </button>
          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}>
            <span>👥</span> Users
          </button>

          <div className="menu-category">SYSTEM</div>
          <button className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-content">
        
        {/* Top Header */}
        <header className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="top-bar-right">
            <div className="search-box">
              <input type="text" placeholder="Global Search..." />
              <span>🔍</span>
            </div>
            <div className="admin-profile-pill">
              <img src="https://ui-avatars.com/api/?name=Admin+User" alt="Admin" />
              <div className="profile-text">
                <span className="name">Super Admin</span>
                <span className="role">Manager</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="content-wrapper">
          
          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-view animate-fade-in">
              <h1>Dashboard Overview</h1>
              
              {/* Stats Cards */}
              <div className="stats-grid">
                {stats && stats.map((stat, idx) => (
                  <div key={idx} className="stat-card">
                    <div className={`icon-box ${getIconColor(stat.label)}`}>{stat.icon}</div>
                    <div className="stat-details">
                      <h4>{stat.label}</h4>
                      <h2>{stat.value}</h2>
                      <span className="trend positive">{stat.change} vs last month</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Chart Visualization (CSS Only) */}
              <div className="chart-section">
                <h3>Revenue Analytics (Weekly)</h3>
                <div className="bar-chart">
                  <div className="bar" style={{height: '60%'}} data-label="Mon"></div>
                  <div className="bar" style={{height: '80%'}} data-label="Tue"></div>
                  <div className="bar" style={{height: '45%'}} data-label="Wed"></div>
                  <div className="bar" style={{height: '90%'}} data-label="Thu"></div>
                  <div className="bar active" style={{height: '100%'}} data-label="Fri"></div>
                  <div className="bar" style={{height: '75%'}} data-label="Sat"></div>
                  <div className="bar" style={{height: '65%'}} data-label="Sun"></div>
                </div>
              </div>
            </div>
          )}

          {/* --- BOOKINGS TAB --- */}
          {activeTab === 'bookings' && (
            <div className="bookings-view animate-fade-in">
              <div className="view-header">
                <h1>Manage Bookings</h1>
                <div className="action-bar">
                  <div className="search-input">
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search guest or ID..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest Name</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono">#{b.id}</td>
                        <td className="font-bold">{b.guestName}</td>
                        <td>{b.roomType || 'Standard'}</td>
                        <td>{new Date(b.date).toLocaleDateString()}</td>
                        <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                        <td>${b.amount}</td>
                        <td>
                          <button className="btn-icon">✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBookings.length === 0 && <div className="empty-state">No bookings found.</div>}
              </div>
            </div>
          )}

          {/* --- ROOMS TAB --- */}
          {activeTab === 'rooms' && (
            <div className="rooms-view animate-fade-in">
              <h1>Room Inventory</h1>
              <div className="room-grid">
                {rooms.map(room => (
                  <div key={room.id} className={`room-card ${room.status}`}>
                    <div className="room-header">
                      <span className="room-number">#{room.id}</span>
                      <span className={`status-dot ${room.status}`}></span>
                    </div>
                    <h3>{room.type}</h3>
                    <div className="room-details">
                      <p>Price: <strong>${room.price}</strong>/night</p>
                      <p>Condition: {room.clean ? '✨ Clean' : '🧹 Dirty'}</p>
                    </div>
                    <div className="room-actions">
                      <button 
                        onClick={() => toggleRoomStatus(room.id)}
                        className="btn-toggle"
                      >
                        {room.status === 'available' ? 'Mark Maintenance' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- USERS TAB --- */}
          {activeTab === 'users' && (
            <div className="users-view animate-fade-in">
              <h1>Registered Users</h1>
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id || Math.random()}>
                        <td>{u.id}</td>
                        <td className="font-bold">{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                           <span className={u.role === 'admin' ? 'role-badge admin' : 'role-badge user'}>
                             {u.role || 'user'}
                           </span>
                        </td>
                        <td><button className="text-red">Block</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// Helpers
const getIconColor = (label) => {
  if (label.includes('Revenue')) return 'bg-green'
  if (label.includes('Bookings')) return 'bg-blue'
  return 'bg-purple'
}

// Mock Fallback Data
const MOCK_STATS = [
  { label: 'Total Bookings', value: '1,240', icon: '📅', change: '+12%' },
  { label: 'Total Revenue', value: '$84,300', icon: '💰', change: '+8%' },
  { label: 'Occupancy Rate', value: '85%', icon: '🏨', change: '-2%' },
  { label: 'Active Guests', value: '42', icon: '👥', change: '+5' },
]

const MOCK_BOOKINGS = [
  { id: 1001, guestName: 'Alice Johnson', roomType: 'Deluxe Suite', date: '2023-11-01', status: 'confirmed', amount: 450 },
  { id: 1002, guestName: 'Bob Smith', roomType: 'Standard', date: '2023-11-02', status: 'pending', amount: 120 },
  { id: 1003, guestName: 'Charlie Brown', roomType: 'Ocean View', date: '2023-11-03', status: 'cancelled', amount: 0 },
]

const MOCK_USERS = [
  { id: 1, username: 'admin_john', email: 'john@hotel.com', role: 'admin' },
  { id: 2, username: 'guest_sarah', email: 'sarah@gmail.com', role: 'user' },
]

export default AdminDashboard