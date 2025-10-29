<script setup>
import { ref, computed, onMounted } from "vue";
import { getDatabase, ref as dbRef, get, child } from "firebase/database";
import { db } from "@/firebase/config";

const songs = ref([]);
const loading = ref(true);
const searchQuery = ref("");

// Fetch songs from Firebase
onMounted(async () => {
  try {
    const snapshot = await get(child(dbRef(db), "items/song"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      songs.value = Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      }));
      songs.value.sort((a, b) => b.postedDate - a.postedDate);
    }
  } catch (error) {
    console.error("Greška pri učitavanju pesama:", error);
  } finally {
    loading.value = false;
  }
});

// Computed filter
const filteredSongs = computed(() => {
  if (!searchQuery.value.trim()) return songs.value;

  const q = searchQuery.value.toLowerCase();
  return songs.value.filter(song => {
    const nameMatch = song.name?.toLowerCase().includes(q);
    const artistMatch = song.songwriters?.[0]?.name?.toLowerCase().includes(q);
    return nameMatch || artistMatch;
  });
});

// Function for highlighting matched text
const highlightMatch = (text) => {
  if (!searchQuery.value) return text;
  const regex = new RegExp(`(${searchQuery.value})`, "gi");
  return text.replace(regex, '<mark>$1</mark>');
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
          placeholder="🔍 Pretraži pesmu ili izvođača..."
          class="search-input"
        />
        <RouterLink to="/login" class="login-btn">Prijava</RouterLink>
      </div>
    </header>

    <section class="songs">
      <h2>Najnovije pesme</h2>

      <div v-if="loading" class="loading">Učitavanje...</div>

      <div v-else-if="filteredSongs.length > 0" class="song-list">
        <div v-for="song in filteredSongs" :key="song.id" class="song-card">
          <RouterLink
            :to="`/item/song/${song.id}`"
            class="song-title"
            v-html="highlightMatch(song.name)"
          ></RouterLink>
          <p class="artist">
            <RouterLink
              :to="`/item/artist/${song.songwriters?.[0]?.id}`"
              v-html="highlightMatch(song.songwriters?.[0]?.name || 'Nepoznati autor')"
            ></RouterLink>
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
