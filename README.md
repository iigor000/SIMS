# SIMS - Student Information Management System

A Vue 3 application with Firebase authentication and role-based access control.

## Table of Contents
- [Getting Started](#getting-started)
- [Vue 3 Development Guide](#vue-3-development-guide)
- [Project Structure](#project-structure)
- [Firebase Setup](#firebase-setup)
- [Common Tasks](#common-tasks)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository
```sh
git clone <repository-url>
cd projekat
```

2. Install dependencies
```sh
npm install
```

3. Set up Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

4. Run the development server
```sh
npm run dev
```

5. Open your browser at `http://localhost:5173`

### Build for Production

```sh
npm run build
```

---

## Vue 3 Development Guide

This project uses **Vue 3** with the **Composition API** and **`<script setup>`** syntax. Here's what you need to know:

### 1. Component Structure

Vue components have three main sections:

```vue
<script setup>
// JavaScript logic goes here
import { ref, computed, onMounted } from 'vue'

// Reactive state
const count = ref(0)

// Computed properties
const doubled = computed(() => count.value * 2)

// Functions
const increment = () => {
  count.value++
}

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted!')
})
</script>

<template>
  <!-- HTML template goes here -->
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
/* Component-specific styles */
p {
  color: blue;
}
</style>
```

### 2. Reactivity with `ref` and `reactive`

**`ref()`** - For primitive values and single objects:
```js
import { ref } from 'vue'

const message = ref('Hello')
const count = ref(0)
const user = ref({ name: 'John', age: 30 })

// Access/modify with .value in script
console.log(message.value) // 'Hello'
message.value = 'Hi'
count.value++

// In template, no .value needed
// {{ message }} or {{ count }}
```

**`reactive()`** - For objects only:
```js
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'John' }
})

// No .value needed
state.count++
state.user.name = 'Jane'
```

**Rule of thumb:** Use `ref()` for everything unless you specifically need `reactive()`.

### 3. Template Syntax

**Text interpolation:**
```vue
<p>Message: {{ message }}</p>
```

**Attribute binding:**
```vue
<img :src="imageUrl" :alt="imageAlt">
<!-- or -->
<img v-bind:src="imageUrl">
```

**Event handling:**
```vue
<button @click="handleClick">Click me</button>
<input @input="handleInput" @keyup.enter="submitForm">
<!-- or -->
<button v-on:click="handleClick">Click me</button>
```

**Conditional rendering:**
```vue
<div v-if="isLoggedIn">Welcome back!</div>
<div v-else-if="isLoading">Loading...</div>
<div v-else>Please log in</div>

<!-- v-show only toggles display CSS -->
<div v-show="isVisible">Toggle me</div>
```

**List rendering:**
```vue
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

**Two-way binding:**
```vue
<input v-model="username">
<textarea v-model="message"></textarea>
<input type="checkbox" v-model="agree">
<select v-model="selected">
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

### 4. Composables (Reusable Logic)

Composables are functions that encapsulate reusable logic. Example: `src/composables/useAuth.js`

```js
// composables/useCounter.js
import { ref } from 'vue'

export function useCounter() {
  const count = ref(0)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  
  return { count, increment, decrement }
}

// In a component:
import { useCounter } from '@/composables/useCounter'

const { count, increment } = useCounter()
```

### 5. Lifecycle Hooks

```js
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  // Runs after component is mounted to DOM
  console.log('Component mounted')
})

onUnmounted(() => {
  // Cleanup before component is destroyed
  console.log('Component unmounted')
})

onUpdated(() => {
  // Runs after any reactive data changes
  console.log('Component updated')
})
```

### 6. Computed Properties and Watchers

**Computed:**
```js
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Automatically recalculates when dependencies change
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})
```

**Watchers:**
```js
import { ref, watch } from 'vue'

const count = ref(0)

// Watch a single ref
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})

// Watch multiple sources
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(`Name: ${newFirst} ${newLast}`)
})
```

### 7. Props and Emits

**Props (parent → child):**
```vue
<!-- Parent component -->
<ChildComponent :message="greeting" :count="42" />

<!-- Child component -->
<script setup>
const props = defineProps({
  message: String,
  count: {
    type: Number,
    required: true,
    default: 0
  }
})

console.log(props.message)
</script>
```

**Emits (child → parent):**
```vue
<!-- Child component -->
<script setup>
const emit = defineEmits(['update', 'delete'])

const handleClick = () => {
  emit('update', { id: 1, name: 'Updated' })
}
</script>

<button @click="handleClick">Update</button>

<!-- Parent component -->
<ChildComponent @update="handleUpdate" />

<script setup>
const handleUpdate = (data) => {
  console.log('Received:', data)
}
</script>
```

### 8. Vue Router

**Navigation:**
```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToAbout = () => {
  router.push('/about')
  // or
  router.push({ name: 'about' })
  // or with params
  router.push({ name: 'user', params: { id: 123 } })
}
</script>

<template>
  <!-- Declarative navigation -->
  <router-link to="/about">About</router-link>
  <router-link :to="{ name: 'user', params: { id: 123 }}">User</router-link>
  
  <!-- Programmatic navigation -->
  <button @click="goToAbout">Go to About</button>
</template>
```

**Route parameters:**
```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

console.log(route.params.id) // Access route params
console.log(route.query.search) // Access query params
</script>
```

### 9. Best Practices

✅ **DO:**
- Use `<script setup>` for cleaner code
- Use `ref()` for reactive data
- Always add `:key` when using `v-for`
- Use computed properties for derived data
- Use composables for reusable logic
- Keep components small and focused
- Use meaningful variable and function names

❌ **DON'T:**
- Mutate props directly (emit events instead)
- Forget `.value` when accessing refs in `<script>`
- Use `v-if` and `v-for` on the same element
- Create unnecessary watchers (use computed instead)
- Put business logic in templates

### 10. Common Patterns in This Project

**Authentication:**
```js
import { useAuth } from '@/composables/useAuth'

const { user, userRole } = useAuth()

// Check if user is logged in
if (user.value) {
  console.log('Logged in as:', user.value.email)
}

// Check user role
if (userRole.value === 'admin') {
  // Admin-only logic
}
```

**Firebase Database:**
```js
import { ref as dbRef, set, get, update } from 'firebase/database'
import { db } from '@/firebase/config'

// Write data
await set(dbRef(db, 'users/' + userId), {
  name: 'John Doe',
  email: 'john@example.com'
})

// Read data
const snapshot = await get(dbRef(db, 'users/' + userId))
if (snapshot.exists()) {
  const data = snapshot.val()
}

// Update data
await update(dbRef(db, 'users/' + userId), {
  name: 'Jane Doe'
})
```

---

## Project Structure

```
src/
├── assets/          # Static assets (CSS, images)
├── components/      # Reusable components
├── composables/     # Reusable composition functions
│   └── useAuth.js   # Authentication composable
├── firebase/        # Firebase configuration
│   └── config.js    # Firebase initialization
├── router/          # Vue Router configuration
│   └── index.js     # Route definitions
├── views/           # Page components
│   ├── LoginView.vue
│   ├── AdminDashboard.vue
│   ├── EditorDashboard.vue
│   ├── UserDashboard.vue
│   ├── ManageUsers.vue
│   └── ProfileView.vue
├── App.vue          # Root component
└── main.js          # Application entry point
```

---

## Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

### User Roles
- **User**: Basic access
- **Editor**: Enhanced permissions
- **Admin**: Full system access, can manage users

See [ROLE_BASED_AUTH.md](./ROLE_BASED_AUTH.md) for role-based authentication details.

---

## Common Tasks

### Creating a New Component

1. Create file in `src/components/MyComponent.vue`
2. Use the basic structure:

```vue
<script setup>
import { ref } from 'vue'

const message = ref('Hello')
</script>

<template>
  <div>{{ message }}</div>
</template>

<style scoped>
/* styles */
</style>
```

3. Import and use in another component:

```vue
<script setup>
import MyComponent from '@/components/MyComponent.vue'
</script>

<template>
  <MyComponent />
</template>
```

### Adding a New Route

1. Create view component in `src/views/`
2. Add route to `src/router/index.js`:

```js
{
  path: '/my-page',
  name: 'myPage',
  component: () => import('../views/MyPage.vue'),
  meta: { requiresAuth: true, requiredRole: 'user' }
}
```

### Working with Forms

```vue
<script setup>
import { ref } from 'vue'

const formData = ref({
  name: '',
  email: '',
  role: 'user'
})

const handleSubmit = async () => {
  try {
    console.log('Form data:', formData.value)
    // Submit logic here
  } catch (error) {
    console.error('Error:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.name" type="text" required>
    <input v-model="formData.email" type="email" required>
    <select v-model="formData.role">
      <option value="user">User</option>
      <option value="editor">Editor</option>
      <option value="admin">Admin</option>
    </select>
    <button type="submit">Submit</button>
  </form>
</template>
```

---

## Useful Resources

- [Vue 3 Official Docs](https://vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vite.dev/)
- [Vue 3 Cheatsheet](https://vue-cheatsheet.themeselection.com/)

---

## IDE Setup

**Recommended IDE:**
[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension

**Browser Extensions:**
- Chrome/Edge: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

## Troubleshooting

**Port already in use:**
```sh
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

**Dependencies issues:**
```sh
rm -rf node_modules package-lock.json
npm install
```

**Firebase errors:**
- Check `.env` file exists with correct API keys
- Verify Firebase project configuration
- Check browser console for specific error messages
