// insertItems.js
// Script to insert example items into Firebase Realtime Database
// Run this in your project (node src/scripts/insertItems.js)

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref as dbRef, set, push } from 'firebase/database'

// --- Firebase config ---
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// --- Example items ---

const exampleSong = {
    name: "Bohemian Rhapsody",
    description: "A progressive rock epic by Queen.",
    postedDate: Date.now(),
    postedBy: "admin@example.com",
    duration: "5:55",
    genres: ["Rock", "Progressive Rock", "Opera"],
    songwriters: [
        { id: "artist-freddie", name: "Freddie Mercury" }
    ],
    producers: [
        { id: "artist-roy", name: "Roy Thomas Baker" }
    ],
    album: { id: "album-night-opera", name: "A Night at the Opera" },
    lyrics: "Is this the real life? Is this just fantasy?..."
}

const exampleArtist = {
    name: "Freddie Mercury",
    description: "Lead vocalist of Queen.",
    postedDate: Date.now(),
    birthDate: -141912000000,
    birthPlace: "Stone Town, Zanzibar",
    bands: [
        { id: "band-queen", name: "Queen" }
    ],
    songs: [
        { id: "song-bohemian", name: "Bohemian Rhapsody" }
    ]
}

const exampleBand = {
    name: "Queen",
    description: "British rock band formed in London in 1970.",
    postedDate: Date.now(),
    formedDate: 315532800000,
    originCity: "London, UK",
    genres: ["Rock", "Glam Rock"],
    members: [
        { id: "artist-freddie", name: "Freddie Mercury", role: "Vocals", joinDate: 315532800000 },
        { id: "artist-brian", name: "Brian May", role: "Guitar", joinDate: 315532800000 }
    ],
    albums: [
        { id: "album-night-opera", name: "A Night at the Opera", releaseDate: 184896000000 }
    ]
}

const exampleAlbum = {
    name: "A Night at the Opera",
    description: "Queen's fourth studio album.",
    postedDate: Date.now(),
    releaseDate: 184896000000,
    artist: { id: "band-queen", name: "Queen", type: "band" },
    genres: ["Rock", "Progressive Rock"],
    label: "EMI",
    songs: [
        { id: "song-bohemian", name: "Bohemian Rhapsody", duration: "5:55" },
        { id: "song-love", name: "Love of My Life", duration: "3:38" }
    ]
}

const examplePerformance = {
    name: "Live Aid 1985",
    description: "Queen's legendary performance at Live Aid.",
    postedDate: Date.now(),
    performanceDate: 489024000000,
    location: {
        venue: "Wembley Stadium",
        city: "London",
        country: "UK",
        address: "Empire Way"
    },
    performers: [
        { id: "band-queen", name: "Queen", type: "band" }
    ],
    setlist: [
        { id: "song-bohemian", name: "Bohemian Rhapsody" },
        { id: "song-radio", name: "Radio Ga Ga" }
    ],
    ticketPrice: "£10",
    attendance: 72000
}

// --- Insert function ---
async function insertExampleItems() {
    // Step 1: Insert all items and collect their keys
    const songRef = dbRef(db, 'items/song')
    const artistRef = dbRef(db, 'items/artist')
    const bandRef = dbRef(db, 'items/band')
    const albumRef = dbRef(db, 'items/album')
    const performanceRef = dbRef(db, 'items/performance')

    // Push items and get keys
    const songKey = push(songRef)
    const artistKey = push(artistRef)
    const bandKey = push(bandRef)
    const albumKey = push(albumRef)
    const performanceKey = push(performanceRef)

    // Step 2: Update references with correct keys
    // Song references
    const songData = {
        ...exampleSong,
        songwriters: [{ id: artistKey.key, name: "Freddie Mercury" }],
        producers: [{ id: artistKey.key, name: "Roy Thomas Baker" }],
        album: { id: albumKey.key, name: "A Night at the Opera" }
    }

    // Artist references
    const artistData = {
        ...exampleArtist,
        bands: [{ id: bandKey.key, name: "Queen" }],
        songs: [{ id: songKey.key, name: "Bohemian Rhapsody" }]
    }

    // Band references
    const bandData = {
        ...exampleBand,
        members: [
            { id: artistKey.key, name: "Freddie Mercury", role: "Vocals", joinDate: 315532800000 },
            { id: artistKey.key, name: "Brian May", role: "Guitar", joinDate: 315532800000 }
        ],
        albums: [{ id: albumKey.key, name: "A Night at the Opera", releaseDate: 184896000000 }]
    }

    // Album references
    const albumData = {
        ...exampleAlbum,
        artist: { id: bandKey.key, name: "Queen", type: "band" },
        songs: [
            { id: songKey.key, name: "Bohemian Rhapsody", duration: "5:55" },
            { id: songKey.key, name: "Love of My Life", duration: "3:38" }
        ]
    }

    // Performance references
    const performanceData = {
        ...examplePerformance,
        performers: [{ id: bandKey.key, name: "Queen", type: "band" }],
        setlist: [
            { id: songKey.key, name: "Bohemian Rhapsody" },
            { id: songKey.key, name: "Radio Ga Ga" }
        ]
    }

    // Step 3: Set items with updated references
    await set(songKey, songData)
    await set(artistKey, artistData)
    await set(bandKey, bandData)
    await set(albumKey, albumData)
    await set(performanceKey, performanceData)
    console.log('Example items inserted with correct references!')
}

insertExampleItems().catch(console.error)
