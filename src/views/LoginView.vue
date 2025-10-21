<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>{{ isLogin ? 'Login' : 'Register' }}</h1>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="displayName">Display Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            placeholder="Enter your username"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="name">First Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter your first name"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="surname">Surname</label>
          <input
            id="surname"
            v-model="surname"
            type="text"
            placeholder="Enter your surname"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="phone">Phone</label>
          <input
            id="phone"
            v-model="phone"
            type="text"
            placeholder="Enter your phone number"
            required
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="address">Address</label>
          <input
            id="address"
            v-model="address"
            type="text"
            placeholder="Enter your address"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register') }}
        </button>
      </form>

      <div class="toggle-mode">
        <p>
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <a @click.prevent="toggleMode" href="#">
            {{ isLogin ? 'Register' : 'Login' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { ref as dbRef, set, get } from 'firebase/database';
import { auth, db } from '../firebase/config';

const router = useRouter();

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const displayName = ref('');
const error = ref('');
const name = ref('');
const surname = ref('');
const phone = ref('');
const address = ref('');
const loading = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  error.value = '';
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  displayName.value = '';
  name.value = '';
  surname.value = '';
  phone.value = '';
  address.value = '';
};

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (isLogin.value) {
      // Login
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
      
      // Check if user is deleted
      const userSnapshot = await get(dbRef(db, 'users/' + userCredential.user.uid));
      const userData = userSnapshot.val();
      
      if (userData && userData.deleted) {
        // User is deleted, sign them out and show error
        await auth.signOut();
        error.value = 'This account has been deleted';
        loading.value = false;
        return;
      }
      
      router.push('/');
    } else {
      // Register
      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        loading.value = false;
        return;
      }

      if (password.value.length < 6) {
        error.value = 'Password must be at least 6 characters';
        loading.value = false;
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName.value
      });

      // Store user data in Realtime Database with role
      await set(dbRef(db, 'users/' + userCredential.user.uid), {
        email: email.value,
        displayName: displayName.value,
        role: 'user',
        name: name.value,
        surname: surname.value,
        phone: phone.value,
        address: address.value,
        createdAt: new Date().toISOString()
      });

      router.push('/');
    }
  } catch (err) {
    console.error('Auth error:', err);
    switch (err.code) {
      case 'auth/email-already-in-use':
        error.value = 'Email already in use';
        break;
      case 'auth/invalid-email':
        error.value = 'Invalid email address';
        break;
      case 'auth/user-not-found':
        error.value = 'User not found';
        break;
      case 'auth/wrong-password':
        error.value = 'Incorrect password';
        break;
      case 'auth/invalid-credential':
        error.value = 'Invalid credentials';
        break;
      default:
        error.value = err.message || 'An error occurred';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #1c1c1c;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

input,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #4CAF50;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.toggle-mode {
  text-align: center;
  margin-top: 20px;
}

.toggle-mode p {
  color: #666;
  margin: 0;
}

.toggle-mode a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.toggle-mode a:hover {
  text-decoration: underline;
}
</style>
