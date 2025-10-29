<template>
  <div class="moderation-actions">
    <button 
      v-if="showApprove"
      @click="$emit('approve')"
      :disabled="loading"
      class="action-btn approve"
      :class="{ 'loading': loading }"
    >
      <span v-if="loading">⏳</span>
      <span v-else>✅</span>
      {{ approveText }}
    </button>

    <button 
      v-if="showReject"
      @click="$emit('reject')"
      :disabled="loading"
      class="action-btn reject"
      :class="{ 'loading': loading }"
    >
      <span v-if="loading">⏳</span>
      <span v-else>❌</span>
      {{ rejectText }}
    </button>

    <button 
      v-if="showView"
      @click="$emit('view')"
      class="action-btn view"
    >
      👁️
      {{ viewText }}
    </button>

    <button 
      v-if="showDelete"
      @click="$emit('delete')"
      :disabled="loading"
      class="action-btn delete"
      :class="{ 'loading': loading }"
    >
      <span v-if="loading">⏳</span>
      <span v-else>🗑️</span>
      {{ deleteText }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  showApprove: {
    type: Boolean,
    default: true
  },
  showReject: {
    type: Boolean,
    default: true
  },
  showView: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  approveText: {
    type: String,
    default: 'Odobri'
  },
  rejectText: {
    type: String,
    default: 'Odbij'
  },
  viewText: {
    type: String,
    default: 'Pregledaj'
  },
  deleteText: {
    type: String,
    default: 'Obriši'
  }
})

defineEmits(['approve', 'reject', 'view', 'delete'])
</script>

<style scoped>
.moderation-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  min-width: 80px;
  justify-content: center;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.loading {
  cursor: wait;
}

.action-btn.approve {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.action-btn.approve:hover:not(:disabled) {
  background: #c3e6cb;
}

.action-btn.reject {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.action-btn.reject:hover:not(:disabled) {
  background: #f5c6cb;
}

.action-btn.view {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.action-btn.view:hover:not(:disabled) {
  background: #d6d8db;
}

.action-btn.delete {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.action-btn.delete:hover:not(:disabled) {
  background: #f5c6cb;
}

/* Responsive */
@media (max-width: 480px) {
  .moderation-actions {
    flex-direction: column;
  }
  
  .action-btn {
    min-width: auto;
    justify-content: flex-start;
  }
}
</style>