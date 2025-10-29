import { ref } from 'vue'
import { 
  ref as dbRef, 
  get, 
  update,
  query,
  orderByChild,
  equalTo
} from 'firebase/database'
import { db } from '@/firebase/config'
import { useUserStore } from '@/stores/user'

export function useAdminModeration() {
  const userStore = useUserStore()
  const editorReviews = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadEditorReviews = async () => {
    try {
      loading.value = true
      error.value = null
      
      const reviewsRef = dbRef(db, 'reviews')
      
      // Query za recenzije koje su napisali editori i imaju status 'editor-approved'
      const q = query(
        reviewsRef,
        orderByChild('status'),
        equalTo('editor-approved')
      )

      const snapshot = await get(q)
      const reviews = []
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const review = childSnapshot.val()
          // Dodatna provera da je autor stvarno editor
          if (review.authorRole === 'editor') {
            reviews.push({
              id: childSnapshot.key,
              ...review,
              createdAt: new Date(review.createdAt)
            })
          }
        })
        
        // Sort by date (oldest first)
        reviews.sort((a, b) => a.createdAt - b.createdAt)
      }

      editorReviews.value = reviews
      return reviews
    } catch (err) {
      console.error('Error fetching editor reviews:', err)
      error.value = 'Greška pri učitavanju editor recenzija'
      throw new Error('Greška pri učitavanju editor recenzija')
    } finally {
      loading.value = false
    }
  }

  // 🔹 APPROVE EDITOR REVIEW (by Admin)
  const approveReview = async (reviewId) => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await update(reviewRef, {
        status: 'approved', // Finalno odobrenje
        adminApprovedBy: userStore.user?.uid,
        adminApprovedAt: Date.now()
      })
      
      // Remove from local state
      editorReviews.value = editorReviews.value.filter(r => r.id !== reviewId)
      return true
    } catch (err) {
      console.error('Error approving editor review:', err)
      throw new Error('Greška pri odobravanju editor recenzije')
    }
  }

  const rejectReview = async (reviewId, reason = '') => {
    try {
      const reviewRef = dbRef(db, `reviews/${reviewId}`)
      await update(reviewRef, {
        status: 'admin-rejected',
        adminRejectedBy: userStore.user?.uid,
        adminRejectedAt: Date.now(),
        adminRejectionReason: reason
      })
      
      // Remove from local state
      editorReviews.value = editorReviews.value.filter(r => r.id !== reviewId)
      return true
    } catch (err) {
      console.error('Error rejecting editor review:', err)
      throw new Error('Greška pri odbijanju editor recenzije')
    }
  }

  // 🔹 GET STATS
  const getEditorReviewStats = async () => {
    try {
      const stats = {
        pending: editorReviews.value.length,
      }
      return stats
    } catch (err) {
      console.error('Error getting stats:', err)
      return { pending: 0 }
    }
  }

  return {
    editorReviews,
    loading,
    error,
    loadEditorReviews,
    approveReview,
    rejectReview,
    getEditorReviewStats
  }
}