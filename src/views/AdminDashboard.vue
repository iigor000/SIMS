<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {{ user?.displayName || user?.email }}</p>
    </div>
    
    <div class="dashboard-content">
      <div class="card">
        <h2>System Overview</h2>
        <p>Manage users, view reports, and configure system settings.</p>
      </div>
      
      <div class="card">
        <h2>User Management</h2>
        <p>Add, edit, or remove users from the system.</p>
      </div>
      
      <div class="card">
        <h2>Reports</h2>
        <p>View and generate system-wide reports.</p>
      </div>

      <div class="card">
  <h2>Editor Reviews Pending Approval</h2>

  <div v-if="editorReviews.length === 0">Nema recenzija za odobravanje</div>

  <div v-for="review in editorReviews" :key="review.id" class="review-card">
    <p><strong>{{ review.authorName }}</strong> (Editor)</p>
    <p>{{ review.content }}</p>
    <button @click="approveReview(review.id)">✔️ Odobri</button>
    <button @click="rejectReview(review.id)">❌ Odbij</button>
  </div>
</div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useAdminModeration } from '@/composables/useAdminModeration'

const { user } = useAuth()
const { editorReviews, loadEditorReviews, approveReview, rejectReview } = useAdminModeration()

onMounted(async () => {
  await loadEditorReviews()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #4CAF50;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #666;
  font-size: 1.1rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1rem;
}

.card p {
  color: #666;
  line-height: 1.6;
}
</style>
