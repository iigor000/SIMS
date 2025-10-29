import { ref, computed } from 'vue'
import { getAuth } from 'firebase/auth'
import { 
  ref as dbRef, 
  get, 
  push, 
  update, 
  remove,
  query,
  orderByChild,
  equalTo,
  limitToFirst
} from 'firebase/database'
import { db } from '@/firebase/config'
import { useUserStore } from '@/stores/user' 

export function useReviews() {
  const reviews = ref([])
  const loading = ref(false)
   const error = ref(null)
const userStore = useUserStore()

  const submitReview = async (reviewData) => {
    try {
      error.value = null
      loading.value = true
      
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('Korisnik nije prijavljen')
      
      // Use computed userRole from store
      const userRole = userStore.userRole
      
      console.log('User role for review submission:', userRole)
      console.log('Is Editor:', userStore.isEditor)
      
      const reviewWithMetadata = {
        ...reviewData,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email,
        authorRole: userRole, // 'user', 'editor', ili 'admin'
        // Editors get auto-approved, but need admin review
        // Users need editor approval
        status: userRole === 'editor' ? 'editor-approved' : 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewCount: 0
      }

      const reviewsRef = dbRef(db, 'reviews')
      const newReviewRef = push(reviewsRef)
      await update(newReviewRef, reviewWithMetadata)
      
      return {
        success: true,
        reviewId: newReviewRef.key,
        review: {
          id: newReviewRef.key,
          ...reviewWithMetadata
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      error.value = err.message
      throw new Error('Greška pri slanju recenzije')
    } finally {
      loading.value = false
    }
  }

const getItemReviews = async (itemId, itemsLimit = 10) => {
  try {
    loading.value = true

    const reviewsRef = dbRef(db, 'reviews')
    const q = query(
      reviewsRef,
      orderByChild('itemId'),
      equalTo(itemId),
      limitToFirst(itemsLimit)
    )

    const snapshot = await get(q)
    const reviewsList = []
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val()
        // Filter only fully approved reviews
        if (review.status === 'approved') {
          reviewsList.push({
            id: childSnapshot.key,
            ...review,
            createdAt: new Date(review.createdAt)
          })
        }
      })
      
      // Sort by date (newest first)
      reviewsList.sort((a, b) => b.createdAt - a.createdAt)
    }

    const hasMore = reviewsList.length === itemsLimit

    return {
      reviews: reviewsList,
      hasMore
    }
  } catch (error) {
    console.error('Error fetching item reviews:', error)
    throw new Error('Greška pri učitavanju recenzija')
  } finally {
    loading.value = false
  }
}

  const getUserReviews = async (userId, status = 'all') => {
    try {
      loading.value = true

      const reviewsRef = dbRef(db, 'reviews')
      const q = query(
        reviewsRef,
        orderByChild('userId'),
        equalTo(userId)
      )

      const snapshot = await get(q)
      const userReviews = []
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const review = childSnapshot.val()
          if (status === 'all' || review.status === status) {
            userReviews.push({
              id: childSnapshot.key,
              ...review,
              createdAt: new Date(review.createdAt)
            })
          }
        })
        
        // Sort by date (newest first)
        userReviews.sort((a, b) => b.createdAt - a.createdAt)
      }

      return userReviews
    } catch (error) {
      console.error('Error fetching user reviews:', error)
      throw new Error('Greška pri učitavanju korisničkih recenzija')
    } finally {
      loading.value = false
    }
  }


const getPendingReviews = async (limitCount = 20) => {
  try {
    loading.value = true

    const reviewsRef = dbRef(db, 'reviews')
    const q = query(
      reviewsRef,
      orderByChild('status'),
      equalTo('pending')
    )

    const snapshot = await get(q)
    const pendingReviews = []
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val()
        // Samo recenzije običnih korisnika (ne editora)
        if (review.authorRole === 'user' || !review.authorRole) {
          pendingReviews.push({
            id: childSnapshot.key,
            ...review,
            createdAt: new Date(review.createdAt)
          })
        }
      })
      
      // Sort by date (oldest first for moderation)
      pendingReviews.sort((a, b) => a.createdAt - b.createdAt)
      
      // Apply limit
      if (limitCount) {
        return pendingReviews.slice(0, limitCount)
      }
    }

    return pendingReviews
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    throw new Error('Greška pri učitavanju recenzija za moderaciju')
  } finally {
    loading.value = false
  }
}
  const approveReview = async (reviewId, moderatorId) => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await update(reviewRef, {
        status: 'approved',
        moderatedBy: moderatorId,
        moderatedAt: Date.now()
      })
      return true
    } catch (error) {
      console.error('Error approving review:', error)
      throw new Error('Greška pri odobravanju recenzije')
    }
  }

  const rejectReview = async (reviewId, moderatorId, reason = '') => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await update(reviewRef, {
        status: 'rejected',
        moderatedBy: moderatorId,
        moderatedAt: Date.now(),
        rejectionReason: reason
      })
      return true
    } catch (error) {
      console.error('Error rejecting review:', error)
      throw new Error('Greška pri odbijanju recenzije')
    }
  }

  const deleteReview = async (reviewId) => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await remove(reviewRef)
      return true
    } catch (error) {
      console.error('Error deleting review:', error)
      throw new Error('Greška pri brisanju recenzije')
    }
  }

  const updateReview = async (reviewId, updateData) => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await update(reviewRef, {
        ...updateData,
        updatedAt: Date.now()
      })
      return true
    } catch (error) {
      console.error('Error updating review:', error)
      throw new Error('Greška pri ažuriranju recenzije')
    }
  }

    const getReviewStats = async (itemId) => {
    try {
      const { reviews } = await getItemReviews(itemId)
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0

      const ratingDistribution = {}
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = reviews.filter(r => Math.round(r.rating) === i).length
      }

      const mediaTypeBreakdown = {}
      reviews.forEach(r => {
        if (!mediaTypeBreakdown[r.mediaType]) {
          mediaTypeBreakdown[r.mediaType] = { count: 0, averageRating: 0 }
        }
        const mt = mediaTypeBreakdown[r.mediaType]
        mt.count++
        mt.averageRating += r.rating
      })
      for (const mt in mediaTypeBreakdown) {
        mediaTypeBreakdown[mt].averageRating = mediaTypeBreakdown[mt].count > 0
          ? mediaTypeBreakdown[mt].averageRating / mediaTypeBreakdown[mt].count
          : 0
      }

      return { totalReviews, averageRating, ratingDistribution, mediaTypeBreakdown }
    } catch (error) {
      console.error('Error calculating review stats:', error)
      throw new Error('Greška pri računanju statistika')
    }
  }

  return {
    reviews,
    loading,
    error,
    submitReview,
    getItemReviews,
    getUserReviews,
    getPendingReviews,
    approveReview,
    rejectReview,
    deleteReview,
    updateReview,
    getReviewStats
  }
}