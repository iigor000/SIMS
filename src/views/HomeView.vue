<script setup>
import { useAuth } from "../composables/useAuth";

const { user, userRole } = useAuth();
</script>

<template>
  <main>
    <div class="welcome-container">
      <h1>Welcome to SIMS!</h1>
      
      <div v-if="user" class="user-info">
        <p>Hello, <strong>{{ user.displayName || user.email }}</strong></p>
        <p class="role-badge">Role: <span>{{ userRole?.toUpperCase() || 'USER' }}</span></p>
      </div>

      <!-- Admin Content -->
      <div v-if="userRole === 'admin'" class="role-content">
        <h2>Admin Dashboard</h2>
        <p>Manage system settings, users, and configurations.</p>
        <div class="quick-actions">
          <RouterLink to="/manage-users" class="action-card">
            <h3>👥 Manage Users</h3>
            <p>Add, edit, or remove users</p>
          </RouterLink>
          <RouterLink to="/settings" class="action-card">
            <h3>⚙️ Settings</h3>
            <p>Configure system preferences</p>
          </RouterLink>
        </div>
      </div>

      <!-- Editor Content -->
      <div v-if="userRole === 'editor'" class="role-content">
        <h2>Editor Dashboard</h2>
        <p>Create, edit, and publish content.</p>
        <div class="quick-actions">
          <RouterLink to="/content" class="action-card">
            <h3>Manage Content</h3>
            <p>Create and edit content</p>
          </RouterLink>
          <RouterLink to="/publish" class="action-card">
            <h3>Publish</h3>
            <p>Publish and manage content</p>
          </RouterLink>
        </div>
      </div>

      <!-- User Content -->
      <div v-if="userRole === 'user'" class="role-content">
        <h2>User Dashboard</h2>
        <p>Access your profile and view your dashboard.</p>
        <div class="quick-actions">
          <RouterLink to="/profile" class="action-card">
            <h3>My Profile</h3>
            <p>View and edit your profile</p>
          </RouterLink>
          <RouterLink to="/dashboard" class="action-card">
            <h3>Dashboard</h3>
            <p>View your personal dashboard</p>
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.welcome-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  color: #4CAF50;
  text-align: center;
  margin-bottom: 2rem;
}

.user-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  text-align: center;
}

.user-info p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.user-info strong {
  font-size: 1.3rem;
}

.role-badge {
  margin-top: 1rem;
}

.role-badge span {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.role-content {
  margin-top: 2rem;
}

.role-content h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.role-content > p {
  color: #666;
  margin-bottom: 2rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.action-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.action-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.action-card p {
  color: #666;
  margin: 0;
}
</style>

