# Item Data Structure

This document describes the data structure for different item types in the Firebase Realtime Database.

## Database Structure

```
items/
├── song/
│   └── {songId}/
├── artist/
│   └── {artistId}/
├── band/
│   └── {bandId}/
├── album/
│   └── {albumId}/
└── performance/
    └── {performanceId}/
```

## Common Fields

All item types share these common fields:

```javascript
{
  name: string,              // Required - Name of the item
  description: string,       // Optional - Detailed description
  postedDate: timestamp,     // Optional - When it was posted
  postedBy: string,          // Optional - User who posted it
  images: [                  // Optional - Array of images
    {
      url: string,
      caption: string
    }
  ],
  additionalInfo: string     // Optional - Any extra information
}
```

## Song

```javascript
{
  // Common fields
  name: "Song Title",
  description: "Description of the song",
  postedDate: 1698530400000,
  postedBy: "user@example.com",
  images: [
    {
      url: "https://example.com/cover.jpg",
      caption: "Single Cover"
    }
  ],
  
  // Song-specific fields
  duration: "3:45",
  genres: ["Rock", "Alternative"],
  songwriters: [
    {
      id: "artistId1",
      name: "John Doe"
    }
  ],
  producers: [
    {
      id: "artistId2",
      name: "Jane Smith"
    }
  ],
  album: {
    id: "albumId1",
    name: "Album Title"
  },
  lyrics: "Song lyrics here..."
}
```

## Artist

```javascript
{
  // Common fields
  name: "Artist Name",
  description: "Biography",
  postedDate: 1698530400000,
  images: [
    {
      url: "https://example.com/artist.jpg",
      caption: "Profile Photo"
    }
  ],
  
  // Artist-specific fields
  birthDate: 946684800000,
  birthPlace: "New York, USA",
  bands: [
    {
      id: "bandId1",
      name: "Band Name"
    }
  ],
  songs: [
    {
      id: "songId1",
      name: "Song Title"
    }
  ]
}
```

## Band

```javascript
{
  // Common fields
  name: "Band Name",
  description: "Band history and info",
  postedDate: 1698530400000,
  images: [
    {
      url: "https://example.com/band.jpg",
      caption: "Band Photo"
    }
  ],
  
  // Band-specific fields
  formedDate: 946684800000,
  originCity: "London, UK",
  genres: ["Rock", "Indie"],
  members: [
    {
      id: "artistId1",
      name: "John Doe",
      role: "Lead Vocals",
      joinDate: 946684800000
    },
    {
      id: "artistId2",
      name: "Jane Smith",
      role: "Guitar",
      joinDate: 978220800000
    }
  ],
  albums: [
    {
      id: "albumId1",
      name: "Album Title",
      releaseDate: 1009843200000
    }
  ]
}
```

## Album

```javascript
{
  // Common fields
  name: "Album Title",
  description: "Album description",
  postedDate: 1698530400000,
  images: [
    {
      url: "https://example.com/album-cover.jpg",
      caption: "Album Cover"
    }
  ],
  
  // Album-specific fields
  releaseDate: 1009843200000,
  artist: {
    id: "artistId1", // or "bandId1"
    name: "Artist/Band Name",
    type: "artist" // or "band"
  },
  genres: ["Rock", "Alternative"],
  label: "Record Label Name",
  songs: [
    {
      id: "songId1",
      name: "Track 1",
      duration: "3:45"
    },
    {
      id: "songId2",
      name: "Track 2",
      duration: "4:20"
    }
  ]
}
```

## Performance

```javascript
{
  // Common fields
  name: "Performance/Concert Name",
  description: "Concert details",
  postedDate: 1698530400000,
  images: [
    {
      url: "https://example.com/concert.jpg",
      caption: "Concert Photo"
    }
  ],
  
  // Performance-specific fields
  performanceDate: 1698530400000,
  location: {
    venue: "Madison Square Garden",
    city: "New York",
    country: "USA",
    address: "4 Pennsylvania Plaza"
  },
  performers: [
    {
      id: "bandId1",
      name: "Band Name",
      type: "band" // or "artist"
    }
  ],
  setlist: [
    {
      id: "songId1",
      name: "Song Title"
    }
  ],
  ticketPrice: "$50 - $150",
  attendance: 20000
}
```

## Example Usage

### Creating an Item in Firebase

```javascript
import { ref as dbRef, set } from 'firebase/database'
import { db } from '@/firebase/config'

// Create a song
const songData = {
  name: "Bohemian Rhapsody",
  description: "A progressive rock epic",
  postedDate: Date.now(),
  postedBy: "user@example.com",
  duration: "5:55",
  genres: ["Rock", "Progressive Rock", "Opera"],
  songwriters: [
    {
      id: "freddie-mercury-id",
      name: "Freddie Mercury"
    }
  ],
  producers: [
    {
      id: "roy-thomas-baker-id",
      name: "Roy Thomas Baker"
    }
  ],
  album: {
    id: "night-at-opera-id",
    name: "A Night at the Opera"
  }
}

await set(dbRef(db, 'items/song/bohemian-rhapsody-id'), songData)
```

### Navigating to an Item

```javascript
// In a component
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigate to a song
router.push({ name: 'item', params: { type: 'song', id: 'songId123' } })

// Navigate to a band
router.push({ name: 'item', params: { type: 'band', id: 'bandId456' } })

// Navigate to a performance
router.push({ name: 'item', params: { type: 'performance', id: 'perfId789' } })
```

### Linking Between Items

```vue
<template>
  <!-- Link to an artist from a song page -->
  <a @click="goToRelatedItem('artist', artistId)">{{ artistName }}</a>
  
  <!-- Link to an album -->
  <router-link :to="{ name: 'item', params: { type: 'album', id: albumId }}">
    {{ albumName }}
  </router-link>
</template>
```

## Firebase Database Rules

Recommended security rules for the items structure:

```json
{
  "rules": {
    "items": {
      "$itemType": {
        "$itemId": {
          ".read": "auth != null",
          ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'editor')"
        }
      }
    }
  }
}
```

This allows:
- All authenticated users can **read** items
- Only **admins** and **editors** can **write/create/edit** items

## Notes

- All timestamps should be in milliseconds (JavaScript `Date.now()`)
- IDs should be unique and URL-safe (use Firebase's `push().key` or custom slugs)
- Images URLs should be publicly accessible (use Firebase Storage or external CDN)
- When referencing related items, always include both `id` and `name` for display purposes
- For arrays of related items (songs, members, etc.), include enough data to display without additional queries
- Use consistent casing (camelCase) for all field names
