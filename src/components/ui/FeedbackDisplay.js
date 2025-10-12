'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, Filter, ChevronDown, MessageSquare, ThumbsUp, Flag } from 'lucide-react';
import Card from './Card';
import Button from './Button';

export default function FeedbackDisplay({ ngoId, showAddFeedback = false, onAddFeedback }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    rating: 'all',
    category: 'all',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General Experience' },
    { value: 'transparency', label: 'Transparency' },
    { value: 'communication', label: 'Communication' },
    { value: 'impact', label: 'Impact & Results' },
    { value: 'efficiency', label: 'Efficiency' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Rating' },
    { value: 'lowest', label: 'Lowest Rating' },
    { value: 'helpful', label: 'Most Helpful' }
  ];

  useEffect(() => {
    if (ngoId) {
      fetchFeedback();
    }
  }, [ngoId, filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        rating: filters.rating,
        category: filters.category,
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/feedback/${ngoId}?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback || []);
        setStats(data.stats || stats);
      } else {
        setError(data.error || 'Failed to load feedback');
      }
    } catch (error) {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const renderStars = (rating, size = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingText = (rating) => {
    const texts = {
      5: 'Excellent',
      4: 'Very Good',
      3: 'Good',
      2: 'Fair',
      1: 'Poor'
    };
    return texts[rating] || 'No Rating';
  };

  const handleHelpfulClick = async (feedbackId) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh feedback to get updated helpful counts
        fetchFeedback();
      }
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleReportClick = async (feedbackId) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Feedback reported successfully. We will review it shortly.');
      }
    } catch (error) {
      console.error('Failed to report feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Reviews & Feedback
          </h3>
          {stats.totalReviews > 0 && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(stats.averageRating), 'md')}
                <span className="text-lg font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {showAddFeedback && (
            <Button onClick={onAddFeedback} className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Write Review</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Rating Distribution</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
          <p className="text-gray-600 mb-4">
            Be the first to share your experience with this NGO.
          </p>
          {showAddFeedback && (
            <Button onClick={onAddFeedback}>Write First Review</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.is_anonymous ? 'Anonymous' : review.reviewer_name || 'Anonymous'}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.created_at)}</span>
                      {review.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{review.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-700">
                    {getRatingText(review.rating)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {review.feedback_text}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleHelpfulClick(review.id)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful</span>
                    {review.helpful_count > 0 && (
                      <span className="text-blue-600">({review.helpful_count})</span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleReportClick(review.id)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button (if needed) */}
      {feedback.length > 0 && feedback.length % 10 === 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={fetchFeedback}>
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}