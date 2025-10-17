import { useState, useEffect } from 'react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [docsRes, jobsRes] = await Promise.all([
        axios.get('/api/documents'),
        axios.get('/api/jobs')
      ])
      setDocuments(docsRes.data.documents)
      setJobs(jobsRes.data.jobs)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await axios.delete(`/api/documents/${id}`)
      setDocuments(documents.filter(d => d.id !== id))
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  const handleDownload = async (doc) => {
    try {
      window.open(`/api/documents/${doc.id}/download`, '_blank')
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true
    return doc.documentType === filter
  })

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
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Upload Document
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'RESUME', 'COVER_LETTER', 'PORTFOLIO', 'CERTIFICATE', 'OTHER'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === type
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type === 'all' ? 'All' : type.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p>No documents yet</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <UploadModal
          jobs={jobs}
          onClose={() => setIsModalOpen(false)}
          onUploaded={() => {
            loadData()
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function DocumentCard({ document: doc, onDelete, onDownload }) {
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('doc')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('zip')) return '📦'
    return '📎'
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <span className="text-3xl mr-3">{getFileIcon(doc.fileType)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{doc.fileName}</h3>
            <p className="text-xs text-gray-500 capitalize">
              {doc.documentType.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {doc.job && (
        <div className="text-sm text-gray-600 mb-2">
          🏢 {doc.job.companyName}
          <br />
          💼 {doc.job.jobTitle}
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3">
        <div>📅 {format(parseISO(doc.createdAt), 'MMM d, yyyy')}</div>
        <div>💾 {formatFileSize(doc.fileSize)}</div>
      </div>

      {doc.notes && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
          {doc.notes}
        </div>
      )}

      <div className="flex space-x-2 pt-2 border-t">
        <button
          onClick={() => onDownload(doc)}
          className="flex-1 btn btn-primary py-2 text-sm"
        >
          Download
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="btn btn-danger py-2 px-3 text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

function UploadModal({ jobs, onClose, onUploaded }) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    jobId: '',
    documentType: 'RESUME',
    notes: ''
  })

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      alert('Please select a file')
      return
    }

    setLoading(true)

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('documentType', formData.documentType)
      if (formData.jobId) uploadData.append('jobId', formData.jobId)
      if (formData.notes) uploadData.append('notes', formData.notes)

      await axios.post('/api/documents/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      onUploaded()
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document')
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
      <div className="bg-white rounded-lg max-w-xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File *
              </label>
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="input"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type *
              </label>
              <select
                name="documentType"
                required
                value={formData.documentType}
                onChange={handleChange}
                className="input"
              >
                <option value="RESUME">Resume</option>
                <option value="COVER_LETTER">Cover Letter</option>
                <option value="PORTFOLIO">Portfolio</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Job (optional)
              </label>
              <select
                name="jobId"
                value={formData.jobId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Not linked to any job</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.companyName} - {job.jobTitle}
                  </option>
                ))}
              </select>
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
                rows="3"
                placeholder="Add any notes about this document..."
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
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
