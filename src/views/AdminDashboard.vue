<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>Dobrodošli, {{ user?.displayName || user?.email }}</p>
    </div>
    
    <div class="dashboard-content">
      <!-- System Overview Cards -->
      

      <!-- Editor Reviews Moderation Section -->
      <div class="moderation-section">
          <div class="section-header-card">
            <div class="header-content">
              <h2>🛡️ Moderacija Editor Recenzija</h2>
              <p>Pregledajte i odobrite recenzije koje su napisali editori</p>
            </div>
            <span class="count-badge" v-if="editorReviewsCount > 0">
              {{ editorReviewsCount }}
            </span>
            <span class="urgent-badge" v-if="editorReviewsCount > 0">NOVO</span>
          </div>

        <EditorReviewsPending
          :editor-reviews="editorReviews"
          :loading="loading"
          @approve="handleApprove"
          @reject="handleReject"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAdminModeration } from '@/composables/useAdminModeration'
import EditorReviewsPending from '@/components/moderation/EditorReviewsPending.vue'

const { user } = useAuth()
const { 
  editorReviews, 
  loading,
  loadEditorReviews, 
  approveReview, 
  rejectReview 
} = useAdminModeration()

const editorReviewsCount = computed(() => editorReviews.value.length)

const handleApprove = async (reviewId) => {
  try {
    await approveReview(reviewId)
    alert('✅ Editor recenzija je uspešno odobrena!')
  } catch (error) {
    console.error('Error approving review:', error)
    alert('❌ Greška pri odobravanju recenzije.')
  }
}

const handleReject = async (reviewId) => {
  const reason = prompt('Razlog odbijanja (opciono):')
  try {
    await rejectReview(reviewId, reason || 'Nije navedeno')
    alert('🚫 Editor recenzija je odbijena.')
  } catch (error) {
    console.error('Error rejecting review:', error)
    alert('❌ Greška pri odbijanju recenzije.')
  }
}

onMounted(async () => {
  await loadEditorReviews()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 3rem;
  background: rgba(124, 58, 237, 0.1);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.dashboard-header h1 {
  color: #ffffff;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: rgba(124, 58, 237, 0.03);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
  transform: translateY(-4px);
  background: rgba(124, 58, 237, 0.05);
}

.card h2 {
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.4rem;
}

.card p {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.moderation-section {
  background: rgba(124, 58, 237, 0.03);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.1);
}

.section-link {
  text-decoration: none;
  display: block;
  margin-bottom: 2rem;
}

.section-header-card {
  background: rgba(124, 58, 237, 0.2);
  color: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.section-header-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
  background: rgba(124, 58, 237, 0.15);
}

.header-content {
  flex: 1;
}

.header-content h2 {
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.header-content p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 1rem;
}

.count-badge {
  background: rgba(196, 181, 253, 1);
  color: rgba(124, 58, 237, 1);
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1.2rem;
  min-width: 50px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.urgent-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ddd6fe;
  color: rgba(124, 58, 237, 1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .moderation-section {
    padding: 1rem;
  }

  .section-header-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .count-badge {
    align-self: flex-end;
  }
}
</style>