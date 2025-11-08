import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

// eGov Logo Component
const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D47A1"/>
      <path d="M11 20.5L16.5 26L29 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login'); // Redirect to login after logout
  };

  const role = user?.role;

  return (
    <header className="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              {/* Mobile Links */}
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/public-map">Public Map</Link></li>
              {role === 'Citizen' && <li><Link to="/report-issue">Report Issue</Link></li>}
            </ul>
          </div>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
            <span className="text-2xl font-bold">
              <span className="text-primary">eGov</span>
              <span className="text-neutral-600">Tracker</span>
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {/* Desktop Links */}
            <li><Link to="/" className="font-medium">Dashboard</Link></li>
            <li><Link to="/public-map" className="font-medium">Public Issue Map</Link></li>
            {role === 'Citizen' && <li><Link to="/report-issue" className="font-medium text-primary">Report New Issue</Link></li>}
          </ul>
        </div>

        <div className="navbar-end flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <span className="text-white text-xl font-semibold uppercase">
                    {user.firstName?.charAt(0)}
                  </span>
                </div>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-xl w-52 border border-base-200">
                <li className="menu-title">
                  <span className="text-neutral-700">Welcome, {user.firstName}!</span>
                  <span className="badge badge-primary badge-outline">{user.role}</span>
                </li>
                <li>
                  <Link to="/" className="hover:bg-base-200 rounded-lg">My Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:bg-base-200 rounded-lg">Edit Profile</Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-error hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="btn btn-ghost"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}