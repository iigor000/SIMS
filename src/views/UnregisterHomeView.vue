<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { getDatabase, ref as dbRef, get, child } from "firebase/database";
import { db } from "@/firebase/config";

const songs = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const searchInput = ref(null);
const genreListRef = ref(null);
const popularListRef = ref(null);

function scrollContainer(containerRef, direction = 1) {
  const el = containerRef.value;
  if (!el) return;
  const amount = Math.round(el.clientWidth * 0.7);
  const newScrollLeft = el.scrollLeft + direction * amount;

  el.scrollTo({
    left: newScrollLeft,
    behavior: "smooth",
  });
}



// simple genre gallery (name + color gradients). If you have images, replace gradient with `background-image`.
const genres = ref([
  { id: 'pop', name: 'Pop', from: '#ff9a9e', to: '#fad0c4' },
  { id: 'rock', name: 'Rock', from: '#a18cd1', to: '#fbc2eb' },
  { id: 'hiphop', name: 'Hip Hop', from: '#f6d365', to: '#fda085' },
  { id: 'electronic', name: 'Electronic', from: '#89f7fe', to: '#66a6ff' },
  { id: 'jazz', name: 'Jazz', from: '#cfd9df', to: '#e2ebf0' }
]);

function filterByGenre(g) {
  // for now, set the search query to the genre name as a quick filter
  searchQuery.value = g.name;
  // focus the input if available
  if (searchInput.value && typeof searchInput.value.focus === 'function') {
    searchInput.value.focus();
  }
}

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

// Compute most popular hits of the week (best-effort using available fields)
const popularSongs = computed(() => {
  const getPopularity = (s) => {
    // use whichever metric exists; fallback to 0
    return (
      s.plays || s.playCount || s.views || s.popularity || s.rating || 0
    );
  };

  return [...songs.value]
    .filter(Boolean)
    .sort((a, b) => getPopularity(b) - getPopularity(a) || (b.postedDate || 0) - (a.postedDate || 0))
    .slice(0, 6);
});

// Function for highlighting matched text
const highlightMatch = (text) => {
  if (!searchQuery.value) return text;
  const regex = new RegExp(`(${searchQuery.value})`, "gi");
  return text.replace(regex, '<mark>$1</mark>');
};
</script>

<template>
  <div class="page-bg">
    <div class="home">
              <h1>🎵 Dobrodošli 🎵</h1>


      <!-- Popular hits of the week (horizontal) -->
      <!-- Genre gallery (images / gradients with genre button) -->
      <section class="genres">
        <h2>Žanrovi</h2>
        <div class="scroll-wrap">
          <button class="scroll-btn left" aria-label="Scroll left" @click="scrollContainer(genreListRef, -1)">‹</button>
          <div class="genre-list" ref="genreListRef">
            <div v-for="g in genres" :key="g.id" class="genre-card" :style="{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }">
              <div class="genre-meta">
                <div class="genre-name">{{ g.name }}</div>
                <button class="genre-btn" @click.prevent="filterByGenre(g)">Prikaži</button>
              </div>
            </div>
          </div>
          <button class="scroll-btn right" aria-label="Scroll right" @click="scrollContainer(genreListRef, 1)">›</button>
        </div>
      </section>

      <section v-if="popularSongs.length" class="popular">
        <h2>Najpopularnije</h2>
        <div class="scroll-wrap">
          <button class="scroll-btn left" aria-label="Scroll left" @click="scrollContainer(popularListRef, -1)">‹</button>
          <div class="popular-list" ref="popularListRef">
            <div v-for="song in popularSongs" :key="song.id" class="popular-card">
              <RouterLink :to="`/item/song/${song.id}`" class="popular-title">
                {{ song.name }}
              </RouterLink>
              <RouterLink :to="`/item/artist/${song.songwriters?.[0]?.id}`" class="popular-artist">
                {{ song.songwriters?.[0]?.name || 'Nepoznati autor' }}
              </RouterLink>
            </div>
          </div>
          <button class="scroll-btn right" aria-label="Scroll right" @click="scrollContainer(popularListRef, 1)">›</button>
        </div>
      </section>

      <!-- Search header -->
      <header class="header">
        <h2>Pretraži muziku</h2>
        <div class="right-header">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Pretraži pesmu ili izvođača..."
            class="search-input"
            ref="searchInput"
          />
          <!-- Login button removed for unregistered home view -->
        </div>
      </header>


      <!-- Remaining songs list -->
      <section class="songs">

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
  </div>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

.page-bg {
  min-height: 100vh;
  background: rgb(37, 36, 36);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1rem;
}

.home { /* ensure text contrasts on purple background */
  color: #fff;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #fff;
}

h2 {
  color: #f3e5f5;
}

.right-header {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.65rem 1.1rem;
  border-radius: 10px;
  border: 1px solid rgba(30,136,229,0.18);
  font-size: 1.05rem;
  width: 420px; /* made wider for better visibility */
  max-width: 100%;
  outline: none;
  background: rgba(30,136,229,0.08); /* translucent blue */
  color: #fff;
  backdrop-filter: blur(4px);
}
.search-input:focus {
  border-color: rgba(30,136,229,0.8);
  box-shadow: 0 0 6px rgba(30,136,229,0.18);
}
.search-input::placeholder { color: rgba(255,255,255,0.75); }
.popular {
  margin-bottom: 1.5rem;
  text-align: left;
}
.popular h2 {
  margin: 0 0 0.75rem 0;
  color: #f3e5f5;
}
.popular-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.popular-card {
  min-width: 200px;
  /* translucent purple glass */
  background: rgba(124,58,237,0.10);
  color: #fff;
  padding: 0.9rem 1.1rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(84,63,215,0.12);
  flex: 0 0 auto;
  border: 1px solid rgba(124,58,237,0.20); /* purple border */
  backdrop-filter: blur(8px);
}
.popular-card:hover {
  box-shadow: 0 14px 40px rgba(124,58,237,0.12), 0 0 0 4px rgba(124,58,237,0.06);
  transform: translateY(-4px);
}
.popular-title {
  font-weight: 700;
  color: #efd9ff; /* soft purple accent */
  text-decoration: none;
}
.popular-artist {
  display: block;
  margin-top: 0.4rem;
  color: rgba(255,255,255,0.85);
  font-style: italic;
  text-decoration: none;
}

.scroll-wrap {
  position: relative;
  overflow: visible;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  pointer-events: auto;
}
.scroll-btn.left { left: 6px; }
.scroll-btn.right { right: 6px; }
.scroll-btn:hover { background: rgba(0,0,0,0.6); }

/* ensure lists have some padding so arrows don't overlap content */
.genre-list, .popular-list { padding: 0 48px; }
/* hide native scrollbars but keep programmatic scrolling via arrows */
.genre-list, .popular-list {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  overflow-x: auto;
  scroll-behavior: smooth;
}
.genre-list::-webkit-scrollbar, .popular-list::-webkit-scrollbar { display: none; height: 0; }

.genres {
  margin-bottom: 1.25rem;
  text-align: left;
}
.genres h2 {
  margin: 0 0 0.5rem 0;
  color: #f3e5f5;
}
.genre-list {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.genre-card {
  min-width: 180px;
  height: 110px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: flex-end;
  padding: 0.75rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  position: relative;
}

/* subtle purple overlay to tint genre gradients without losing image/gradient */
.genre-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(rgba(124,58,237,0.10), rgba(124,58,237,0.06));
  pointer-events: none;
}
.genre-meta {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}
.genre-name {
  font-weight: 700;
}
.genre-btn {
  background: rgba(255,255,255,0.9);
  color: #333;
  border: none;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.genre-btn:hover {
  background: white;
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
  /* translucent purple glass for song cards */
  background: rgba(99,102,241,0.06);
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(75,66,160,0.10);
  border: 1px solid rgba(124,58,237,0.18); /* purple border */
  backdrop-filter: blur(7px);
  color: #fff;
}
.song-card:hover {
  box-shadow: 0 12px 32px rgba(124,58,237,0.10), 0 0 0 3px rgba(124,58,237,0.05);
  transform: translateY(-3px);
}
.song-title {
  font-weight: bold;
  color: #f3e6ff;
  text-decoration: none;
  font-size: 1.1rem;
}
.song-title:hover { text-decoration: underline; }
.artist {
  margin: 0.3rem 0 0 0;
  color: #cfcfcf;
  font-style: italic;
}
.artist a { color: #dcdcdc; text-decoration: none; }
.artist a:hover { text-decoration: underline; }
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
