import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [activities, setActivities] = useState([])
  const [upcomingInterviews, setUpcomingInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showExtensionBanner, setShowExtensionBanner] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [statsRes, timelineRes, activitiesRes, interviewsRes] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/analytics/timeline?days=30'),
        axios.get('/api/analytics/activities?limit=10'),
        axios.get('/api/interviews?upcoming=true')
      ])

      setStats(statsRes.data)
      setTimeline(timelineRes.data.timeline)
      setActivities(activitiesRes.data.activities)
      setUpcomingInterviews(interviewsRes.data.interviews.slice(0, 5))
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

      {/* Chrome Extension Banner */}
      {showExtensionBanner && (
        <div className="mb-8 relative">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="flex-1 mb-6 lg:mb-0">
                  <div className="flex items-center mb-3">
                    <span className="text-4xl mr-3">🧩</span>
                    <h2 className="text-2xl font-bold text-white">
                      Get the Chrome Extension
                    </h2>
                  </div>
                  <p className="text-blue-100 text-lg mb-4 max-w-2xl">
                    Autofill job applications with one click! Save hours of repetitive typing and never miss a field again.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                    <div className="flex items-center">
                      <span className="mr-2">✨</span>
                      <span>One-click autofill</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">🎯</span>
                      <span>Smart field detection</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">🔒</span>
                      <span>Secure & private</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/extension"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                  >
                    <span className="mr-2">📥</span>
                    Install Extension
                  </Link>
                  <a
                    href="https://github.com/Nakeerans/claudeproject/tree/main/job-application-platform/apps/extension"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowExtensionBanner(false)}
              className="absolute top-4 right-4 text-white hover:text-blue-200 transition-colors"
              aria-label="Dismiss banner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Rate</h2>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {stats?.responseRate || 0}%
              </div>
              <div className="text-sm text-gray-600">
                of applications lead to interviews
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Timeline */}
      {timeline.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Activity (Last 30 Days)</h2>
          <div className="h-48 flex items-end space-x-1">
            {timeline.slice(-30).map((day, idx) => {
              const maxTotal = Math.max(...timeline.map(d => d.total), 1)
              const height = (day.total / maxTotal) * 100
              return (
                <div
                  key={idx}
                  className="flex-1 bg-primary rounded-t hover:bg-primary-dark transition-colors relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${format(parseISO(day.date), 'MMM d')}: ${day.total} jobs`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {format(parseISO(day.date), 'MMM d')}: {day.total} jobs
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Total: {timeline.reduce((sum, day) => sum + day.total, 0)} jobs added in the last 30 days
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
          {upcomingInterviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming interviews</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map(interview => (
                <div key={interview.id} className="border-l-4 border-primary pl-3 py-2">
                  <div className="font-medium text-gray-900">
                    {interview.job.companyName} - {interview.job.jobTitle}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(parseISO(interview.interviewDate), 'MMM d, yyyy h:mm a')}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {interview.interviewType.toLowerCase().replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
          <a href="/interviews" className="text-primary hover:underline text-sm mt-4 inline-block">
            View all interviews →
          </a>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-2 text-sm">
                  <span className="text-lg">{getActivityIcon(activity.activityType)}</span>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.job?.companyName} • {format(parseISO(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getActivityIcon(type) {
  const icons = {
    JOB_CREATED: '✨',
    JOB_UPDATED: '✏️',
    STAGE_CHANGED: '➡️',
    APPLICATION_SUBMITTED: '📤',
    INTERVIEW_SCHEDULED: '📅',
    INTERVIEW_COMPLETED: '✅',
    OFFER_RECEIVED: '🎉',
    OFFER_ACCEPTED: '🤝',
    OFFER_REJECTED: '❌',
    NOTE_ADDED: '📝',
    CONTACT_ADDED: '👤',
    DOCUMENT_UPLOADED: '📄'
  }
  return icons[type] || '📌'
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
