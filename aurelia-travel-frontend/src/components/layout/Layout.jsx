import { useLocation } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';

const Layout = ({ children }) => {
  const location = useLocation();

  // Define paths that should act as "Full Screen Apps" 
  // (No footer, no empty bottom space, exact viewport height)
  const fullScreenRoutes = [
    '/trip-dashboard',
    '/travel-itinerary',
    '/adminDashboard'
  ];
  
  const isFullScreen = fullScreenRoutes.some(route => location.pathname.startsWith(route));

  // If it's a dashboard/planner, lock the layout to exactly 100vh.
  if (isFullScreen) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--color-background)' }}>
        <Header />
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </main>
      </div>
    );
  }

  // Standard website layout (Home, About, Hotels, etc.)
  return (
    <div style={{ minHeight: '100%', width: '100%',display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;