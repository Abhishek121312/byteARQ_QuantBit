import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { loginUser } from "../store/authSlice";

// Zod schema for login validation
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

// Logo Component
const Logo = () => (
    <svg width="50" height="50" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D47A1"/>
      <path d="M11 20.5L16.5 26L29 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, error, isLoading } = useSelector((state) => state.auth);

    // Get the path to redirect to after login, default to "/"
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const onSubmit = (data) => {
        dispatch(loginUser(data));
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 flex flex-col items-center gap-3">
                    <Logo />
                    <div className="text-3xl font-bold">
                        <span className="text-primary">eGov</span>
                        <span className="text-neutral-600">Tracker</span>
                    </div>
                </div>

                <div className="card w-full bg-base-100 shadow-2xl">
                    <div className="card-body">
                        <h2 className="text-3xl font-bold text-center mb-6">Secure Login</h2>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                            {/* Email Field */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email Address</span>
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="your.email@example.com"
                                    className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                                />
                                {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
                            </div>

                            {/* Password Field */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Password</span>
                                </label>
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Your Password"
                                    className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                                />
                                {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
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
                                    disabled={isLoading}
                                    className="btn btn-primary w-full"
                                >
                                    {isLoading ? <span className="loading loading-spinner"></span> : "Login"}
                                </button>
                            </div>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-6 text-center text-sm">
                            <span>Don't have an account? </span>
                            <Link to="/signup" className="link link-primary font-medium">Sign Up</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}