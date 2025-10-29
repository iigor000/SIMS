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
            :class="{ active: star <= form.rating }"
            @click="form.rating = star"
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
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.star-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}

.star-button:hover,
.star-button.active {
  color: #ffd700;
}

.rating-value {
  margin-left: 10px;
  font-weight: bold;
  color: #333;
}

select,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

select:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
}

.submit-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.submit-button:hover:not(:disabled) {
  background: #0056b3;
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #ef5350;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 4px;
  margin-top: 15px;
  border: 1px solid #66bb6a;
  text-align: center;
}
</style>