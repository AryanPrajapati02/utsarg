'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VolunteerApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.userType !== 'volunteer') {
          router.push('/login');
          return;
        }
        setUser(userData);
        fetchApplication();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/volunteer/applications/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
      } else {
        setError('Failed to fetch application details');
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
      setError('Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Application</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/volunteer/applications')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={() => router.push('/volunteer/applications')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="volunteer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/volunteer/applications')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600">View your volunteer application status and details</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(application.status)}`}>
            {getStatusIcon(application.status)}
            <span className="capitalize">{application.status}</span>
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Application Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{application.message}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Application Submitted</p>
                      <p className="text-sm text-gray-500">
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {application.updated_at !== application.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        application.status === 'approved' ? 'bg-green-500' : 
                        application.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">Status Updated</p>
                        <p className="text-sm text-gray-500">
                          {new Date(application.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NGO Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">NGO Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{application.ngo_name}</h4>
                    {application.ngo_description && (
                      <p className="text-sm text-gray-600 mt-1">{application.ngo_description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {application.ngo_city}, {application.ngo_state}
                    </span>
                  </div>

                  {application.ngo_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{application.ngo_phone}</span>
                    </div>
                  )}

                  {application.ngo_contact && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{application.ngo_contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {application.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Application Approved!</h4>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Congratulations! Your volunteer application has been approved. The NGO will contact you soon with next steps.
                  </p>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Application Not Approved</h4>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    Unfortunately, your application was not approved at this time. You can apply to other NGOs or try again later.
                  </p>
                </div>
              )}

              {application.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Under Review</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Your application is currently being reviewed by the NGO. You'll be notified once a decision is made.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}