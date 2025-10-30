<template>
  <div class="review-list">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Učitavanje recenzija...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="empty-state">
      <p>🤷‍♂️ Nema recenzija za ovaj item</p>
      <p v-if="!userStore.isAuthenticated" class="prompt">
        Budi prvi koji će oceniti!
      </p>
    </div>

    <!-- Reviews -->
    <div v-else class="reviews-container">
      <!-- Statistics -->
      <div class="reviews-stats">
        <div class="stat">
          <span class="stat-number">{{ reviews.length }}</span>
          <span class="stat-label">ukupno recenzija</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ averageRating.toFixed(1) }}</span>
          <span class="stat-label">prosečna ocena</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ editorReviewsCount }}</span>
          <span class="stat-label">editor recenzija</span>
        </div>
      </div>

      <!-- Reviews -->
      <div class="reviews">
        <ReviewCard 
          v-for="review in filteredReviews" 
          :key="review.id"
          :review="review"
          :editable="isUsersReview(review)"
          @edit="handleEditReview"
          @delete="handleDeleteReview"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" :disabled="loadingMore" class="load-more-btn">
          {{ loadingMore ? 'Učitavanje...' : 'Učitaj još' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useReviews } from '@/composables/useReviews'
import ReviewCard from './ReviewCard.vue'

const props = defineProps({
  itemId: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    default: 'all'
  },
  limit: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['edit-review', 'delete-review'])

const userStore = useUserStore()
const { getItemReviews, deleteReview } = useReviews()

const reviews = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const lastVisible = ref(null)

// Computed
const filteredReviews = computed(() => {
  if (props.mediaType === 'all') {
    return reviews.value
  }
  return reviews.value.filter(review => review.mediaType === props.mediaType)
})

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  
  const total = reviews.value.reduce((sum, review) => sum + review.rating, 0)
  return total / reviews.value.length
})

const editorReviewsCount = computed(() => {
  return reviews.value.filter(review => review.userRole === 'editor').length
})

// Methods
const fetchReviews = async (loadMore = false) => {
  if (loadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const result = await getItemReviews(
      props.itemId, 
      props.limit, 
      loadMore ? lastVisible.value : null
    )
    
    if (loadMore) {
      reviews.value = [...reviews.value, ...result.reviews]
    } else {
      reviews.value = result.reviews
    }
    
    lastVisible.value = result.lastVisible
    hasMore.value = result.hasMore
    
  } catch (error) {
    console.error('Error fetching reviews:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  fetchReviews(true)
}

const isUsersReview = (review) => {
  return userStore.user && review.userId === userStore.user.uid
}

const handleEditReview = (review) => {
  emit('edit-review', review)
}

const handleDeleteReview = async (reviewId) => {
  if (confirm('Da li ste sigurni da želite da obrišete ovu recenziju?')) {
    try {
      await deleteReview(reviewId)
      // Remove from local state
      reviews.value = reviews.value.filter(review => review.id !== reviewId)
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Greška pri brisanju recenzije')
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchReviews()
})

// Watch for media type changes
watch(
  () => props.mediaType,
  () => {
  }
)

// Watch for itemId changes
watch(
  () => props.itemId,
  () => {
    fetchReviews()
  }
)
</script>

<style scoped>
.review-list {
  margin-top: 24px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #ddd6fe;
  font-size: 1.1rem;
}

.empty-state .prompt {
  margin-top: 12px;
  font-size: 1rem;
  color: #c4b5fd;
}

.reviews-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 28px;
  padding: 24px;
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.16);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 1.75rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #ddd6fe;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.load-more {
  text-align: center;
  margin-top: 36px;
}

.load-more-btn {
  background: rgba(124,58,237,0.1);
  color: #ffffff;
  border: 1px solid rgba(124,58,237,0.2);
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
}

.load-more-btn:hover:not(:disabled) {
  background: rgba(124,58,237,0.2);
  transform: translateY(-1px);
}

.load-more-btn:disabled {
  background: rgba(124,58,237,0.05);
  border-color: rgba(124,58,237,0.1);
  color: #a899c2;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .reviews-stats {
    gap: 15px;
    justify-content: space-around;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
}
</style>