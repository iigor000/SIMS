import { ref } from 'vue'
import { useReviews } from './useReviews'
import { useUserStore } from '@/stores/user'

export function useModeration() {
  const { 
    getPendingReviews, 
    approveReview, 
    rejectReview,
  } = useReviews()
  
  const userStore = useUserStore()

  const pendingReviews = ref([])
  const moderationLoading = ref(false)
  const moderationStats = ref({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0
  })

  // 🔹 LOAD PENDING REVIEWS
  const loadPendingReviews = async () => {
    try {
      moderationLoading.value = true
      pendingReviews.value = await getPendingReviews(50)
      
      // Update stats
      moderationStats.value.pendingCount = pendingReviews.value.length
    } catch (error) {
      console.error('Error loading pending reviews:', error)
      throw error
    } finally {
      moderationLoading.value = false
    }
  }

  // 🔹 BULK APPROVE REVIEWS
  const bulkApproveReviews = async (reviewIds) => {
    try {
      moderationLoading.value = true
      const results = []
      
      for (const reviewId of reviewIds) {
        try {
          await approveReview(reviewId, userStore.user.uid)
          results.push({ id: reviewId, status: 'success' })
        } catch (error) {
          results.push({ id: reviewId, status: 'error', error: error.message })
        }
      }
      
      // Remove approved reviews from local state
      pendingReviews.value = pendingReviews.value.filter(
        review => !reviewIds.includes(review.id)
      )
      
      return results
    } catch (error) {
      console.error('Error in bulk approve:', error)
      throw error
    } finally {
      moderationLoading.value = false
    }
  }

  // 🔹 BULK REJECT REVIEWS
  const bulkRejectReviews = async (reviewIds, reason = '') => {
    try {
      moderationLoading.value = true
      const results = []
      
      for (const reviewId of reviewIds) {
        try {
          await rejectReview(reviewId, userStore.user.uid, reason)
          results.push({ id: reviewId, status: 'success' })
        } catch (error) {
          results.push({ id: reviewId, status: 'error', error: error.message })
        }
      }
      
      // Remove rejected reviews from local state
      pendingReviews.value = pendingReviews.value.filter(
        review => !reviewIds.includes(review.id)
      )
      
      return results
    } catch (error) {
      console.error('Error in bulk reject:', error)
      throw error
    } finally {
      moderationLoading.value = false
    }
  }

  // 🔹 GET MODERATION STATISTICS
  const loadModerationStats = async () => {
    try {
      // This would typically fetch from a dedicated stats collection
      // For now, we'll calculate from pending reviews
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Count approved/rejected today (this is simplified)
      // In a real app, you'd query Firestore for today's actions
      moderationStats.value.approvedToday = 0
      moderationStats.value.rejectedToday = 0
      
    } catch (error) {
      console.error('Error loading moderation stats:', error)
    }
  }

  // 🔹 SEARCH PENDING REVIEWS
  const searchPendingReviews = async (searchTerm) => {
    if (!searchTerm.trim()) {
      await loadPendingReviews()
      return
    }

    const filtered = pendingReviews.value.filter(review => 
      review.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    pendingReviews.value = filtered
  }

  // 🔹 FILTER BY ITEM TYPE
  const filterByItemType = async (itemType) => {
    if (!itemType) {
      await loadPendingReviews()
      return
    }

    const filtered = pendingReviews.value.filter(review => 
      review.itemType === itemType
    )

    pendingReviews.value = filtered
  }

  return {
    pendingReviews,
    moderationLoading,
    moderationStats,
    loadPendingReviews,
    bulkApproveReviews,
    bulkRejectReviews,
    loadModerationStats,
    searchPendingReviews,
    filterByItemType
  }
}