import React, { useState, useEffect } from 'react';
import IssueMap from '../components/IssueMap';
import axiosClient from '../utils/axiosClient';
import Spinner from '../components/Spinner';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSelector } from 'react-redux';

export default function PublicIssueMap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/api/issues');
        setIssues(response.data);
      } catch (err) {
        setError('Failed to fetch issues.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[600px]">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return <div className="alert alert-error">{error}</div>;
    }

    if (issues.length === 0) {
      return <div className="alert alert-info">No issues reported yet.</div>;
    }

    return <IssueMap issues={issues} />;
  };

  // The map page is public, so it needs its own Navbar and Footer
  // if the user is not authenticated.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-primary mb-6">Public Issue Map</h1>
            <p className="text-lg text-neutral-600 mb-8">
              See all reported civic issues in real-time.
            </p>
            {renderContent()}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is authenticated, this component is rendered inside HomePage,
  // so we don't need the extra Navbar/Footer.
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-6">Public Issue Map</h1>
      <p className="text-lg text-neutral-600 mb-8">
        See all reported civic issues in real-time.
      </p>
      {renderContent()}
    </div>
  );
}