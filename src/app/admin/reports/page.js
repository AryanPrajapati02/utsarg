'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminReports() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [analytics, setAnalytics] = useState({
        overview: {},
        donations: {},
        volunteers: {},
        ngos: {},
        campaigns: {},
        trends: {}
    });
    const [dateRange, setDateRange] = useState('30');
    const [exportLoading, setExportLoading] = useState(false);

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
                if (userData.role !== 'super_admin' && userData.role !== 'admin') {
                    router.push('/login');
                    return;
                }
                setUser(userData);
                fetchAnalytics();
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/login');
        }
    };

    useEffect(() => {
        if (user) {
            fetchAnalytics();
        }
    }, [dateRange, user]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/analytics?days=${dateRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (type) => {
        try {
            setExportLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/export?type=${type}&days=${dateRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const StatCard = ({ title, value, change, icon, color = 'blue' }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {change && (
                        <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '+' : ''}{change}% from last period
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full bg-${color}-100`}>
                    <span className={`text-${color}-600 text-xl`}>{icon}</span>
                </div>
            </div>
        </div>
    );

    const ChartCard = ({ title, children, actions }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {actions && <div className="flex space-x-2">{actions}</div>}
            </div>
            {children}
        </div>
    );

    if (loading || !user) {
        return (
            <DashboardLayout userType="admin" user={user}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userType="admin" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                        <p className="text-gray-600">Comprehensive platform insights and data analysis</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                        <button
                            onClick={() => fetchAnalytics()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={analytics.overview.totalUsers || 0}
                        change={analytics.overview.userGrowth}
                        icon="👥"
                        color="blue"
                    />
                    <StatCard
                        title="Total Donations"
                        value={`₹${(analytics.donations.totalAmount || 0).toLocaleString()}`}
                        change={analytics.donations.growth}
                        icon="💰"
                        color="green"
                    />
                    <StatCard
                        title="Active NGOs"
                        value={analytics.ngos.verified || 0}
                        change={analytics.ngos.growth}
                        icon="🏢"
                        color="purple"
                    />
                    <StatCard
                        title="Volunteer Applications"
                        value={analytics.volunteers.totalApplications || 0}
                        change={analytics.volunteers.growth}
                        icon="🤝"
                        color="orange"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Registration Trends */}
                    <ChartCard
                        title="User Registration Trends"
                        actions={
                            <button
                                onClick={() => exportReport('users')}
                                disabled={exportLoading}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                            >
                                Export
                            </button>
                        }
                    >
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <div className="text-center">
                                <div className="text-2xl mb-2">📈</div>
                                <p className="text-gray-600">User registration chart would go here</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Donors:</span>
                                        <span className="font-semibold">{analytics.overview.donors || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Volunteers:</span>
                                        <span className="font-semibold">{analytics.overview.volunteers || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>NGOs:</span>
                                        <span className="font-semibold">{analytics.overview.ngos || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Donation Analytics */}
                    <ChartCard
                        title="Donation Analytics"
                        actions={
                            <button
                                onClick={() => exportReport('donations')}
                                disabled={exportLoading}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                            >
                                Export
                            </button>
                        }
                    >
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <div className="text-center">
                                <div className="text-2xl mb-2">💹</div>
                                <p className="text-gray-600">Donation trends chart would go here</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Donations:</span>
                                        <span className="font-semibold">{analytics.donations.count || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Average Amount:</span>
                                        <span className="font-semibold">₹{(analytics.donations.average || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Top Campaign:</span>
                                        <span className="font-semibold">{analytics.donations.topCampaign || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ChartCard>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Performance */}
                    <ChartCard
                        title="Campaign Performance"
                        actions={
                            <button
                                onClick={() => exportReport('campaigns')}
                                disabled={exportLoading}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                            >
                                Export
                            </button>
                        }
                    >
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <div className="text-center">
                                <div className="text-2xl mb-2">🎯</div>
                                <p className="text-gray-600">Campaign performance metrics</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Active Campaigns:</span>
                                        <span className="font-semibold">{analytics.campaigns.active || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Completed:</span>
                                        <span className="font-semibold">{analytics.campaigns.completed || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Success Rate:</span>
                                        <span className="font-semibold">{analytics.campaigns.successRate || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Geographic Distribution */}
                    <ChartCard
                        title="Geographic Distribution"
                        actions={
                            <button
                                onClick={() => exportReport('geographic')}
                                disabled={exportLoading}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                            >
                                Export
                            </button>
                        }
                    >
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <div className="text-center">
                                <div className="text-2xl mb-2">🗺️</div>
                                <p className="text-gray-600">User distribution by location</p>
                                <div className="mt-4 space-y-2">
                                    {analytics.geographic?.topCities?.slice(0, 5).map((city, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{city.name}:</span>
                                            <span className="font-semibold">{city.count}</span>
                                        </div>
                                    )) || (
                                            <div className="text-sm text-gray-500">No geographic data available</div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </ChartCard>
                </div>

                {/* Detailed Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performing NGOs */}
                    <ChartCard title="Top Performing NGOs">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NGO</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donations</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaigns</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {analytics.ngos.topPerformers?.slice(0, 5).map((ngo, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm text-gray-900">{ngo.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">₹{ngo.totalDonations?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{ngo.campaignCount}</td>
                                        </tr>
                                    )) || (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3 text-sm text-gray-500 text-center">No data available</td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>

                    {/* Recent Activity */}
                    <ChartCard title="Recent Platform Activity">
                        <div className="space-y-3">
                            {analytics.recentActivity?.slice(0, 8).map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                    <div className="flex-shrink-0">
                                        <span className="text-lg">
                                            {activity.type === 'donation' && '💰'}
                                            {activity.type === 'registration' && '👤'}
                                            {activity.type === 'campaign' && '🎯'}
                                            {activity.type === 'volunteer' && '🤝'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                    </div>
                                </div>
                            )) || (
                                    <div className="text-sm text-gray-500 text-center py-4">No recent activity</div>
                                )}
                        </div>
                    </ChartCard>
                </div>

                {/* Export Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => exportReport('complete')}
                            disabled={exportLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            Complete Report
                        </button>
                        <button
                            onClick={() => exportReport('financial')}
                            disabled={exportLoading}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            Financial Report
                        </button>
                        <button
                            onClick={() => exportReport('user-analytics')}
                            disabled={exportLoading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            User Analytics
                        </button>
                        <button
                            onClick={() => exportReport('performance')}
                            disabled={exportLoading}
                            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                            Performance Report
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}