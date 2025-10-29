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
      component: () => import("../views/UnregisterHomeView.vue"),
      // component: HomeView,
      // meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { requiresAuth: true },
    },
        {
      path: "/item/:type/:id",
      name: "item-details",
      component: () => import("../views/ItemDetailsView.vue"),
      // NEMA requiresAuth - neulogovani mogu da vide recenzije
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
        {
      path: "/moderation",
      name: "moderation",
      component: () => import("../views/ModerationView.vue"),
      meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] },
    },
        {
      path: "/edit-review/:reviewId",
      name: "edit-review",
      component: () => import("../views/EditReviewView.vue"),
      meta: { requiresAuth: true },
    },
    // Editor routes
    {
      path: "/content",
      name: "content",
      component: () => import("../views/EditorDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'editor' },
    },
    {
      path: "/content/add",
      name: "add-item",
      component: () => import("../views/AddItemView.vue"),
      meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] },
    },
    {
      path: "/publish",
      name: "publish",
      component: () => import("../views/EditorDashboard.vue"),
      meta: { requiresAuth: true, requiredRole: 'editor' },
    },
    // User routes
        {
      path: "/my-reviews",
      name: "my-reviews",
      component: () => import("../views/MyReviewsView.vue"),
      meta: { requiresAuth: true },
    },
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
            await auth.signOut();
            next('/login');
            return;
          }

          if (requiredRole) {
            // Ako je requiredRole array (['editor', 'admin'])
            if (Array.isArray(requiredRole)) {
              if (userData && requiredRole.includes(userData.role)) {
                next();
              } else {
                next('/');
              }
            } 
            // Ako je single role string ('admin', 'editor', 'user')
            else if (userData && userData.role === requiredRole) {
              next();
            } else {
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
