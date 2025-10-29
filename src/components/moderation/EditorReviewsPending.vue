<template>
  <div class="editor-reviews-pending">
    <div class="section-header">
      <h2>Editor recenzije na čekanju</h2>
      <span class="count-badge">{{ editorReviews.length }}</span>
    </div>

    <div v-if="loading" class="loading">
      <p>Učitavanje...</p>
    </div>

    <div v-else-if="editorReviews.length === 0" class="empty">
      <p>🎉 Nema editor recenzija za pregled!</p>
    </div>

    <div v-else class="reviews-grid">
      <div 
        v-for="review in editorReviews" 
        :key="review.id"
        class="editor-review-card"
      >
        <div class="review-preview">
          <div class="review-header">
            <h4>{{ review.itemName }}</h4>
            <span class="editor-badge">Editor</span>
          </div>
          
          <p class="review-excerpt">
            {{ review.reviewText?.substring(0, 150) || 'Bez teksta' }}
            <span v-if="review.reviewText?.length > 150">...</span>
          </p>
          
          <div class="review-meta">
            <span class="user">👤 {{ review.userDisplayName }}</span>
            <span class="rating">⭐ {{ review.rating }}/5</span>
            <span class="media-type">📀 {{ formatMediaType(review.mediaType) }}</span>
            <span class="date">📅 {{ formatDate(review.createdAt) }}</span>
          </div>
        </div>
        
        <div class="quick-actions">
          <button 
            @click="$emit('approve', review.id)"
            class="quick-btn approve"
            title="Odobri recenziju"
          >
            ✅ Odobri
          </button>
          <button 
            @click="$emit('reject', review.id)"
            class="quick-btn reject"
            title="Odbij recenziju"
          >
            ❌ Odbij
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  editorReviews: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['approve', 'reject'])

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznato'
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return date.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatMediaType = (type) => {
  const types = {
    cd: 'CD',
    vinyl: 'Vinyl',
    digital: 'Digital',
    youtube: 'YouTube',
    streaming: 'Streaming'
  }
  return types[type] || type
}
</script>

<style scoped>
.editor-reviews-pending {
  padding: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #333;
  font-size: 1.8rem;
  margin: 0;
}

.count-badge {
  background: #ff9800;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.reviews-grid {
  display: grid;
  gap: 1.5rem;
}

.editor-review-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.editor-review-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.15);
  transform: translateY(-2px);
}

.review-preview {
  margin-bottom: 1rem;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.review-header h4 {
  color: #333;
  font-size: 1.2rem;
  margin: 0;
  flex: 1;
}

.editor-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.review-excerpt {
  color: #555;
  line-height: 1.6;
  margin: 0.75rem 0;
  font-size: 1rem;
}

.review-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.review-meta span {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user {
  font-weight: 600;
  color: #333;
}

.rating {
  color: #ff9800;
  font-weight: 600;
}

.media-type {
  color: #2196F3;
}

.date {
  color: #888;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.quick-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.quick-btn.approve {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.quick-btn.approve:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.quick-btn.reject {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.quick-btn.reject:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.quick-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .editor-reviews-pending {
    padding: 1rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }

  .review-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-actions {
    flex-direction: column;
  }
}
</style>