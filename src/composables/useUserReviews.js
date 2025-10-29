import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useReviews } from './useReviews'

export function useUserReviews() {
  const userStore = useUserStore()
  const { getUserReviews, deleteReview, updateReview } = useReviews()

  const userReviews = ref([])
  const userStats = ref({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0
  })
  const loading = ref(false)

  // 🔹 LOAD USER'S REVIEWS
  const loadUserReviews = async (status = 'all') => {
    if (!userStore.user) {
      throw new Error('Korisnik nije prijavljen')
    }

    try {
      loading.value = true
      userReviews.value = await getUserReviews(userStore.user.uid, status)
      calculateUserStats()
      return userReviews.value
    } catch (error) {
      console.error('Error loading user reviews:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 🔹 CALCULATE USER STATISTICS
  const calculateUserStats = () => {
    const stats = {
      total: userReviews.value.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalRating: 0
    }

    userReviews.value.forEach(review => {
      switch (review.status) {
        case 'approved':
          stats.approved++
          stats.totalRating += review.rating
          break
        case 'pending':
          stats.pending++
          break
        case 'rejected':
          stats.rejected++
          break
      }
    })

    stats.averageRating = stats.approved > 0 ? stats.totalRating / stats.approved : 0
    userStats.value = stats
  }

  // 🔹 DELETE USER REVIEW
  const deleteUserReview = async (reviewId) => {
    try {
      await deleteReview(reviewId)
      // Remove from local state
      userReviews.value = userReviews.value.filter(review => review.id !== reviewId)
      calculateUserStats()
      return true
    } catch (error) {
      console.error('Error deleting user review:', error)
      throw error
    }
  }

  // 🔹 UPDATE USER REVIEW
  const updateUserReview = async (reviewId, updateData) => {
    try {
      await updateReview(reviewId, {
        ...updateData,
        status: 'pending' // Reset status to pending when updated
      })
      
      // Update local state
      const reviewIndex = userReviews.value.findIndex(review => review.id === reviewId)
      if (reviewIndex !== -1) {
        userReviews.value[reviewIndex] = {
          ...userReviews.value[reviewIndex],
          ...updateData,
          status: 'pending'
        }
      }
      
      calculateUserStats()
      return true
    } catch (error) {
      console.error('Error updating user review:', error)
      throw error
    }
  }

  // 🔹 GET REVIEWS BY STATUS
  const getReviewsByStatus = (status) => {
    return userReviews.value.filter(review => review.status === status)
  }

  // 🔹 GET RECENT REVIEWS
  const getRecentReviews = (limit = 5) => {
    return userReviews.value
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
  }

  // 🔹 GET TOP RATED REVIEWS
  const getTopRatedReviews = (limit = 5) => {
    return userReviews.value
      .filter(review => review.status === 'approved')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
  }

  // Computed properties
  const approvedReviews = computed(() => getReviewsByStatus('approved'))
  const pendingReviews = computed(() => getReviewsByStatus('pending'))
  const rejectedReviews = computed(() => getReviewsByStatus('rejected'))

  return {
    userReviews,
    userStats,
    loading,
    approvedReviews,
    pendingReviews,
    rejectedReviews,
    loadUserReviews,
    deleteUserReview,
    updateUserReview,
    getRecentReviews,
    getTopRatedReviews,
    getReviewsByStatus
  }
}