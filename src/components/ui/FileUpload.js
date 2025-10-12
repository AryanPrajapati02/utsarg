'use client'

import { useState } from 'react'
import { Upload, FileText, Trash2, Eye } from 'lucide-react'

export default function FileUpload({ 
  files = [], 
  onFilesChange, 
  accept = "image/*,.pdf",
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  label = "Upload Files"
}) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (fileList) => {
    const fileArray = Array.from(fileList)
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
        return false
      }
      return true
    })

    const filePromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result,
            id: Date.now() + Math.random()
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then(fileData => {
      onFilesChange([...files, ...fileData])
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (fileId) => {
    onFilesChange(files.filter(file => file.id !== fileId))
  }

  const viewFile = (file) => {
    window.open(file.data, '_blank')
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-4 ${dragActive ? 'text-primary-500' : 'text-neutral-500'}`} />
            <p className="mb-2 text-sm text-neutral-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-xs text-neutral-400">Max {maxSize / (1024 * 1024)}MB per file</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">Uploaded Files:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="border border-neutral-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                  {file.type && file.type.startsWith('image/') ? (
                    <img
                      src={file.data}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded mb-2 cursor-pointer"
                      onClick={() => viewFile(file)}
                    />
                  ) : (
                    <div 
                      className="w-full h-20 bg-neutral-100 rounded mb-2 flex items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors"
                      onClick={() => viewFile(file)}
                    >
                      <FileText className="w-8 h-8 text-neutral-500" />
                    </div>
                  )}
                  <p className="text-xs text-neutral-600 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  
                  {/* Action buttons */}
                  <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => viewFile(file)}
                      className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                      title="View file"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}