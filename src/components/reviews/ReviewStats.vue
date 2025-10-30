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
  background: rgba(124,58,237,0.03);
  border: 1px solid rgba(124,58,237,0.1);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(124,58,237,0.05);
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: 10px;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-item.distribution {
  text-align: left;
  grid-column: 3;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: bold;
  color: #ddd6fe;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.9rem;
  color: #c4b5fd;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.9rem;
}

.star-label {
  min-width: 45px;
  text-align: right;
  color: #ddd6fe;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  background: rgba(124,58,237,0.08);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(124,58,237,0.15);
  border: 1px solid rgba(124,58,237,0.16);
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(124,58,237,0.6), rgba(99,102,241,0.6));
  transition: width 0.3s ease;
}

.count {
  min-width: 30px;
  text-align: right;
  color: #ddd6fe;
  font-weight: 500;
}

.media-breakdown {
  border-top: 1px solid rgba(124,58,237,0.16);
  padding-top: 24px;
  margin-top: 16px;
}

.media-breakdown h4 {
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.16);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.breakdown-item:hover {
  background: rgba(124,58,237,0.12);
  transform: translateX(2px);
}

.media-type {
  font-weight: 500;
  color: #ffffff;
}

.media-count {
  color: #ddd6fe;
  font-size: 0.9rem;
}

.media-rating {
  color: #c4b5fd;
  font-weight: 600;
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