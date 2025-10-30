<script setup>
import PendingReviews from '@/components/moderation/PendingReviews.vue'
import { useReviews } from '@/composables/useReviews'
import { getAuth } from 'firebase/auth'

const { approveReview, rejectReview, getPendingReviews } = useReviews()

const auth = getAuth()
const user = auth.currentUser

const handleApprove = async (reviewId) => {
  try {
    await approveReview(reviewId, user.uid)
    alert('✅ Recenzija je uspešno odobrena!')
    await refreshPendingReviews()
  } catch (error) {
    alert('❌ Greška pri odobravanju recenzije.')
  }
}

const handleReject = async (reviewId) => {
  try {
    await rejectReview(reviewId, user.uid, 'Ne odgovara pravilima')
    alert('🚫 Recenzija je odbijena.')
    await refreshPendingReviews()
  } catch (error) {
    alert('❌ Greška pri odbijanju recenzije.')
  }
}

// 🔹 Obezbedi da PendingReviews može ponovo da učita podatke
import { ref, onMounted } from 'vue'
const pendingReviews = ref([])
const loading = ref(false)

const refreshPendingReviews = async () => {
  loading.value = true
  pendingReviews.value = await getPendingReviews()
  loading.value = false
}

onMounted(refreshPendingReviews)
</script>

<template>
  <div class="moderation">
    <div class="page-header">
      <h1>Moderacija recenzija</h1>
    </div>

    <PendingReviews 
      :pending-reviews="pendingReviews" 
      :loading="loading"
      @approve="handleApprove"
      @reject="handleReject"
    />
  </div>
</template>

<style scoped>
.moderation {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(124,58,237,0.1);
}

.page-header h1 {
  color: #efe6ff;
  font-size: 2.25rem;
  font-weight: 600;
  margin: 0;
}
</style>
