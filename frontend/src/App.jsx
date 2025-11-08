import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import PublicIssueMap from './pages/PublicIssueMap';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

function App() {
  const { isLoading } = useSelector((state) => state.auth);

  // Show a global spinner while Redux checks auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/public-map" element={<PublicIssueMap />} />

        {/* Protected Routes
          The HomePage component internally handles routing to the correct
          dashboard based on the user's role.
        */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;