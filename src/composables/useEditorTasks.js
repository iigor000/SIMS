import { ref } from 'vue'
import { db } from '@/firebase/config'
import { ref as dbRef, push, get, query, orderByChild, equalTo } from 'firebase/database'

export function useEditorTasks() {
    const loading = ref(false)
    const error = ref(null)
    const items = ref([])
    const editors = ref([])

    // Učitavanje svih predmeta
    const loadItems = async () => {
        try {
            loading.value = true
            const itemsRef = dbRef(db, 'items')
            const snapshot = await get(itemsRef)

            if (snapshot.exists()) {
                const data = snapshot.val()
                const list = []

                // Podaci mogu biti ili ravna mapa ili grupisani po tipu
                for (const [key, value] of Object.entries(data)) {
                    if (value && typeof value === 'object') {
                        const isGroup = Object.values(value).some(v =>
                            v && typeof v === 'object' &&
                            (v.name || v.title || v.displayName || v.songwriters || v.author)
                        )
                        if (isGroup) {
                            // Spljošti grupisane unose, sačuvaj tip
                            for (const [id, item] of Object.entries(value)) {
                                list.push({ id, type: key, ...(item || {}) })
                            }
                            continue
                        }
                    }
                    // Inače tretiraj kao pojedinačni item
                    list.push({ id: key, ...(value || {}) })
                }

                items.value = list
                // Sortiraj po datumu postavljanja, najnoviji prvi
                items.value.sort((a, b) => (b.postedDate || 0) - (a.postedDate || 0))

                console.log('Učitani predmeti:', items.value) // Debug log
            } else {
                console.log('Nema pronađenih predmeta')
                items.value = []
            }
        } catch (err) {
            console.error('Greška pri učitavanju predmeta:', err)
            error.value = 'Greška pri učitavanju predmeta'
        } finally {
            loading.value = false
        }
    }

    // Učitavanje svih urednika
    const loadEditors = async () => {
        try {
            loading.value = true
            const usersRef = dbRef(db, 'users')
            // Prvo učitaj sve korisnike
            const snapshot = await get(usersRef)

            if (snapshot.exists()) {
                const data = snapshot.val()
                editors.value = Object.entries(data)
                    .map(([id, editor]) => ({
                        id,
                        ...editor
                    }))
                    // Filtriraj samo aktivne urednike
                    .filter(editor =>
                        editor.role === 'editor' && // mora biti editor
                        !editor.deleted && // ne sme biti obrisan
                        editor.active !== false // mora biti aktivan (ako postoji polje active)
                    )
            }
            console.log('Učitani urednici:', editors.value) // Debug log
        } catch (err) {
            console.error('Greška pri učitavanju urednika:', err)
            error.value = 'Greška pri učitavanju urednika'
        } finally {
            loading.value = false
        }
    }

    // Provera da li već postoji recenzija za dati item i urednika
    const checkExistingReview = async (itemId, editorId) => {
        try {
            const reviewsRef = dbRef(db, 'reviews')
            const existingQuery = query(
                reviewsRef,
                orderByChild('itemId'),
                equalTo(itemId)
            )
            const snapshot = await get(existingQuery)

            if (snapshot.exists()) {
                const reviews = snapshot.val()
                return Object.values(reviews).some(
                    review => review.userId === editorId
                )
            }
            return false
        } catch (err) {
            console.error('Greška pri proveri postojeće recenzije:', err)
            throw err
        }
    }

    // Dodela zadatka uredniku
    const assignTask = async (itemId, editorId, itemName, editorName) => {
        loading.value = true
        error.value = null

        try {
            // Provera postojeće recenzije
            const exists = await checkExistingReview(itemId, editorId)
            if (exists) {
                throw new Error('Urednik već ima recenziju za ovaj sadržaj')
            }

            // Kreiranje novog zadatka
            const tasksRef = dbRef(db, 'editor_tasks')
            await push(tasksRef, {
                itemId,
                editorId,
                itemName,
                editorName,
                status: 'pending',
                assignedAt: Date.now()
            })

            return true
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        items,
        editors,
        loadItems,
        loadEditors,
        assignTask,
        checkExistingReview
    }
}