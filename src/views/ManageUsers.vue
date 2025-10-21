<template>
  <div class="manage-users">
    <div class="container">
      <div class="header">
        <h1>Manage Users</h1>
        <button @click="showAddModal = true" class="btn-primary">
          <span>+</span> Add New User
        </button>
      </div>

      <!-- Users Table -->
      <div v-if="loading" class="loading">Loading users...</div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.uid">
              <td>{{ user.displayName || 'N/A' }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="'role-' + user.role">
                  {{ user.role?.toUpperCase() }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <button 
                  @click="confirmDelete(user)" 
                  class="btn-delete"
                  title="Delete user"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="users.length === 0" class="no-users">
          No users found.
        </div>
      </div>

      <!-- Add User Modal -->
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>Add New User</h2>
            <button @click="closeAddModal" class="close-btn">&times;</button>
          </div>
          
          <form @submit.prevent="addUser" class="modal-body">
            <div class="form-group">
              <label for="newEmail">Email</label>
              <input
                id="newEmail"
                v-model="newUser.email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="newPassword">Password</label>
              <input
                id="newPassword"
                v-model="newUser.password"
                type="password"
                placeholder="Min. 6 characters"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="newDisplayName">Display Name</label>
              <input
                id="newDisplayName"
                v-model="newUser.displayName"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>

            <div class="form-group">
              <label for="newRole">Role</label>
              <select id="newRole" v-model="newUser.role" required>
                <option value="" disabled>Select role</option>
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div v-if="modalError" class="error-message">
              {{ modalError }}
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeAddModal" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="adding">
                {{ adding ? 'Adding...' : 'Add User' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
        <div class="modal modal-small" @click.stop>
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button @click="showDeleteModal = false" class="close-btn">&times;</button>
          </div>
          
          <div class="modal-body">
            <p>Are you sure you want to delete this user?</p>
            <p class="delete-warning">
              <strong>{{ userToDelete?.displayName || userToDelete?.email }}</strong>
            </p>
            <p class="delete-note">This action cannot be undone.</p>

            <div v-if="modalError" class="error-message">
              {{ modalError }}
            </div>

            <div class="modal-actions">
              <button @click="showDeleteModal = false" class="btn-secondary">
                Cancel
              </button>
              <button @click="deleteUser" class="btn-danger" :disabled="deleting">
                {{ deleting ? 'Deleting...' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ref as dbRef, get, set, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, secondaryAuth, db } from '../firebase/config';

const users = ref([]);
const loading = ref(true);
const error = ref('');
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const adding = ref(false);
const deleting = ref(false);
const modalError = ref('');

const newUser = ref({
  email: '',
  password: '',
  displayName: '',
  role: ''
});

// Fetch all users
const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const usersSnapshot = await get(dbRef(db, 'users'));
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      users.value = Object.keys(usersData)
        .map(uid => ({
          uid,
          ...usersData[uid]
        }))
        .filter(user => !user.deleted); // Filter out deleted users
    } else {
      users.value = [];
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    error.value = 'Failed to load users';
  } finally {
    loading.value = false;
  }
};

// Add new user
const addUser = async () => {
  adding.value = true;
  modalError.value = '';
  
  try {
    // Create user with secondary auth instance (doesn't affect admin session)
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      newUser.value.email,
      newUser.value.password
    );

    const newUserId = userCredential.user.uid;

    // Update profile on the new user
    await updateProfile(userCredential.user, {
      displayName: newUser.value.displayName
    });

    // Store user data in database
    await set(dbRef(db, 'users/' + newUserId), {
      email: newUser.value.email,
      displayName: newUser.value.displayName,
      role: newUser.value.role,
      createdAt: new Date().toISOString()
    });

    // Sign out the newly created user from secondary auth
    await signOut(secondaryAuth);

    // Refresh user list
    await fetchUsers();
    closeAddModal();
    
  } catch (err) {
    console.error('Error adding user:', err);
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        modalError.value = 'Email already in use';
        break;
      case 'auth/invalid-email':
        modalError.value = 'Invalid email address';
        break;
      case 'auth/weak-password':
        modalError.value = 'Password is too weak';
        break;
      default:
        modalError.value = err.message || 'Failed to add user';
    }
  } finally {
    adding.value = false;
  }
};

// Confirm delete
const confirmDelete = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
  modalError.value = '';
};

// Delete user
const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  deleting.value = true;
  modalError.value = '';
  
  try {
    // Mark user as deleted in database (soft delete)
    await set(dbRef(db, 'users/' + userToDelete.value.uid), {
      ...userToDelete.value,
      deleted: true,
      deletedAt: new Date().toISOString()
    });
    
    // Note: Full deletion from Firebase Auth requires Admin SDK on the server side
    // This soft delete prevents login by checking the 'deleted' flag in router guard
    
    // Refresh user list
    await fetchUsers();
    showDeleteModal.value = false;
    userToDelete.value = null;
  } catch (err) {
    console.error('Error deleting user:', err);
    modalError.value = 'Failed to delete user';
  } finally {
    deleting.value = false;
  }
};

// Close add modal
const closeAddModal = () => {
  showAddModal.value = false;
  modalError.value = '';
  newUser.value = {
    email: '',
    password: '',
    displayName: '',
    role: ''
  };
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Load users on mount
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.manage-users {
  padding: 2rem;
  max-width: 1400px;
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
}

.header h1 {
  color: #333;
  margin: 0;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-primary span {
  font-size: 1.5rem;
  line-height: 1;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #1c1c1c;
  font-size: 1.1rem;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #4CAF50;
}

th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: rgb(255, 255, 255);
  border-bottom: 2px solid #45a049;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
}

tbody tr:hover {
  background: #f0f7f1;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
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

.btn-delete {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.btn-delete:hover {
  background: #d32f2f;
}

.no-users {
  text-align: center;
  padding: 3rem;
  color: #2a2a2a;
  font-size: 1.1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #262626;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.delete-warning {
  color: #f44336;
  font-weight: 600;
  margin: 1rem 0;
}

.delete-note {
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .manage-users {
    padding: 1rem;
  }
  
  .container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .users-table {
    font-size: 0.9rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
  
  .modal {
    width: 95%;
  }
}
</style>
