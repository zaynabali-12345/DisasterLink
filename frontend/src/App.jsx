import React from 'react';
import { Route, Routes, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import DonationSuccessPage from './pages/DonationSuccessPage';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import RequestHelpPage from './pages/RequestHelpPage.jsx';
import VictimDashboard from './pages/VictimDashboard/VictimDashboard.jsx';
import PredictionPage from './pages/PredictionPage/PredictionPage.jsx';
import EmergencyDashboard from './pages/EmergencyDashboard/EmergencyDashboard.jsx';
import RequestDetailsPage from './pages/RequestDetailsPage.jsx';
import VolunteerDashboard from './pages/VolunteerDashboard/VolunteerDashboard.jsx';
import NgoDashboard from './pages/NgoDashboard/NgoDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import LoginPage from './pages/LoginPage/LoginPage';
import Chatbot from './components/Chatbot.jsx';
import './components/chatbot.css';
import 'leaflet/dist/leaflet.css'; // <-- Add this line

// Layout for public-facing pages that includes Navbar, Footer, and Chatbot
const MainLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet /> {/* Child routes will render here */}
    </main>
    <Footer />
    <Chatbot />
  </>
);

// A simple layout for the admin section that doesn't include the main Navbar or Footer
const AdminLayout = () => (
    <Outlet />
);


function App() {
  return (
    <Routes>
      {/* Admin Routes use a dedicated layout */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* All other public routes use the MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="donation-success" element={<DonationSuccessPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="request-help" element={<RequestHelpPage />} />
        <Route path="victim-dashboard" element={<VictimDashboard />} />
        <Route path="predict/earthquake" element={<PredictionPage />} />
        <Route path="dashboard/emergency" element={<EmergencyDashboard />} />
        <Route path="requests/:id" element={<RequestDetailsPage />} />
        <Route path="task/:id" element={<RequestDetailsPage />} />
        <Route path="dashboard/volunteer" element={<VolunteerDashboard />} />
        <Route path="dashboard/ngo" element={<NgoDashboard />} />
        {/* Add any other public routes here as children of MainLayout */}
      </Route>
    </Routes>
  );
}

export default App;
