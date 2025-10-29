<template>
  <div class="my-reviews">
    <div class="page-header">
      <h1>Moje Recenzije</h1>
      <p>Pregledaj i upravljaj svojim recenzijama</p>
    </div>

    <div v-if="loading" class="loading">
      <p>Učitavanje recenzija...</p>
    </div>

    <div v-else class="reviews-content">
      <!-- Statistics -->
      <div class="reviews-stats">
        <div class="stat-card">
          <div class="stat-number">{{ userStats.total }}</div>
          <div class="stat-label">Ukupno recenzija</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ userStats.approved }}</div>
          <div class="stat-label">Odobreno</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ userStats.pending }}</div>
          <div class="stat-label">Na čekanju</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ userStats.averageRating.toFixed(1) }}</div>
          <div class="stat-label">Prosečna ocena</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select v-model="statusFilter" @change="filterReviews" class="filter-select">
          <option value="all">Sve recenzije</option>
          <option value="approved">Odobrene</option>
          <option value="pending">Na čekanju</option>
          <option value="rejected">Odbijene</option>
        </select>
      </div>

      <!-- Reviews List -->
      <div v-if="filteredReviews.length > 0" class="reviews-list">
        <ReviewCard 
          v-for="review in filteredReviews" 
          :key="review.id"
          :review="review"
          :editable="true"
          @edit="editReview"
          @delete="deleteReview"
        />
      </div>

      <div v-else class="empty-state">
        <p>🤷‍♂️ Nemaš nijednu recenziju</p>
        <p class="subtext">
          <router-link to="/">Pronađi neki album ili pesmu</router-link> i ostavi svoju prvu recenziju!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserReviews } from '@/composables/useUserReviews'
import ReviewCard from '@/components/reviews/ReviewCard.vue'

const { userReviews, userStats, loading, loadUserReviews, deleteUserReview } = useUserReviews()

const statusFilter = ref('all')

const filteredReviews = computed(() => {
  if (statusFilter.value === 'all') {
    return userReviews.value
  }
  return userReviews.value.filter(review => review.status === statusFilter.value)
})

const filterReviews = () => {
  // Filter se automatski primenjuje kroz computed property
}

const editReview = (review) => {
  // Implementiraj edit funkcionalnost kasnije
  alert('Edit funkcionalnost će biti dostupna uskoro!')
}

const deleteReview = async (reviewId) => {
  if (confirm('Da li ste sigurni da želite da obrišete ovu recenziju?')) {
    try {
      await deleteUserReview(reviewId)
    } catch (error) {
      alert('Greška pri brisanju recenzije: ' + error.message)
    }
  }
}

onMounted(async () => {
  await loadUserReviews()
})
</script>

<style scoped>
.my-reviews {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.reviews-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
}

.filters {
  margin-bottom: 20px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state .subtext {
  margin-top: 10px;
  font-size: 0.9rem;
}

.empty-state a {
  color: #007bff;
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}
</style>