<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>Dobrodošli, {{ user?.displayName || user?.email }}</p>
    </div>
    
    <div class="dashboard-content">
      <!-- Dodela Zadataka Sekcija -->
      <div class="tasks-section">
        <div class="section-header-card">
          <div class="header-content">
            <h2>📝 Dodela Zadataka Urednicima</h2>
            <p>Dodelite zadatke za pisanje recenzija urednicima</p>
          </div>
        </div>

        <div class="assignment-form">
          <div v-if="taskLoading" class="loading-message">
            Učitavanje podataka...
          </div>
          
          <template v-else>
            <div class="form-group">
              <label>Predmet:</label>
              <select v-model="selectedItem" class="select-input">
                <option value="">-- Izaberite predmet --</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name || item.title || item.displayName || 'Bez naziva' }}
                  {{ item.type ? ` (${item.type})` : '' }}
                  {{ item.band?.name ? ` - ${item.band.name}` : '' }}
                </option>
              </select>
              <div v-if="items.length === 0" class="helper-text">
                Nema dostupnih predmeta
              </div>
            </div>

            <div class="form-group">
              <label>Urednik:</label>
              <select v-model="selectedEditor" class="select-input">
                <option value="">-- Izaberite urednika --</option>
                <option v-for="editor in editors" :key="editor.id" :value="editor.id">
                  {{ editor.displayName || editor.email }}
                  {{ editor.role === 'editor' ? '(Urednik)' : '' }}
                </option>
              </select>
              <div v-if="editors.length === 0" class="helper-text">
                Nema dostupnih urednika
              </div>
            </div>
          </template>

          <div v-if="assignmentError" class="error-message">
            {{ assignmentError }}
          </div>

          <button 
            @click="handleAssignTask" 
            class="assign-btn"
            :disabled="taskLoading || !selectedItem || !selectedEditor"
          >
            {{ taskLoading ? 'Dodeljivanje...' : 'Dodeli zadatak' }}
          </button>
        </div>
      </div>

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
          :loading="moderationLoading"
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
import { useEditorTasks } from '@/composables/useEditorTasks'
import EditorReviewsPending from '@/components/moderation/EditorReviewsPending.vue'
import { db } from '@/firebase/config'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'

const { user } = useAuth()
const { 
  editorReviews, 
  loading: moderationLoading,
  loadEditorReviews, 
  approveReview, 
  rejectReview 
} = useAdminModeration()

const {
  loading: taskLoading,
  error: taskError,
  items,
  editors,
  loadItems,
  loadEditors,
  assignTask
} = useEditorTasks()

// State za dodelu zadataka
const selectedItem = ref(null)
const selectedEditor = ref(null)
const assignmentError = ref('')

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

// Handler za dodelu zadatka
const handleAssignTask = async () => {
  if (!selectedItem.value || !selectedEditor.value) {
    assignmentError.value = 'Molimo izaberite i sadržaj i urednika'
    return
  }

  try {
    assignmentError.value = ''
    const item = items.value.find(i => i.id === selectedItem.value)
    const editor = editors.value.find(e => e.id === selectedEditor.value)

    await assignTask(
      item.id,
      editor.id,
      item.name || item.title || 'Untitled',
      editor.displayName || editor.email
    )

    alert('✅ Zadatak je uspešno dodeljen uredniku!')
    selectedItem.value = null
    selectedEditor.value = null
  } catch (err) {
    assignmentError.value = err.message
  }
}

onMounted(async () => {
  await Promise.all([
    loadEditorReviews(),
    loadItems(),
    loadEditors()
  ])
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

.tasks-section {
  margin-bottom: 2rem;
}

.assignment-form {
  background: rgba(124, 58, 237, 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-weight: 500;
}

.select-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  background: rgba(124, 58, 237, 0.05);
  color: #ffffff;
  font-size: 1rem;
}

.select-input:focus {
  outline: none;
  border-color: rgba(124, 58, 237, 0.5);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.select-input option {
  background: #1a1a1a;
  color: #ffffff;
}

.error-message {
  color: #ef4444;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.assign-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: rgba(124, 58, 237, 0.3);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assign-btn:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.4);
  transform: translateY(-1px);
}

.assign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-message {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 1rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.helper-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-style: italic;
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