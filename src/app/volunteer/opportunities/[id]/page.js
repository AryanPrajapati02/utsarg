'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Mail, User } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VolunteerOpportunityDetail() {
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    fetchNgoDetails();
  }, []);

  const fetchNgoDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch NGO details from the opportunities API
      const response = await fetch('/api/volunteer/opportunities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NGO details');
      }

      const data = await response.json();
      const ngoDetails = data.opportunities.find(opportunity => opportunity.id === params.id);
      
      if (!ngoDetails) {
        setError('NGO not found');
        return;
      }

      setNgo(ngoDetails);
    } catch (error) {
      console.error('Error fetching NGO details:', error);
      setError('Failed to load NGO details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!message.trim()) {
      alert('Please enter a message for your application');
      return;
    }

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ngo_id: params.id,
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      alert('Application submitted successfully!');
      router.push('/volunteer/applications');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">NGO Details</h1>
          </div>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => router.push('/volunteer/opportunities')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View All Opportunities
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ngo) {
    return (
      <DashboardLayout userType="volunteer">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">NGO Not Found</h1>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              The NGO you're looking for could not be found.
            </p>
            
            <button
              onClick={() => router.push('/volunteer/opportunities')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View All Opportunities
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="volunteer">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Opportunity</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NGO Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{ngo.ngo_name}</h2>
              
              {ngo.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About This NGO</h3>
                  <p className="text-gray-600">{ngo.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">
                      {ngo.registered_district}, {ngo.registered_state}
                    </p>
                  </div>
                </div>

                {ngo.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{ngo.phone}</p>
                    </div>
                  </div>
                )}

                {ngo.contact_person && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Contact Person</p>
                      <p className="text-sm text-gray-600">{ngo.contact_person}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Volunteer Here?</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Make a direct impact in your community</li>
                  <li>Gain valuable experience and skills</li>
                  <li>Connect with like-minded individuals</li>
                  <li>Contribute to meaningful social causes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply to Volunteer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why do you want to volunteer with this NGO? *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell them about your motivation, relevant skills, and how you can contribute..."
                  />
                </div>

                <button
                  onClick={handleApply}
                  disabled={applying || !message.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>

                <p className="text-xs text-gray-500">
                  By applying, you agree to be contacted by this NGO regarding volunteer opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}