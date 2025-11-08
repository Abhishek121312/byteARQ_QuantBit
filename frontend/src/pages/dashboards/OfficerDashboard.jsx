import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../utils/axiosClient';
import socket from '../../utils/socket';
import Spinner from '../../components/Spinner';

// Reusable Stat Card (from CitizenDashboard)
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

export default function OfficerDashboard({ user }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null); // --- ADDED ---

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/issues/my-assigned');
      setIssues(response.data);
    } catch (err) {
      setError('Failed to fetch your assigned issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();

    // --- Socket.io Setup ---
    socket.connect();
    // Join a room for this user's ID to get direct assignments
    socket.emit('join_user_room', user._id);
    // Join a room for this user's ward to get ward-wide updates
    if (user.ward) {
      socket.emit('join_ward_room', user.ward._id || user.ward);
    }

    // Listen for new assignments
    const handleNewAssignment = (notification) => {
      console.log('New assignment received:', notification);
      setIssues(currentIssues => [notification.issue, ...currentIssues]);
    };

    // Listen for other updates in the ward (e.g., admin reassigned it)
    const handleWardUpdate = (notification) => {
       console.log('Ward update received:', notification);
       // This might be a new issue, or an update to an existing one
       setIssues(currentIssues => {
         const exists = currentIssues.some(i => i._id === notification.issue._id);
         if (exists) {
           return currentIssues.map(i => i._id === notification.issue._id ? notification.issue : i);
         } else {
           // Only add if it's assigned to this officer
           if (notification.issue.assignedTo?._id === user._id) {
             return [notification.issue, ...currentIssues];
           }
           return currentIssues;
         }
       });
    };

    socket.on('new_assignment', handleNewAssignment);
    socket.on('new_issue_ward', handleWardUpdate);
    socket.on('issue_status_update_ward', handleWardUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('new_assignment', handleNewAssignment);
      socket.off('new_issue_ward', handleWardUpdate);
      socket.off('issue_status_update_ward', handleWardUpdate);
      socket.disconnect();
    };
  }, [user._id, user.ward]);

  const stats = useMemo(() => {
    return {
      total: issues.length,
      pending: issues.filter(i => i.status === 'Pending').length,
      inProgress: issues.filter(i => i.status === 'In Progress').length,
      resolved: issues.filter(i => i.status === 'Resolved').length,
    };
  }, [issues]);

  const openStatusModal = (issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    document.getElementById('status_modal').showModal();
  };

  // --- ADDED: Function to open image modal ---
  const openImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    document.getElementById('image_modal_officer').showModal();
  };
  
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus || !selectedIssue) return;
    
    setIsUpdating(true);
    try {
      const response = await axiosClient.patch(
        `/api/issues/${selectedIssue._id}/status`, 
        { status: newStatus }
      );
      
      // Update local state immediately
      setIssues(currentIssues => 
        currentIssues.map(issue => 
          issue._id === selectedIssue._id ? response.data.issue : issue
        )
      );
      
      document.getElementById('status_modal').close();
      setSelectedIssue(null);

    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card bg-base-100 shadow-xl p-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Officer Dashboard</h1>
        <p className="text-lg text-neutral-600">
          Welcome, {user.firstName}. Here are the issues assigned to you.
        </p>
        {user.ward && (
          <p className="text-md text-neutral-500 mt-1">
            Ward: <span className="font-semibold">{user.ward.name}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assigned" value={stats.total} icon="📋" color="border-primary" />
        <StatCard title="Pending" value={stats.pending} icon="⏳" color="border-warning" />
        <StatCard title="In Progress" value={stats.inProgress} icon="⚙️" color="border-info" />
        <StatCard title="Resolved" value={stats.resolved} icon="✅" color="border-success" />
      </div>

      {/* My Assigned Issues Table */}
      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8 border border-base-300">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6">My Assigned Issues</h2>

        {loading && <div className="flex justify-center py-20"><Spinner /></div>}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && issues.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👍</div>
            <p className="text-lg text-neutral-500">No issues are currently assigned to you. Good job!</p>
          </div>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Reported By</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue._id} className="hover">
                    <td className="font-medium">
                      {issue.title}
                      <div className="text-xs text-neutral-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td><span className="badge badge-outline">{issue.category}</span></td>
                    <td>{issue.createdBy?.firstName} {issue.createdBy?.lastName}</td>
                    <td>{issue.ward?.name}</td>
                    <td>
                      <span className={`badge ${
                        issue.status === 'Resolved' ? 'badge-success' :
                        issue.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                      }`}>{issue.status}</span>
                    </td>
                    <td className="flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => openStatusModal(issue)}
                      >
                        Update
                      </button>
                      {/* --- MODIFIED VIEW IMAGE BUTTON --- */}
                      {issue.imageUrl && (
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => openImageModal(issue.imageUrl)}
                        >
                          View Image
                        </button>
                      )}
                      {/* --- END MODIFIED BUTTON --- */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <dialog id="status_modal" className="modal">
        <div className="modal-box bg-base-100">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-2xl mb-4">Update Issue Status</h3>
          <p className="py-2 bg-base-200 rounded-lg px-4 mb-6">
            <span className="font-semibold">Issue:</span> {selectedIssue?.title}
          </p>
          
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Select new status</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            <div className="modal-action">
              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                {isUpdating ? <span className="loading loading-spinner"></span> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* --- ADDED IMAGE MODAL --- */}
      <dialog id="image_modal_officer" className="modal">
        <div className="modal-box w-11/12 max-w-3xl bg-base-100">
          <form method="dialog">
            <button 
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setSelectedImageUrl(null)}
            >✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Issue Image</h3>
          {selectedImageUrl && (
            <img 
              src={selectedImageUrl} 
              alt="Issue" 
              className="w-full h-auto rounded-lg object-contain"
            />
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setSelectedImageUrl(null)}>close</button>
        </form>
      </dialog>
    </div>
  );
}