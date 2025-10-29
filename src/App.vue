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
          
          <!-- Profile link moved into user-section (displayed as user name) -->
          
          <div class="user-section">
            <!-- hide the role badge when role is exactly 'user' -->
            <span class="user-role" v-if="userRole && userRole !== 'user'">{{ userRole.toUpperCase() }}</span>
            <RouterLink to="/profile" class="user-name">{{ user.displayName || user.email || 'Profile' }}</RouterLink>
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
/* make the app container background match UnregisterHomeView */
#app-container {
  background: rgb(37, 36, 36);
}

header {
  line-height: 1.5;
  padding: 0.5rem;
  background: linear-gradient(90deg, #6a1b9a 0%, #ca54eb 100%);
  border-bottom: 1px solid #4a0072;
  width: 100%;
  color: #fff;
}

.wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem; /* reduced gap so Home and Dashboard are closer */
  font-size: 1rem;
}

nav a {
  text-decoration: none;
  color: rgba(255,255,255,0.95);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

nav a:hover {
  background: rgba(255,255,255,0.06);
}

nav a.router-link-exact-active {
  color: #e1bee7;
  font-weight: 700;
}

.user-section {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-role {
  background: #7e57c2;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.user-name {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
}
.user-name:hover {
  color: #f3e5f5;
}

.logout-btn {
  padding: 0.45rem 0.9rem;
  background: #080808;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s, transform 0.08s;
}

.logout-btn:hover {
  background: #d32f2f;
  transform: translateY(-1px);
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
