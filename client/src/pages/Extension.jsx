import { useState } from 'react'

export default function Extension() {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const extensionPath = 'https://github.com/Nakeerans/claudeproject/tree/main/job-application-platform/apps/extension'
  const downloadUrl = '/downloads/jobflow-chrome-extension.zip'

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chrome Extension</h1>
        <p className="text-gray-600">
          Autofill job applications directly from your browser with our Chrome extension
        </p>
      </div>

      {/* Direct Download Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 mb-8 border-2 border-green-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <span className="text-3xl">📥</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Extension</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Click the button below to download the JobFlow Chrome Extension (13 KB).
            Then follow the installation steps to add it to your browser.
          </p>
          <a
            href={downloadUrl}
            download="jobflow-chrome-extension.zip"
            onClick={handleDownload}
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {downloaded ? '✓ Downloaded!' : 'Download Extension (13 KB)'}
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Version 1.0.0 • Works with Chrome, Edge, Brave, and other Chromium browsers
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What can the extension do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✨</span>
            <div>
              <h3 className="font-medium text-gray-900">One-Click Autofill</h3>
              <p className="text-sm text-gray-600">Fill job applications instantly with your saved data</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <h3 className="font-medium text-gray-900">Smart Detection</h3>
              <p className="text-sm text-gray-600">Automatically detects form fields and fills them correctly</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">💼</span>
            <div>
              <h3 className="font-medium text-gray-900">Job Tracking</h3>
              <p className="text-sm text-gray-600">Save job applications directly from any website</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">🔒</span>
            <div>
              <h3 className="font-medium text-gray-900">Secure & Private</h3>
              <p className="text-sm text-gray-600">Your data stays secure and syncs with your account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Installation Guide</h2>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Download the Extension</h3>
              <p className="text-sm text-gray-600 mb-3">
                Click the green download button above to get the extension zip file (13 KB)
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  💡 The zip file will be saved to your Downloads folder
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Extract the ZIP File</h3>
              <p className="text-sm text-gray-600 mb-3">
                Unzip the downloaded file to a permanent location on your computer
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ⚠️ <strong>Important:</strong> Don't delete this folder after installation! Chrome needs it to run the extension.
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Recommended location: Create a folder like <code>C:\Extensions\JobFlow</code> or <code>~/Extensions/JobFlow</code>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Open Chrome Extensions Page</h3>
              <p className="text-sm text-gray-600 mb-3">
                Navigate to Chrome's extension management page
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Open Chrome and go to: <code className="bg-white px-2 py-1 rounded border border-gray-300">chrome://extensions/</code>
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Enable Developer Mode</h3>
              <p className="text-sm text-gray-600 mb-3">
                Toggle the "Developer mode" switch in the top right corner
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 This allows you to load unpacked extensions from your computer
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-4">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Load Unpacked Extension</h3>
              <p className="text-sm text-gray-600 mb-3">
                Click "Load unpacked" and select the extracted extension folder
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-2">
                <li>Click the <strong>"Load unpacked"</strong> button</li>
                <li>Navigate to where you extracted the zip file</li>
                <li>Select the folder containing the extension files</li>
                <li>Click "Select Folder"</li>
              </ol>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold mr-4">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-sm text-gray-600 mb-3">
                The extension icon should now appear in your Chrome toolbar
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  🎉 Click the extension icon to start autofilling job applications!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">1️⃣</span>
            <div>
              <h3 className="font-medium text-gray-900">Fill Your Profile</h3>
              <p className="text-sm text-gray-600">
                Make sure your profile information is complete in the Settings page
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">2️⃣</span>
            <div>
              <h3 className="font-medium text-gray-900">Visit a Job Application</h3>
              <p className="text-sm text-gray-600">
                Go to any job application form on websites like LinkedIn, Indeed, etc.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">3️⃣</span>
            <div>
              <h3 className="font-medium text-gray-900">Click the Extension Icon</h3>
              <p className="text-sm text-gray-600">
                Click the JobFlow extension icon in your Chrome toolbar
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">4️⃣</span>
            <div>
              <h3 className="font-medium text-gray-900">Autofill</h3>
              <p className="text-sm text-gray-600">
                Click "Autofill Application" and watch the magic happen!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Extension doesn't appear after installation</h3>
            <p className="text-sm text-gray-600">
              • Make sure you selected the correct folder (the one containing manifest.json)<br />
              • Try reloading the extension from chrome://extensions/<br />
              • Check for any error messages in the extensions page
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Autofill doesn't work</h3>
            <p className="text-sm text-gray-600">
              • Make sure you're logged in to your JobFlow account<br />
              • Check that your profile information is complete in Settings<br />
              • Refresh the job application page and try again
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Need more help?</h3>
            <p className="text-sm text-gray-600">
              Check out the detailed documentation in the{' '}
              <a
                href="https://github.com/Nakeerans/claudeproject/blob/main/EXTENSION_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Extension Guide
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
