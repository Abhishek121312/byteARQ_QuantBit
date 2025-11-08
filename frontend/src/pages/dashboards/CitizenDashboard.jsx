import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../utils/axiosClient';
import socket from '../../utils/socket';
import Spinner from '../../components/Spinner';
import { Link } from 'react-router-dom';

// Reusable Stat Card
const StatCard = ({ title, value, icon, color }) => (
  <div className={`card bg-base-100 shadow-lg border-l-4 ${color}`}>
    <div className="card-body">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-medium text-neutral-500 uppercase">{title}</div>
          <div className="text-4xl font-bold text-neutral-800">{value}</div>
        </div>
        <div className="text-5xl opacity-20">{icon}</div>
      </div>
    </div>
  </div>
);

// Reusable Issue Card
const IssueCard = ({ issue }) => {
  const statusColors = {
    Pending: 'badge-warning',
    'In Progress': 'badge-info',
    Resolved: 'badge-success',
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow border border-base-300">
      <div className="card-body p-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="text-xs text-neutral-500">
              {new Date(issue.createdAt).toLocaleDateString()}
            </div>
            <h3 className="card-title text-lg font-semibold">{issue.title}</h3>
          </div>
          <span className={`badge ${statusColors[issue.status]}`}>{issue.status}</span>
        </div>
        <p className="text-sm text-neutral-600 mt-2 h-12 overflow-hidden">
          {issue.description || 'No description provided.'}
        </p>
        <div className="divider my-2"></div>
        <div className="flex justify-between items-center text-sm">
          <div className="flex flex-col">
            <span className="font-medium">Category:</span>
            <span className="badge badge-outline">{issue.category}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-medium">Ward:</span>
            <span className="text-neutral-600">{issue.ward?.name}</span>
          </div>
        </div>
        {issue.assignedTo && (
          <div className="text-sm mt-2 pt-2 border-t border-base-200">
            Assigned to: <span className="font-medium">{issue.assignedTo.firstName} {issue.assignedTo.lastName}</span>
          </div>
        )}
      </div>
    </div>
  );
};


export default function CitizenDashboard({ user }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial data
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/api/issues/my-reported');
        setIssues(response.data);
      } catch (err) {
        setError('Failed to fetch your reported issues.');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();

    // --- Socket.io Setup ---
    socket.connect();
    // Join a room specific to this user to receive personal updates
    socket.emit('join_user_room', user._id);

    // Listen for status updates
    const handleStatusUpdate = (notification) => {
      console.log('Issue update received:', notification);
      setIssues(currentIssues => 
        currentIssues.map(issue => 
          issue._id === notification.issue._id ? notification.issue : issue
        )
      );
    };
    socket.on('issue_status_update', handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('issue_status_update', handleStatusUpdate);
      socket.disconnect();
    };
  }, [user._id]);

  const stats = useMemo(() => {
    return {
      total: issues.length,
      pending: issues.filter(i => i.status === 'Pending').length,
      inProgress: issues.filter(i => i.status === 'In Progress').length,
      resolved: issues.filter(i => i.status === 'Resolved').length,
    };
  }, [issues]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card bg-base-100 shadow-xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome, {user.firstName}!</h1>
            <p className="text-lg text-neutral-600">
              Here's a summary of your reported issues. Report a new one today!
            </p>
          </div>
          <Link to="/report-issue" className="btn btn-primary btn-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Report a New Issue
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Reports" value={stats.total} icon="📊" color="border-primary" />
        <StatCard title="Pending" value={stats.pending} icon="⏳" color="border-warning" />
        <StatCard title="In Progress" value={stats.inProgress} icon="⚙️" color="border-info" />
        <StatCard title="Resolved" value={stats.resolved} icon="✅" color="border-success" />
      </div>

      {/* My Issues List */}
      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8 border border-base-300">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6">My Reported Issues</h2>
        
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && issues.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗂️</div>
            <p className="text-lg text-neutral-500">You haven't reported any issues yet.</p>
          </div>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}