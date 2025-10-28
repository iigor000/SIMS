<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '@/firebase/config'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { user, userRole } = useAuth()

// Item data
const item = ref(null)
const loading = ref(true)
const error = ref(null)

// Get item type and ID from route params
const itemType = computed(() => route.params.type) // 'song', 'artist', 'band', 'performance', 'album'
const itemId = computed(() => route.params.id)

// Fetch item data from Firebase
const fetchItem = async () => {
  loading.value = true
  error.value = null
  
  try {
    const itemRef = dbRef(db, `items/${itemType.value}/${itemId.value}`)
    const snapshot = await get(itemRef)
    
    if (snapshot.exists()) {
      item.value = {
        id: itemId.value,
        type: itemType.value,
        ...snapshot.val()
      }
    } else {
      error.value = 'Item not found'
    }
  } catch (err) {
    console.error('Error fetching item:', err)
    error.value = 'Failed to load item'
  } finally {
    loading.value = false
  }
}

// Computed properties for different sections
const hasImages = computed(() => item.value?.images && item.value.images.length > 0)
const hasMembers = computed(() => item.value?.members && item.value.members.length > 0)
const hasSongs = computed(() => item.value?.songs && item.value.songs.length > 0)
const hasGenres = computed(() => item.value?.genres && item.value.genres.length > 0)

// Format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Navigation helpers
const goToRelatedItem = (type, id) => {
  router.push({ name: 'item', params: { type, id } })
}

const goBack = () => {
  router.back()
}

// Can user edit?
const canEdit = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'editor'
})

const editItem = () => {
  router.push({ name: 'edit-item', params: { type: itemType.value, id: itemId.value } })
}


onMounted(() => {
  fetchItem()
})

import { watch } from 'vue'
watch(
  () => [route.params.type, route.params.id],
  () => {
    fetchItem()
  }
)
</script>

<template>
  <div class="item-view">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="btn-secondary">Go Back</button>
    </div>

    <!-- Item Content -->
    <div v-else-if="item" class="item-content">
      <!-- Header Section -->
      <header class="item-header">
        <div class="header-top">
          <button @click="goBack" class="btn-back">← Back</button>
          <span class="item-type-badge">{{ item.type }}</span>
          <button v-if="canEdit" @click="editItem" class="btn-edit">Edit</button>
        </div>
        
        <h1 class="item-title">{{ item.name }}</h1>
        
        <div class="item-meta">
          <span v-if="item.postedDate" class="meta-item">
            📅 Posted: {{ formatDate(item.postedDate) }}
          </span>
          <span v-if="item.postedBy" class="meta-item">
            👤 By: {{ item.postedBy }}
          </span>
        </div>
      </header>

      <!-- Images Section -->
      <section v-if="hasImages" class="section images-section">
        <div class="image-gallery">
          <img 
            v-for="(image, index) in item.images" 
            :key="index"
            :src="image.url" 
            :alt="image.caption || item.name"
            class="gallery-image"
          />
        </div>
      </section>

      <!-- Description Section (Common to all types) -->
      <section v-if="item.description" class="section description-section">
        <h2>Description</h2>
        <p class="description-text">{{ item.description }}</p>
      </section>

      <!-- Type-Specific Sections -->
      
      <!-- SONG Specific -->
      <template v-if="item.type === 'song'">
        <section v-if="hasGenres" class="section">
          <h2>Genres</h2>
          <div class="tags">
            <span v-for="genre in item.genres" :key="genre" class="tag">{{ genre }}</span>
          </div>
        </section>

        <section v-if="item.duration" class="section">
          <h2>Duration</h2>
          <p>{{ item.duration }}</p>
        </section>

        <section v-if="item.songwriters?.length" class="section">
          <h2>Songwriters</h2>
          <ul class="list">
            <li v-for="songwriter in item.songwriters" :key="songwriter.id">
              <a href="#" @click.prevent="goToRelatedItem('artist', songwriter.id)" class="link">
                {{ songwriter.name }}
              </a>
            </li>
          </ul>
        </section>

        <section v-if="item.producers?.length" class="section">
          <h2>Producers</h2>
          <ul class="list">
            <li v-for="producer in item.producers" :key="producer.id">
              <a href="#" @click.prevent="goToRelatedItem('artist', producer.id)" class="link">
                {{ producer.name }}
              </a>
            </li>
          </ul>
        </section>

        <section v-if="item.album" class="section">
          <h2>Album</h2>
          <a href="#" @click.prevent="goToRelatedItem('album', item.album.id)" class="link">
            {{ item.album.name }}
          </a>
        </section>

        <section v-if="item.lyrics" class="section">
          <h2>Lyrics</h2>
          <pre class="lyrics">{{ item.lyrics }}</pre>
        </section>
      </template>

      <!-- ARTIST Specific -->
      <template v-if="item.type === 'artist'">
        <section v-if="item.birthDate" class="section">
          <h2>Born</h2>
          <p>{{ formatDate(item.birthDate) }}</p>
        </section>

        <section v-if="item.birthPlace" class="section">
          <h2>Birth Place</h2>
          <p>{{ item.birthPlace }}</p>
        </section>

        <section v-if="item.bands?.length" class="section">
          <h2>Bands</h2>
          <ul class="list">
            <li v-for="band in item.bands" :key="band.id">
              <a href="#" @click.prevent="goToRelatedItem('band', band.id)" class="link">
                {{ band.name }}
              </a>
            </li>
          </ul>
        </section>

        <section v-if="hasSongs" class="section">
          <h2>Songs</h2>
          <ul class="list">
            <li v-for="song in item.songs" :key="song.id">
              <a href="#" @click.prevent="goToRelatedItem('song', song.id)" class="link">
                {{ song.name }}
              </a>
            </li>
          </ul>
        </section>
      </template>

      <!-- BAND Specific -->
      <template v-if="item.type === 'band'">
        <section v-if="item.formedDate" class="section">
          <h2>Formed</h2>
          <p>{{ formatDate(item.formedDate) }}</p>
        </section>

        <section v-if="item.originCity" class="section">
          <h2>Origin</h2>
          <p>{{ item.originCity }}</p>
        </section>

        <section v-if="hasMembers" class="section">
          <h2>Members</h2>
          <ul class="list">
            <li v-for="member in item.members" :key="member.id" class="member-item">
              <a href="#" @click.prevent="goToRelatedItem('artist', member.id)" class="link">
                {{ member.name }}
              </a>
              <span v-if="member.role" class="member-role"> - {{ member.role }}</span>
              <span v-if="member.joinDate" class="member-date">
                ({{ formatDate(member.joinDate) }} - {{ member.leaveDate ? formatDate(member.leaveDate) : 'present' }})
              </span>
              <span v-else-if="member.leaveDate" class="member-date">
                ({{ formatDate(member.leaveDate) }})
              </span>
            </li>
          </ul>
        </section>

        <section v-if="hasGenres" class="section">
          <h2>Genres</h2>
          <div class="tags">
            <span v-for="genre in item.genres" :key="genre" class="tag">{{ genre }}</span>
          </div>
        </section>

        <section v-if="item.albums?.length" class="section">
          <h2>Albums</h2>
          <ul class="list">
            <li v-for="album in item.albums" :key="album.id">
              <a href="#" @click.prevent="goToRelatedItem('album', album.id)" class="link">
                {{ album.name }}
              </a>
              <span v-if="album.releaseDate"> - {{ formatDate(album.releaseDate) }}</span>
            </li>
          </ul>
        </section>
      </template>

      <!-- ALBUM Specific -->
      <template v-if="item.type === 'album'">
        <section v-if="item.releaseDate" class="section">
          <h2>Release Date</h2>
          <p>{{ formatDate(item.releaseDate) }}</p>
        </section>

        <section v-if="item.artist" class="section">
          <h2>Artist</h2>
          <a href="#" @click.prevent="goToRelatedItem(item.artist.type || 'artist', item.artist.id)" class="link">
            {{ item.artist.name }}
          </a>
        </section>

        <section v-if="hasGenres" class="section">
          <h2>Genres</h2>
          <div class="tags">
            <span v-for="genre in item.genres" :key="genre" class="tag">{{ genre }}</span>
          </div>
        </section>

        <section v-if="item.label" class="section">
          <h2>Record Label</h2>
          <p>{{ item.label }}</p>
        </section>

        <section v-if="hasSongs" class="section">
          <h2>Tracklist</h2>
          <ol class="tracklist">
            <li v-for="song in item.songs" :key="song.id" class="track-item">
              <a href="#" @click.prevent="goToRelatedItem('song', song.id)" class="link">
                {{ song.name }}
              </a>
              <span v-if="song.duration" class="track-duration">{{ song.duration }}</span>
            </li>
          </ol>
        </section>
      </template>

      <!-- PERFORMANCE Specific -->
      <template v-if="item.type === 'performance'">
        <section v-if="item.performanceDate" class="section">
          <h2>Date</h2>
          <p>{{ formatDate(item.performanceDate) }}</p>
        </section>

        <section v-if="item.location" class="section">
          <h2>Location</h2>
          <p class="location">
            <span class="location-name">{{ item.location.venue }}</span>
            <span v-if="item.location.city" class="location-city">{{ item.location.city }}</span>
            <span v-if="item.location.country" class="location-country">{{ item.location.country }}</span>
            <span v-if="item.location.address" class="location-address">{{ item.location.address }}</span>
          </p>
        </section>

        <section v-if="item.performers?.length" class="section">
          <h2>Performers</h2>
          <ul class="list">
            <li v-for="performer in item.performers" :key="performer.id">
              <a href="#" @click.prevent="goToRelatedItem(performer.type || 'artist', performer.id)" class="link">
                {{ performer.name }}
              </a>
            </li>
          </ul>
        </section>

        <section v-if="item.setlist?.length" class="section">
          <h2>Setlist</h2>
          <ol class="list">
            <li v-for="song in item.setlist" :key="song.id">
              <a href="#" @click.prevent="goToRelatedItem('song', song.id)" class="link">
                {{ song.name }}
              </a>
            </li>
          </ol>
        </section>

        <section v-if="item.ticketPrice" class="section">
          <h2>Ticket Price</h2>
          <p>{{ item.ticketPrice }}</p>
        </section>

        <section v-if="item.attendance" class="section">
          <h2>Attendance</h2>
          <p>{{ item.attendance }} people</p>
        </section>
      </template>

      <!-- Additional Info Section (Common) -->
      <section v-if="item.additionalInfo" class="section">
        <h2>Additional Information</h2>
        <p>{{ item.additionalInfo }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.item-view {
  max-width: 2600px;
  margin: 0 auto;
  padding: 2rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.error h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.item-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header Section */
.item-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.item-type-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.btn-edit {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-edit:hover {
  background: #059669;
}

.item-title {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.item-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Images Section */
.images-section {
  padding: 0 !important;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 2rem;
}

.gallery-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  transition: transform 0.3s;
}

.gallery-image:hover {
  transform: scale(1.02);
}

/* Sections */
.section {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.section:last-child {
  border-bottom: none;
}

.section h2 {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.section p {
    color: #4b5563;
    line-height: 1.6;
}

.section span {
    color: #4b5563;
    line-height: 1.6;
}

.description-text {
  line-height: 1.8;
  color: #4b5563;
  font-size: 1.05rem;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Lists */
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.list li:last-child {
  border-bottom: none;
}

.link {
  color: #4f46e5;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s;
  font-weight: 500;
}

.link:hover {
  color: #6366f1;
  text-decoration: underline;
}

/* Member specific */
.member-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-role {
  color: #6b7280;
  font-style: italic;
}

.member-date {
  color: #9ca3af;
  font-size: 0.9rem;
}

/* Tracklist */
.tracklist {
  list-style: decimal;
  padding-left: 2rem;
  margin: 0;
}

.track-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-duration {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Location */
.location {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.location-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.location-city, .location-country {
  color: #4b5563;
}

.location-address {
  color: #6b7280;
  font-size: 0.95rem;
}

/* Lyrics */
.lyrics {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #4b5563;
  font-family: 'Georgia', serif;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

/* Buttons */
.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 768px) {
  .item-view {
    padding: 1rem;
  }

  .item-title {
    font-size: 1.8rem;
  }

  .item-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-gallery {
    grid-template-columns: 1fr;
  }

  .header-top {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
