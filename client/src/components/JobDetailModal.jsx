import { useState, useEffect } from 'react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

export default function JobDetailModal({ jobId, onClose, onJobUpdated, onJobDeleted }) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    loadJobDetails()
  }, [jobId])

  const loadJobDetails = async () => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`)
      setJob(response.data.job)
    } catch (error) {
      console.error('Failed to load job details:', error)
      alert('Failed to load job details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await axios.delete(`/api/jobs/${jobId}`)
      onJobDeleted(jobId)
      onClose()
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job')
    }
  }

  const handleUpdate = async (updatedData) => {
    try {
      await axios.put(`/api/jobs/${jobId}`, updatedData)
      setJob(prev => ({ ...prev, ...updatedData }))
      setIsEditing(false)
      onJobUpdated()
    } catch (error) {
      console.error('Failed to update job:', error)
      alert('Failed to update job')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{job.companyName}</h2>
              <p className="text-lg text-gray-600">{job.jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {/* Stage Badge */}
          <div className="flex items-center space-x-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(job.stage)}`}>
              {formatStageName(job.stage)}
            </span>
            {job.priority && (
              <span className="text-sm text-gray-500">
                Priority: {'⭐'.repeat(job.priority)}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b -mb-px">
            <TabButton
              active={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            >
              Details
            </TabButton>
            <TabButton
              active={activeTab === 'interviews'}
              onClick={() => setActiveTab('interviews')}
            >
              Interviews ({job.interviews?.length || 0})
            </TabButton>
            <TabButton
              active={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
            >
              Documents ({job.documents?.length || 0})
            </TabButton>
            <TabButton
              active={activeTab === 'activities'}
              onClick={() => setActiveTab('activities')}
            >
              Activity
            </TabButton>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            isEditing ? (
              <EditJobForm job={job} onSave={handleUpdate} onCancel={() => setIsEditing(false)} />
            ) : (
              <JobDetailsView job={job} onEdit={() => setIsEditing(true)} onDelete={handleDelete} />
            )
          )}

          {activeTab === 'interviews' && (
            <InterviewsTab interviews={job.interviews || []} jobId={job.id} onUpdate={loadJobDetails} />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab documents={job.documents || []} jobId={job.id} onUpdate={loadJobDetails} />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTab activities={job.activities || []} />
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function JobDetailsView({ job, onEdit, onDelete }) {
  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
    if (min) return `$${(min / 1000).toFixed(0)}k+`
    return `Up to $${(max / 1000).toFixed(0)}k`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoField label="Location" value={job.location || 'Not specified'} icon="📍" />
        <InfoField label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} icon="💰" />
        <InfoField
          label="Applied Date"
          value={job.appliedDate ? format(parseISO(job.appliedDate), 'MMM d, yyyy') : 'Not yet applied'}
          icon="📤"
        />
        <InfoField
          label="Deadline"
          value={job.deadline ? format(parseISO(job.deadline), 'MMM d, yyyy') : 'No deadline'}
          icon="⏰"
        />
      </div>

      {job.jobUrl && (
        <InfoField
          label="Job Posting URL"
          value={
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {job.jobUrl}
            </a>
          }
          icon="🔗"
        />
      )}

      {job.description && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>
      )}

      {job.notes && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{job.notes}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4 border-t">
        <button onClick={onEdit} className="btn btn-primary">
          Edit Job
        </button>
        <button onClick={onDelete} className="btn btn-danger">
          Delete Job
        </button>
      </div>
    </div>
  )
}

function InfoField({ label, value, icon }) {
  return (
    <div>
      <div className="flex items-center text-sm text-gray-500 mb-1">
        {icon && <span className="mr-2">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-gray-900">{value}</div>
    </div>
  )
}

function EditJobForm({ job, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    companyName: job.companyName || '',
    jobTitle: job.jobTitle || '',
    location: job.location || '',
    jobUrl: job.jobUrl || '',
    description: job.description || '',
    salaryMin: job.salaryMin || '',
    salaryMax: job.salaryMax || '',
    stage: job.stage || 'WISHLIST',
    priority: job.priority || 3,
    appliedDate: job.appliedDate ? new Date(job.appliedDate).toISOString().split('T')[0] : '',
    deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
    notes: job.notes || '',
    color: job.color || '#6a4feb'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : null) : value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input
            type="text"
            name="companyName"
            required
            value={formData.companyName}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            name="jobTitle"
            required
            value={formData.jobTitle}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input"
            placeholder="San Francisco, CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
          <input
            type="url"
            name="jobUrl"
            value={formData.jobUrl}
            onChange={handleChange}
            className="input"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
          <input
            type="number"
            name="salaryMin"
            value={formData.salaryMin}
            onChange={handleChange}
            className="input"
            placeholder="80000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
          <input
            type="number"
            name="salaryMax"
            value={formData.salaryMax}
            onChange={handleChange}
            className="input"
            placeholder="120000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select name="stage" value={formData.stage} onChange={handleChange} className="input">
            <option value="WISHLIST">Wishlist</option>
            <option value="APPLIED">Applied</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="input">
            <option value="1">1 - Lowest</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Highest</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Color</label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="input h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
          <input
            type="date"
            name="appliedDate"
            value={formData.appliedDate}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input"
          rows="4"
          placeholder="Job description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="input"
          rows="3"
          placeholder="Personal notes..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  )
}

function InterviewsTab({ interviews, jobId, onUpdate }) {
  if (interviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No interviews scheduled for this job</p>
        <a href="/interviews" className="text-primary hover:underline mt-2 inline-block">
          Schedule an interview
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interviews.map(interview => (
        <div key={interview.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 capitalize">
                {interview.interviewType.toLowerCase().replace('_', ' ')} Interview
              </h4>
              <p className="text-sm text-gray-600">
                {format(parseISO(interview.interviewDate), 'EEEE, MMMM d, yyyy h:mm a')}
              </p>
              {interview.interviewerName && (
                <p className="text-sm text-gray-600 mt-1">
                  Interviewer: {interview.interviewerName}
                </p>
              )}
              {interview.completed && (
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Completed {interview.rating && `- ${'⭐'.repeat(interview.rating)}`}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsTab({ documents, jobId, onUpdate }) {
  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No documents uploaded for this job</p>
        <a href="/documents" className="text-primary hover:underline mt-2 inline-block">
          Upload a document
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map(doc => (
        <div key={doc.id} className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900">{doc.fileName}</h4>
          <p className="text-sm text-gray-600 capitalize">
            {doc.documentType.replace('_', ' ').toLowerCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {format(parseISO(doc.createdAt), 'MMM d, yyyy')}
          </p>
          <a
            href={`/api/documents/${doc.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  )
}

function ActivitiesTab({ activities }) {
  if (activities.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No activity recorded for this job</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">{getActivityIcon(activity.activityType)}</span>
          <div className="flex-1">
            <p className="text-sm text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {format(parseISO(activity.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      ))}
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

function getStageColor(stage) {
  const colors = {
    WISHLIST: 'bg-gray-100 text-gray-800',
    APPLIED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    OFFER: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  }
  return colors[stage] || 'bg-gray-100 text-gray-800'
}

function formatStageName(stage) {
  return stage.charAt(0) + stage.slice(1).toLowerCase()
}
