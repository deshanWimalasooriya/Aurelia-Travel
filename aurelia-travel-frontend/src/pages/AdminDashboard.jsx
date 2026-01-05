import { useState, useEffect } from "react";
import "./styles/AdminDashboard.css";
import { adminAPI } from "../services/api";

/* ================= MOCK DATA (fallbacks) ================= */

const ADMIN = {
  name: "Alexander P.",
  role: "SUPER_ADMIN",
};

const FALLBACK_STATS = [
  { title: "Total Revenue", value: "$124,500", trend: "+12%", type: "success", icon: "💰" },
  { title: "Occupancy Rate", value: "84%", trend: "-2%", type: "warning", icon: "🏨" },
  { title: "Active Bookings", value: "56", trend: "+6", type: "success", icon: "📅" },
  { title: "Rooms Available", value: "8", trend: "Low", type: "danger", icon: "🔑" },
];

const FALLBACK_BOOKINGS = [
  { id: "BK-1001", guest: "John Doe", room: "Deluxe 101", status: "Confirmed" },
  { id: "BK-1002", guest: "Sarah Smith", room: "Suite 404", status: "Pending" },
  { id: "BK-1003", guest: "Mike Ross", room: "Single 202", status: "Checked-in" },
];

/* ================= MAIN COMPONENT ================= */

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // API state
  const [stats, setStats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);

  // Fetch stats on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingStats(true);
      setError(null);
      try {
        const res = await adminAPI.getStats();
        if (mounted) setStats(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  // Fetch bookings when Bookings tab is opened
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (activeTab !== "bookings") return;
    const load = async () => {
      setLoadingBookings(true);
      setError(null);
      try {
        const res = await adminAPI.getBookings();
        if (mounted) setBookings(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        if (mounted) setLoadingBookings(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [activeTab]);

  // Fetch rooms when Rooms tab is opened
  useEffect(() => {
    let mounted = true;
    if (activeTab !== "rooms") return;
    const loadRooms = async () => {
      setLoadingRooms(true);
      setError(null);
      try {
        const res = await adminAPI.getRooms();
        if (mounted) setRooms(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        if (mounted) setLoadingRooms(false);
      }
    };
    loadRooms();
    return () => (mounted = false);
  }, [activeTab]);

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
        </header>

        <div className="content">
          {activeTab === "dashboard" && (
            <Dashboard stats={stats} loading={loadingStats} error={error} />
          )}

          {activeTab === "bookings" && (
            <BookingsView bookings={bookings} setBookings={setBookings} loading={loadingBookings} error={error} />
          )}

          {activeTab === "rooms" && (
            <RoomsView rooms={rooms} setRooms={setRooms} loading={loadingRooms} error={error} />
          )}
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

const Dashboard = ({ stats, loading, error }) => (
  <div className="dashboard fade-in">
    <h1>Dashboard Overview</h1>

    {error && <div className="error">{error}</div>}

    <div className="stats-grid">
      {(loading ? FALLBACK_STATS : (stats.length ? stats : FALLBACK_STATS)).map((s, i) => (
        <div key={i} className={`stat-card ${s.type || ""}`}>
          <div>
            <p>{s.title || s.label}</p>
            <h3>{s.value}</h3>
            <span>{s.trend || s.change}</span>
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
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(loading ? FALLBACK_BOOKINGS : (/* map backend bookings to simple format */ bookingsPreview(stats))).map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.guest}</td>
                <td>{b.date}</td>
                <td>
                  <span className={`badge ${String(b.status || '').toLowerCase()}`}>
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

const BookingsView = ({ bookings, loading, error, setBookings }) => {
  const [processingId, setProcessingId] = useState(null);

  const handleChangeStatus = async (id, status) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    setProcessingId(id);
    try {
      await adminAPI.updateBooking(id, { status });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    setProcessingId(id);
    try {
      await adminAPI.deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fade-in">
      <h1>Booking Management</h1>
      {error && <div className="error">{error}</div>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest</th>
              <th>Email</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(bookings && bookings.length ? bookings : FALLBACK_BOOKINGS).map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.guestName || b.guest}</td>
                <td>{b.email || '-'}</td>
                <td>{b.date ? new Date(b.date).toLocaleString() : '-'}</td>
                <td>{b.status}</td>
                <td>{b.amount ? `$${b.amount}` : '-'}</td>
                <td>
                  <div className="actions-inline">
                    <button disabled={processingId === b.id} onClick={() => handleChangeStatus(b.id, 'Confirmed')}>Confirm</button>
                    <button disabled={processingId === b.id} onClick={() => handleChangeStatus(b.id, 'Cancelled')}>Cancel</button>
                    <button className="danger" disabled={processingId === b.id} onClick={() => handleDelete(b.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const RoomsView = ({ rooms, setRooms, loading, error }) => {
  const [processingId, setProcessingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', price: '', capacity: 1, description: '' });

  const resetForm = () => {
    setForm({ title: '', price: '', capacity: 1, description: '' });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (room) => {
    setEditing(room);
    setForm({ title: room.title || room.name || '', price: room.price || room.rate || '', capacity: room.capacity || 1, description: room.description || '' });
    setShowForm(true);
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    setProcessingId(id);
    try {
      await adminAPI.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessingId('form');
    try {
      if (editing) {
        await adminAPI.updateRoom(editing.id, form);
        setRooms(prev => prev.map(r => r.id === editing.id ? { ...r, ...form } : r));
      } else {
        const res = await adminAPI.createRoom(form);
        // backend may return created room
        setRooms(prev => [ ...(prev || []), res.data || form ]);
      }
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fade-in">
      <h1>Room Management</h1>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>Rooms</h3>
          <button onClick={() => setShowForm(true)}>➕ Add Room</button>
        </div>

        {loading ? (
          <p>Loading rooms...</p>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Price</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rooms && rooms.length ? rooms : []).map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title || r.name}</td>
                  <td>{r.price ? `$${r.price}` : '-'}</td>
                  <td>{r.capacity || '-'}</td>
                  <td>
                    <div className="actions-inline">
                      <button onClick={() => startEdit(r)}>Edit</button>
                      <button className="danger" disabled={processingId === r.id} onClick={() => handleDeleteRoom(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal">
          <form className="modal-form" onSubmit={handleSubmit}>
            <h3>{editing ? 'Edit Room' : 'Add Room'}</h3>
            <label>Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <label>Price</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            <label>Capacity</label>
            <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} required />
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            <div className="modal-actions">
              <button type="submit" disabled={processingId === 'form'}>{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const SimpleView = ({ title }) => (
  <div className="fade-in">
    <h1>{title}</h1>
    <p>This section is ready for backend integration.</p>
  </div>
);

// Small helper that attempts to show a bookings preview if the stats endpoint returned any recent bookings info
function bookingsPreview(statsArr) {
  // Backend returns stats (array with label/value) — we don't expect bookings there, so fallback
  return FALLBACK_BOOKINGS;
}

