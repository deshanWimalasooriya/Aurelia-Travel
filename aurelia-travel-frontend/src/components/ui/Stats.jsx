import './styles/stats.css'

const Stats = () => {
  const stats = [
    { label: 'Happy Guests', value: '12,500+', icon: '👥' },
    { label: 'Hotels', value: '5,200+', icon: '🏨' },
    { label: 'Bookings', value: '45,000+', icon: '📅' },
    { label: 'Average Rating', value: '4.8 ⭐', icon: '⭐' }
  ]

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-item">
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default Stats
