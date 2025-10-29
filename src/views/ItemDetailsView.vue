<template>
  <div class="item-details">
    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Učitavanje...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchItemDetails">Pokušaj ponovo</button>
    </div>

    <!-- Item details -->
    <div v-else-if="item" class="item-content">
      <!-- Item Header -->
      <div class="item-header">
        <div class="item-basic-info">
          <h1 class="item-title">{{ item.name }}</h1>
          <p class="item-type-badge">{{ getItemTypeLabel(itemType) }}</p>
        </div>
        
        <!-- Review Stats -->
        <ReviewStats :itemId="itemId" :itemType="itemType" />
      </div>

      <!-- Item Details Section -->
      <div class="item-details-section">
        <!-- Description -->
        <div v-if="item.description" class="description-section">
          <h3>Opis</h3>
          <p class="item-description">{{ item.description }}</p>
        </div>

        <!-- Specific details based on item type -->
        <div class="specific-details">
          <!-- Album details -->
          <div v-if="itemType === 'album' && item.artist" class="detail-row">
            <strong>Izvođač:</strong>
            <span>{{ item.artist.name }}</span>
          </div>

          <!-- Song details -->
          <div v-if="itemType === 'song'" class="detail-grid">
            <div v-if="item.duration" class="detail-row">
              <strong>Trajanje:</strong>
              <span>{{ item.duration }}</span>
            </div>
            <div v-if="item.album" class="detail-row">
              <strong>Album:</strong>
              <span>{{ item.album.name }}</span>
            </div>
          </div>

          <!-- Band details -->
          <div v-if="itemType === 'band'" class="detail-grid">
            <div v-if="item.formedDate" class="detail-row">
              <strong>Osnovan:</strong>
              <span>{{ formatDate(item.formedDate) }}</span>
            </div>
            <div v-if="item.originCity" class="detail-row">
              <strong>Mesto:</strong>
              <span>{{ item.originCity }}</span>
            </div>
          </div>

          <!-- Artist details -->
          <div v-if="itemType === 'artist'" class="detail-grid">
            <div v-if="item.birthDate" class="detail-row">
              <strong>Datum rođenja:</strong>
              <span>{{ formatDate(item.birthDate) }}</span>
            </div>
            <div v-if="item.birthPlace" class="detail-row">
              <strong>Mesto rođenja:</strong>
              <span>{{ item.birthPlace }}</span>
            </div>
          </div>

          <!-- Performance details -->
          <div v-if="itemType === 'performance'" class="detail-grid">
            <div v-if="item.performanceDate" class="detail-row">
              <strong>Datum nastupa:</strong>
              <span>{{ formatDate(item.performanceDate) }}</span>
            </div>
            <div v-if="item.location" class="detail-row">
              <strong>Lokacija:</strong>
              <span>{{ item.location.venue }}, {{ item.location.city }}</span>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="item.genres && item.genres.length" class="detail-row">
            <strong>Žanrovi:</strong>
            <div class="genres-list">
              <span v-for="genre in item.genres" :key="genre" class="genre-tag">
                {{ genre }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Items Navigation -->
      <div class="related-items">
        <h3>Povezani sadržaj</h3>
        <div class="related-links">
          <!-- Navigate to artist if viewing album/song -->
          <router-link 
            v-if="item.artist && (itemType === 'album' || itemType === 'song')"
            :to="`/item/artist/${item.artist.id}`"
            class="related-link"
          >
            → Pogledaj izvođača: {{ item.artist.name }}
          </router-link>

          <!-- Navigate to band if viewing artist -->
          <router-link 
            v-if="item.bands && itemType === 'artist'"
            v-for="band in item.bands"
            :key="band.id"
            :to="`/item/band/${band.id}`"
            class="related-link"
          >
            → Bend: {{ band.name }}
          </router-link>

          <!-- Navigate to album if viewing song -->
          <router-link 
            v-if="item.album && itemType === 'song'"
            :to="`/item/album/${item.album.id}`"
            class="related-link"
          >
            → Ceo album: {{ item.album.name }}
          </router-link>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section">
        <div class="reviews-header">
          <h2>Recenzije</h2>
          <div class="reviews-actions">
            <select v-model="selectedMediaType" class="media-filter">
              <option value="all">Sva izdanja</option>
              <option value="cd">CD</option>
              <option value="vinyl">Vinyl</option>
              <option value="digital">Digital</option>
              <option value="youtube">YouTube</option>
              <option value="streaming">Streaming</option>
            </select>
          </div>
        </div>

        <!-- Review Stats -->
        <ReviewStats :itemId="itemId" :itemType="itemType" />
        
        <!-- Review Form (only for authenticated users) -->
        <div v-if="userStore.isAuthenticated" class="review-form-container">
          <h3>Oceni ovaj {{ getItemTypeLabel(itemType) }}</h3>
          <ReviewForm 
            :itemId="itemId"
            :itemName="item.name"
            :itemType="itemType"
            @review-submitted="handleReviewSubmitted"
          />
        </div>
        <div v-else class="auth-prompt">
          <p>
            <router-link to="/login">Prijavi se</router-link> 
            da bi ostavio recenziju
          </p>
        </div>

        <!-- Reviews List -->
        <ReviewList 
          :itemId="itemId"
          :itemType="itemType"
          :mediaType="selectedMediaType"
          :key="reviewsKey"
        />
      </div>
    </div>

    <!-- No item found -->
    <div v-else class="not-found">
      <h2>Item nije pronađen</h2>
      <router-link to="/">← Nazad na početnu</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { db } from '@/firebase/config'
import { ref as dbRef, get } from 'firebase/database'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import ReviewList from '@/components/reviews/ReviewList.vue'
import ReviewStats from '@/components/reviews/ReviewStats.vue'

const route = useRoute()
const userStore = useUserStore()

// Reactive data
const itemId = route.params.id
const itemType = route.params.type
const item = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedMediaType = ref('all')
const reviewsKey = ref(0) // For forcing re-renders

// Item type labels
const itemTypeLabels = {
  album: 'Album',
  song: 'Pesma', 
  artist: 'Izvođač',
  band: 'Bend',
  performance: 'Nastup'
}

// Computed
const getItemTypeLabel = (type) => {
  return itemTypeLabels[type] || type
}

// Methods
const fetchItemDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Construct Firebase path based on item type
    const itemPath = `items/${itemType}/${itemId}`
    const itemSnapshot = await get(dbRef(db, itemPath))
    
    if (itemSnapshot.exists()) {
      item.value = {
        id: itemId,
        ...itemSnapshot.val()
      }
    } else {
      error.value = 'Item nije pronađen'
    }
  } catch (err) {
    console.error('Error fetching item:', err)
    error.value = 'Greška pri učitavanju podataka'
  } finally {
    loading.value = false
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznato'
  return new Date(timestamp).toLocaleDateString('sr-RS')
}

const handleReviewSubmitted = () => {
  // Refresh reviews list when new review is submitted
  reviewsKey.value += 1
}

// Lifecycle
onMounted(() => {
  fetchItemDetails()
})

// Watch for route changes
import { watch } from 'vue'
watch(
  () => route.params,
  () => {
    // Reset state when route changes
    item.value = null
    loading.value = true
    error.value = null
    selectedMediaType.value = 'all'
    reviewsKey.value = 0
    
    fetchItemDetails()
  }
)
</script>

<style scoped>
.item-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error, .not-found {
  text-align: center;
  padding: 40px;
}

.error {
  color: #d32f2f;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.item-basic-info {
  flex: 1;
}

.item-title {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #333;
}

.item-type-badge {
  display: inline-block;
  background: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.item-details-section {
  margin-bottom: 30px;
}

.description-section {
  margin-bottom: 25px;
}

.description-section h3 {
  margin-bottom: 10px;
  color: #555;
}

.item-description {
  line-height: 1.6;
  color: #666;
}

.specific-details {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.detail-grid {
  display: grid;
  gap: 15px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-row strong {
  min-width: 120px;
  color: #333;
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
}

.related-items {
  margin-bottom: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.related-items h3 {
  margin-bottom: 15px;
  color: #333;
}

.related-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-link {
  color: #007bff;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.related-link:hover {
  background: #e3f2fd;
  text-decoration: underline;
}

.reviews-section {
  margin-top: 40px;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.reviews-header h2 {
  margin: 0;
  color: #333;
}

.media-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.review-form-container {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.review-form-container h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.auth-prompt {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.auth-prompt a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.auth-prompt a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .item-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .item-title {
    font-size: 2rem;
  }
  
  .reviews-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .detail-row strong {
    min-width: auto;
  }
}
</style>