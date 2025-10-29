<template>
  <div class="review-stats">
    <div class="stats-grid">
      <!-- Average Rating -->
      <div class="stat-item">
        <div class="stat-value">{{ averageRating.toFixed(1) }}</div>
        <div class="stat-label">Prosečna ocena</div>
        <StarRating :rating="averageRating" :readonly="true" size="small" />
      </div>

      <!-- Total Reviews -->
      <div class="stat-item">
        <div class="stat-value">{{ totalReviews }}</div>
        <div class="stat-label">Ukupno recenzija</div>
      </div>

      <!-- Rating Distribution -->
      <div class="stat-item distribution">
        <div class="stat-label">Raspodela ocena</div>
        <div class="distribution-bars">
          <div 
            v-for="i in 5" 
            :key="i"
            class="distribution-row"
          >
            <span class="star-label">{{ 6 - i }}⭐</span>
            <div class="bar-container">
              <div 
                class="bar" 
                :style="{ width: getRatingPercentage(6 - i) + '%' }"
              ></div>
            </div>
            <span class="count">{{ ratingDistribution[6 - i] || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Media Type Breakdown -->
    <div v-if="mediaTypeBreakdown.length > 0" class="media-breakdown">
      <h4>Recenzije po tipu izdanja</h4>
      <div class="breakdown-list">
        <div 
          v-for="item in mediaTypeBreakdown" 
          :key="item.mediaType"
          class="breakdown-item"
        >
          <span class="media-type">{{ getMediaTypeLabel(item.mediaType) }}</span>
          <span class="media-count">{{ item.count }} recenzija</span>
          <span class="media-rating">{{ item.averageRating.toFixed(1) }} ⭐</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReviews } from '@/composables/useReviews'
import StarRating from './StarRaiting.vue'

const props = defineProps({
  itemId: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    required: true
  }
})

const { getReviewStats } = useReviews()

const stats = ref({
  totalReviews: 0,
  averageRating: 0,
  ratingDistribution: {},
  mediaTypeBreakdown: {}
})

const loading = ref(true)

// Computed
const totalReviews = computed(() => stats.value.totalReviews)
const averageRating = computed(() => stats.value.averageRating)
const ratingDistribution = computed(() => stats.value.ratingDistribution)

const mediaTypeBreakdown = computed(() => {
  return Object.entries(stats.value.mediaTypeBreakdown).map(([mediaType, data]) => ({
    mediaType,
    count: data.count,
    averageRating: data.averageRating
  }))
})

// Methods
const fetchStats = async () => {
  try {
    loading.value = true
    const reviewStats = await getReviewStats(props.itemId)
    stats.value = reviewStats
  } catch (error) {
    console.error('Error fetching review stats:', error)
  } finally {
    loading.value = false
  }
}

const getRatingPercentage = (rating) => {
  const count = ratingDistribution.value[rating] || 0
  if (totalReviews.value === 0) return 0
  return (count / totalReviews.value) * 100
}

const getMediaTypeLabel = (mediaType) => {
  const labels = {
    cd: 'CD',
    vinyl: 'Vinyl',
    cassette: 'Kasetа',
    digital: 'Digitalno',
    youtube: 'YouTube',
    streaming: 'Streaming'
  }
  return labels[mediaType] || mediaType
}

// Lifecycle
onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.review-stats {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
}

.stat-item.distribution {
  text-align: left;
  grid-column: 3;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  text-transform: uppercase;
  font-weight: 500;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.star-label {
  min-width: 30px;
  text-align: right;
}

.bar-container {
  flex: 1;
  background: #f0f0f0;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #ffc107;
  transition: width 0.3s ease;
}

.count {
  min-width: 20px;
  text-align: right;
  color: #666;
}

.media-breakdown {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.media-breakdown h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1rem;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.media-type {
  font-weight: 500;
  color: #333;
}

.media-count {
  color: #666;
  font-size: 0.9rem;
}

.media-rating {
  color: #007bff;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stat-item.distribution {
    grid-column: 1;
  }
  
  .breakdown-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>