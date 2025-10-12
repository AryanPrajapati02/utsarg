'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VolunteerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/volunteer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="volunteer">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Volunteer Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Applications</h3>
            <p className="text-3xl font-bold text-blue-600">{dashboardData?.stats?.activeApplications || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Approved Applications</h3>
            <p className="text-3xl font-bold text-green-600">{dashboardData?.stats?.approvedApplications || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Hours Volunteered</h3>
            <p className="text-3xl font-bold text-purple-600">{dashboardData?.stats?.hoursVolunteered || 0}</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="p-6">
            {dashboardData?.recentApplications?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{application.ngo_name}</h3>
                        <p className="text-gray-600">{application.message}</p>
                        <p className="text-sm text-gray-500">Applied: {new Date(application.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No applications yet</p>
            )}
          </div>
        </div>

        {/* Available Opportunities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Available Opportunities</h2>
          </div>
          <div className="p-6">
            {dashboardData?.availableOpportunities?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.availableOpportunities.map((ngo) => (
                  <div key={ngo.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{ngo.ngo_name}</h3>
                    <p className="text-gray-600 text-sm">{ngo.description}</p>
                    <p className="text-sm text-gray-500">Location: {ngo.registered_district}, {ngo.registered_state}</p>
                    <button 
                      onClick={() => router.push('/volunteer/opportunities')}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No opportunities available</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}