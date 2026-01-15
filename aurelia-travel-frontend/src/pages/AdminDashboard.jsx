import { useState } from "react";
import "./styles/AdminDashboard.css";

/* ================= MOCK DATA ================= */

const ADMIN = {
  name: "Alexander P.",
  role: "SUPER_ADMIN",
};

const STATS = [
  { title: "Total Revenue", value: "$124,500", trend: "+12%", type: "success", icon: "💰" },
  { title: "Occupancy Rate", value: "84%", trend: "-2%", type: "warning", icon: "🏨" },
  { title: "Active Bookings", value: "56", trend: "+6", type: "success", icon: "📅" },
  { title: "Rooms Available", value: "8", trend: "Low", type: "danger", icon: "🔑" },
];

const BOOKINGS = [
  { id: "BK-1001", guest: "John Doe", room: "Deluxe 101", status: "Confirmed" },
  { id: "BK-1002", guest: "Sarah Smith", room: "Suite 404", status: "Pending" },
  { id: "BK-1003", guest: "Mike Ross", room: "Single 202", status: "Checked-in" },
];

/* ================= MAIN COMPONENT ================= */

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-container">
      
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-header">
          <span className="logo">🏨</span>
          <h2>LuxeAdmin</h2>
        </div>

        <nav className="sidebar-nav">
          <NavItem icon="📊" label="Dashboard" tab="dashboard" active={activeTab} set={setActiveTab} />
          <NavItem icon="📅" label="Bookings" tab="bookings" active={activeTab} set={setActiveTab} />
          <NavItem icon="🔑" label="Rooms" tab="rooms" active={activeTab} set={setActiveTab} />
          <NavItem icon="👥" label="Guests" tab="guests" active={activeTab} set={setActiveTab} />
          <NavItem icon="🧹" label="Housekeeping" tab="housekeeping" active={activeTab} set={setActiveTab} />

          {ADMIN.role === "SUPER_ADMIN" && (
            <>
              <NavItem icon="🪪" label="Staff" tab="staff" active={activeTab} set={setActiveTab} />
              <NavItem icon="📈" label="Reports" tab="reports" active={activeTab} set={setActiveTab} />
              <NavItem icon="⚙️" label="Settings" tab="settings" active={activeTab} set={setActiveTab} />
            </>
          )}
        </nav>

        <button className="logout-btn">Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search bookings, guests, rooms..." />
          </div>

          <div className="profile">
            <img src="https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff" alt="admin" />
            <div>
              <p>{ADMIN.name}</p>
              <span>{ADMIN.role}</span>
            </div>
          </div>

        <div className="content">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "bookings" && <SimpleView title="Booking Management" />}
          {activeTab === "rooms" && <SimpleView title="Room Management" />}
          {activeTab === "guests" && <SimpleView title="Guest Management" />}
          {activeTab === "housekeeping" && <SimpleView title="Housekeeping" />}
          {activeTab === "staff" && <SimpleView title="Staff Management" />}
          {activeTab === "reports" && <SimpleView title="Reports & Analytics" />}
          {activeTab === "settings" && <SimpleView title="System Settings" />}
        </div>
      </main>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

const NavItem = ({ icon, label, tab, active, set }) => (
  <button
    className={`nav-item ${active === tab ? "active" : ""}`}
    onClick={() => set(tab)}
  >
    <span>{icon}</span>
    {label}
  </button>
);

const Dashboard = () => (
  <div className="dashboard fade-in">
    <h1>Dashboard Overview</h1>

    <div className="stats-grid">
      {STATS.map((s, i) => (
        <div key={i} className={`stat-card ${s.type}`}>
          <div>
            <p>{s.title}</p>
            <h3>{s.value}</h3>
            <span>{s.trend}</span>
          </div>
          <div className="icon">{s.icon}</div>
        </div>
      ))}
    </div>

    <div className="dashboard-bottom">
      <div className="card">
        <h3>Recent Bookings</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {BOOKINGS.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.guest}</td>
                <td>{b.room}</td>
                <td>
                  <span className={`badge ${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="actions">
          <button>➕ New Booking</button>
          <button>🛏 Add Room</button>
          <button>🧹 Assign Cleaning</button>
          <button>👤 Add Staff</button>
        </div>
      </div>
    </div>
  </div>
);

const SimpleView = ({ title }) => (
  <div className="fade-in">
    <h1>{title}</h1>
    <p>This section is ready for backend integration.</p>
  </div>
);
