'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Star, 
  Medal, 
  Award, 
  MapPin, 
  Users,
  TrendingUp,
  ExternalLink,
  Filter
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    limit: 20,
    minRatings: 5
  });
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
  }, [filters]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: filters.limit.toString(),
        minRatings: filters.minRatings.toString()
      });

      const response = await fetch(`/api/leaderboard?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">{rank}</span>
          </div>
        );
    }
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-12 h-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">NGO Leaderboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the top-rated and most trusted NGOs based on community feedback and ratings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total NGOs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_ngos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rated NGOs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rated_ngos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Qualified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualified_ngos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Min Ratings</p>
                <p className="text-2xl font-bold text-gray-900">{filters.minRatings}+</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Limit
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Ratings Required
              </label>
              <select
                value={filters.minRatings}
                onChange={(e) => handleFilterChange('minRatings', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1+ ratings</option>
                <option value={5}>5+ ratings</option>
                <option value={10}>10+ ratings</option>
                <option value={25}>25+ ratings</option>
                <option value={50}>50+ ratings</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-4">
          {leaderboard.length > 0 ? (
            leaderboard.map((ngo) => (
              <div
                key={ngo.ngo_id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                  ngo.rank <= 3 ? 'border-l-4 border-yellow-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(ngo.rank)}
                    </div>

                    {/* NGO Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {ngo.ngo_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {ngo.location}
                            </div>
                            {ngo.npo_type && (
                              <div className="flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                {ngo.npo_type}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="flex space-x-1">
                              {renderStars(ngo.average_rating)}
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {ngo.average_rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ngo.total_ratings} reviews
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {ngo.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {ngo.description}
                        </p>
                      )}

                      {/* NGO Type and DARPAN ID */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {ngo.npo_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {ngo.npo_type}
                          </span>
                        )}
                        {ngo.darpan_id && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            DARPAN: {ngo.darpan_id}
                          </span>
                        )}
                      </div>

                      {/* Rating Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Donor Reviews:</span>
                          <span className="ml-1 font-medium">{ngo.user_type_breakdown.donor_ratings}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Volunteer Reviews:</span>
                          <span className="ml-1 font-medium">{ngo.user_type_breakdown.volunteer_ratings}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">General Reviews:</span>
                          <span className="ml-1 font-medium">{ngo.user_type_breakdown.general_ratings}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => router.push(`/ngo/${ngo.ngo_id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Profile
                    </button>
                    
                    {ngo.website && (
                      <a
                        href={ngo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No NGOs Found</h3>
              <p className="text-gray-600">
                No NGOs meet the current filter criteria. Try adjusting the minimum ratings requirement.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Help Build Trust in the NGO Community
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Your feedback matters! Rate and review NGOs you've worked with to help others make informed decisions 
            and help organizations improve their impact.
          </p>
          <button
            onClick={() => router.push('/campaigns')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Explore NGOs & Campaigns
          </button>
        </div>
      </div>
    </div>
  );
}