<template>
  <div class="profile-page">
    <div class="container">
      <div class="header">
        <h1>My Profile</h1>
        <span class="role-badge" :class="'role-' + userRole">
          {{ userRole?.toUpperCase() }}
        </span>
      </div>

      <div v-if="loading" class="loading">Loading profile...</div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else class="profile-content">
        <!-- View Mode -->
        <div v-if="!isEditing" class="view-mode">
          <div class="profile-card">
            <div class="profile-header">
              <div class="avatar">
                {{ userProfile.displayName?.charAt(0)?.toUpperCase() || '?' }}
              </div>
              <div class="profile-info">
                <h2>{{ userProfile.displayName || 'No name set' }}</h2>
                <p class="email">{{ userProfile.email }}</p>
              </div>
            </div>

            <div class="profile-details">
              <div class="detail-item">
                <label>Display Name (Username)</label>
                <p>{{ userProfile.displayName || 'Not set' }}</p>
              </div>

              <div class="detail-item">
                <label>First Name</label>
                <p>{{ userProfile.name || 'Not set' }}</p>
              </div>

              <div class="detail-item">
                <label>Last Name</label>
                <p>{{ userProfile.surname || 'Not set' }}</p>
              </div>

              <div class="detail-item">
                <label>Phone</label>
                <p>{{ userProfile.phone || 'Not set' }}</p>
              </div>

              <div class="detail-item">
                <label>Address</label>
                <p>{{ userProfile.address || 'Not set' }}</p>
              </div>

              <div class="detail-item">
                <label>Email</label>
                <p>{{ userProfile.email }}</p>
              </div>

              <div class="detail-item">
                <label>Member Since</label>
                <p>{{ formatDate(userProfile.createdAt) }}</p>
              </div>
            </div>

            <button @click="startEditing" class="btn-primary">
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="edit-mode">
          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-group">
              <label for="displayName">Display Name (Username)</label>
              <input
                id="displayName"
                v-model="editForm.displayName"
                type="text"
                placeholder="Enter your display name"
                required
              />
            </div>

            <div class="form-group">
              <label for="name">First Name</label>
              <input
                id="name"
                v-model="editForm.name"
                type="text"
                placeholder="Enter your first name"
              />
            </div>

            <div class="form-group">
              <label for="surname">Last Name</label>
              <input
                id="surname"
                v-model="editForm.surname"
                type="text"
                placeholder="Enter your last name"
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone</label>
              <input
                id="phone"
                v-model="editForm.phone"
                type="tel"
                placeholder="Enter your phone number"
              />
            </div>

            <div class="form-group">
              <label for="address">Address</label>
              <textarea
                id="address"
                v-model="editForm.address"
                placeholder="Enter your address"
                rows="3"
              ></textarea>
            </div>

            <div v-if="saveError" class="error-message">
              {{ saveError }}
            </div>

            <div v-if="saveSuccess" class="success-message">
              Profile updated successfully!
            </div>

            <div class="form-actions">
              <button type="button" @click="cancelEditing" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '../composables/useAuth';
import { ref as dbRef, get, set, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase/config';

const { user, userRole } = useAuth();

const loading = ref(true);
const error = ref('');
const isEditing = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);

const userProfile = ref({
  email: '',
  displayName: '',
  name: '',
  surname: '',
  phone: '',
  address: '',
  role: '',
  createdAt: ''
});

const editForm = ref({
  displayName: '',
  name: '',
  surname: '',
  phone: '',
  address: ''
});

// Fetch user profile
const fetchProfile = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const currentUser = auth.currentUser || user.value;
    
    if (!currentUser) {
      error.value = 'No user logged in';
      loading.value = false;
      return;
    }

    const userSnapshot = await get(dbRef(db, 'users/' + currentUser.uid));
    
    if (userSnapshot.exists()) {
      userProfile.value = {
        ...userSnapshot.val(),
        email: currentUser.email
      };
    } else {
      error.value = 'Profile not found';
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    error.value = 'Failed to load profile';
  } finally {
    loading.value = false;
  }
};

// Start editing
const startEditing = () => {
  editForm.value = {
    displayName: userProfile.value.displayName || '',
    name: userProfile.value.name || '',
    surname: userProfile.value.surname || '',
    phone: userProfile.value.phone || '',
    address: userProfile.value.address || ''
  };
  isEditing.value = true;
  saveError.value = '';
  saveSuccess.value = false;
};

// Cancel editing
const cancelEditing = () => {
  isEditing.value = false;
  saveError.value = '';
  saveSuccess.value = false;
};

// Save profile
const saveProfile = async () => {
  saving.value = true;
  saveError.value = '';
  saveSuccess.value = false;
  
  try {
    const currentUser = auth.currentUser || user.value;
    
    if (!currentUser) {
      saveError.value = 'No user logged in';
      saving.value = false;
      return;
    }

    // Update Firebase Auth profile (display name)
    await updateProfile(currentUser, {
      displayName: editForm.value.displayName
    });

    // Update database
    await update(dbRef(db, 'users/' + currentUser.uid), {
      displayName: editForm.value.displayName,
      name: editForm.value.name,
      surname: editForm.value.surname,
      phone: editForm.value.phone,
      address: editForm.value.address,
      updatedAt: new Date().toISOString()
    });

    // Update local profile
    userProfile.value = {
      ...userProfile.value,
      displayName: editForm.value.displayName,
      name: editForm.value.name,
      surname: editForm.value.surname,
      phone: editForm.value.phone,
      address: editForm.value.address
    };

    saveSuccess.value = true;
    
    // Exit edit mode after short delay
    setTimeout(() => {
      isEditing.value = false;
      saveSuccess.value = false;
    }, 2000);

  } catch (err) {
    console.error('Error saving profile:', err);
    saveError.value = 'Failed to save profile';
  } finally {
    saving.value = false;
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Load profile on mount and when user changes
onMounted(() => {
  fetchProfile();
});

// Watch for user changes and refetch
watch(user, (newUser) => {
  if (newUser) {
    fetchProfile();
  }
});
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  border: 1px solid #e0e0e0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  color: #333;
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.role-admin {
  background: #f44336;
  color: white;
}

.role-editor {
  background: #2196F3;
  color: white;
}

.role-user {
  background: #4CAF50;
  color: white;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.profile-info h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.email {
  color: #666;
  margin: 0;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.detail-item p {
  color: #333;
  margin: 0;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  align-self: flex-start;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .container {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
