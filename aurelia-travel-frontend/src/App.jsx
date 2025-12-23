import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'

//import Pages
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import HotelDetails from './pages/HotelDetails'
import LoginRegister from './pages/LoginRegister'
import Profile from './pages/Profile'

import './index.css'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/auth" element={<LoginRegister />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
