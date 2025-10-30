<template>
  <div class="dashboard">
    <div class="dashboard-header">
     
      <p>Dobrodošao/la, {{ user?.displayName || user?.email }}</p>
      <div class="role-badge">Editor</div>
    </div>
    
    <div class="dashboard-content">
      <!-- Moderacija recenzija -->
      <router-link to="/moderation" class="card link-card urgent">
        <h2>🛡️ Moderacija Recenzija</h2>
        <p>Odobri ili odbij recenzije korisnika.</p>
        <span class="card-badge" v-if="pendingReviewsCount > 0">{{ pendingReviewsCount }}</span>
        <span class="urgent-badge" v-if="pendingReviewsCount > 0">HITNO</span>
      </router-link>
      
      <!-- Dodaj novi sadržaj -->
      <router-link to="/content/add" class="card link-card">
        <h2>📝 Dodaj Sadržaj</h2>
        <p>Dodaj nove albume, pesme ili izvođače.</p>
      </router-link>
      
      <!-- Moje recenzije -->
      <router-link to="/my-reviews" class="card link-card">
        <h2>⭐ Moje Editor Recenzije</h2>
        <p>Pregledaj recenzije koje si napisao/la kao editor.</p>
        <span class="card-badge" v-if="editorReviewsCount > 0">{{ editorReviewsCount }}</span>
      </router-link>
      
      <!-- Statistike -->
      <div class="card">
        <h2>📊 Statistike</h2>
        <p>Pregledaj performanse i aktivnost.</p>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-number">{{ approvedCount }}</span>
            <span class="stat-label">Odobreno</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ rejectedCount }}</span>
            <span class="stat-label">Odbijeno</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ editorReviewsCount }}</span>
            <span class="stat-label">Moje recenzije</span>
          </div>
        </div>
      </div>

      <!-- Brzi linkovi -->
      <router-link to="/item/album/-OcefTs91Ri4WfxE9dA6" class="card link-card">
        <h2>🎵 Queen - A Night at the Opera</h2>
        <p>Dodaj recenziju za ovaj album.</p>
      </router-link>

      <router-link to="/item/band/-OcefTs91Ri4WfxE9dA5" class="card link-card">
        <h2>🎸 Bend Queen</h2>
        <p>Uredi informacije o bendu.</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useModeration } from '@/composables/useModeration'
import { 
  ref as dbRef, 
  query, 
  orderByChild, 
  equalTo, 
  get 
} from 'firebase/database'
import { db } from '@/firebase/config'

const userStore = useUserStore()
const { pendingReviews, loadPendingReviews } = useModeration()

const user = userStore.user
const pendingReviewsCount = ref(0)
const editorReviewsCount = ref(0)
const approvedCount = ref(0)
const rejectedCount = ref(0)
const loading = ref(false)

// 🔹 KORIGOVANA FUNKCIJA - Realtime Database
const loadEditorStats = async () => {
  if (!userStore.user) return
  
  try {
    loading.value = true

    // ✅ KORISTITE Realtime Database, NE Firestore
    const reviewsRef = dbRef(db, 'reviews')
    const q = query(
      reviewsRef,
      orderByChild('userId'),
      equalTo(userStore.user.uid)
    )

    const snapshot = await get(q)
    
    let approved = 0
    let rejected = 0
    let total = 0

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val()
        total++
        if (data.status === 'approved') approved++
        else if (data.status === 'rejected') rejected++
      })
    }

    approvedCount.value = approved
    rejectedCount.value = rejected
    editorReviewsCount.value = total
    
    console.log('Editor stats loaded:', { approved, rejected, total })
  } catch (error) {
    console.error('Error loading editor stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (userStore.user) {
    await loadPendingReviews()
    pendingReviewsCount.value = pendingReviews.value.length
    await loadEditorStats()
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
  position: relative;
}

.dashboard-header h1 {
  color: #007bff;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: white;
  font-size: 1.1rem;
}

.role-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #a240e4;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  /* translucent purple glass for dashboard cards */
  background: rgba(99,102,241,0.06);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(75,66,160,0.10);
  position: relative;
  border: 1px solid rgba(92, 41, 180, 0.22); /* stronger purple border */
  backdrop-filter: blur(8px);
}

.link-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px rgba(124,58,237,0.12), 0 6px 20px rgba(0,0,0,0.4);
}

.card.urgent {
  border-left: 4px solid #dc3545;
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
  background: rgba(124,58,237,0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.urgent-badge {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  margin-top: 4px;
}
</style>