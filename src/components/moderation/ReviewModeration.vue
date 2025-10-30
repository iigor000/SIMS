<template>
  <div class="review-moderation">
    <!-- Header with Stats -->
    <div class="moderation-header">
      <h1>Moderacija Recenzija</h1>
      <div class="moderation-stats">
        <div class="stat-card">
          <div class="stat-number">{{ stats.pendingCount }}</div>
          <div class="stat-label">Na čekanju</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.approvedToday }}</div>
          <div class="stat-label">Odobreno danas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.rejectedToday }}</div>
          <div class="stat-label">Odbijeno danas</div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="moderation-controls">
      <div class="search-filter">
        <input 
          v-model="searchTerm"
          type="text" 
          placeholder="Pretraži recenzije..."
          class="search-input"
        >
        <select v-model="selectedItemType" class="type-filter">
          <option value="">Svi tipovi</option>
          <option value="album">Album</option>
          <option value="song">Pesma</option>
          <option value="artist">Izvođač</option>
          <option value="band">Bend</option>
          <option value="performance">Nastup</option>
        </select>
        <button @click="refreshReviews" class="refresh-btn">
          🔄 Osveži
        </button>
      </div>

      <div class="bulk-actions" v-if="selectedReviews.length > 0">
        <span class="selected-count">
          Izabrano: {{ selectedReviews.length }}
        </span>
        <button 
          @click="bulkApprove"
          class="bulk-btn approve-btn"
          :disabled="bulkLoading"
        >
          ✅ Odobri izabrane
        </button>
        <button 
          @click="showRejectModal = true"
          class="bulk-btn reject-btn"
          :disabled="bulkLoading"
        >
          ❌ Odbij izabrane
        </button>
        <button 
          @click="clearSelection"
          class="bulk-btn clear-btn"
        >
          ❌ Poništi izbor
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Učitavanje recenzija za moderaciju...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredReviews.length === 0" class="empty-state">
      <p>🎉 Nema recenzija za moderaciju!</p>
      <p class="subtext">Sve recenzije su obrađene.</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-moderation-list">
      <div 
        v-for="review in filteredReviews" 
        :key="review.id"
        class="moderation-review-item"
        :class="{ 'selected': selectedReviews.includes(review.id) }"
      >
        <!-- Selection Checkbox -->
        <div class="selection-checkbox">
          <input 
            type="checkbox" 
            :id="`review-${review.id}`"
            :checked="selectedReviews.includes(review.id)"
            @change="toggleReviewSelection(review.id)"
          >
        </div>

        <!-- Review Content -->
        <div class="review-content">
          <div class="review-header">
            <div class="item-info">
              <h4 class="item-name">{{ review.itemName }}</h4>
              <div class="item-meta">
                <span class="item-type">{{ getItemTypeLabel(review.itemType) }}</span>
                <span class="media-type">{{ getMediaTypeLabel(review.mediaType) }}</span>
              </div>
            </div>
            <div class="rating-info">
              <StarRating :rating="review.rating" :readonly="true" size="small" />
              <span class="rating-value">{{ review.rating }}/5</span>
            </div>
          </div>

          <div class="review-details">
            <h5 class="review-title">{{ review.title }}</h5>
            <p class="review-text">{{ review.reviewText }}</p>
          </div>

          <div class="user-info">
            <div class="user-details">
              <strong>{{ review.userDisplayName }}</strong>
              <span class="user-email">({{ review.userEmail }})</span>
              <span class="user-role" :class="review.userRole">{{ review.userRole }}</span>
            </div>
            <div class="review-date">
              {{ formatDate(review.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="review-actions">
          <button 
            @click="approveSingleReview(review.id)"
            class="action-btn approve-btn"
            :disabled="singleActionLoading"
            title="Odobri recenziju"
          >
            ✅ Odobri
          </button>
          <button 
            @click="rejectSingleReview(review.id)"
            class="action-btn reject-btn"
            :disabled="singleActionLoading"
            title="Odbij recenziju"
          >
            ❌ Odbij
          </button>
          <button 
            @click="viewReviewDetails(review)"
            class="action-btn details-btn"
            title="Pogledaj detalje"
          >
            👁️ Detalji
          </button>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMoreReviews" class="load-more-btn">
        Učitaj još recenzija
      </button>
    </div>

    <!-- Reject Reason Modal -->
    <div v-if="showRejectModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Odbijanje recenzija</h3>
        <p>Unesite razlog odbijanja za {{ selectedReviews.length }} recenzija:</p>
        <textarea 
          v-model="rejectReason"
          placeholder="Razlog odbijanja..."
          rows="4"
          class="reject-reason-input"
        ></textarea>
        <div class="modal-actions">
          <button 
            @click="bulkReject"
            class="confirm-btn"
            :disabled="!rejectReason.trim() || bulkLoading"
          >
            {{ bulkLoading ? 'Odbijanje...' : 'Potvrdi odbijanje' }}
          </button>
          <button 
            @click="cancelReject"
            class="cancel-btn"
          >
            Otkaži
          </button>
        </div>
      </div>
    </div>

    <!-- Review Details Modal -->
    <div v-if="selectedReview" class="modal-overlay">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>Detalji recenzije</h3>
          <button @click="closeReviewDetails" class="close-btn">×</button>
        </div>
        
        <div class="review-details-modal">
          <div class="detail-section">
            <h4>Informacije o itemu</h4>
            <p><strong>Naziv:</strong> {{ selectedReview.itemName }}</p>
            <p><strong>Tip:</strong> {{ getItemTypeLabel(selectedReview.itemType) }}</p>
            <p><strong>Medijum:</strong> {{ getMediaTypeLabel(selectedReview.mediaType) }}</p>
          </div>

          <div class="detail-section">
            <h4>Recenzija</h4>
            <p><strong>Ocena:</strong> {{ selectedReview.rating }}/5</p>
            <p><strong>Naslov:</strong> {{ selectedReview.title }}</p>
            <p><strong>Tekst:</strong></p>
            <div class="review-text-content">
              {{ selectedReview.reviewText }}
            </div>
          </div>

          <div class="detail-section">
            <h4>Korisnik</h4>
            <p><strong>Ime:</strong> {{ selectedReview.userDisplayName }}</p>
            <p><strong>Email:</strong> {{ selectedReview.userEmail }}</p>
            <p><strong>Uloga:</strong> {{ selectedReview.userRole }}</p>
            <p><strong>Datum:</strong> {{ formatDate(selectedReview.createdAt) }}</p>
          </div>
        </div>

        <div class="modal-actions">
          <button 
            @click="approveSingleReview(selectedReview.id)"
            class="action-btn approve-btn"
          >
            ✅ Odobri
          </button>
          <button 
            @click="rejectSingleReview(selectedReview.id)"
            class="action-btn reject-btn"
          >
            ❌ Odbij
          </button>
          <button 
            @click="closeReviewDetails"
            class="action-btn cancel-btn"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useModeration } from '@/composables/useModeration'
import { useUserStore } from '@/stores/user'
import StarRating from '@/components/reviews/StarRaiting.vue'

const userStore = useUserStore()
const {
  pendingReviews,
  moderationLoading,
  moderationStats,
  loadPendingReviews,
  bulkApproveReviews,
  bulkRejectReviews,
  searchPendingReviews,
  filterByItemType
} = useModeration()

// Local state
const selectedReviews = ref([])
const searchTerm = ref('')
const selectedItemType = ref('')
const showRejectModal = ref(false)
const rejectReason = ref('')
const selectedReview = ref(null)
const bulkLoading = ref(false)
const singleActionLoading = ref(false)

// Computed
const filteredReviews = computed(() => {
  let filtered = pendingReviews.value

  // Apply search filter
  if (searchTerm.value) {
    filtered = filtered.filter(review => 
      review.itemName?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      review.userDisplayName?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      review.reviewText?.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  }

  // Apply item type filter
  if (selectedItemType.value) {
    filtered = filtered.filter(review => review.itemType === selectedItemType.value)
  }

  return filtered
})

const stats = computed(() => moderationStats.value)
const loading = computed(() => moderationLoading.value)
const hasMore = computed(() => filteredReviews.value.length >= 50) // Simplified

// Methods
const loadMoreReviews = async () => {
  // Implementation for pagination would go here
  await loadPendingReviews()
}

const refreshReviews = async () => {
  selectedReviews.value = []
  searchTerm.value = ''
  selectedItemType.value = ''
  await loadPendingReviews()
}

const toggleReviewSelection = (reviewId) => {
  const index = selectedReviews.value.indexOf(reviewId)
  if (index > -1) {
    selectedReviews.value.splice(index, 1)
  } else {
    selectedReviews.value.push(reviewId)
  }
}

const clearSelection = () => {
  selectedReviews.value = []
}

const bulkApprove = async () => {
  if (selectedReviews.value.length === 0) return

  bulkLoading.value = true
  try {
    const results = await bulkApproveReviews(selectedReviews.value)
    showBulkResults(results, 'odobrene')
    selectedReviews.value = []
  } catch (error) {
    alert('Greška pri odobravanju recenzija: ' + error.message)
  } finally {
    bulkLoading.value = false
  }
}

const bulkReject = async () => {
  if (selectedReviews.value.length === 0) return

  bulkLoading.value = true
  try {
    const results = await bulkRejectReviews(selectedReviews.value, rejectReason.value)
    showBulkResults(results, 'odbijene')
    selectedReviews.value = []
    cancelReject()
  } catch (error) {
    alert('Greška pri odbijanju recenzija: ' + error.message)
  } finally {
    bulkLoading.value = false
  }
}

const showBulkResults = (results, action) => {
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  
  if (errorCount === 0) {
    alert(`Uspešno ${action} ${successCount} recenzija.`)
  } else {
    alert(`Uspešno ${action} ${successCount} recenzija. ${errorCount} nije uspelo.`)
  }
}

const cancelReject = () => {
  showRejectModal.value = false
  rejectReason.value = ''
}

const approveSingleReview = async (reviewId) => {
  singleActionLoading.value = true
  try {
    await bulkApproveReviews([reviewId])
    // Remove from selected if it was selected
    const index = selectedReviews.value.indexOf(reviewId)
    if (index > -1) {
      selectedReviews.value.splice(index, 1)
    }
  } catch (error) {
    alert('Greška pri odobravanju recenzije: ' + error.message)
  } finally {
    singleActionLoading.value = false
  }
}

const rejectSingleReview = async (reviewId) => {
  const reason = prompt('Unesite razlog odbijanja:')
  if (reason === null) return // User cancelled

  singleActionLoading.value = true
  try {
    await bulkRejectReviews([reviewId], reason)
    // Remove from selected if it was selected
    const index = selectedReviews.value.indexOf(reviewId)
    if (index > -1) {
      selectedReviews.value.splice(index, 1)
    }
  } catch (error) {
    alert('Greška pri odbijanju recenzije: ' + error.message)
  } finally {
    singleActionLoading.value = false
  }
}

const viewReviewDetails = (review) => {
  selectedReview.value = review
}

const closeReviewDetails = () => {
  selectedReview.value = null
}

const getItemTypeLabel = (type) => {
  const labels = {
    album: 'Album',
    song: 'Pesma',
    artist: 'Izvođač',
    band: 'Bend',
    performance: 'Nastup'
  }
  return labels[type] || type
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

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznato'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('sr-RS', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch for search term changes
import { watch } from 'vue'
watch(searchTerm, async (newSearch) => {
  if (newSearch) {
    await searchPendingReviews(newSearch)
  } else {
    await loadPendingReviews()
  }
})

watch(selectedItemType, async (newType) => {
  if (newType) {
    await filterByItemType(newType)
  } else {
    await loadPendingReviews()
  }
})

// Lifecycle
onMounted(async () => {
  await loadPendingReviews()
})
</script>

<style scoped>
.review-moderation {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.moderation-header {
  margin-bottom: 30px;
}

.moderation-header h1 {
  margin: 0 0 20px 0;
  color: #333;
}

.moderation-stats {
  display: flex;
  gap: 20px;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  min-width: 120px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
}

.moderation-controls {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.search-filter {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.type-filter {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.refresh-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.selected-count {
  font-weight: 600;
  color: #007bff;
}

.bulk-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.clear-btn {
  background: #6c757d;
  color: white;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.empty-state .subtext {
  color: #666;
  margin-top: 8px;
}

.reviews-moderation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moderation-review-item {
  display: flex;
  background: white;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
  gap: 15px;
}

.moderation-review-item.selected {
  border-color: #007bff;
  background: #f8f9fa;
}

.selection-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.review-content {
  flex: 1;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
}

.item-type, .media-type {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-value {
  font-weight: 600;
  color: #ffc107;
}

.review-details {
  margin-bottom: 15px;
}

.review-title {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.review-text {
  margin: 0;
  color: #555;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-role {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.user-role.editor {
  background: #e3f2fd;
  color: #1976d2;
}

.user-role.user {
  background: #f3e5f5;
  color: #7b1fa2;
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.approve-btn {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.action-btn.approve-btn:hover:not(:disabled) {
  background: #c3e6cb;
}

.action-btn.reject-btn {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.action-btn.reject-btn:hover:not(:disabled) {
  background: #f5c6cb;
}

.action-btn.details-btn {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.action-btn.details-btn:hover:not(:disabled) {
  background: #d6d8db;
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
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.reject-reason-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 15px 0;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.confirm-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

/* Review Details Modal */
.review-details-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.detail-section p {
  margin: 8px 0;
  color: #555;
}

.review-text-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  white-space: pre-wrap;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .moderation-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-card {
    min-width: auto;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .bulk-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .moderation-review-item {
    flex-direction: column;
  }
  
  .review-actions {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>