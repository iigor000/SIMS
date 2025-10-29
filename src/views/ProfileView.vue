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
        <!-- URL modal for nicer UX when editing profile photo -->
        <div v-if="showUrlModal" class="modal-overlay" @click.self="closeUrlModal">
          <div class="modal-card" role="dialog" aria-modal="true">
            <h3>Unesite URL profilne slike</h3>
            <input
              ref="modalInput"
              v-model="modalUrl"
              type="url"
              placeholder="Nalepi link do slike (npr. https://...jpg)"
              @keydown.enter.prevent="testAndUseUrl"
            />
            <div class="modal-actions">
              <div class="left">
                <button class="btn-secondary" type="button" @click="closeUrlModal">Otkaži</button>
              </div>
              <div class="right">
                <button class="btn-ghost" type="button" @click="testUrl">Probaj</button>
                <button class="btn-primary btn-confirm" type="button" @click="testAndUseUrl">Koristi URL</button>
              </div>
            </div>
            <div class="modal-preview">
              <div v-if="previewError" class="error-message">{{ previewError }}</div>
              <img v-else-if="previewSrc" :src="previewSrc" alt="Preview" />
              <div v-else class="preview-placeholder">Preview će se pojaviti ovde</div>
            </div>
            <div v-if="previewError" class="modal-hint">
              Mogući razlozi: link nije direktan image URL, zahteva prijavu, ili server blokira hotlinking.
              Pritisnite "Otvori u novom tabu" da testirate URL direktno.
            </div>
          </div>
        </div>
        <div class="profile-header">
          <div class="avatar" @click="triggerFileInput" :class="{ editable: isEditing }">
          <img
            v-if="userProfile.photoURL"
            :src="userProfile.photoURL"
            alt="Profilna slika"
            class="avatar-img"
          />
          <span v-else>
            {{ userProfile.displayName?.charAt(0)?.toUpperCase() || '?' }}
          </span>
          <!-- skriveni input za upload -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="onFileChange"
            style="display: none"
          />
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
import { ref, onMounted, watch, nextTick } from "vue";
import { useUserStore } from "@/stores/user";
import { auth, db } from "@/firebase/config";
import { get, ref as dbRef, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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

const newPhotoFile = ref(null);
const fileInput = ref(null);
const externalPhotoUrl = ref("");

const showUrlModal = ref(false);
const modalUrl = ref("");
const previewSrc = ref("");
const previewError = ref("");

const openUrlModal = () => {
  if (!isEditing.value) return;
  modalUrl.value = externalPhotoUrl.value || "";
  previewSrc.value = externalPhotoUrl.value || "";
  previewError.value = "";
  showUrlModal.value = true;
};

const closeUrlModal = () => {
  showUrlModal.value = false;
};

const modalInput = ref(null);

// (openInNewTab removed) — the 'Open in new tab' button was removed per user request.

const onModalKeydown = (e) => {
  if (e.key === 'Escape') closeUrlModal();
};

// autofocus and escape handling when modal opens
watch(showUrlModal, async (val) => {
  if (val) {
    await nextTick();
    try { modalInput.value && modalInput.value.focus(); } catch (e) {}
    window.addEventListener('keydown', onModalKeydown);
  } else {
    window.removeEventListener('keydown', onModalKeydown);
  }
});

const triggerFileInput = () => {
  // When editing, open the nicer URL modal instead of the prompt.
  openUrlModal();
};

const testUrl = () => {
  const url = (modalUrl.value || '').trim();
  previewError.value = "";
  previewSrc.value = "";
  if (!url) {
    previewError.value = "Unesite validan URL.";
    return;
  }

  // quick image load test
  const img = new Image();
  img.onload = () => {
    previewError.value = "";
    previewSrc.value = url;
  };
  img.onerror = () => {
    previewSrc.value = "";
    previewError.value = "Ne mogu da učitam sliku sa tog URL-a.";
  };
  img.src = url;
};

const testAndUseUrl = () => {
  // try load first, if successful apply; otherwise still attempt to apply but show error
  const url = (modalUrl.value || '').trim();
  if (!url) return;

  const img = new Image();
  img.onload = () => {
    externalPhotoUrl.value = url;
    newPhotoFile.value = null;
    userProfile.value.photoURL = url;
    previewSrc.value = url;
    previewError.value = "";
    closeUrlModal();
  };
  img.onerror = () => {
    previewError.value = "Ne mogu da učitam sliku sa tog URL-a. Ako si siguran, možeš ipak sačuvati, ali možda se neće prikazati.";
    // still set values so user can save if they accept the risk
    externalPhotoUrl.value = url;
    newPhotoFile.value = null;
    userProfile.value.photoURL = url;
  };
  img.src = url;
};

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    newPhotoFile.value = file;
    // clear external URL when a file is chosen
    externalPhotoUrl.value = "";
    userProfile.value.photoURL = URL.createObjectURL(file); // immediately show preview
  }
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

  const currentUser = auth.currentUser || user.value;
  if (!currentUser) {
    saveError.value = "Nijedan korisnik nije prijavljen.";
    saving.value = false;
    return;
  }

  let photoURL = userProfile.value.photoURL;

  try {
    // If external URL provided, prefer it. Otherwise upload selected file (if any).
    if (externalPhotoUrl.value) {
      photoURL = externalPhotoUrl.value;
    } else if (newPhotoFile.value) {
      const storage = getStorage();
      const fileRef = storageRef(storage, `profile_pictures/${currentUser.uid}`);
      await uploadBytes(fileRef, newPhotoFile.value);
      photoURL = await getDownloadURL(fileRef);
    }

    await updateProfile(currentUser, { displayName: editForm.value.displayName, photoURL });

    await update(dbRef(db, "users/" + currentUser.uid), {
      ...editForm.value,
      photoURL,
      updatedAt: new Date().toISOString(),
    });

    userProfile.value = { ...userProfile.value, ...editForm.value, photoURL };
    saveSuccess.value = true;

    setTimeout(() => {
      isEditing.value = false;
      saveSuccess.value = false;
    }, 1200);
  } catch (err) {
    console.error("Greška pri čuvanju profila:", err);
    saveError.value = err?.message || "Nije uspelo čuvanje podataka.";
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

.avatar {
  position: relative;
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
  overflow: hidden;
  cursor: default;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.avatar.editable {
  cursor: pointer;
}

.avatar.editable:hover {
  opacity: 0.8;
  transform: scale(1.03);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Modal styles for URL input */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}
.modal-card {
  background: rgba(20, 18, 30, 0.96);
  padding: 1.25rem;
  border-radius: 10px;
  width: 420px;
  max-width: calc(100% - 32px);
  color: #fff;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  border: 1px solid rgba(94,76,175,0.18);
}
.modal-card h3 { margin: 0 0 0.75rem 0; }
.modal-card input[type="url"] {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  color: #fff;
  margin-bottom: 0.75rem;
}
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}
.modal-actions .left { display: flex; align-items: center; }
.modal-actions .right { display: flex; gap: 0.6rem; }

/* Responsive: stack buttons on very small screens */
@media (max-width: 420px) {
  .modal-actions { flex-direction: column; align-items: stretch; }
  .modal-actions .left, .modal-actions .right { justify-content: stretch; }
  .modal-actions .right button, .modal-actions .left button { width: 100%; }
}

/* Ghost / outline button for 'Probaj' */
.btn-ghost {
  background: transparent;
  color: rgba(255,255,255,0.95);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.03);
  transform: translateY(-1px);
}

/* Emphasized confirm button */
.btn-confirm {
  background: linear-gradient(90deg,#6e56e6,#5e4caf);
  border: none;
}

.modal-actions button {
  min-width: 110px;
  box-sizing: border-box;
  font-size: 1rem; /* unify font size */
  font-weight: 600; /* unify weight */
  line-height: 1.2;
  padding: 0.55rem 0.9rem; /* consistent padding */
  border-radius: 10px;
}
.modal-actions .right button { min-width: 110px; }
.modal-actions .left button { min-width: 110px; }
.modal-preview { min-height:120px; display:flex; align-items:center; justify-content:center; }
.modal-preview img { max-width:100%; max-height:200px; border-radius:6px; }
.preview-placeholder { color: rgba(255,255,255,0.5); }
.modal-hint { color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 0.6rem; }
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
