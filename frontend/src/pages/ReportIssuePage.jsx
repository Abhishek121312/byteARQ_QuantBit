import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import LocationPicker from '../components/LocationPicker';
import Spinner from '../components/Spinner';

// Zod schema for reporting an issue
const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  category: z.enum(['Lighting', 'Waste', 'Road', 'Other'], {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  wardId: z.string().min(1, "Please select the ward for the issue"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable(),
  image: z.instanceof(FileList).optional(),
});

export default function ReportIssuePage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(true);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      category: 'Other',
      location: null,
      wardId: user?.ward?._id || user?.ward || '', // Pre-select user's ward
    },
  });

  // Fetch available wards for the dropdown
  useEffect(() => {
    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        // --- THIS IS THE FIX ---
        // Changed from '/api/public/wards' to '/public/wards'
        // The '/api' is already in axiosClient.js
        const response = await axiosClient.get('/api/public/wards');
        // --- END OF FIX ---
        setWards(response.data);
      } catch (err) {
        console.error("Failed to fetch wards:", err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, []);

  const onSubmit = async (data) => {
    if (!data.location) {
      setError("Please pick a location on the map.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Use FormData to send file and other data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('wardId', data.wardId);
    formData.append('latitude', data.location.lat);
    formData.append('longitude', data.location.lng);
    
    if (data.image && data.image[0]) {
      formData.append('image', data.image[0]);
    }

    try {
      // This URL is correct, as it doesn't start with '/api'
      await axiosClient.post('/api/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Issue reported successfully! You will be redirected to your dashboard.');
      setTimeout(() => navigate('/'), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue.');
      console.error("Issue report error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-300">
      <h1 className="text-3xl font-bold text-primary mb-8">Report a New Civic Issue</h1>
      
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

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Issue Title*</span></label>
            <input
              {...register('title')}
              placeholder="e.g., Streetlight out on Main St."
              className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && <span className="text-error text-xs mt-1">{errors.title.message}</span>}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Description</span></label>
            <textarea
              {...register('description')}
              placeholder="Provide more details (optional)..."
              className="textarea textarea-bordered h-24"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Category*</span></label>
              <select
                {...register('category')}
                className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
              >
                <option value="Lighting">Lighting</option>
                <option value="Waste">Waste</option>
                <option valueT="Road">Road</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <span className="text-error text-xs mt-1">{errors.category.message}</span>}
            </div>
            
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Ward*</span></label>
              <select
                {...register('wardId')}
                className={`select select-bordered w-full ${errors.wardId ? 'select-error' : ''}`}
                disabled={loadingWards}
              >
                <option value="">{loadingWards ? 'Loading...' : 'Select ward'}</option>
                {wards.map(ward => (
                  <option key={ward._id} value={ward._id}>{ward.name}</option>
                ))}
              </select>
              {errors.wardId && <span className="text-error text-xs mt-1">{errors.wardId.message}</span>}
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Upload Photo (Optional)</span></label>
            <input
              {...register('image')}
              type="file"
              accept="image/*"
              className={`file-input file-input-bordered w-full ${errors.image ? 'file-input-error' : ''}`}
            />
            {errors.image && <span className="text-error text-xs mt-1">{errors.image.message}</span>}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Pin Location*</span></label>
            <p className="text-xs text-neutral-500 mb-2">Click on the map to set the exact location of the issue. The map will try to find your current location first.</p>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationPicker
                  onLocationSelect={(latlng) => field.onChange(latlng)}
                  disableSearch={true} // This forces it to use current location
                />
              )}
            />
            {errors.location && <span className="text-error text-xs mt-1">{errors.location.message}</span>}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg px-10"
            >
              {isSubmitting ? <Spinner /> : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}