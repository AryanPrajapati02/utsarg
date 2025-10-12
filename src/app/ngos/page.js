'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Globe, Phone, Filter, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NGOsPage() {
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    state: '',
    category: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const categories = [
    'Trust',
    'Society',
    'Section 8 Company',
    'Foundation',
    'Cooperative Society',
    'Other'
  ]

  const fetchNGOs = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/ngos?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch NGOs')
      }

      setNgos(data.ngos)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNGOs()
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchNGOs(1)
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchNGOs(newPage)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      state: '',
      category: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
    setTimeout(() => fetchNGOs(1), 0)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Verified NGOs
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-6">
              Discover and connect with verified NGOs making a difference in communities across India
            </p>
            
            {/* Rating CTA */}
            <div className="bg-primary-50 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-neutral-900">Help Others Choose</span>
              </div>
              <p className="text-sm text-neutral-600">
                Rate and review NGOs to help donors and volunteers make informed decisions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-neutral-600" />
              <h3 className="text-lg font-semibold text-neutral-900">Filter NGOs</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search NGOs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  City
                </label>
                <Input
                  type="text"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  State
                </label>
                <Input
                  type="text"
                  placeholder="Enter state"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchNGOs(pagination.page)}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-neutral-600">
                Showing {ngos.length} of {pagination.total} NGOs
              </p>
            </div>

            {/* NGO Grid */}
            {ngos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600 text-lg">No NGOs found matching your criteria.</p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {ngos.map((ngo) => (
                  <Card key={ngo.id} className="hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      {/* NGO Logo/Header */}
                      <div className="flex items-start gap-3">
                        {ngo.logo_url ? (
                          <img
                            src={ngo.logo_url}
                            alt={`${ngo.ngo_name} logo`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                              {ngo.ngo_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 text-lg leading-tight">
                            {ngo.ngo_name}
                          </h3>
                          {ngo.npo_type && (
                            <span className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full mt-1">
                              {ngo.npo_type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-neutral-600 text-sm line-clamp-3">
                        {ngo.description}
                      </p>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <MapPin className="w-4 h-4" />
                        <span>{ngo.registered_district}, {ngo.registered_state}</span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {ngo.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-neutral-400" />
                            <a
                              href={ngo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 truncate"
                            >
                              {ngo.website}
                            </a>
                          </div>
                        )}
                        {ngo.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-600">{ngo.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Rating Display */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className="w-4 h-4 text-yellow-400 fill-current" 
                            />
                          ))}
                        </div>
                        <span className="font-medium">4.8</span>
                        <span className="text-neutral-500">(24)</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        <Link href={`/ngos/${ngo.id}`}>
                          <Button className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <button 
                          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => {/* Handle quick rating */}}
                        >
                          Quick Rate & Review
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}