import React, { useState, useEffect, useMemo } from 'react';
// --- FIX: Added 'Controller' to the import ---
import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../../utils/axiosClient';
import socket from '../../utils/socket';
import Spinner from '../../components/Spinner';
import LocationPicker from '../../components/LocationPicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Zod schema for adding a ward
const addWardSchema = z.object({
    name: z.string().min(3, "Ward name is required"),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).nullable(),
});

// Zod schema for assigning an issue
const assignIssueSchema = z.object({
  officerId: z.string().min(1, "You must select an officer"),
});

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

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('issues');
  
  // Data state
  const [stats, setStats] = useState({ issues: 0, officers: 0, citizens: 0, wards: 0 });
  const [issues, setIssues] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [wards, setWards] = useState([]);
  
  // Loading state
  const [loading, setLoading] = useState({ issues: true, officers: true, citizens: true, wards: true });
  
  // State for modals
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAddingWard, setIsAddingWard] = useState(false);

  // Form for adding a ward
  const { 
    register: registerWard, 
    handleSubmit: handleWardSubmit, 
    setValue: setWardValue,
    control: wardControl, // This control is now correctly defined
    reset: resetWardForm,
    formState: { errors: wardErrors } 
  } = useForm({
    resolver: zodResolver(addWardSchema),
    defaultValues: { name: "", location: null }
  });

  // Form for assigning an issue
  const { 
    register: registerAssign, 
    handleSubmit: handleAssignSubmit,
    reset: resetAssignForm,
    formState: { errors: assignErrors } 
  } = useForm({
    resolver: zodResolver(assignIssueSchema)
  });

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading({ issues: true, officers: true, citizens: true, wards: true });
    try {
      const [issueRes, officerRes, citizenRes, wardRes] = await Promise.all([
        axiosClient.get('/api/admin/issues'),
        axiosClient.get('/api/admin/officers'),
        axiosClient.get('/api/admin/citizens'),
        axiosClient.get('/api/admin/wards'),
      ]);
      setIssues(issueRes.data);
      setOfficers(officerRes.data);
      setCitizens(citizenRes.data);
      setWards(wardRes.data);
      setStats({
        issues: issueRes.data.length,
        officers: officerRes.data.length,
        citizens: citizenRes.data.length,
        wards: wardRes.data.length,
      });
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      // Handle error display
    } finally {
      setLoading({ issues: false, officers: false, citizens: false, wards: false });
    }
  };

  useEffect(() => {
    fetchData();

    // --- Socket.io Setup ---
    socket.connect();
    socket.emit('join_admin_room');

    const handleNewIssue = (notification) => {
      console.log('New issue received by admin:', notification);
      setIssues(currentIssues => [notification.issue, ...currentIssues]);
      setStats(s => ({ ...s, issues: s.issues + 1 }));
    };
    
    const handleStatusUpdate = (notification) => {
      setIssues(currentIssues => 
        currentIssues.map(i => i._id === notification.issue._id ? notification.issue : i)
      );
    };

    socket.on('new_issue_admin', handleNewIssue);
    socket.on('issue_status_update_admin', handleStatusUpdate);

    return () => {
      socket.off('new_issue_admin', handleNewIssue);
      socket.off('issue_status_update_admin', handleStatusUpdate);
      socket.disconnect();
    };
  }, []);

  // --- Chart Data ---
  const issueStatusData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'Pending', value: counts.Pending || 0 },
      { name: 'In Progress', value: counts['In Progress'] || 0 },
      { name: 'Resolved', value: counts.Resolved || 0 },
    ];
  }, [issues]);

  const issueCategoryData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);
  
  const PIE_COLORS = ['#FFBB28', '#0088FE', '#00C49F', '#FF8042'];

  // --- Modal Handlers ---
  const openAssignModal = (issue) => {
    setSelectedIssue(issue);
    resetAssignForm();
    document.getElementById('assign_modal').showModal();
  };
  
  const onAssignSubmit = async (data) => {
    setIsAssigning(true);
    try {
      const response = await axiosClient.patch(
        `/api/admin/issues/${selectedIssue._id}/assign`, 
        { officerId: data.officerId }
      );
      // Update local state
      setIssues(currentIssues => 
        currentIssues.map(i => i._id === selectedIssue._id ? response.data.issue : i)
      );
      document.getElementById('assign_modal').close();
      setSelectedIssue(null);
    } catch (err) {
      alert("Failed to assign issue.");
    } finally {
      setIsAssigning(false);
    }
  };

  const onAddWardSubmit = async (data) => {
    if (!data.location) {
      alert("Please pick a location on the map for the ward.");
      return;
    }
    setIsAddingWard(true);
    try {
      const payload = {
        name: data.name,
        latitude: data.location.lat,
        longitude: data.location.lng,
      };
      const response = await axiosClient.post('/api/admin/wards', payload);
      setWards(currentWards => [...currentWards, response.data.ward]);
      setStats(s => ({ ...s, wards: s.wards + 1 }));
      document.getElementById('add_ward_modal').close();
      resetWardForm();
    } catch (err) {
      alert("Failed to add ward.");
    } finally {
      setIsAddingWard(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'issues': return <IssueManagement issues={issues} loading={loading.issues} officers={officers} onAssignClick={openAssignModal} />;
      case 'officers': return <UserManagement title="Officers" users={officers} loading={loading.officers} />;
      case 'citizens': return <UserManagement title="Citizens" users={citizens} loading={loading.citizens} />;
      case 'wards': return <WardManagement wards={wards} loading={loading.wards} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card bg-base-100 shadow-xl p-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Admin Control Panel</h1>
        <p className="text-lg text-neutral-600">Overview of the entire eGov system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Issues" value={stats.issues} icon="📋" color="border-primary" />
        <StatCard title="Total Officers" value={stats.officers} icon="👮" color="border-info" />
        <StatCard title="Total Citizens" value={stats.citizens} icon="👥" color="border-accent" />
        <StatCard title="Total Wards" value={stats.wards} icon="🗺️" color="border-secondary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl p-6 border border-base-300">
          <h3 className="font-semibold text-lg mb-4">Issues by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0D47A1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card bg-base-100 shadow-xl p-6 border border-base-300">
          <h3 className="font-semibold text-lg mb-4">Issues by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={issueCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {issueCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed bg-base-200 p-2">
        <a className={`tab tab-lg flex-1 ${activeTab === 'issues' ? 'tab-active btn-primary text-white' : ''}`} onClick={() => setActiveTab('issues')}>Issue Management</a>
        <a className={`tab tab-lg flex-1 ${activeTab === 'wards' ? 'tab-active btn-primary text-white' : ''}`} onClick={() => setActiveTab('wards')}>Ward Management</a>
        <a className={`tab tab-lg flex-1 ${activeTab === 'officers' ? 'tab-active btn-primary text-white' : ''}`} onClick={() => setActiveTab('officers')}>Officers</a>
        <a className={`tab tab-lg flex-1 ${activeTab === 'citizens' ? 'tab-active btn-primary text-white' : ''}`} onClick={() => setActiveTab('citizens')}>Citizens</a>
      </div>

      {/* Tab Content */}
      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8 border border-base-300 min-h-[400px]">
        {renderContent()}
      </div>

      {/* Assign Issue Modal */}
      <dialog id="assign_modal" className="modal">
        <div className="modal-box bg-base-100">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-2xl mb-4">Assign Issue</h3>
          <p className="py-2 bg-base-200 rounded-lg px-4 mb-6">
            <span className="font-semibold">Issue:</span> {selectedIssue?.title}
            <br/>
            <span className="font-semibold">Ward:</span> {selectedIssue?.ward?.name}
          </p>
          
          <form onSubmit={handleAssignSubmit(onAssignSubmit)} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Select an Officer</span>
              </label>
              <select 
                {...registerAssign('officerId')}
                className={`select select-bordered w-full ${assignErrors.officerId ? 'select-error' : ''}`}
              >
                <option value="">Select Officer...</option>
                {/* Filter officers by the issue's ward */}
                {officers.filter(o => o.ward?._id === selectedIssue?.ward?._id).map(officer => (
                  <option key={officer._id} value={officer._id}>
                    {officer.firstName} {officer.lastName}
                  </option>
                ))}
              </select>
              {assignErrors.officerId && <span className="text-error text-xs mt-1">{assignErrors.officerId.message}</span>}
              {officers.filter(o => o.ward?._id === selectedIssue?.ward?._id).length === 0 && (
                <span className="text-warning text-xs mt-1">
                  No officers found for this ward.
                </span>
              )}
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary" disabled={isAssigning}>
                {isAssigning ? <span className="loading loading-spinner"></span> : 'Assign Issue'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* Add Ward Modal */}
      <dialog id="add_ward_modal" className="modal">
        <div className="modal-box w-11/12 max-w-2xl bg-base-100">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" type="button" onClick={() => resetWardForm()}>✕</button>
          </form>
          <h3 className="font-bold text-2xl mb-6">Add New Ward</h3>
          <form onSubmit={handleWardSubmit(onAddWardSubmit)} className="space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Ward Name</span></label>
              <input
                {...registerWard('name')}
                placeholder="e.g., Ward A, Sector 5"
                className={`input input-bordered w-full ${wardErrors.name ? 'input-error' : ''}`}
              />
              {wardErrors.name && <span className="text-error text-xs mt-1">{wardErrors.name.message}</span>}
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Pin Ward Location</span></label>
              <p className="text-xs text-neutral-500 mb-2">Click on the map to set the ward's central location.</p>
              {/* This is the line that was breaking */}
              <Controller
                name="location"
                control={wardControl}
                render={({ field }) => (
                  <LocationPicker
                    onLocationSelect={(latlng) => field.onChange(latlng)}
                  />
                )}
              />
              {wardErrors.location && <span className="text-error text-xs mt-1">{wardErrors.location.message}</span>}
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary" disabled={isAddingWard}>
                {isAddingWard ? <span className="loading loading-spinner"></span> : 'Add Ward'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button type="button" onClick={() => resetWardForm()}>close</button></form>
      </dialog>
    </div>
  );
}

// --- Sub-Components for Admin Dashboard ---

const IssueManagement = ({ issues, loading, officers, onAssignClick }) => {
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (issues.length === 0) return <div className="text-center py-20"><p className="text-lg text-neutral-500">No issues found.</p></div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead className="bg-base-200">
          <tr>
            <th>Title / Reported</th>
            <th>Ward</th>
            <th>Category</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr key={issue._id} className="hover">
              <td className="font-medium">
                {issue.title}
                <div className="text-xs text-neutral-500">
                  {new Date(issue.createdAt).toLocaleString()}
                </div>
              </td>
              <td>{issue.ward?.name}</td>
              <td><span className="badge badge-outline">{issue.category}</span></td>
              <td>
                <span className={`badge ${
                  issue.status === 'Resolved' ? 'badge-success' :
                  issue.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                }`}>{issue.status}</span>
              </td>
              <td>
                {issue.assignedTo ? (
                  <span>{issue.assignedTo.firstName} {issue.assignedTo.lastName}</span>
                ) : (
                  <span className="text-neutral-500 italic">Unassigned</span>
                )}
              </td>
              <td>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onAssignClick(issue)}
                  disabled={issue.status === 'Resolved'}
                >
                  {issue.assignedTo ? 'Re-assign' : 'Assign'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserManagement = ({ title, users, loading }) => {
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (users.length === 0) return <div className="text-center py-20"><p className="text-lg text-neutral-500">No {title.toLowerCase()} found.</p></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table w-full table-zebra">
          <thead className="bg-base-200">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Ward</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="hover">
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.ward?.name || <span className="text-neutral-500 italic">N/A</span>}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WardManagement = ({ wards, loading }) => {
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Wards</h2>
        <button 
          className="btn btn-primary"
          onClick={() => document.getElementById('add_ward_modal').showModal()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Ward
        </button>
      </div>
      {wards.length === 0 ? (
        <div className="text-center py-20"><p className="text-lg text-neutral-500">No wards created yet.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>Name</th>
                <th>Location (Lng, Lat)</th>
                <th>Assigned Officers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wards.map(ward => (
                <tr key={ward._id} className="hover">
                  <td className="font-medium">{ward.name}</td>
                  <td>{ward.location?.coordinates.join(', ')}</td>
                  <td>{ward.assignedOfficers?.length || 0}</td>
                  <td>
                    <button className="btn btn-xs btn-error" disabled>Delete</button>
                    <span className="text-xs text-neutral-400 italic ml-2">(Delete not implemented in backend)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};