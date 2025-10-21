<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useAuth } from "./composables/useAuth";

const { user, userRole, logout } = useAuth();
</script>

<template>
  <div id="app-container">
    <header v-if="user">
      <div class="wrapper">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          
          <!-- Admin specific links -->
          <RouterLink v-if="userRole === 'admin'" to="/manage-users">Manage Users</RouterLink>
          <RouterLink v-if="userRole === 'admin'" to="/settings">Settings</RouterLink>
          
          <!-- Editor specific links -->
          <RouterLink v-if="userRole === 'editor'" to="/content">Manage Content</RouterLink>
          <RouterLink v-if="userRole === 'editor'" to="/publish">Publish</RouterLink>
          
          <!-- User specific links -->
          <RouterLink v-if="userRole === 'user'" to="/dashboard">Dashboard</RouterLink>
          
          <!-- Profile link for all users -->
          <RouterLink to="/profile">My Profile</RouterLink>
          
          <RouterLink to="/about">About</RouterLink>
          
          <div class="user-section">
            <span class="user-role" v-if="userRole">{{ userRole.toUpperCase() }}</span>
            <span class="user-name">{{ user.displayName || user.email }}</span>
            <button @click="logout" class="logout-btn">Logout</button>
          </div>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

header {
  line-height: 1.5;
  padding: 0.5rem;
  background: #baffca;
  border-bottom: 1px solid #1f752b;
  width: 100%;
}

.wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  font-size: 1rem;
}

nav a {
  text-decoration: none;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

nav a:hover {
  background: rgba(76, 175, 80, 0.1);
}

nav a.router-link-exact-active {
  color: #4CAF50;
  font-weight: 600;
}

.user-section {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-role {
  background: #4CAF50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.user-name {
  color: #555;
  font-weight: 500;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #d32f2f;
}

@media (max-width: 768px) {
  nav {
    flex-wrap: wrap;
  }
  
  .user-section {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 1rem;
  }
}
</style>
