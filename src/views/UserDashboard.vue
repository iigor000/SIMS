<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Student Dashboard</h1>
      <p>Welcome, {{ user?.displayName || user?.email }}</p>
    </div>
    
    <div class="dashboard-content">
      <div class="card">
        <h2>My Courses</h2>
        <p>View your enrolled courses and schedules.</p>
      </div>
      
      <div class="card">
        <h2>Assignments</h2>
        <p>View and submit your assignments.</p>
      </div>
      
      <div class="card">
        <h2>Grades</h2>
        <p>Check your grades and progress reports.</p>
      </div>
      
      <div class="card">
        <h2>Resources</h2>
        <p>Access course materials and study resources.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';

const { user } = useAuth();
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
