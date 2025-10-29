<template>
  <div class="manage-users">
    <div class="container">
      <div class="header">
        <h1>Pregled korisnika</h1>
        <button @click="showAddModal = true" class="btn-primary">
          <span>+</span> Dodaj novog korisnika
        </button>
      </div>

      <!-- Users Table -->
      <div v-if="loading" class="loading">Učitavanje korisnika...</div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Ime</th>
              <th>Email</th>
              <th>Uloga</th>
              <th>Datum kreiranja</th>
              <th>Akcije</th>
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
                  🗑️ Obriši
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
            <h2>Dodaj novog korisnika</h2>
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
              <label for="newPassword">Lozinka</label>
              <input
                id="newPassword"
                v-model="newUser.password"
                type="password"
                placeholder="Min. 6 karaktera"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="newDisplayName">Prikazano ime</label>
              <input
                id="newDisplayName"
                v-model="newUser.displayName"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>

            <div class="form-group">
              <label for="newRole">Uloga</label>
              <select id="newRole" v-model="newUser.role" required>
                <option value="" disabled>Izaberi ulogu</option>
                <option value="user">Korisnik</option>
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
            <p>Da li ste sigurni da želite da obrišete ovog korisnika?</p>
            <p class="delete-warning">
              <strong>{{ userToDelete?.displayName || userToDelete?.email }}</strong>
            </p>
            <p class="delete-note">Ova akcija se ne može poništiti.</p>

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
  padding: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  background: rgb(37, 36, 36); /* match app background */
  min-height: calc(100vh - 80px);
  color: #fff;
}

.container {
  /* purple translucent glass container to match theme */
  background: rgba(99,102,241,0.06);
  border-radius: 14px;
  padding: 3rem;
  border: 1px solid rgba(124,58,237,0.18);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgba(75,66,160,0.10);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  gap: 1.25rem;
}

.header h1 {
  color: #f6ecff;
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.4px;
}

.btn-primary {
  background: #6b46c1;
  color: white;
  border: none;
  padding: 0.9rem 1.75rem;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background 0.25s, transform 0.12s;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-primary span {
  font-size: 1.8rem;
  line-height: 1;
}

.loading {
  text-align: center;
  padding: 3.5rem;
  color: rgba(255,255,255,0.9);
  font-size: 1.15rem;
}

.error-message {
  background: rgba(255, 230, 235, 0.06);
  color: #ffb3b3;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid rgba(255,120,120,0.06);
}

.users-table {
  overflow-x: auto;
  margin-top: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(90deg, rgba(124,58,237,0.95), rgba(99,102,241,0.95));
}

th {
  text-align: left;
  padding: 1.5rem 1.25rem;
  font-weight: 700;
  color: rgb(255, 255, 255);
  border-bottom: 2px solid rgba(124,58,237,0.6);
  font-size: 1.05rem;
}

td {
  padding: 1.25rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.92);
  font-size: 1rem;
}

tbody tr:hover {
  background: rgba(255,255,255,0.025);
}

.role-badge {
  display: inline-block;
  padding: 0.45rem 0.9rem;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
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
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.65rem 1.15rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s, transform 0.12s;
}

.btn-delete:hover {
  background: #d32f2f;
}

.no-users {
  text-align: center;
  padding: 3.5rem;
  color: rgba(255,255,255,0.9);
  font-size: 1.15rem;
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
