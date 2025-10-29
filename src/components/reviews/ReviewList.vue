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
  margin-top: 20px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state .prompt {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #888;
}

.reviews-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  margin-top: 4px;
}

.reviews {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.load-more-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #0056b3;
}

.load-more-btn:disabled {
  background: #6c757d;
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