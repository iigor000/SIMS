import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth'
import { db } from '@/firebase/config'
import { ref as dbRef, get } from 'firebase/database'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const userData = ref(null)
  const loading = ref(true)
  
  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => userData.value?.role || 'user')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isEditor = computed(() => userRole.value === 'editor')
  const isRegularUser = computed(() => userRole.value === 'user')

  // Actions
  const setUser = (userData) => {
    user.value = userData
  }

  const setUserData = (data) => {
    userData.value = data
  }

  const setLoading = (isLoading) => {
    loading.value = isLoading
  }

  const fetchUserData = async (userId) => {
    try {
      const userSnapshot = await get(dbRef(db, 'users/' + userId))
      if (userSnapshot.exists()) {
        userData.value = userSnapshot.val()
        return userSnapshot.val()
      }
      return null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }
  
  const logout = async () => {
    try {
      const auth = getAuth()
      await signOut(auth)
      user.value = null
      userData.value = null
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Initialize auth state listener
  const initAuthListener = () => {
    const auth = getAuth()
    
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        await fetchUserData(firebaseUser.uid)
      } else {
        user.value = null
        userData.value = null
      }
      loading.value = false
    })
  }

  return {
    // State
    user,
    userData,
    loading,
    
    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isEditor,
    isRegularUser,
    
    // Actions
    setUser,
    setUserData,
    setLoading,
    fetchUserData,
    logout,
    initAuthListener
  }
})