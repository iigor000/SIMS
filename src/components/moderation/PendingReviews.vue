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
          <h4>{{ review.itemName }}</h4>
<p class="review-excerpt">{{ review.reviewText?.substring(0, 100) || 'Bez teksta' }}...</p>
          <div class="review-meta">
            <span class="user">{{ review.userDisplayName }}</span>
            <span class="rating">{{ review.rating }}⭐</span>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>
        
        <div class="quick-actions">
          <button 
            @click="$emit('approve', review.id)"
            class="quick-btn approve"
            title="Odobri"
          >
            ✅
          </button>
          <button 
            @click="$emit('reject', review.id)"
            class="quick-btn reject"
            title="Odbij"
          >
            ❌
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
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.count-badge {
  background: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pending-review-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  transition: box-shadow 0.2s;
}

.pending-review-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-preview {
  flex: 1;
}

.review-preview h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1rem;
}

.review-excerpt {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.review-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #888;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.2s;
}

.quick-btn.approve:hover {
  background: #d4edda;
}

.quick-btn.reject:hover {
  background: #f8d7da;
}

.quick-btn.view:hover {
  background: #e2e3e5;
}
</style>