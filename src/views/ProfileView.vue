<template>
  <div class="profile-page">
    <div class="container">
      <div class="header">
        <h1>Moj Profil</h1>
        <span v-if="userRole" class="role-badge" :class="'role-' + userRole">
          {{ userRole.toUpperCase() }}
        </span>
      </div>

      <div v-if="loading" class="loading">Učitavanje profila...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            {{ userProfile.displayName?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="profile-info">
            <h2>{{ userProfile.displayName || userProfile.name || 'Korisnik' }}</h2>
            <p class="email">{{ userProfile.email }}</p>
          </div>
          <button v-if="!isEditing" @click="startEditing" class="btn-primary">Izmeni podatke</button>
        </div>

        <form
          v-if="isEditing"
          @submit.prevent="saveProfile"
          class="profile-details edit-form"
        >
          <div class="detail-item" v-for="(value, key) in editableFields" :key="key">
            <label :for="key">{{ value.label }}</label>
            <input
              v-if="key !== 'address'"
              :id="key"
              v-model="editForm[key]"
              :type="value.type"
              :placeholder="value.placeholder"
            />
            <textarea
              v-else
              :id="key"
              v-model="editForm[key]"
              rows="3"
              :placeholder="value.placeholder"
            ></textarea>
          </div>

          <div v-if="saveError" class="error-message">{{ saveError }}</div>
          <div v-if="saveSuccess" class="success-message">Profil uspešno ažuriran!</div>

          <div class="form-actions">
            <button type="button" @click="cancelEditing" class="btn-secondary">Otkaži</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Čuvanje...' : 'Sačuvaj' }}
            </button>
          </div>
        </form>

        <div v-else class="profile-details">
          <div class="detail-item">
            <label>Ime</label>
            <p>{{ userProfile.name || 'Nije uneto' }}</p>
          </div>
          <div class="detail-item">
            <label>Prezime</label>
            <p>{{ userProfile.surname || 'Nije uneto' }}</p>
          </div>
          <div class="detail-item">
            <label>Adresa</label>
            <p>{{ userProfile.address || 'Nije uneto' }}</p>
          </div>
          <div class="detail-item">
            <label>Telefon</label>
            <p>{{ userProfile.phone || 'Nije uneto' }}</p>
          </div>
          <div class="detail-item">
            <label>Email</label>
            <p>{{ userProfile.email }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useUserStore } from "@/stores/user";
import { auth, db } from "@/firebase/config";
import { get, ref as dbRef, update } from "firebase/database";
import { updateProfile } from "firebase/auth";

const userStore = useUserStore();
const user = userStore.user;
const userRole = userStore.userRole;

const loading = ref(true);
const error = ref("");
const isEditing = ref(false);
const saving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

const userProfile = ref({
  email: "",
  displayName: "",
  name: "",
  surname: "",
  phone: "",
  address: "",
  role: "",
  createdAt: "",
});

const editForm = ref({
  displayName: "",
  name: "",
  surname: "",
  phone: "",
  address: "",
});

const editableFields = {
  displayName: { label: "Prikazno ime", type: "text", placeholder: "Unesite prikazno ime" },
  name: { label: "Ime", type: "text", placeholder: "Unesite ime" },
  surname: { label: "Prezime", type: "text", placeholder: "Unesite prezime" },
  phone: { label: "Telefon", type: "tel", placeholder: "Unesite broj telefona" },
  address: { label: "Adresa", type: "text", placeholder: "Unesite adresu" },
};

// Učitavanje profila
const fetchProfile = async () => {
  loading.value = true;
  error.value = "";

  try {
    const currentUser = auth.currentUser || user.value;
    if (!currentUser) {
      error.value = "Nijedan korisnik nije prijavljen.";
      return;
    }

    const snapshot = await get(dbRef(db, "users/" + currentUser.uid));
    if (snapshot.exists()) {
      userProfile.value = {
        ...snapshot.val(),
        email: currentUser.email,
      };
    } else {
      error.value = "Profil nije pronađen.";
    }
  } catch (err) {
    console.error("Greška pri učitavanju:", err);
    error.value = "Došlo je do greške pri učitavanju profila.";
  } finally {
    loading.value = false;
  }
};

const startEditing = () => {
  editForm.value = {
    displayName: userProfile.value.displayName || "",
    name: userProfile.value.name || "",
    surname: userProfile.value.surname || "",
    phone: userProfile.value.phone || "",
    address: userProfile.value.address || "",
  };
  isEditing.value = true;
  saveError.value = "";
  saveSuccess.value = false;
};

const cancelEditing = () => {
  isEditing.value = false;
  saveError.value = "";
  saveSuccess.value = false;
};

const saveProfile = async () => {
  saving.value = true;
  saveError.value = "";
  saveSuccess.value = false;

  try {
    const currentUser = auth.currentUser || user.value;
    if (!currentUser) {
      saveError.value = "Nijedan korisnik nije prijavljen.";
      return;
    }

    await updateProfile(currentUser, { displayName: editForm.value.displayName });

    await update(dbRef(db, "users/" + currentUser.uid), {
      ...editForm.value,
      updatedAt: new Date().toISOString(),
    });

    userProfile.value = { ...userProfile.value, ...editForm.value };
    saveSuccess.value = true;

    setTimeout(() => {
      isEditing.value = false;
      saveSuccess.value = false;
    }, 1200);
  } catch (err) {
    console.error("Greška pri čuvanju profila:", err);
    saveError.value = "Nije uspelo čuvanje podataka.";
  } finally {
    saving.value = false;
  }
};

onMounted(fetchProfile);
watch(user, (u) => u && fetchProfile());
</script>

<style scoped>
.profile-page {
  padding: 3rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

.container {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(6px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header h1 {
  color: #fff;
  font-size: 2rem;
  margin: 0;
}

.role-badge {
  padding: 0.6rem 1.1rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 700;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
}

.error-message {
  background: rgba(255, 30, 30, 0.08);
  color: #ffb4b4;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.success-message {
  background: rgba(46, 125, 50, 0.08);
  color: #b8f2c9;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 800;
}

.profile-info h2 {
  color: #fff;
  font-size: 1.5rem;
  margin: 0;
}

.email {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}


.detail-item label {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.detail-item p,
.detail-item input,
.detail-item textarea {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  padding: 1rem;
  font-family: inherit;
}

.detail-item input:focus,
.detail-item textarea:focus {
  outline: none;
  border-color: #5e4caf;
  box-shadow: 0 0 6px rgba(94, 76, 175, 0.4);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.05rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #5e4caf;
  color: #fff;
}

.btn-primary:hover {
  background: #4a3d91;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.edit-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
}
.edit-form .detail-item label {
  font-size: 1.15rem;
}

.edit-form .detail-item input,
.edit-form .detail-item textarea {
  font-size: 1.25rem; /* veći tekst */
  padding: 1.5rem 1.2rem;
}

.edit-form .form-actions {
  margin-top: 2.5rem;
}

.edit-form .btn-primary,
.edit-form .btn-secondary {
  padding: 1.15rem 2.75rem;
  font-size: 1.15rem;
  border-radius: 12px;
}


@media (max-width: 768px) {
  .container {
    padding: 1.5rem;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
