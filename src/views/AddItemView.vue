<template>
  <div class="add-item">
    <h1>➕ Dodaj novi sadržaj</h1>

    <!-- samo admin/editor može dodavati -->
    <div v-if="!canAdd" class="error-msg">
      ⛔ Nemate dozvolu za dodavanje sadržaja.
    </div>

    <div v-else>
      <!-- izbor tipa -->
      <div class="form-group">
        <label>Tip sadržaja:</label>
        <select v-model="itemType">
          <option disabled value="">-- Izaberi tip --</option>
          <option value="song">🎵 Pesma</option>
          <option value="album">💿 Album</option>
          <option value="artist">🎤 Izvođač</option>
          <option value="band">🎸 Bend</option>
          <option value="performance">🎭 Nastup</option>
        </select>
      </div>

      <div v-if="itemType">
        <!-- zajednička polja -->
        <div class="form-group">
          <label>Naziv:</label>
          <input v-model="formData.name" placeholder="Unesite naziv" />
        </div>

        <div class="form-group">
          <label>Opis:</label>
          <textarea v-model="formData.description" placeholder="Opis..." />
        </div>

        <!-- ===================== 🎵 SONG ===================== -->
        <template v-if="itemType === 'song'">
          <div class="form-group">
            <label>Trajanje:</label>
            <input v-model="formData.duration" placeholder="npr. 4:12" />
          </div>

          <!-- bira se bend ili izvođač -->
          <div class="form-group">
            <label>Izvođač / Bend:</label>
            <select v-model="formData.performerId">
              <option value="">Bez izvođača</option>
              <optgroup label="Izvođači">
                <option v-for="a in artists" :key="a.id" :value="`artist:${a.id}`">{{ a.name }}</option>
              </optgroup>
              <optgroup label="Bendovi">
                <option v-for="b in bands" :key="b.id" :value="`band:${b.id}`">{{ b.name }}</option>
              </optgroup>
            </select>
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
            <div v-for="(g, i) in formData.genres || []" :key="i">
              <input v-model="formData.genres[i]" placeholder="npr. Rock" />
            </div>
            <button @click="addGenre" type="button">+ Dodaj žanr</button>
          </div>

          <!-- songwriters -->
          <div class="form-group">
            <label>Songwriteri:</label>
            <div v-for="(s, i) in formData.songwriters || []" :key="i">
              <input v-model="s.name" placeholder="Ime songwritera" />
            </div>
            <button @click="addSongwriter" type="button">+ Dodaj songwritera</button>
          </div>

          <!-- producers -->
          <div class="form-group">
            <label>Producenti:</label>
            <div v-for="(p, i) in formData.producers || []" :key="i">
              <input v-model="p.name" placeholder="Ime producenta" />
            </div>
            <button @click="addProducer" type="button">+ Dodaj producenta</button>
          </div>

          <div class="form-group">
            <label>Tekst pjesme:</label>
            <textarea v-model="formData.lyrics" placeholder="Tekst pjesme..." />
          </div>
        </template>

        <!-- ===================== 💿 ALBUM ===================== -->
        <template v-if="itemType === 'album'">
          <div class="form-group">
            <label>Izvođač / Bend (nosilac albuma):</label>
            <select v-model="formData.artistId">
              <option value="">Izaberi</option>
              <optgroup label="Izvođači">
                <option v-for="a in artists" :key="a.id" :value="a.id">{{ a.name }}</option>
              </optgroup>
              <optgroup label="Bendovi">
                <option v-for="b in bands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label>Izdavač:</label>
            <input v-model="formData.label" placeholder="EMI, Universal..." />
          </div>

          <div class="form-group">
            <label>Datum izlaska:</label>
            <input type="date" v-model="formData.releaseDate" />
          </div>

          <div class="form-group">
            <label>Žanrovi:</label>
            <div v-for="(g, i) in formData.genres || []" :key="i">
              <input v-model="formData.genres[i]" placeholder="npr. Rock" />
            </div>
            <button @click="addGenre" type="button">+ Dodaj žanr</button>
          </div>
        </template>

        <!-- ===================== 🎤 ARTIST ===================== -->
        <template v-if="itemType === 'artist'">
          <div class="form-group row-2">
            <div>
              <label>Datum rođenja:</label>
              <input type="date" v-model="formData.birthDate" />
            </div>
            <div>
              <label>Mjesto rođenja:</label>
              <input v-model="formData.birthPlace" placeholder="Grad, država" />
            </div>
          </div>
        </template>

        <!-- ===================== 🎸 BAND ===================== -->
        <template v-if="itemType === 'band'">
          <div class="form-group">
            <label>Grad / Porijeklo:</label>
            <input v-model="formData.originCity" placeholder="London, UK" />
          </div>

          <div class="form-group">
            <label>Datum osnivanja:</label>
            <input type="date" v-model="formData.formedDate" />
          </div>

          <div class="form-group">
            <label>Žanrovi:</label>
            <div v-for="(g, i) in formData.genres || []" :key="i">
              <input v-model="formData.genres[i]" placeholder="npr. Rock" />
            </div>
            <button @click="addGenre" type="button">+ Dodaj žanr</button>
          </div>

          <!-- izbor postojećih izvođača -->
          <div class="form-group">
            <label>Članovi benda:</label>
            <div v-for="(m, i) in formData.members || []" :key="i" class="member-row">
              <select v-model="m.artistId">
                <option value="">Izaberi izvođača</option>
                <option v-for="a in artists" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
              <input v-model="m.role" placeholder="Uloga (Vocals...)" />
              <input type="date" v-model="m.joinDate" />
              <button type="button" class="btn-small" @click="removeMember(i)">Ukloni</button>
            </div>
            <button @click="addMember" type="button">+ Dodaj člana</button>
          </div>
        </template>

        <!-- ===================== 🎭 PERFORMANCE ===================== -->
        <template v-if="itemType === 'performance'">
          <div class="form-group">
            <label>Datum nastupa:</label>
            <input type="date" v-model="formData.performanceDate" />
          </div>

          <!-- samo performance ima location -->
          <div class="form-group">
            <label>Lokacija:</label>
            <input v-model="formData.location.address" placeholder="Adresa" />
            <input v-model="formData.location.city" placeholder="Grad" />
            <input v-model="formData.location.country" placeholder="Država" />
            <input v-model="formData.location.venue" placeholder="Venue (npr. Wembley)" />
          </div>

          <!-- performers: bendovi + izvođači -->
          <div class="form-group">
            <label>Izvođači (performers):</label>
            <div v-for="(p, i) in formData.performers || []" :key="i" class="member-row">
              <select v-model="p.sourceId">
                <option value="">Izaberi izvođača/bend</option>
                <optgroup label="Izvođači">
                  <option v-for="a in artists" :key="a.id" :value="`artist:${a.id}`">{{ a.name }}</option>
                </optgroup>
                <optgroup label="Bendovi">
                  <option v-for="b in bands" :key="b.id" :value="`band:${b.id}`">{{ b.name }}</option>
                </optgroup>
              </select>
              <button type="button" class="btn-small" @click="removePerformer(i)">Ukloni</button>
            </div>
            <button @click="addPerformer" type="button">+ Dodaj izvođača</button>
          </div>

          <!-- set lista -->
          <div class="form-group">
            <label>Set lista (pjesme):</label>
            <div v-for="(s, i) in formData.setlist || []" :key="i" class="member-row">
              <select v-model="s.songId">
                <option value="">Izaberi pjesmu</option>
                <option v-for="sg in songs" :key="sg.id" :value="sg.id">{{ sg.name }}</option>
              </select>
              <input v-model="s.name" placeholder="Naziv (ako želiš promijeniti)" />
              <button type="button" class="btn-small" @click="removeSetlistItem(i)">Ukloni</button>
            </div>
            <button @click="addSongToSetlist" type="button">+ Dodaj pjesmu</button>
          </div>

          <div class="form-group row-2">
            <div>
              <label>Cijena karte:</label>
              <input v-model="formData.ticketPrice" placeholder="£10" />
            </div>
            <div>
              <label>Broj prisutnih:</label>
              <input type="number" v-model="formData.attendance" placeholder="72000" />
            </div>
          </div>
        </template>

        <!-- review obavezno za editora -->
        <div v-if="userStore.userRole === 'editor'">
          <h3>📝 Recenzija</h3>
          <div class="form-group">
            <label>Tekst recenzije:</label>
            <textarea v-model="formData.reviewText" placeholder="Unesi recenziju..."></textarea>
          </div>
          <div class="form-group">
            <label>Ocjena (1–5):</label>
            <input type="number" min="1" max="5" v-model="formData.rating" />
          </div>
        </div>

        <button :disabled="saving" @click="saveItem">
          {{ saving ? "Čuvanje..." : "💾 Sačuvaj" }}
        </button>

        <p v-if="success" class="success-msg">✅ Uspješno sačuvano!</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getDatabase, ref as dbRef, get, push, set, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/config";
import { useUserStore } from "@/stores/user";

const auth = getAuth();
const userStore = useUserStore();

const itemType = ref("");
const formData = ref({});
const albums = ref([]);
const artists = ref([]);
const bands = ref([]);
const songs = ref([]);
const saving = ref(false);
const success = ref(false);

// ✅ Učitavanje postojećih podataka da bi se mogli birati u formi
onMounted(async () => {
  const dbInstance = getDatabase();
  const itemsRef = dbRef(dbInstance, "items");
  const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    albums.value = data.album ? Object.entries(data.album).map(([id, v]) => ({ id, name: v.name })) : [];
    artists.value = data.artist ? Object.entries(data.artist).map(([id, v]) => ({ id, name: v.name })) : [];
    bands.value = data.band ? Object.entries(data.band).map(([id, v]) => ({ id, name: v.name })) : [];
    songs.value = data.song ? Object.entries(data.song).map(([id, v]) => ({ id, name: v.name })) : [];
  }
  // inicijalne vrijednosti
  formData.value.location = {};
});

const canAdd = computed(() => userStore.userRole === "admin" || userStore.userRole === "editor");

// 🔸 helperi za dodavanje u formu
const addGenre = () => {
  if (!formData.value.genres) formData.value.genres = [];
  formData.value.genres.push("");
};
const addProducer = () => {
  if (!formData.value.producers) formData.value.producers = [];
  formData.value.producers.push({ id: crypto.randomUUID(), name: "" });
};
const addSongwriter = () => {
  if (!formData.value.songwriters) formData.value.songwriters = [];
  formData.value.songwriters.push({ id: crypto.randomUUID(), name: "" });
};
const addMember = () => {
  if (!formData.value.members) formData.value.members = [];
  formData.value.members.push({ artistId: "", role: "", joinDate: "" });
};
const removeMember = (i) => formData.value.members.splice(i, 1);
const addPerformer = () => {
  if (!formData.value.performers) formData.value.performers = [];
  formData.value.performers.push({ sourceId: "" });
};
const removePerformer = (i) => formData.value.performers.splice(i, 1);
const addSongToSetlist = () => {
  if (!formData.value.setlist) formData.value.setlist = [];
  formData.value.setlist.push({ songId: "", name: "" });
};
const removeSetlistItem = (i) => formData.value.setlist.splice(i, 1);

// 🔸 validacija forme
const isFormValid = computed(() => {
  if (!itemType.value || !formData.value.name) return false;
  if (userStore.userRole === "editor" && !formData.value.reviewText) return false;
  return true;
});

// 🔹 glavna funkcija za upis
const saveItem = async () => {
  if (!isFormValid.value) {
    alert("Molimo popunite sva obavezna polja.");
    return;
  }

  saving.value = true;
  const dbInstance = getDatabase();
  const newItemRef = push(dbRef(dbInstance, `items/${itemType.value}`));
  const id = newItemRef.key;
  const now = Date.now();

  try {
    let newItem = { ...formData.value, postedBy: userStore.user?.email || "unknown", postedDate: now };

    // 🟩 SONG
    if (itemType.value === "song") {
      // ako je izabran album → dodaj referencu
      if (formData.value.albumId) {
        const albumSnap = await get(dbRef(dbInstance, `items/album/${formData.value.albumId}`));
        if (albumSnap.exists()) {
          newItem.album = { id: formData.value.albumId, name: albumSnap.val().name };
          const songRef = { id, name: formData.value.name, duration: formData.value.duration };
          const albumSongsRef = dbRef(dbInstance, `items/album/${formData.value.albumId}/songs`);
          const albumSongsSnap = await get(albumSongsRef);
          const existing = albumSongsSnap.exists() ? Object.values(albumSongsSnap.val()) : [];
          await set(albumSongsRef, [...existing, songRef]);
        }
      }

      // ako je izabran performer (band ili artist) → dodaj referencu kod njih
      if (formData.value.performerId) {
        const [type, performerId] = formData.value.performerId.split(":");
        const performerRef = dbRef(dbInstance, `items/${type}/${performerId}/songs`);
        const performerSnap = await get(performerRef);
        const existing = performerSnap.exists() ? Object.values(performerSnap.val()) : [];
        await set(performerRef, [...existing, { id, name: formData.value.name }]);
      }
    }

    // 🟩 BAND
    if (itemType.value === "band") {
      // kod svakog člana dodaj referencu na bend
      if (formData.value.members?.length) {
        for (const member of formData.value.members) {
          if (!member.artistId) continue;
          const artistRef = dbRef(dbInstance, `items/artist/${member.artistId}/bands`);
          const snap = await get(artistRef);
          const existing = snap.exists() ? Object.values(snap.val()) : [];
          await set(artistRef, [...existing, { id, name: formData.value.name }]);
        }
      }
    }

    // 🟩 PERFORMANCE
    if (itemType.value === "performance") {
      // performers: konvertuj sourceId u {id, name, type}
      if (formData.value.performers?.length) {
        const resolved = [];
        for (const p of formData.value.performers) {
          if (!p.sourceId) continue;
          const [type, pid] = p.sourceId.split(":");
          const snap = await get(dbRef(dbInstance, `items/${type}/${pid}`));
          if (snap.exists()) resolved.push({ id: pid, name: snap.val().name, type });
        }
        newItem.performers = resolved;
      }

      // setlist: spoji id i naziv
      if (formData.value.setlist?.length) {
        const setlistResolved = [];
        for (const s of formData.value.setlist) {
          if (!s.songId) continue;
          const snap = await get(dbRef(dbInstance, `items/song/${s.songId}`));
          if (snap.exists()) setlistResolved.push({ id: s.songId, name: snap.val().name });
        }
        newItem.setlist = setlistResolved;
      }

      newItem.location = formData.value.location || {};
    }

    // 🟩 EDITOR → automatski pravi review
    if (userStore.userRole === "editor") {
      const reviewRef = push(dbRef(dbInstance, "reviews"));
      await set(reviewRef, {
        itemId: id,
        itemName: formData.value.name,
        itemType: itemType.value,
        rating: formData.value.rating || null,
        reviewText: formData.value.reviewText,
        status: "pending",
        createdAt: now,
        userId: userStore.user?.uid || "",
        createdBy: userStore.user?.uid || "",
        viewCount: 0,
      });
    }

    // 🟩 upis novog itema
    await set(newItemRef, newItem);

    success.value = true;
    formData.value = {};
    itemType.value = "";
  } catch (err) {
    console.error("❌ Greška pri čuvanju:", err);
    alert("Došlo je do greške prilikom čuvanja.");
  } finally {
    saving.value = false;
  }
};
</script>

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
  margin-bottom: 0.4rem;
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
.error-msg {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 2rem auto;
}
.member-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.btn-small {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border-radius: 4px;
  background: #e53935;
}
.btn-small:hover {
  background: #c62828;
}
</style>
