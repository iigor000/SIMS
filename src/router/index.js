import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref as dbRef, get } from "firebase/database";
import { db } from "../firebase/config";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { requiresAuth: true },
    },
    // Admin routes
    {
      path: "/manage-users",
      name: "manage-users",
      component: () => import("../views/ManageUsers.vue"),
      meta: { requiresAuth: true, requiredRole: 'admin' },
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("../views/AdminDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'admin' },
    },
    // Editor routes
    {
      path: "/content",
      name: "content",
      component: () => import("../views/EditorDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'editor' },
    },
    {
      path: "/publish",
      name: "publish",
      component: () => import("../views/EditorDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'editor' },
    },
    // User routes
    {
      path: "/profile",
      name: "profile",
      component: () => import("../views/ProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/UserDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'user' },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    // Item view route - handles songs, artists, bands, performances, albums
    {
      path: "/item/:type/:id",
      name: "item",
      component: () => import("../views/ItemView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.meta.requiredRole;
  const auth = getAuth();

  if (requiresAuth) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnapshot = await get(dbRef(db, 'users/' + user.uid));
          const userData = userSnapshot.val();

          // Check if user is deleted
          if (userData && userData.deleted) {
            // User is deleted, sign them out
            await auth.signOut();
            next('/login');
            return;
          }

          // Check role if required
          if (requiredRole) {
            if (userData && userData.role === requiredRole) {
              next();
            } else {
              // User doesn't have required role, redirect to home
              next('/');
            }
          } else {
            next();
          }
        } catch (error) {
          console.error('Error checking user:', error);
          next('/');
        }
      } else {
        next('/login');
      }
    });
  } else {
    next();
  }
});

export default router;
