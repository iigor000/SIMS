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
<StarRating :rating="review.rating" :readonly="true" :show-value="true" size="small" />
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
  background: rgba(124,58,237,0.03);
  border: 1px solid rgba(124,58,237,0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.review-card.editor-review {
  border-left: 4px solid rgba(124,58,237,0.6);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(124,58,237,0.2);
  color: #ddd6fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  border: 1px solid rgba(124,58,237,0.3);
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #ddd6fe;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-badge {
  background: rgba(124,58,237,0.2);
  color: #ddd6fe;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid rgba(124,58,237,0.3);
  font-weight: 500;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.media-badge {
  background: rgba(124,58,237,0.1);
  color: #ddd6fe;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  border: 1px solid rgba(124,58,237,0.2);
}

.date {
  color: #c4b5fd;
  font-size: 0.85rem;
  opacity: 0.8;
}

.review-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.2);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  color: #ddd6fe;
}

.action-btn:hover {
  background: rgba(124,58,237,0.15);
  transform: translateY(-1px);
}

.delete-btn:hover {
  background: rgba(239,68,68,0.15);
  border-color: rgba(239,68,68,0.2);
  color: #fca5a5;
}

.review-content {
  margin-bottom: 18px;
}

.review-title {
  margin: 0 0 12px 0;
  color: #ddd6fe;
  font-size: 1.15rem;
  font-weight: 600;
}

.review-text {
  margin: 0;
  color: #c4b5fd;
  line-height: 1.7;
  white-space: pre-wrap;
  opacity: 0.95;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(124,58,237,0.1);
}

.language-tag {
  background: rgba(124,58,237,0.1);
  color: #ddd6fe;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  border: 1px solid rgba(124,58,237,0.2);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(234,179,8,0.1);
  color: #fde68a;
  border: 1px solid rgba(234,179,8,0.2);
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