<template>
  <div class="star-rating">
    <span 
      v-for="star in 5" 
      :key="star" 
      class="star"
      :class="{
        'active': star <= displayRating,
        'half': star - 0.5 === displayRating && allowHalfStars
      }"
      @click="setRating(star)"
      @mouseover="hoverRating = star"
      @mouseleave="hoverRating = null"
    >
      {{ getStarSymbol(star) }}
    </span>
    <span v-if="showValue" class="rating-value">
      {{ displayRating.toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  readonly: {
    type: Boolean,
    default: false
  },
  allowHalfStars: {
    type: Boolean,
    default: true
  },
  showValue: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium' // 'small', 'medium', 'large'
  }
})

const emit = defineEmits(['update:modelValue'])

const hoverRating = ref(null)

const displayRating = computed(() => {
  return hoverRating.value || props.modelValue
})

const getStarSymbol = (star) => {
  if (star <= displayRating.value) {
    return '★'
  } else if (star - 0.5 === displayRating.value && props.allowHalfStars) {
    return '⯨' // Half star
  } else {
    return '☆'
  }
}

const setRating = (rating) => {
  if (!props.readonly) {
    emit('update:modelValue', rating)
  }
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.star {
  cursor: v-bind('readonly ? "default" : "pointer"');
  color: #ddd;
  font-size: v-bind('size === "small" ? "1.2rem" : size === "large" ? "2rem" : "1.5rem"');
  transition: color 0.2s ease;
  user-select: none;
}

.star.active {
  color: #ffc107;
}

.star.half {
  color: #ffc107;
  position: relative;
}

.star.half::before {
  content: '★';
  position: absolute;
  left: 0;
  width: 50%;
  overflow: hidden;
  color: #ffc107;
}

.rating-value {
  margin-left: 8px;
  font-weight: bold;
  color: #666;
  font-size: 0.9rem;
}

/* Hover effects for interactive ratings */
.star-rating:not(.readonly) .star:hover,
.star-rating:not(.readonly) .star:hover ~ .star {
  color: #ffc107;
}
</style>