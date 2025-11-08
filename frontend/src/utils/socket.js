import { io } from 'socket.io-client';

// Get the backend URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create a shared socket instance
// `autoConnect: false` means we'll have to manually call socket.connect()
// when the component that needs it mounts.
const socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true, // Important for cookie-based auth if socket.io is configured for it
});

export default socket;