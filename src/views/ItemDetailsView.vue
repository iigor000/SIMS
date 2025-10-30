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
        <div v-if="showImage && imageSrc" class="item-cover">
          <img :src="imageSrc" alt="cover" @error="onImageError" @click="openImage" />
        </div>
        <div class="item-basic-info">
          <h1 class="item-title">{{ item.name }}</h1>
          <p class="item-type-badge">{{ getItemTypeLabel(itemType) }}</p>
        </div>
        
        
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
          <!-- Song details -->
          <div v-if="itemType === 'song'" class="detail-grid">
            <div v-if="item.duration" class="detail-row">
              <strong>Trajanje:</strong>
              <span>{{ item.duration }}</span>
            </div>
            <div v-if="item.album" class="detail-row">
              <strong>Album:</strong>
              <router-link :to="`/item/album/${item.album.id}`" class="link">
                {{ item.album.name }}
              </router-link>
            </div>
            <div v-if="item.songwriters?.length" class="detail-row">
              <strong>Autori:</strong>
              <div class="list-links">
                <router-link 
                  v-for="songwriter in item.songwriters" 
                  :key="songwriter.id"
                  :to="`/item/artist/${songwriter.id}`" 
                  class="link"
                >
                  {{ songwriter.name }}
                </router-link>
              </div>
            </div>
            <div v-if="item.producers?.length" class="detail-row">
              <strong>Producenti:</strong>
              <div class="list-links">
                <router-link 
                  v-for="producer in item.producers" 
                  :key="producer.id"
                  :to="`/item/artist/${producer.id}`" 
                  class="link"
                >
                  {{ producer.name }}
                </router-link>
              </div>
            </div>
            <div v-if="item.lyrics" class="detail-row lyrics-section">
              <strong>Tekst:</strong>
              <pre class="lyrics">{{ item.lyrics }}</pre>
            </div>
          </div>

          <!-- Album details -->
          <div v-if="itemType === 'album'" class="detail-grid">
            <div v-if="item.releaseDate" class="detail-row">
              <strong>Datum izdanja:</strong>
              <span>{{ formatDate(item.releaseDate) }}</span>
            </div>
            <div v-if="item.artist" class="detail-row">
              <strong>Izvođač:</strong>
              <router-link 
                :to="`/item/${item.artist.type || 'artist'}/${item.artist.id}`" 
                class="link"
              >
                {{ item.artist.name }}
              </router-link>
            </div>
            <div v-if="item.tracks?.length" class="detail-row">
              <strong>Pesme:</strong>
              <div class="tracks-list">
                <div v-for="track in item.tracks" :key="track.id" class="track-item">
                  <router-link :to="`/item/song/${track.id}`" class="link">
                    {{ track.name }}
                  </router-link>
                  <span v-if="track.duration" class="track-duration">{{ track.duration }}</span>
                </div>
              </div>
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
            <div v-if="item.members?.length" class="detail-row">
              <strong>Članovi:</strong>
              <div class="members-list">
                <div v-for="member in item.members" :key="member.id" class="member-item">
                  <router-link :to="`/item/artist/${member.id}`" class="link">
                    {{ member.name }}
                  </router-link>
                  <span v-if="member.role" class="member-role"> - {{ member.role }}</span>
                  <span v-if="member.joinDate" class="member-date">
                    ({{ formatDate(member.joinDate) }} - {{ member.leaveDate ? formatDate(member.leaveDate) : 'danas' }})
                  </span>
                  <span v-else-if="member.leaveDate" class="member-date">
                    (do {{ formatDate(member.leaveDate) }})
                  </span>
                </div>
              </div>
            </div>
            <div v-if="item.albums?.length" class="detail-row">
              <strong>Albumi:</strong>
              <div class="albums-list">
                <div v-for="album in item.albums" :key="album.id" class="album-item">
                  <router-link :to="`/item/album/${album.id}`" class="link">
                    {{ album.name }}
                  </router-link>
                  <span v-if="album.releaseDate" class="album-date">
                    {{ formatDate(album.releaseDate) }}
                  </span>
                </div>
              </div>
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
            <div v-if="item.bands?.length" class="detail-row">
              <strong>Bendovi:</strong>
              <div class="list-links">
                <router-link 
                  v-for="band in item.bands" 
                  :key="band.id"
                  :to="`/item/band/${band.id}`" 
                  class="link"
                >
                  {{ band.name }}
                </router-link>
              </div>
            </div>
            <div v-if="item.songs?.length" class="detail-row">
              <strong>Pesme:</strong>
              <div class="list-links">
                <router-link 
                  v-for="song in item.songs" 
                  :key="song.id"
                  :to="`/item/song/${song.id}`" 
                  class="link"
                >
                  {{ song.name }}
                </router-link>
              </div>
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
            <div v-if="item.performers?.length" class="detail-row">
              <strong>Izvođači:</strong>
              <div class="list-links">
                <router-link 
                  v-for="performer in item.performers" 
                  :key="performer.id"
                  :to="`/item/${performer.type}/${performer.id}`" 
                  class="link"
                >
                  {{ performer.name }}
                </router-link>
              </div>
            </div>
          </div>

          <!-- Genres (common to multiple types) -->
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
const itemId = ref(route.params.id)
const itemType = ref(route.params.type)
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
    const itemPath = `items/${itemType.value}/${itemId.value}`
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

// Image handling for item
const showImage = ref(true)
const imageSrc = computed(() => {
  if (!item.value) return ''
  return (
    item.value.imageUrl ||
    item.value.image ||
    item.value.coverUrl ||
    item.value.thumbnail ||
    item.value.artwork ||
    ''
  )
})

const onImageError = () => {
  showImage.value = false
}

const openImage = () => {
  if (!imageSrc.value) return
  window.open(imageSrc.value, '_blank', 'noopener')
}

// Lifecycle
onMounted(() => {
  fetchItemDetails()
})

// Watch for route changes
import { watch } from 'vue'
watch(
  () => route.params,
  (newParams) => {
    // Update route params
    itemId.value = newParams.id
    itemType.value = newParams.type
    
    // Reset state when route changes
    item.value = null
    loading.value = true
    error.value = null
    selectedMediaType.value = 'all'
    reviewsKey.value = 0
    
    // Fetch new data
    fetchItemDetails()
  },
  { immediate: true } // Run immediately on component mount
)
</script>

<style scoped>
.item-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #ffffff;
}

.loading, .error, .not-found {
  text-align: center;
  padding: 40px;
  color: #ddd6fe;
}

.error {
  color: #fca5a5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(124,58,237,0.12);
}

.item-basic-info {
  flex: 1;
}

.item-cover {
  width: 220px;
  height: 220px;
  flex: 0 0 220px;
  margin-right: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(124,58,237,0.06);
  border: 1px solid rgba(124,58,237,0.12);
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.item-title {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #efe6ff;
}

.item-type-badge {
  display: inline-block;
  background: linear-gradient(90deg, rgba(124,58,237,0.95), rgba(99,102,241,0.95));
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.item-details-section {
  margin-bottom: 30px;
}

.description-section {
  margin-bottom: 25px;
}

.description-section h3 {
  margin-bottom: 10px;
  color: #efe6ff;
}

.item-description {
  line-height: 1.6;
  color: #dcd4f8;
}

.specific-details {
  background: rgba(124,58,237,0.06);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(124,58,237,0.18);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-grid {
  display: grid;
  gap: 20px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row strong {
  font-size: 0.9rem;
  color: #ddd6fe;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  opacity: 0.9;
}

.link {
  color: #c4b5fd;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 2px 6px;
  margin: -2px -6px;
  border-radius: 4px;
}

.link:hover {
  color: #ddd6fe;
  background: rgba(124,58,237,0.08);
}

.list-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.track-item:hover {
  background: rgba(124,58,237,0.08);
}

.track-duration {
  color: #a899c2;
  font-size: 0.875rem;
  opacity: 0.8;
}

.lyrics-section {
  margin-top: 16px;
}

.lyrics {
  white-space: pre-wrap;
  font-family: inherit;
  background: rgba(17,24,39,0.48);
  padding: 16px;
  border-radius: 8px;
  margin-top: 8px;
  border: 1px solid rgba(124,58,237,0.16);
  line-height: 1.7;
  color: #e2e8f0;
  font-size: 0.95rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.member-item:hover {
  background: rgba(124,58,237,0.08);
}

.member-role {
  color: #c4b5fd;
  font-weight: 500;
}

.member-date {
  color: #a899c2;
  font-size: 0.875rem;
  opacity: 0.8;
}

.albums-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.album-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.album-item:hover {
  background: rgba(124,58,237,0.08);
}

.album-date {
  color: #a899c2;
  font-size: 0.875rem;
  opacity: 0.8;
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.genre-tag {
  background: rgba(124,58,237,0.12);
  color: #ddd6fe;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.genre-tag:hover {
  background: rgba(124,58,237,0.16);
}

.genre-tag {
  background: rgba(124,58,237,0.12);
  color: #f5eefb;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
}

.related-items {
  margin: 32px 0;
  padding: 24px;
  background: rgba(124,58,237,0.06);
  border-radius: 12px;
  border: 1px solid rgba(124,58,237,0.16);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.related-items h3 {
  margin-bottom: 16px;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.related-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-link {
  color: #ffffff;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(124,58,237,0.08);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.related-link:hover {
  background: rgba(124,58,237,0.12);
  transform: translateX(4px);
  text-decoration: none;
}

.reviews-section {
  margin-top: 48px;
  background: rgba(124,58,237,0.03);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(124,58,237,0.1);
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(124,58,237,0.12);
}

.reviews-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 600;
}

.media-filter {
  padding: 8px 16px;
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px;
  background: rgba(124,58,237,0.1);
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.media-filter:hover {
  background: rgba(124,58,237,0.15);
  border-color: rgba(124,58,237,0.25);
}

.review-form-container {
  background: rgba(124,58,237,0.06);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
  border: 1px solid rgba(124,58,237,0.16);
  margin-top: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.review-form-container h3 {
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.auth-prompt {
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.16);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  text-align: center;
  color: #ffffff;
}

.auth-prompt a {
  color: #c4b5fd;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.auth-prompt a:hover {
  color: #ddd6fe;
  text-decoration: none;
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