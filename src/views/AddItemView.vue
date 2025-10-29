<script setup>
import { ref, onMounted, computed } from "vue";
import { getDatabase, ref as dbRef, get, push, set } from "firebase/database";
import { db } from "@/firebase/config";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const itemType = ref(""); // song, album, artist, band, performance
const formData = ref({});
const genres = ref([]);
const albums = ref([]);
const artists = ref([]);
const bands = ref([]);
const saving = ref(false);
const success = ref(false);

// 🔹 Učitaj postojeće albume, žanrove, izvođače, bendove
onMounted(async () => {
  const dbInstance = getDatabase();
  const itemsRef = dbRef(dbInstance, "items");

  try {
    const snapshot = await get(itemsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();

      albums.value = data.album ? Object.entries(data.album).map(([id, val]) => ({ id, name: val.name })) : [];
      artists.value = data.artist ? Object.entries(data.artist).map(([id, val]) => ({ id, name: val.name })) : [];
      bands.value = data.band ? Object.entries(data.band).map(([id, val]) => ({ id, name: val.name })) : [];
      genres.value = Array.from(new Set((data.song ? Object.values(data.song).flatMap(s => s.genres || []) : [])));
    }
  } catch (e) {
    console.error("Greška pri učitavanju postojećih podataka:", e);
  }
});

const addGenre = () => {
  if (!formData.value.genres) formData.value.genres = [];
  formData.value.genres.push("");
};

const addProducer = () => {
  if (!formData.value.producers) formData.value.producers = [];
  formData.value.producers.push({ name: "" });
};

const addSongwriter = () => {
  if (!formData.value.songwriters) formData.value.songwriters = [];
  formData.value.songwriters.push({ name: "" });
};

const addPerformer = () => {
  if (!formData.value.performers) formData.value.performers = [];
  formData.value.performers.push({ name: "", type: "artist" });
};

const addSongToSetlist = () => {
  if (!formData.value.setlist) formData.value.setlist = [];
  formData.value.setlist.push({ name: "" });
};

// 🔹 Dinamičko polje validacije
const isFormValid = computed(() => {
  if (!itemType.value) return false;
  if (!formData.value.name) return false;
  if (itemType.value === "song" && (!formData.value.genres?.length || !formData.value.duration)) return false;
  return true;
});

// 🔹 Sačuvaj novi item
const saveItem = async () => {
  if (!isFormValid.value) {
    alert("Molimo popunite sva obavezna polja.");
    return;
  }

  try {
    saving.value = true;
    const dbInstance = getDatabase();
    const newItemRef = push(dbRef(dbInstance, `items/${itemType.value}`));

    const newItem = {
      ...formData.value,
      postedBy: userStore.user?.email || "unknown",
      postedDate: Date.now(),
    };

    await set(newItemRef, newItem);

    // Ako je editor → kreiraj recenziju automatski
    if (userStore.userRole === "editor" && formData.value.reviewText) {
      const newReviewRef = push(dbRef(dbInstance, "reviews"));
      await set(newReviewRef, {
        itemId: newItemRef.key,
        itemName: formData.value.name,
        itemType: itemType.value,
        mediaType: formData.value.mediaType || "",
        rating: formData.value.rating || null,
        reviewText: formData.value.reviewText,
        status: "pending",
        userId: userStore.user?.uid,
        createdAt: Date.now(),
        viewCount: 0,
      });
    }

    success.value = true;
    formData.value = {};
    itemType.value = "";
  } catch (e) {
    console.error("Greška pri čuvanju:", e);
    alert("Došlo je do greške prilikom čuvanja.");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="add-item">
    <h1>➕ Dodaj novi sadržaj</h1>

    <div class="form-group">
      <label>Tip sadržaja:</label>
      <select v-model="itemType">
        <option disabled value="">-- Izaberi tip --</option>
        <option value="song">🎵 Pesma</option>
        <option value="album">💿 Album</option>
        <option value="artist">🎤 Izvođač</option>
        <option value="band">🎸 Bend</option>
        <option value="performance">🎭 Izvođenje / Nastup</option>
      </select>
    </div>

    <div v-if="itemType">
      <div class="form-group">
        <label>Naziv:</label>
        <input v-model="formData.name" placeholder="Unesite naziv" />
      </div>

      <div class="form-group">
        <label>Opis:</label>
        <textarea v-model="formData.description" placeholder="Opis sadržaja"></textarea>
      </div>

      <!-- POLJA ZA PESMU -->
      <template v-if="itemType === 'song'">
        <div class="form-group">
          <label>Trajanje:</label>
          <input v-model="formData.duration" placeholder="npr. 4:12" />
        </div>

        <div class="form-group">
          <label>Album:</label>
          <select v-model="formData.albumId">
            <option value="">Solo izdanje</option>
            <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Žanrovi:</label>
          <div v-for="(genre, i) in formData.genres || []" :key="i">
            <input v-model="formData.genres[i]" placeholder="npr. Rock" />
          </div>
          <button @click="addGenre" type="button">+ Dodaj žanr</button>
        </div>

        <div class="form-group">
          <label>Songwriteri:</label>
          <div v-for="(s, i) in formData.songwriters || []" :key="i">
            <input v-model="s.name" placeholder="Ime songwritera" />
          </div>
          <button @click="addSongwriter" type="button">+ Dodaj songwritera</button>
        </div>

        <div class="form-group">
          <label>Producenti:</label>
          <div v-for="(p, i) in formData.producers || []" :key="i">
            <input v-model="p.name" placeholder="Ime producenta" />
          </div>
          <button @click="addProducer" type="button">+ Dodaj producenta</button>
        </div>

        <div class="form-group">
          <label>Tekst pesme:</label>
          <textarea v-model="formData.lyrics" placeholder="Unesite tekst pesme..."></textarea>
        </div>
      </template>

      <!-- POLJA ZA IZVOĐENJE -->
      <template v-if="itemType === 'performance'">
        <div class="form-group">
          <label>Lokacija (adresa, grad, država):</label>
          <input v-model="formData.location.address" placeholder="Adresa" />
          <input v-model="formData.location.city" placeholder="Grad" />
          <input v-model="formData.location.country" placeholder="Država" />
        </div>

        <div class="form-group">
          <label>Datum izvođenja:</label>
          <input type="date" v-model="formData.performanceDate" />
        </div>

        <div class="form-group">
          <label>Izvođači:</label>
          <div v-for="(perf, i) in formData.performers || []" :key="i">
            <input v-model="perf.name" placeholder="Ime izvođača ili benda" />
          </div>
          <button @click="addPerformer" type="button">+ Dodaj izvođača</button>
        </div>

        <div class="form-group">
          <label>Set lista:</label>
          <div v-for="(song, i) in formData.setlist || []" :key="i">
            <input v-model="song.name" placeholder="Naziv pesme" />
          </div>
          <button @click="addSongToSetlist" type="button">+ Dodaj pesmu u setlistu</button>
        </div>

        <div class="form-group">
          <label>Cena karte (£, €):</label>
          <input v-model="formData.ticketPrice" placeholder="10€" />
        </div>

        <div class="form-group">
          <label>Broj prisutnih:</label>
          <input type="number" v-model="formData.attendance" placeholder="72000" />
        </div>
      </template>

      <!-- REVIJA AKO JE EDITOR -->
      <div v-if="userStore.userRole === 'editor'">
        <h3>📝 Recenzija</h3>
        <div class="form-group">
          <label>Tekst recenzije:</label>
          <textarea v-model="formData.reviewText" placeholder="Unesi recenziju..."></textarea>
        </div>
        <div class="form-group">
          <label>Ocena (1–5):</label>
          <input type="number" v-model="formData.rating" min="1" max="5" />
        </div>
      </div>

      <button :disabled="saving" @click="saveItem">
        {{ saving ? "Čuvanje..." : "💾 Sačuvaj" }}
      </button>

      <p v-if="success" class="success-msg">✅ Uspešno sačuvano!</p>
    </div>
  </div>
</template>

<style scoped>
.add-item {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
h1 {
  color: #4caf50;
  text-align: center;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.3rem;
}
input, textarea, select {
  width: 100%;
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
button:hover {
  background: #43a047;
}
.success-msg {
  color: #388e3c;
  font-weight: 600;
  margin-top: 1rem;
}
</style>
