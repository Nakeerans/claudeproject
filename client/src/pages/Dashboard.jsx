import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await axios.get('/api/analytics/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          icon="📋"
          color="blue"
        />
        <StatCard
          title="Applications This Month"
          value={stats?.applicationsThisMonth || 0}
          icon="📤"
          color="green"
        />
        <StatCard
          title="Upcoming Interviews"
          value={stats?.upcomingInterviews || 0}
          icon="📅"
          color="purple"
        />
        <StatCard
          title="Offers Received"
          value={stats?.offersCount || 0}
          icon="🎉"
          color="yellow"
        />
      </div>

      {/* Jobs by Stage */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs by Stage</h2>
        <div className="space-y-3">
          {stats?.jobsByStage && Object.entries(stats.jobsByStage).map(([stage, count]) => (
            <div key={stage} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-3 ${getStageColor(stage)}`}></span>
                <span className="text-gray-700">{formatStageName(stage)}</span>
              </div>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Response Rate */}
      {stats?.responseRate !== undefined && (
        <div className="card p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Rate</h2>
          <div className="flex items-center">
            <div className="text-4xl font-bold text-primary">{stats.responseRate}%</div>
            <div className="ml-4 text-sm text-gray-600">
              of applications lead to interviews
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function getStageColor(stage) {
  const colors = {
    WISHLIST: 'bg-gray-400',
    APPLIED: 'bg-blue-500',
    INTERVIEW: 'bg-purple-500',
    OFFER: 'bg-green-500',
    REJECTED: 'bg-red-500'
  }
  return colors[stage] || 'bg-gray-400'
}

function formatStageName(stage) {
  return stage.charAt(0) + stage.slice(1).toLowerCase()
}
