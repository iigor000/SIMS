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
  color: #ddd6fe;
  margin-bottom: 12px;
  font-size: 2.2rem;
  font-weight: 600;
}

.page-header p {
  color: #c4b5fd;
  font-size: 1.1rem;
  opacity: 0.9;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #ddd6fe;
  font-size: 1.1rem;
}

.reviews-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(124,58,237,0.03);
  border: 1px solid rgba(124,58,237,0.1);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-number {
  display: block;
  font-size: 2.2rem;
  font-weight: bold;
  color: #ddd6fe;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters {
  margin-bottom: 24px;
}

.filter-select {
  padding: 12px 20px;
  background: rgba(124,58,237,0.05);
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: 8px;
  font-size: 1rem;
  color: #ddd6fe;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  background: rgba(124,58,237,0.08);
  border-color: rgba(124,58,237,0.2);
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(124,58,237,0.1);
}

.filter-select option {
  background: #1a1a1a;
  color: #ddd6fe;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #ddd6fe;
  background: rgba(124,58,237,0.03);
  border: 1px solid rgba(124,58,237,0.1);
  border-radius: 12px;
  margin-top: 20px;
}

.empty-state .subtext {
  margin-top: 12px;
  font-size: 1rem;
  color: #c4b5fd;
}

.empty-state a {
  color: #ddd6fe;
  text-decoration: none;
  border-bottom: 1px solid rgba(124,58,237,0.3);
  transition: all 0.2s ease;
}

.empty-state a:hover {
  color: #fde047;
  border-bottom-color: #fde047;
}
</style>