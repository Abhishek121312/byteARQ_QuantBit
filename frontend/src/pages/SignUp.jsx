import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { registerUser } from "../store/authSlice";
import axiosClient from "../utils/axiosClient";

// Zod schema for registration validation
const signUpSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    ward: z.string().min(1, "You must select your ward"), // Ward ID
});

// Logo Component
const Logo = () => (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D47A1"/>
      <path d="M11 20.5L16.5 26L29 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function SignUp() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(signUpSchema)
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, error, isLoading } = useSelector((state) => state.auth);

    const [wards, setWards] = useState([]);
    const [loadingWards, setLoadingWards] = useState(true);

    // Fetch available wards for the dropdown
    useEffect(() => {
        const fetchWards = async () => {
            try {
                setLoadingWards(true);
                // **ASSUMPTION**: A public endpoint exists at '/api/public/wards'
                // If this fails, the user must create this endpoint in their backend.
                // The existing `/api/admin/wards` is protected.
                const response = await axiosClient.get('/api/public/wards');
                setWards(response.data);
            } catch (err) {
                console.error("Failed to fetch wards:", err);
                // You might want to show this error to the user
            } finally {
                setLoadingWards(false);
            }
        };
        fetchWards();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = (data) => {
        // Data already matches the backend payload
        dispatch(registerUser(data));
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8 flex flex-col items-center gap-3">
                    <Logo />
                    <div className="text-3xl font-bold">
                        <span className="text-primary">eGov</span>
                        <span className="text-neutral-600">Tracker</span>
                    </div>
                </div>

                <div className="card w-full bg-base-100 shadow-2xl">
                    <div className="card-body">
                        <h2 className="text-3xl font-bold text-center mb-2">Citizen Registration</h2>
                        <p className="text-neutral-500 text-center mb-6">Create your account to report issues</p>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">First Name</span></label>
                                    <input
                                        {...register('firstName')}
                                        type="text"
                                        placeholder="First Name"
                                        className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                                    />
                                    {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Last Name</span></label>
                                    <input
                                        {...register('lastName')}
                                        type="text"
                                        placeholder="Last Name"
                                        className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
                                    />
                                    {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName.message}</span>}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text">Email</span></label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="Email"
                                    className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                                />
                                {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text">Password</span></label>
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Password (min 6 characters)"
                                    className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                                />
                                {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text">Select Your Ward</span></label>
                                <select
                                    {...register('ward')}
                                    className={`select select-bordered w-full ${errors.ward ? 'select-error' : ''}`}
                                    disabled={loadingWards || wards.length === 0}
                                >
                                    <option value="">
                                        {loadingWards ? 'Loading wards...' : 'Select your ward'}
                                    </option>
                                    {wards.map(ward => (
                                        <option key={ward._id} value={ward._id}>{ward.name}</option>
                                    ))}
                                </select>
                                {errors.ward && <span className="text-error text-xs mt-1">{errors.ward.message}</span>}
                                {wards.length === 0 && !loadingWards && (
                                    <span className="text-warning text-xs mt-1">
                                        Could not load wards. Please contact admin.
                                    </span>
                                )}
                            </div>

                            {/* Server Error Message */}
                            {error && (
                                <div className="alert alert-error text-sm p-3">
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="form-control mt-6">
                                <button 
                                    type="submit" 
                                    disabled={isLoading || loadingWards}
                                    className="btn btn-primary w-full"
                                >
                                    {isLoading ? <span className="loading loading-spinner"></span> : "Create Account"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span>Already have an account? </span>
                            <Link to="/login" className="link link-primary font-medium">Log In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}