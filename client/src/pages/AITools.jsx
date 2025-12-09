import { useState } from 'react'
import axios from 'axios'

export default function AITools() {
  const [activeTab, setActiveTab] = useState('resume')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Tools</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        <TabButton
          active={activeTab === 'resume'}
          onClick={() => setActiveTab('resume')}
        >
          Resume Builder
        </TabButton>
        <TabButton
          active={activeTab === 'cover-letter'}
          onClick={() => setActiveTab('cover-letter')}
        >
          Cover Letter
        </TabButton>
        <TabButton
          active={activeTab === 'job-analysis'}
          onClick={() => setActiveTab('job-analysis')}
        >
          Job Analysis
        </TabButton>
        <TabButton
          active={activeTab === 'interview-prep'}
          onClick={() => setActiveTab('interview-prep')}
        >
          Interview Prep
        </TabButton>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'resume' && (
          <ResumeBuilder
            loading={loading}
            setLoading={setLoading}
            result={result}
            setResult={setResult}
          />
        )}

        {activeTab === 'cover-letter' && (
          <CoverLetterGenerator
            loading={loading}
            setLoading={setLoading}
            result={result}
            setResult={setResult}
          />
        )}

        {activeTab === 'job-analysis' && (
          <JobAnalysis
            loading={loading}
            setLoading={setLoading}
            result={result}
            setResult={setResult}
          />
        )}

        {activeTab === 'interview-prep' && (
          <InterviewPrep
            loading={loading}
            setLoading={setLoading}
            result={result}
            setResult={setResult}
          />
        )}
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

function ResumeBuilder({ loading, setLoading, result, setResult }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    style: 'professional'
  })

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      // Parse experience, education, and skills
      const userInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        linkedinUrl: formData.linkedinUrl,
        summary: formData.summary,
        experience: formData.experience ? formData.experience.split('\n\n').map(exp => ({
          description: exp
        })) : [],
        education: formData.education ? formData.education.split('\n').map(edu => ({
          description: edu
        })) : [],
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : []
      }

      const response = await axios.post('/api/ai/generate-resume', {
        userInfo,
        style: formData.style
      })

      setResult(response.data.resume)
    } catch (error) {
      console.error('Resume generation error:', error)
      alert(error.response?.data?.error || 'Failed to generate resume')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="input"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="input"
              rows="3"
              placeholder="Brief overview of your professional background..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="input"
              rows="5"
              placeholder="Separate each job with a blank line:&#10;&#10;Software Engineer at Google (2020-Present)&#10;Led development of...&#10;&#10;Junior Developer at Startup (2018-2020)&#10;Built features for..."
            />
            <p className="text-xs text-gray-500 mt-1">Separate each job with a blank line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <textarea
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="input"
              rows="3"
              placeholder="BS Computer Science - MIT (2018)&#10;Online Certification - AWS Solutions Architect"
            />
            <p className="text-xs text-gray-500 mt-1">One entry per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="input"
              rows="2"
              placeholder="JavaScript, React, Node.js, Python, AWS"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
            <select
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              className="input"
            >
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Resume'}
          </button>
        </form>
      </div>

      {/* Output */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Resume</h2>
        {result ? (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="btn btn-secondary"
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Fill out the form and click "Generate Resume" to see your AI-powered resume here.
          </p>
        )}
      </div>
    </div>
  )
}

function CoverLetterGenerator({ loading, setLoading, result, setResult }) {
  const [jobs, setJobs] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentRole: '',
    summary: '',
    skills: '',
    jobId: '',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    whyInterested: '',
    tone: 'professional'
  })

  useState(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await axios.get('/api/jobs')
      setJobs(response.data.jobs || [])
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  const handleJobSelect = (e) => {
    const jobId = e.target.value
    const job = jobs.find(j => j.id === jobId)

    if (job) {
      setFormData({
        ...formData,
        jobId,
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        jobDescription: job.description || ''
      })
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      const userInfo = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        currentRole: formData.currentRole,
        summary: formData.summary,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        whyInterested: formData.whyInterested
      }

      const job = {
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        description: formData.jobDescription
      }

      const response = await axios.post('/api/ai/generate-cover-letter', {
        userInfo,
        job,
        tone: formData.tone
      })

      setResult(response.data.coverLetter)
    } catch (error) {
      console.error('Cover letter generation error:', error)
      alert(error.response?.data?.error || 'Failed to generate cover letter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cover Letter Details</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Job (optional)</label>
            <select onChange={handleJobSelect} className="input">
              <option value="">Or enter manually below...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.companyName} - {job.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
            <input
              type="text"
              value={formData.currentRole}
              onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              className="input"
              placeholder="Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="input"
              rows="4"
              placeholder="Paste the job description here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="input"
              placeholder="JavaScript, React, Python (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why Are You Interested?</label>
            <textarea
              value={formData.whyInterested}
              onChange={(e) => setFormData({ ...formData, whyInterested: e.target.value })}
              className="input"
              rows="2"
              placeholder="What excites you about this role/company?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="input"
            >
              <option value="professional">Professional</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="formal">Formal</option>
              <option value="conversational">Conversational</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Cover Letter</h2>
        {result ? (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="btn btn-secondary"
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Fill out the form to generate your cover letter.
          </p>
        )}
      </div>
    </div>
  )
}

function JobAnalysis({ loading, setLoading, result, setResult }) {
  const [jobDescription, setJobDescription] = useState('')
  const [userSkills, setUserSkills] = useState('')

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      const response = await axios.post('/api/ai/analyze-job', {
        jobDescription,
        userSkills: userSkills ? userSkills.split(',').map(s => s.trim()) : []
      })

      setResult(JSON.stringify(response.data.analysis, null, 2))
    } catch (error) {
      console.error('Job analysis error:', error)
      alert(error.response?.data?.error || 'Failed to analyze job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste Job Description *
            </label>
            <textarea
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="input"
              rows="12"
              placeholder="Paste the full job description here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Skills (optional)
            </label>
            <input
              type="text"
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              className="input"
              placeholder="JavaScript, React, Python, AWS (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add your skills to get a match analysis
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Job'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
        {result ? (
          <div className="bg-gray-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Paste a job description and click "Analyze Job" to get insights.
          </p>
        )}
      </div>
    </div>
  )
}

function InterviewPrep({ loading, setLoading, result, setResult }) {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [userBackground, setUserBackground] = useState('')

  useState(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await axios.get('/api/jobs')
      setJobs(response.data.jobs || [])
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  const handleJobSelect = (e) => {
    const jobId = e.target.value
    const job = jobs.find(j => j.id === jobId)
    setSelectedJob(job || null)
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      const response = await axios.post('/api/ai/interview-prep', {
        job: selectedJob,
        userBackground
      })

      setResult(response.data.preparation)
    } catch (error) {
      console.error('Interview prep error:', error)
      alert(error.response?.data?.error || 'Failed to generate interview prep')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Details</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Job *</label>
            <select required onChange={handleJobSelect} className="input">
              <option value="">Choose a job...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.companyName} - {job.jobTitle}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">{selectedJob.jobTitle}</h3>
              <p className="text-sm text-gray-600">{selectedJob.companyName}</p>
              {selectedJob.location && (
                <p className="text-sm text-gray-600">{selectedJob.location}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Background (optional)
            </label>
            <textarea
              value={userBackground}
              onChange={(e) => setUserBackground(e.target.value)}
              className="input"
              rows="5"
              placeholder="Share your relevant experience, skills, and achievements that relate to this role..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedJob}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Interview Prep'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Preparation Guide</h2>
        {result ? (
          <div className="bg-gray-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Select a job and click "Generate Interview Prep" to get your personalized preparation guide.
          </p>
        )}
      </div>
    </div>
  )
}
