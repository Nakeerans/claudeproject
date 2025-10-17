import { useState, useEffect } from 'react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

export default function Interviews() {
  const [interviews, setInterviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState(null)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      const [interviewsRes, jobsRes] = await Promise.all([
        axios.get(`/api/interviews?${filter}=true`),
        axios.get('/api/jobs')
      ])
      setInterviews(interviewsRes.data.interviews)
      setJobs(jobsRes.data.jobs)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this interview?')) return

    try {
      await axios.delete(`/api/interviews/${id}`)
      setInterviews(interviews.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to delete interview:', error)
      alert('Failed to delete interview')
    }
  }

  const handleComplete = async (interview) => {
    const rating = prompt('Rate this interview (1-5):', '3')
    if (!rating) return

    try {
      await axios.patch(`/api/interviews/${interview.id}/complete`, {
        rating: parseInt(rating)
      })
      loadData()
    } catch (error) {
      console.error('Failed to complete interview:', error)
      alert('Failed to mark interview as complete')
    }
  }

  const handleEdit = (interview) => {
    setEditingInterview(interview)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingInterview(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingInterview(null)
  }

  const handleInterviewSaved = () => {
    loadData()
    handleModalClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + Schedule Interview
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'upcoming'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'completed'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p>No {filter} interviews</p>
          <button onClick={handleAdd} className="btn btn-primary mt-4">
            Schedule Your First Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map(interview => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <InterviewModal
          interview={editingInterview}
          jobs={jobs}
          onClose={handleModalClose}
          onSaved={handleInterviewSaved}
        />
      )}
    </div>
  )
}

function InterviewCard({ interview, onEdit, onDelete, onComplete }) {
  const interviewDate = parseISO(interview.interviewDate)
  const isPast = interviewDate < new Date()

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">{getInterviewIcon(interview.interviewType)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {interview.job.companyName} - {interview.job.jobTitle}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {interview.interviewType.toLowerCase().replace('_', ' ')} Interview
              </p>
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div>📅 {format(interviewDate, 'EEEE, MMMM d, yyyy')}</div>
            <div>🕐 {format(interviewDate, 'h:mm a')}</div>
            {interview.duration && <div>⏱️ {interview.duration} minutes</div>}
            {interview.interviewerName && <div>👤 {interview.interviewerName}</div>}
            {interview.locationOrLink && (
              <div className="break-all">
                📍 {interview.locationOrLink.startsWith('http') ? (
                  <a href={interview.locationOrLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Join Link
                  </a>
                ) : interview.locationOrLink}
              </div>
            )}
          </div>

          {interview.notes && (
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {interview.notes}
            </div>
          )}

          {interview.completed && interview.rating && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Completed - Rating: {'⭐'.repeat(interview.rating)}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          {!interview.completed && !isPast && (
            <button
              onClick={() => onComplete(interview)}
              className="btn btn-primary py-1 px-3 text-sm"
            >
              Complete
            </button>
          )}
          <button
            onClick={() => onEdit(interview)}
            className="btn btn-secondary py-1 px-3 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(interview.id)}
            className="btn btn-danger py-1 px-3 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function InterviewModal({ interview, jobs, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jobId: interview?.jobId || '',
    interviewDate: interview?.interviewDate
      ? new Date(interview.interviewDate).toISOString().slice(0, 16)
      : '',
    interviewType: interview?.interviewType || 'PHONE',
    locationOrLink: interview?.locationOrLink || '',
    interviewerName: interview?.interviewerName || '',
    interviewerEmail: interview?.interviewerEmail || '',
    duration: interview?.duration || '30',
    notes: interview?.notes || '',
    preparationNotes: interview?.preparationNotes || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (interview) {
        await axios.put(`/api/interviews/${interview.id}`, formData)
      } else {
        await axios.post('/api/interviews', formData)
      }
      onSaved()
    } catch (error) {
      console.error('Failed to save interview:', error)
      alert('Failed to save interview')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {interview ? 'Edit Interview' : 'Schedule Interview'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job *
              </label>
              <select
                name="jobId"
                required
                value={formData.jobId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.companyName} - {job.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="interviewDate"
                  required
                  value={formData.interviewDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  name="interviewType"
                  required
                  value={formData.interviewType}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="PHONE">Phone</option>
                  <option value="VIDEO">Video</option>
                  <option value="IN_PERSON">In Person</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="PANEL">Panel</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location / Video Link
              </label>
              <input
                type="text"
                name="locationOrLink"
                value={formData.locationOrLink}
                onChange={handleChange}
                className="input"
                placeholder="https://zoom.us/... or Office address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewer Name
                </label>
                <input
                  type="text"
                  name="interviewerName"
                  value={formData.interviewerName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewer Email
                </label>
                <input
                  type="email"
                  name="interviewerEmail"
                  value={formData.interviewerEmail}
                  onChange={handleChange}
                  className="input"
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input"
                rows="2"
                placeholder="Interview notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Notes
              </label>
              <textarea
                name="preparationNotes"
                value={formData.preparationNotes}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Things to prepare, questions to ask..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : interview ? 'Update Interview' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function getInterviewIcon(type) {
  const icons = {
    PHONE: '📞',
    VIDEO: '🎥',
    IN_PERSON: '🏢',
    TECHNICAL: '💻',
    BEHAVIORAL: '💬',
    PANEL: '👥',
    OTHER: '📋'
  }
  return icons[type] || '📋'
}
