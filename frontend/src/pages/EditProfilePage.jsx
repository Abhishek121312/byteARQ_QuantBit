import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { checkAuth } from '../store/authSlice'; // To update user state after save
import Spinner from '../components/Spinner';

// Schema for profile updates
const profileSchema = z.object({
    firstName: z.string().min(2, "First name is required").trim(),
    lastName: z.string().min(2, "Last name is required").trim(),
    phone_number: z.string().min(10, "Valid phone number is required").optional().or(z.literal('')),
    ward: z.string().optional(), // Ward ID, optional for update
});

export default function EditProfilePage() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [wards, setWards] = useState([]);
    const [loadingWards, setLoadingWards] = useState(true);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone_number: user?.phone_number || '',
            ward: user?.ward?._id || user?.ward || '',
        },
    });

    // Fetch available wards for the dropdown
    useEffect(() => {
        const fetchWards = async () => {
            try {
                setLoadingWards(true);
                // Use the same assumed public endpoint
                const response = await axiosClient.get('/api/public/wards');
                setWards(response.data);
            } catch (err) {
                console.error("Failed to fetch wards:", err);
            } finally {
                setLoadingWards(false);
            }
        };
        
        // Only citizens and officers need to change wards
        if (user?.role === 'Citizen' || user?.role === 'Officer') {
            fetchWards();
        } else {
            setLoadingWards(false);
        }
    }, [user?.role]);

    // Reset form if user data changes
    useEffect(() => {
        reset({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone_number: user?.phone_number || '',
            ward: user?.ward?._id || user?.ward || '',
        });
    }, [user, reset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            // Filter out empty strings so backend uses existing values
            const payload = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
            
            await axiosClient.put('/api/users/profile', payload);
            setSuccess('Profile updated successfully!');
            dispatch(checkAuth()); // Refresh user data in Redux
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
            console.error("Profile update error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <Spinner />;
    }

    return (
        <div className="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-300">
            <h1 className="text-3xl font-bold text-primary mb-8">Edit Your Profile</h1>

            {/* Success Message */}
            {success && (
                <div role="alert" className="alert alert-success mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{success}</span>
                </div>
            )}
            {/* Error Message */}
            {error && (
                <div role="alert" className="alert alert-error mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium">First Name</span></label>
                        <input
                            {...register('firstName')}
                            className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                        />
                        {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Last Name</span></label>
                        <input
                            {...register('lastName')}
                            className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
                        />
                        {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName.message}</span>}
                    </div>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Email Address (Cannot Change)</span></label>
                    <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Phone Number</span></label>
                    <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        {...register('phone_number')}
                        className={`input input-bordered w-full ${errors.phone_number ? 'input-error' : ''}`}
                    />
                    {errors.phone_number && <span className="text-error text-xs mt-1">{errors.phone_number.message}</span>}
                </div>
                
                {/* Ward selection for Citizen and Officer */}
                {(user.role === 'Citizen' || user.role === 'Officer') && (
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Your Ward</span></label>
                        <select
                            {...register('ward')}
                            className={`select select-bordered w-full ${errors.ward ? 'select-error' : ''}`}
                            disabled={loadingWards}
                        >
                            <option value="">
                                {loadingWards ? 'Loading wards...' : 'Select your ward'}
                            </option>
                            {wards.map(ward => (
                                <option key={ward._id} value={ward._id}>{ward.name}</option>
                            ))}
                        </select>
                        {errors.ward && <span className="text-error text-xs mt-1">{errors.ward.message}</span>}
                    </div>
                )}
                
                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary px-8"
                    >
                        {isSubmitting ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}