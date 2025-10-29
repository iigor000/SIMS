<template>
  <div class="page-bg">
    <div class="dashboard">
    <div class="dashboard-header">
      
      <p>Dobrodošao/la, {{ user?.displayName || user?.email }}</p>
    </div>
    
    <div class="dashboard-content">
      <!-- NOVO: Moje recenzije -->
      <router-link to="/my-reviews" class="card link-card">
        <h2>📝 Moje Recenzije</h2>
        <p>Pregledaj i uredi svoje recenzije albuma i pesama.</p>
        <span class="card-badge" v-if="userReviewsCount > 0">{{ userReviewsCount }}</span>
      </router-link>

      <!-- NOVO: Plejliste -->
      <div class="card">
        <h2>🎵 Moje Plejliste</h2>
        <p>Kreiraj i uredi svoje plejliste.</p>
        <button @click="createPlaylist" class="btn-secondary">Nova Plejlista</button>
      </div>      
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useUserReviews } from '@/composables/useUserReviews'

const userStore = useUserStore()
const { loadUserReviews, userStats } = useUserReviews()

const user = userStore.user
const userReviewsCount = ref(0)

const createPlaylist = () => {
  // Implementiraj kasnije  
  alert('Funkcionalnost plejlisti će biti dostupna uskoro!')
}

onMounted(async () => {
  if (userStore.user) {
    await loadUserReviews()
    userReviewsCount.value = userStats.value.total
  }
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
  color: #fff;
  font-size: 1.1rem;
}

.page-bg {
  min-height: 100vh;
  background: rgb(37, 36, 36);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: rgba(250, 248, 248, 0.06); /* translucent card */
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  position: relative;
  border: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(6px);
}

.link-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card h2 {
  color: #fff;
  margin-bottom: 1rem;
}

.card p {
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>