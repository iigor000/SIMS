<template>
  <div class="pending-reviews">
    <div class="section-header">
      <h2>Recenzije na čekanju</h2>
      <span class="count-badge">{{ pendingReviews.length }}</span>
    </div>

    <div v-if="loading" class="loading">
      <p>Učitavanje...</p>
    </div>

    <div v-else-if="pendingReviews.length === 0" class="empty">
      <p>🎉 Nema recenzija za pregled!</p>
    </div>

    <div v-else class="reviews-grid">
      <div 
        v-for="review in pendingReviews" 
        :key="review.id"
        class="pending-review-card"
      >
        <div class="review-preview">
          <div class="review-header">
            <h4>
              <router-link :to="`/item/${review.itemType}/${review.itemId}`" class="item-link">
                {{ review.itemName }}
              </router-link>
            </h4>
            <div class="rating-badge">{{ review.rating }}⭐</div>
          </div>
          
          <div class="review-content">
            <div class="review-text">{{ review.reviewText || 'Bez teksta' }}</div>
            
            <div class="review-meta">
              <div class="meta-group">
                <span class="meta-label">Korisnik:</span>
                <span class="meta-value">{{ review.userDisplayName }}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">Format:</span>
                <span class="meta-value">{{ review.mediaType || 'Nije navedeno' }}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">Datum:</span>
                <span class="meta-value">{{ formatDate(review.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <button 
            @click="$emit('approve', review.id)"
            class="quick-btn approve"
            title="Odobri"
          >
            <span class="btn-icon">✓</span>
            <span class="btn-text">Odobri</span>
          </button>
          <button 
            @click="$emit('reject', review.id)"
            class="quick-btn reject"
            title="Odbij"
          >
            <span class="btn-icon">✕</span>
            <span class="btn-text">Odbij</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pendingReviews: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['approve', 'reject', 'view'])

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznato'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('sr-RS')
}
</script>

<style scoped>
.pending-reviews {
  background: rgba(124,58,237,0.03);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(124,58,237,0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(124,58,237,0.1);
}

.section-header h2 {
  margin: 0;
  color: #efe6ff;
  font-size: 1.75rem;
  font-weight: 600;
}

.count-badge {
  background: rgba(124,58,237,0.2);
  color: #ddd6fe;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #ddd6fe;
  font-size: 1.1rem;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.pending-review-card {
  background: rgba(124,58,237,0.06);
  border: 1px solid rgba(124,58,237,0.16);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
}

.pending-review-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.review-preview {
  flex: 1;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.review-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.item-link {
  color: #c4b5fd;
  text-decoration: none;
  transition: color 0.2s;
}

.item-link:hover {
  color: #ddd6fe;
}

.rating-badge {
  background: rgba(124,58,237,0.2);
  color: #ddd6fe;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-text {
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(124,58,237,0.1);
}

.review-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px;
  background: rgba(124,58,237,0.04);
  border-radius: 8px;
}

.meta-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  color: #c4b5fd;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  color: #e2e8f0;
  font-size: 0.95rem;
}

.quick-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(124,58,237,0.1);
}

.quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.2);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  color: #ddd6fe;
  transition: all 0.2s ease;
}

.quick-btn.approve {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.quick-btn.approve:hover {
  background: rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}

.quick-btn.reject {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.quick-btn.reject:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-text {
  font-weight: 500;
}
</style>