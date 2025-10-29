import { ref, computed } from 'vue'
import { useReviews } from './useReviews'

export function useRatings() {
  const { getReviewStats } = useReviews()

  const ratingsData = ref({})
  const loading = ref(false)

  // 🔹 CALCULATE RATING DISTRIBUTION
  const calculateRatingDistribution = (reviews) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    reviews.forEach(review => {
      const roundedRating = Math.round(review.rating)
      distribution[roundedRating] = (distribution[roundedRating] || 0) + 1
    })
    
    return distribution
  }

  // 🔹 CALCULATE AVERAGE RATING
  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / reviews.length
  }

  // 🔹 GET RATING PERCENTAGE
  const getRatingPercentage = (rating) => {
  const count = ratingDistribution.value[rating] || ratingDistribution.value[rating.toString()] || 0
  if (totalReviews.value === 0) return 0
  return (count / totalReviews.value) * 100
}


  // 🔹 GET RATING COLOR
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#28a745' // Excellent - Green
    if (rating >= 4.0) return '#20c997' // Very Good - Teal
    if (rating >= 3.0) return '#ffc107' // Good - Yellow
    if (rating >= 2.0) return '#fd7e14' // Fair - Orange
    return '#dc3545' // Poor - Red
  }

  // 🔹 GET RATING LABEL
  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Odlično'
    if (rating >= 4.0) return 'Vrlo dobro'
    if (rating >= 3.0) return 'Dobro'
    if (rating >= 2.0) return 'Dovoljno'
    return 'Slabo'
  }

  // 🔹 FORMAT RATING FOR DISPLAY
  const formatRating = (rating) => {
    return rating.toFixed(1)
  }

  // 🔹 COMPARE RATINGS (for editor ranking)
  const compareRatings = (editorRating, userRatings) => {
    if (userRatings.length === 0) return 0
    
    const userAverage = calculateAverageRating(userRatings)
    const difference = Math.abs(editorRating - userAverage)
    
    // Calculate similarity score (0-100)
    const maxDifference = 4 // Max possible difference
    const similarity = Math.max(0, 100 - (difference / maxDifference) * 100)
    
    return Math.round(similarity)
  }

  // 🔹 LOAD RATINGS DATA FOR ITEM
  const loadItemRatings = async (itemId) => {
    try {
      loading.value = true
      const stats = await getReviewStats(itemId)
      ratingsData.value = stats
      return stats
    } catch (error) {
      console.error('Error loading item ratings:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    ratingsData,
    loading,
    calculateRatingDistribution,
    calculateAverageRating,
    getRatingPercentage,
    getRatingColor,
    getRatingLabel,
    formatRating,
    compareRatings,
    loadItemRatings
  }
}