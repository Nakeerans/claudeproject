import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function JobCard({ job, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return null
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`
    if (min) return `$${(min / 1000).toFixed(0)}k+`
    return `Up to $${(max / 1000).toFixed(0)}k`
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
    >
      {/* Company & Title */}
      <div className="mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{job.companyName}</h4>
        <p className="text-sm text-gray-600">{job.jobTitle}</p>
      </div>

      {/* Location */}
      {job.location && (
        <div className="text-xs text-gray-500 mb-2">
          📍 {job.location}
        </div>
      )}

      {/* Salary */}
      {salary && (
        <div className="text-xs text-gray-500 mb-2">
          💰 {salary}
        </div>
      )}

      {/* Applied Date */}
      {job.appliedDate && (
        <div className="text-xs text-gray-500 mb-3">
          Applied {new Date(job.appliedDate).toLocaleDateString()}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {job.contacts && job.contacts.length > 0 && (
            <span className="text-xs text-gray-500">👥 {job.contacts.length}</span>
          )}
          {job.interviews && job.interviews.length > 0 && (
            <span className="text-xs text-gray-500">📅 {job.interviews.length}</span>
          )}
          {job._count?.documents > 0 && (
            <span className="text-xs text-gray-500">📄 {job._count.documents}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(job.id)
          }}
          className="text-gray-400 hover:text-red-600 text-xs"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
