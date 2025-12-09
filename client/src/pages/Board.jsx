import { useState, useEffect } from 'react'
import axios from 'axios'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import JobCard from '../components/JobCard'
import AddJobModal from '../components/AddJobModal'
import JobDetailModal from '../components/JobDetailModal'

const STAGES = [
  { id: 'WISHLIST', name: 'Wishlist', color: 'bg-gray-200' },
  { id: 'APPLIED', name: 'Applied', color: 'bg-blue-200' },
  { id: 'INTERVIEW', name: 'Interview', color: 'bg-purple-200' },
  { id: 'OFFER', name: 'Offer', color: 'bg-green-200' },
  { id: 'REJECTED', name: 'Rejected', color: 'bg-red-200' }
]

export default function Board() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await axios.get('/api/jobs')
      setJobs(response.data.jobs)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over) return

    const jobId = active.id
    const newStage = over.id

    // Optimistic update
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, stage: newStage } : job
      )
    )

    try {
      await axios.patch(`/api/jobs/${jobId}/stage`, { stage: newStage })
    } catch (error) {
      console.error('Failed to update job stage:', error)
      // Revert on error
      loadJobs()
    }
  }

  const handleAddJob = (stage) => {
    setSelectedStage(stage)
    setIsAddModalOpen(true)
  }

  const handleJobCreated = () => {
    loadJobs()
    setIsAddModalOpen(false)
    setSelectedStage(null)
  }

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await axios.delete(`/api/jobs/${jobId}`)
      setJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  const handleViewDetails = (jobId) => {
    setSelectedJobId(jobId)
  }

  const handleCloseDetails = () => {
    setSelectedJobId(null)
  }

  const handleJobUpdated = () => {
    loadJobs()
  }

  const handleJobDeleted = (jobId) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCompany = filterCompany === '' ||
      job.companyName.toLowerCase().includes(filterCompany.toLowerCase())

    return matchesSearch && matchesCompany
  })

  const getJobsByStage = (stage) => {
    return filteredJobs.filter(job => job.stage === stage)
  }

  const uniqueCompanies = [...new Set(jobs.map(job => job.companyName))].sort()

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
        <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
        <button
          onClick={() => handleAddJob('WISHLIST')}
          className="btn btn-primary"
        >
          + Add Job
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search jobs by company, title, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="input w-full"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
        {(searchTerm || filterCompany) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterCompany('')
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <Column
              key={stage.id}
              stage={stage}
              jobs={getJobsByStage(stage.id)}
              onAddJob={() => handleAddJob(stage.id)}
              onDeleteJob={handleDeleteJob}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </DndContext>

      {isAddModalOpen && (
        <AddJobModal
          initialStage={selectedStage}
          onClose={() => setIsAddModalOpen(false)}
          onJobCreated={handleJobCreated}
        />
      )}

      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={handleCloseDetails}
          onJobUpdated={handleJobUpdated}
          onJobDeleted={handleJobDeleted}
        />
      )}
    </div>
  )
}

function Column({ stage, jobs, onAddJob, onDeleteJob, onViewDetails }) {
  const jobIds = jobs.map(job => job.id)

  return (
    <div className="flex flex-col h-full">
      <div className={`${stage.color} rounded-t-lg p-3 flex items-center justify-between`}>
        <div>
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="text-sm text-gray-600">{jobs.length}</span>
        </div>
        <button
          onClick={onAddJob}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
          title="Add job"
        >
          +
        </button>
      </div>

      <SortableContext items={jobIds} strategy={verticalListSortingStrategy} id={stage.id}>
        <div className="flex-1 bg-gray-50 rounded-b-lg p-2 min-h-[500px] space-y-2 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-8">
              No jobs yet
            </div>
          ) : (
            jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={onDeleteJob}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
