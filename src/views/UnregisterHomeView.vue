<script setup>
import { ref, computed, onMounted } from "vue";
import { getDatabase, ref as dbRef, get, child } from "firebase/database";
import { db } from "@/firebase/config";
import { useAuth } from "@/composables/useAuth";

const { user } = useAuth();
const songs = ref([]);
const loading = ref(true);
const searchQuery = ref("");

const parsePerformer = (performerId) => {
  if (!performerId || typeof performerId !== "string" || !performerId.includes(":"))
    return null;
  const [type, id] = performerId.split(":");
  return { type, id };
};

const fetchPerformerName = async (performerId) => {
  const parsed = parsePerformer(performerId);
  if (!parsed) return null;

  try {
    const performerRef = child(dbRef(db), `items/${parsed.type}/${parsed.id}`);
    const snapshot = await get(performerRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return data.name || null;
    }
  } catch (error) {
    console.error("Greška pri učitavanju izvođača:", error);
  }
  return null;
};

onMounted(async () => {
  try {
    const snapshot = await get(child(dbRef(db), "items/song"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const songsArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      for (const song of songsArray) {
        if (song.performerId) {
          const performerName = await fetchPerformerName(song.performerId);
          song.performerName = performerName;
          const parsed = parsePerformer(song.performerId);
          song.performerType = parsed?.type || null;
          song.performerKey = parsed?.id || null;
        }
      }

      songs.value = songsArray.sort((a, b) => b.postedDate - a.postedDate);
    }
  } catch (error) {
    console.error("Greška pri učitavanju pesama:", error);
  } finally {
    loading.value = false;
  }
});

const filteredSongs = computed(() => {
  if (!searchQuery.value.trim()) return songs.value;

  const q = searchQuery.value.toLowerCase();
  return songs.value.filter((song) => {
    const nameMatch = song.name?.toLowerCase().includes(q);
    const performerMatch = song.performerName?.toLowerCase().includes(q);
    const songwriterMatch = song.songwriters?.[0]?.name?.toLowerCase().includes(q);
    return nameMatch || performerMatch || songwriterMatch;
  });
});

const highlightMatch = (text) => {
  if (!text || !searchQuery.value) return text;
  const regex = new RegExp(`(${searchQuery.value})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
};
</script>

<template>
  <div class="home">
    <header class="header">
      <h1>🎵 Dobrodošli na SIMS</h1>

      <div class="right-header">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Pretraži pesmu, izvođača ili bend..."
          class="search-input"
        />
        <RouterLink v-if="!user" to="/login" class="login-btn">Prijava</RouterLink>
      </div>
    </header>

    <section class="songs">
      <h2>Najnovije pesme</h2>

      <div v-if="loading" class="loading">Učitavanje...</div>

      <div v-else-if="filteredSongs.length > 0" class="song-list">
        <div v-for="song in filteredSongs" :key="song.id" class="song-card">
          <!-- Naziv pesme -->
          <RouterLink
            :to="`/item/song/${song.id}`"
            class="song-title"
            v-html="highlightMatch(song.name)"
          ></RouterLink>

          <!-- Izvođač (ime iz baze) -->
          <p class="artist">
            <template v-if="song.performerName && song.performerType && song.performerKey">
              <RouterLink
                :to="`/item/${song.performerType === 'band' ? 'band' : 'artist'}/${song.performerKey}`"
                v-html="highlightMatch(song.performerName)"
              ></RouterLink>
            </template>
            <span v-else> Nepoznati izvođač</span>
          </p>
        </div>
      </div>

      <div v-else class="no-songs">Nema pesama koje se poklapaju 🎶</div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #4a514bff;
}

h2 {
  color: #4a514bff;
}

.right-header {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  width: 260px;
  outline: none;
}
.search-input:focus {
  border-color: #4caf50;
  box-shadow: 0 0 3px #4caf50;
}

.login-btn {
  background: #4caf50;
  color: white;
  text-decoration: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
}
.login-btn:hover {
  background: #43a047;
}

.songs {
  margin-top: 2rem;
  text-align: left;
}
.song-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.song-card {
  background: #fff;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.song-title {
  font-weight: bold;
  color: #4caf50;
  text-decoration: none;
  font-size: 1.1rem;
}
.song-title:hover {
  text-decoration: underline;
}
.artist {
  margin: 0.3rem 0 0 0;
  color: #666;
  font-style: italic;
}
.artist a {
  color: #555;
  text-decoration: none;
}
.artist a:hover {
  text-decoration: underline;
}
.loading {
  text-align: center;
  color: #777;
}
.no-songs {
  text-align: center;
  color: #aaa;
}
mark {
  background-color: #97ef87ff;
  color: black;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
