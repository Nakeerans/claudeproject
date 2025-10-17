import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const response = await axios.get('/api/contacts')
      setContacts(response.data.contacts)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      await axios.delete(`/api/contacts/${id}`)
      setContacts(contacts.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact')
    }
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingContact(null)
  }

  const handleContactSaved = () => {
    loadContacts()
    handleModalClose()
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input max-w-md"
        />
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p>No contacts yet</p>
          <button onClick={handleAdd} className="btn btn-primary mt-4">
            Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <ContactModal
          contact={editingContact}
          onClose={handleModalClose}
          onSaved={handleContactSaved}
        />
      )}
    </div>
  )
}

function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
            {contact.role && (
              <p className="text-sm text-gray-600">{contact.role}</p>
            )}
          </div>
        </div>
      </div>

      {contact.company && (
        <div className="text-sm text-gray-600 mb-2">
          🏢 {contact.company}
        </div>
      )}

      {contact.email && (
        <div className="text-sm text-gray-600 mb-2">
          📧 {contact.email}
        </div>
      )}

      {contact.phone && (
        <div className="text-sm text-gray-600 mb-2">
          📱 {contact.phone}
        </div>
      )}

      {contact.linkedinUrl && (
        <div className="text-sm text-gray-600 mb-3">
          🔗 <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            LinkedIn
          </a>
        </div>
      )}

      {contact.jobs && contact.jobs.length > 0 && (
        <div className="text-xs text-gray-500 mb-3 pt-2 border-t">
          Linked to {contact.jobs.length} job(s)
        </div>
      )}

      <div className="flex space-x-2 pt-2 border-t">
        <button
          onClick={() => onEdit(contact)}
          className="flex-1 btn btn-secondary py-2 text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="flex-1 btn btn-danger py-2 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function ContactModal({ contact, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    linkedinUrl: contact?.linkedinUrl || '',
    company: contact?.company || '',
    role: contact?.role || '',
    notes: contact?.notes || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (contact) {
        await axios.put(`/api/contacts/${contact.id}`, formData)
      } else {
        await axios.post('/api/contacts', formData)
      }
      onSaved()
    } catch (error) {
      console.error('Failed to save contact:', error)
      alert('Failed to save contact')
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
              {contact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="input"
                  placeholder="Google"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role/Title
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input"
                  placeholder="Recruiter"
                />
              </div>
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
                placeholder="Add any notes about this contact..."
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
                {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
