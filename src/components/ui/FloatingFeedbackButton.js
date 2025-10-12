'use client'

import { useState } from 'react'
import { MessageSquare, Star, X } from 'lucide-react'
import Button from './Button'

export default function FloatingFeedbackButton({ ngoId, ngoName, onOpenFeedback }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isExpanded ? (
        <div className="bg-white rounded-lg shadow-lg border p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-neutral-900">Rate {ngoName}</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Quick Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="text-gray-300 hover:text-yellow-400 transition-colors"
                    onClick={() => onOpenFeedback && onOpenFeedback()}
                  >
                    <Star className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={() => {
                setIsExpanded(false)
                onOpenFeedback && onOpenFeedback()
              }}
              className="w-full text-sm"
            >
              Write Full Review
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}