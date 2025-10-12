'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export default function QuickRating({ 
  ngoId, 
  ngoName, 
  onRatingSubmit, 
  currentRating = 0,
  readonly = false,
  size = 'md'
}) {
  const [rating, setRating] = useState(currentRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleRatingClick = async (selectedRating) => {
    if (readonly) return

    setRating(selectedRating)
    
    if (onRatingSubmit) {
      setIsSubmitting(true)
      try {
        await onRatingSubmit(selectedRating)
      } catch (error) {
        console.error('Error submitting rating:', error)
        setRating(currentRating) // Reset on error
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly || isSubmitting}
          className={`transition-colors ${
            readonly 
              ? 'cursor-default' 
              : 'cursor-pointer hover:scale-110 transform transition-transform'
          } ${
            star <= (hoverRating || rating)
              ? 'text-yellow-400'
              : 'text-gray-300'
          } ${readonly ? '' : 'hover:text-yellow-400'}`}
          onClick={() => handleRatingClick(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          <Star className={`${sizeClasses[size]} fill-current`} />
        </button>
      ))}
      {isSubmitting && (
        <div className="ml-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  )
}