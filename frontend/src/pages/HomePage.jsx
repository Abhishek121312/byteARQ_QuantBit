import React from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';
import CitizenDashboard from './dashboards/CitizenDashboard';
import OfficerDashboard from './dashboards/OfficerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import EditProfilePage from './EditProfilePage';
import ReportIssuePage from './ReportIssuePage';
import PublicIssueMap from './PublicIssueMap'; // Import the public map

// Main component that decides which view to show based on user role
const UserDashboard = ({ user }) => {
    switch(user?.role) {
        case 'Citizen':
            return <CitizenDashboard user={user} />;
        case 'Officer':
            return <OfficerDashboard user={user} />;
        case 'Admin':
            return <AdminDashboard user={user} />;
        default:
            return (
              <div className="text-center py-20">
                <div className="alert alert-error">
                  Unknown user role: {user?.role}. Please contact support.
                </div>
              </div>
            );
    }
}

export default function HomePage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Routes>
            {/* Main dashboard route */}
            <Route path="/" element={<UserDashboard user={user} />} />
            
            {/* Other protected routes */}
            <Route path="/profile" element={<EditProfilePage />} />
            <Route path="/public-map" element={<PublicIssueMap />} />

            {/* Role-specific routes */}
            {user.role === 'Citizen' && (
              <Route path="/report-issue" element={<ReportIssuePage />} />
            )}
            
            {/* Fallback for any other protected route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}