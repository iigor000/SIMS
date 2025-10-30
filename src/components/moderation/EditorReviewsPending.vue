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
  background: rgba(124, 58, 237, 0.05);
  padding: 1rem 1.5rem;
  border-radius: 8px;
}

.section-header h2 {
  color: #ffffff;
  font-size: 1.8rem;
  margin: 0;
}

.count-badge {
  background: rgba(124, 58, 237, 0.3);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #ffffff;
  font-size: 1.1rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.reviews-grid {
  display: grid;
  gap: 1.5rem;
}

.editor-review-card {
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.05);
}

.editor-review-card:hover {
  border-color: rgba(124, 58, 237, 0.4);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
  transform: translateY(-2px);
  background: rgba(124, 58, 237, 0.15);
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
  color: #ffffff;
  font-size: 1.2rem;
  margin: 0;
  flex: 1;
}

.editor-badge {
  background: rgba(124, 58, 237, 0.3);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.review-excerpt {
  color: rgba(255, 255, 255, 0.9);
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.review-meta span {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user {
  font-weight: 600;
  color: #ffffff;
}

.rating {
  color: #ffffff;
  font-weight: 600;
}

.media-type {
  color: rgba(255, 255, 255, 0.9);
}

.date {
  color: rgba(255, 255, 255, 0.8);
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.quick-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
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
  background: rgba(124, 58, 237, 0.3);
  color: #ffffff;
}

.quick-btn.approve:hover {
  background: rgba(124, 58, 237, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
}

.quick-btn.reject {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(239, 68, 68, 1);
  border-color: rgba(239, 68, 68, 0.2);
}

.quick-btn.reject:hover {
  background: rgba(239, 68, 68, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
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