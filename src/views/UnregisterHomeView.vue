<script setup>
import { ref, computed, onMounted } from "vue";
import { get, child, ref as dbRef } from "firebase/database";
import { db } from "@/firebase/config";
import { useAuth } from "@/composables/useAuth";

// generic items list (will fetch from /items)
const items = ref([]);
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

  el.scrollTo({ left: newScrollLeft, behavior: "smooth" });
}

// simple genre gallery
const genres = ref([
  { id: 'pop', name: 'Pop', from: '#ff9a9e', to: '#fad0c4' },
  { id: 'rock', name: 'Rock', from: '#a18cd1', to: '#fbc2eb' },
  { id: 'hiphop', name: 'Hip Hop', from: '#f6d365', to: '#fda085' },
  { id: 'electronic', name: 'Electronic', from: '#89f7fe', to: '#66a6ff' },
  { id: 'jazz', name: 'Jazz', from: '#cfd9df', to: '#e2ebf0' }
]);

const selectedGenre = ref(null);

function filterByGenre(g) {
  // toggle selected genre
  if (selectedGenre.value && selectedGenre.value.id === g.id) {
    selectedGenre.value = null;
    searchQuery.value = '';
  } else {
    selectedGenre.value = g;
    searchQuery.value = g.name;
  }
  if (searchInput.value && typeof searchInput.value.focus === 'function') {
    searchInput.value.focus();
  }
}

// Fetch all items from /items
onMounted(async () => {
  try {
    const snapshot = await get(child(dbRef(db), "items"));
    console.log('[UnregisterHome] fetched snapshot exists:', snapshot.exists());
    console.log('[UnregisterHome] snapshot.val():', snapshot.val());
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = [];

      // Data may be either a flat map of items or grouped by type (e.g. { song: { id: {...} }, artist: {...} })
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object') {
          const isGroup = Object.values(value).some(v => v && typeof v === 'object' && (v.name || v.title || v.displayName || v.songwriters || v.author));
          if (isGroup) {
            // flatten group entries, record parent key as type
            for (const [id, item] of Object.entries(value)) {
              list.push({ id, type: key, ...(item || {}) });
            }
            continue;
          }
        }
        // otherwise treat as single item
        list.push({ id: key, ...(value || {}) });
      }

      items.value = list;
      items.value.sort((a, b) => (b.postedDate || 0) - (a.postedDate || 0));
    } else {
      console.log('[UnregisterHome] No items found at /items');
      items.value = [];
    }
  } catch (err) {
    console.error('Greška pri učitavanju itema:', err);
  } finally {
    loading.value = false;
  }
});

// computed lists
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value;
  const q = searchQuery.value.toLowerCase();
  return items.value.filter(item => {
    const name = (item.name || item.title || item.displayName || '').toString().toLowerCase();
    const artist = (item.songwriters?.[0]?.name || item.author || '').toString().toLowerCase();
    return name.includes(q) || artist.includes(q);
  });
});

const popularItems = computed(() => {
  const getPopularity = (s) => (s.plays || s.playCount || s.views || s.popularity || s.rating || 0);
  return [...items.value]
    .filter(Boolean)
    // only include songs and performances in the popular strip
    .filter(item => ['song', 'performance'].includes(getItemType(item)))
    .sort((a, b) => getPopularity(b) - getPopularity(a) || (b.postedDate || 0) - (a.postedDate || 0))
    .slice(0, 6);
});

const pageBgStyle = computed(() => {
  if (!selectedGenre.value) return { background: 'rgb(37, 36, 36)' };
  const g = selectedGenre.value;
  return { background: `linear-gradient(135deg, ${g.from}, ${g.to})` };
});

const highlightMatch = (text) => {
  if (!searchQuery.value) return text || '';
  const regex = new RegExp(`(${searchQuery.value})`, "gi");
  return (text || '').toString().replace(regex, '<mark>$1</mark>');
};

// Determine a simple type label for display
const getItemType = (item) => {
  if (!item) return 'item';
  const t = (item.type || '').toString().toLowerCase();
  if (t) {
    if (['album','artist','band','song','performance'].includes(t)) return t;
    // common synonyms
    if (t.includes('album')) return 'album';
    if (t.includes('artist')) return 'artist';
    if (t.includes('band')) return 'band';
    if (t.includes('performance')) return 'performance';
    if (t.includes('song') || t.includes('track')) return 'song';
  }
  // heuristics based on fields
  if (item.songwriters) return 'song';
  if (item.tracks || item.tracklist) return 'album';
  if (item.members || item.bandName) return 'band';
  if (item.isPerformance || item.venue) return 'performance';
  if (item.displayName && !item.name) return 'artist';
  return 'item';
};

const typeLabel = (item) => {
  const t = getItemType(item);
  switch (t) {
    case 'album': return 'Album';
    case 'artist': return 'Artist';
    case 'band': return 'Band';
    case 'song': return 'Song';
    case 'performance': return 'Performance';
    default: return 'Item';
  }
};

const getArtistName = (item) => {
  if (!item) return '';
  // common places for artist/author
  return item.songwriters?.[0]?.name || item.artist || item.author || '';
};

// pick a sensible image field from item
const getImageUrl = (item) => {
  if (!item) return '';
  return item.imageUrl || item.image || item.coverUrl || item.thumbnail || item.artwork || '';
};
</script>

<template>
  <div class="page-bg" :style="pageBgStyle">
    <div class="home">
              <h1> Dobrodošli </h1>


      <!-- Popular hits of the week (horizontal) -->
      <!-- Genre gallery (images / gradients with genre button) -->
      <section class="genres">
        <h2>Žanrovi</h2>
        <div class="scroll-wrap">
          <button class="scroll-btn left" aria-label="Scroll left" @click="scrollContainer(genreListRef, -1)">‹</button>
          <div class="genre-list" ref="genreListRef">
            <div
              v-for="g in genres"
              :key="g.id"
              class="genre-card"
              :style="{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }"
              role="button"
              tabindex="0"
              @click="filterByGenre(g)"
              @keydown.enter.prevent="filterByGenre(g)"
              @keydown.space.prevent="filterByGenre(g)"
            >
              <div class="genre-meta">
                <div class="genre-name">{{ g.name }}</div>
              </div>
            </div>
          </div>
          <button class="scroll-btn right" aria-label="Scroll right" @click="scrollContainer(genreListRef, 1)">›</button>
        </div>
      </section>

      <section v-if="popularItems.length" class="popular">
        <h2>Najpopularnije</h2>
        <div class="scroll-wrap">
          <button class="scroll-btn left" aria-label="Scroll left" @click="scrollContainer(popularListRef, -1)">‹</button>
          <div class="popular-list" ref="popularListRef">
            <div v-for="item in popularItems" :key="item.id" class="popular-card">
                <div v-if="getImageUrl(item)" class="popular-thumb-wrap">
                  <RouterLink :to="`/item/${item.type || 'song'}/${item.id}`">
                    <img :src="getImageUrl(item)" class="popular-thumb" @error="e => e.target.style.display='none'" />
                  </RouterLink>
                </div>
                <div class="popular-top">
                  <RouterLink :to="`/item/${item.type || 'song'}/${item.id}`" class="popular-title">
                    {{ item.name || item.title || item.displayName || 'Bez naslova' }}
                  </RouterLink>
                  <span class="item-type">{{ typeLabel(item) }}</span>
                </div>
              <RouterLink v-if="item.songwriters?.[0]?.id" :to="`/item/artist/${item.songwriters?.[0]?.id}`" class="popular-artist">
                {{ item.songwriters?.[0]?.name || item.author || 'Nepoznati autor' }}
              </RouterLink>
              <div v-else class="popular-artist">{{ item.author || '' }}</div>
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

        <div v-else-if="filteredItems.length > 0" class="song-list">
          <div v-for="item in filteredItems" :key="item.id" class="song-card">
            <div class="song-top">
              <div class="song-left">
                <RouterLink :to="`/item/${item.type || 'song'}/${item.id}`">
                  <img v-if="getImageUrl(item)" :src="getImageUrl(item)" class="song-thumb" @error="e => e.target.style.display='none'" />
                </RouterLink>
                <RouterLink
                  :to="`/item/${item.type || 'song'}/${item.id}`"
                  class="song-title"
                  v-html="highlightMatch(item.name || item.title || item.displayName || 'Bez naslova')"
                ></RouterLink>
              </div>
              <span class="item-type">{{ typeLabel(item) }}</span>
            </div>
            <p class="artist" v-if="item.songwriters?.[0]?.id || item.author">
              <RouterLink
                v-if="item.songwriters?.[0]?.id"
                :to="`/item/artist/${item.songwriters?.[0]?.id}`"
                v-html="highlightMatch(item.songwriters?.[0]?.name || item.author || 'Nepoznati autor')"
              ></RouterLink>
              <span v-else class="artist-text">{{ item.author || '' }}</span>
            </p>
          </div>
        </div>

        <div v-else class="no-songs">Nema stavki koje se poklapaju 🎶</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 1rem auto; /* move content up */
  padding: 1rem; /* tighter card padding */
  text-align: center;
}

.page-bg {
  min-height: 100vh;
  background: rgb(37, 36, 36);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem 1rem; /* reduce top space */
}

.home { /* ensure text contrasts on purple background */
  color: #fff;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
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
  margin-bottom: 1rem;
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
  margin-bottom: 0.75rem;
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
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
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
.genre-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.2);
}
.genre-card:focus {
  outline: 3px solid rgba(124,58,237,0.18);
  outline-offset: 2px;
}


.songs {
  margin-top: 1.25rem;
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
.song-top, .popular-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.popular-thumb-wrap { margin-bottom: 0.6rem; }
.popular-thumb { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; display: block; }
.song-left { display: flex; align-items: center; gap: 0.75rem; }
.song-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(124,58,237,0.12); }
.item-type {
  background: rgba(255,255,255,0.06);
  color: #e9dbff;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.artist-text { color: #dcdcdc; }
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
  background-color: rgb(8, 8, 8);
  color: black;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
