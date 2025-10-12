'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  Users, 
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FeedbackForm from '@/components/ui/FeedbackForm';
import Card from '@/components/ui/Card';

export default function NGOProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [ngo, setNgo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (error) {
        console.error('Invalid token');
      }
    }

    fetchNGOData();
  }, [params.id]);

  const fetchNGOData = async () => {
    try {
      setLoading(true);
      
      // Fetch NGO profile
      const ngoResponse = await fetch(`/api/ngo/profile?id=${params.id}`);
      if (!ngoResponse.ok) {
        throw new Error('NGO not found');
      }
      const ngoData = await ngoResponse.json();
      setNgo(ngoData);

      // Fetch NGO campaigns
      const campaignsResponse = await fetch(`/api/campaigns?ngoId=${params.id}`);
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      }

      // Fetch feedback and ratings
      const feedbackResponse = await fetch(`/api/feedback/${params.id}`);
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.feedback || []);
        setRatingSummary(feedbackData.summary || null);
      }

    } catch (error) {
      console.error('Error fetching NGO data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = (newFeedback) => {
    setShowFeedbackForm(false);
    fetchNGOData(); // Refresh data
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">NGO Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/campaigns')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* NGO Header */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {ngo.ngo_name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {ngo.registered_district}, {ngo.registered_state}
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {ngo.npo_type}
                    </div>
                  </div>
                </div>

                {/* Rating Summary */}
                {ratingSummary && (
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex space-x-1">
                        {renderStars(ratingSummary.average_rating)}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {ratingSummary.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {ratingSummary.total_ratings} reviews
                    </p>
                  </div>
                )}
              </div>

              {ngo.description && (
                <p className="text-gray-700 mb-6">{ngo.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {ngo.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-1" />
                    {ngo.phone}
                  </div>
                )}
                {ngo.website && (
                  <a
                    href={ngo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Visit Website
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
                <div className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-1" />
                  DARPAN: {ngo.darpan_id}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 lg:mt-0 lg:ml-8 flex flex-col space-y-3">
              {user && user.userType !== 'ngo' && (
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </button>
              )}
              <button
                onClick={() => router.push(`/campaigns?ngo=${params.id}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                View Campaigns
              </button>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ratingSummary ? ratingSummary.average_rating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ratingSummary ? ratingSummary.total_ratings : 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Campaigns */}
        {campaigns.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Campaigns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {campaign.description}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600">{campaign.category}</span>
                    <span className="text-gray-500">
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {campaigns.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push(`/campaigns?ngo=${params.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Campaigns ({campaigns.length})
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Recent Reviews */}
        {feedback.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {feedback.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {review.is_anonymous ? 'Anonymous' : 'User'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {review.category}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.feedback_text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
              <FeedbackForm
                ngoId={params.id}
                ngoName={ngo.ngo_name}
                userType={user?.userType}
                onSubmit={handleFeedbackSubmit}
                onCancel={() => setShowFeedbackForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}