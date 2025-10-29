<template>
  <div class="review-card" :class="{ 'editor-review': review.userRole === 'editor' }">
    <!-- Review Header -->
    <div class="review-header">
      <div class="user-info">
        <div class="user-avatar">
          {{ review.userDisplayName?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div class="user-details">
          <div class="user-name">
            {{ review.userDisplayName }}
            <span v-if="review.userRole === 'editor'" class="editor-badge">Editor</span>
          </div>
          <div class="review-meta">
<StarRating v-model="review.rating" :readonly="true" :show-value="true" size="small" />
            <span class="media-badge">{{ getMediaTypeLabel(review.mediaType) }}</span>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions (for user's own reviews or moderators) -->
      <div v-if="showActions" class="review-actions">
        <button 
          v-if="canDelete" 
          @click="deleteReview"
          class="action-btn delete-btn"
          title="Obriši recenziju"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Review Content -->
    <div class="review-content">
      <h4 class="review-title">{{ review.title }}</h4>
      <p class="review-text">{{ review.reviewText }}</p>
    </div>

    <!-- Review Footer -->
    <div class="review-footer">
      <span class="language-tag">{{ getLanguageLabel(review.language) }}</span>
      <div v-if="review.status === 'pending'" class="status-badge pending">
        ⏳ Na čekanju
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import StarRating from './StarRaiting.vue'

const props = defineProps({
  review: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  },
  showModeration: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])

const userStore = useUserStore()

// Media type labels
const mediaTypeLabels = {
  cd: 'CD',
  vinyl: 'Vinyl',
  cassette: 'Kasetа',
  digital: 'Digitalno',
  youtube: 'YouTube',
  streaming: 'Streaming'
}

// Language labels
const languageLabels = {
  sr: 'Srpski',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français'
}

const showActions = computed(() => {
  return props.editable || props.showModeration
})

const canEdit = computed(() => {
  if (!userStore.user) return false
  return props.editable && userStore.user.uid === props.review.userId
})

const canDelete = computed(() => {
  if (!userStore.user) return false
  return (props.editable && userStore.user.uid === props.review.userId) || 
         userStore.userData?.role === 'admin'
})

const getMediaTypeLabel = (mediaType) => {
  return mediaTypeLabels[mediaType] || mediaType
}

const getLanguageLabel = (language) => {
  return languageLabels[language] || language
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Nepoznato'
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('sr-RS', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const editReview = () => {
  emit('edit', props.review)
}

const deleteReview = () => {
  if (confirm('Da li ste sigurni da želite da obrišete ovu recenziju?')) {
    emit('delete', props.review.id)
  }
}
</script>

<style scoped>
.review-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}

.review-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-card.editor-review {
  border-left: 4px solid #007bff;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.media-badge {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.date {
  color: #666;
  font-size: 0.8rem;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 1.1rem;
}

.action-btn:hover {
  background: #f8f9fa;
}

.delete-btn:hover {
  background: #f8d7da;
}

.review-content {
  margin-bottom: 15px;
}

.review-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.review-text {
  margin: 0;
  color: #555;
  line-height: 1.5;
  white-space: pre-wrap;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.language-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

/* Responsive */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .review-actions {
    align-self: flex-end;
  }
  
  .review-meta {
    gap: 8px;
  }
}
</style>