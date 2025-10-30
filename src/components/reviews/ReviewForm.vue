<template>
  <div class="review-form">
    <form @submit.prevent="handleSubmit">
      <!-- Rating -->
      <div class="form-group">
        <label for="rating">Ocena *</label>
        <div class="rating-input">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="star-button"
            :class="{ 
              active: star <= form.rating,
              hover: star <= hoverRating
            }"
            @click="form.rating = star"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
          >
            ★
          </button>
          <span class="rating-value">{{ form.rating }}/5</span>
        </div>
      </div>

      <!-- Media Type -->
      <div class="form-group">
        <label for="mediaType">Tip izdanja *</label>
        <select v-model="form.mediaType" id="mediaType" required>
          <option value="">Izaberi izdanje</option>
          <option value="cd">CD</option>
          <option value="vinyl">Vinyl</option>
          <option value="digital">Digital</option>
          <option value="youtube">YouTube</option>
          <option value="streaming">Streaming</option>
        </select>
      </div>

      <!-- Review Text -->
      <div class="form-group">
        <label for="reviewText">Tvoja recenzija (opciono)</label>
        <textarea
          v-model="form.reviewText"
          id="reviewText"
          rows="4"
          placeholder="Podeli svoje mišljenje..."
        ></textarea>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        class="submit-button"
        :disabled="loading || !form.rating || !form.mediaType"
      >
        {{ loading ? 'Šaljem...' : 'Objavi recenziju' }}
      </button>
    </form>

    <!-- Success Message -->
    <div v-if="showSuccess" class="success-message">
      ✅ Recenzija uspešno objavljena!
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useReviews } from '@/composables/useReviews'

const props = defineProps({
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['review-submitted'])

// Use composable
const { submitReview, loading, error } = useReviews()

// Form state
const form = reactive({
  rating: 0,
  mediaType: '',
  reviewText: ''
})

const showSuccess = ref(false)
const hoverRating = ref(0)

const handleSubmit = async () => {
  try {
    showSuccess.value = false

    const result = await submitReview({
      itemId: props.itemId,
      itemName: props.itemName,
      itemType: props.itemType,
      rating: form.rating,
      mediaType: form.mediaType,
      reviewText: form.reviewText
    })

    if (result.success) {
      // Show success message
      showSuccess.value = true

      // Reset form
      form.rating = 0
      form.mediaType = ''
      form.reviewText = ''

      // Emit event
      emit('review-submitted', result.review)

      // Hide success after 3s
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    }

  } catch (err) {
    console.error('Submit error:', err)
  }
}
</script>

<style scoped>
.review-form {
  width: 100%;
  background: rgba(124,58,237,0.03);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(124,58,237,0.1);
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #ddd6fe;
  letter-spacing: 0.5px;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(124,58,237,0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(124,58,237,0.15);
}

.star-button {
  background: none;
  border: none;
  font-size: 2.2rem;
  color: rgba(124,58,237,0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  position: relative;
}

.star-button.hover {
  color: rgba(253,224,71,0.7);
  transform: scale(1.05);
}

.star-button.active {
  color: #fde047;
  transform: scale(1.1);
}

.star-button:focus {
  outline: none;
}

.rating-value {
  margin-left: 12px;
  font-weight: bold;
  color: #ddd6fe;
  font-size: 1.1rem;
}

select,
textarea {
  width: 100%;
  padding: 12px;
  background: rgba(124,58,237,0.05);
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  color: #ddd6fe;
  transition: all 0.2s ease;
}

select:focus,
textarea:focus {
  outline: none;
  border-color: rgba(124,58,237,0.4);
  box-shadow: 0 0 0 2px rgba(124,58,237,0.1);
}

select option {
  background: #1a1a1a;
  color: #ddd6fe;
}

textarea::placeholder {
  color: #c4b5fd;
  opacity: 0.6;
}

.submit-button {
  background: rgba(124,58,237,0.8);
  color: white;
  border: 1px solid rgba(124,58,237,0.2);
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.submit-button:hover:not(:disabled) {
  background: rgba(124,58,237,0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  background: rgba(124,58,237,0.2);
  border-color: rgba(124,58,237,0.1);
  color: rgba(221,214,254,0.5);
  cursor: not-allowed;
}

.error-message {
  background: rgba(239,68,68,0.1);
  color: #fca5a5;
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 18px;
  border: 1px solid rgba(239,68,68,0.2);
  font-weight: 500;
}

.success-message {
  background: rgba(34,197,94,0.1);
  color: #86efac;
  padding: 14px;
  border-radius: 8px;
  margin-top: 18px;
  border: 1px solid rgba(34,197,94,0.2);
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>