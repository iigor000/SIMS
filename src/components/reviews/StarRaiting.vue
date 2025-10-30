<template>
  <div class="star-rating">
    <span 
      v-for="star in 5" 
      :key="star" 
      class="star"
      :class="{ active: star <= rating }"
      @click="!readonly && setRating(star)"
    >★</span>
    <span v-if="showValue" class="rating-value">{{ rating.toFixed(1) }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  rating: {
    type: Number,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showValue: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium'
  }
})

const emit = defineEmits(['update:rating'])

const setRating = (newRating) => {
  if (!props.readonly) {
    emit('update:rating', newRating)
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
  font-size: v-bind('size === "small" ? "1.2rem" : size === "large" ? "2rem" : "1.5rem"');
  user-select: none;
  color: #ddd;
}

.star.active {
  color: #fde047 !important;
}
</style>