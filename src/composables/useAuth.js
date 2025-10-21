import { ref, onMounted } from 'vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref as dbRef, get } from 'firebase/database';
import { auth, db } from '../firebase/config';
import { useRouter } from 'vue-router';

export function useAuth() {
    const user = ref(null);
    const userRole = ref(null);
    const loading = ref(true);
    const router = useRouter();

    onMounted(() => {
        onAuthStateChanged(auth, async (firebaseUser) => {
            user.value = firebaseUser;

            if (firebaseUser) {
                // Fetch user role from database
                try {
                    const userSnapshot = await get(dbRef(db, 'users/' + firebaseUser.uid));
                    const userData = userSnapshot.val();
                    userRole.value = userData?.role || null;
                } catch (error) {
                    console.error('Error fetching user role:', error);
                }
            } else {
                userRole.value = null;
            }

            loading.value = false;
        });
    });

    const logout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return {
        user,
        userRole,
        loading,
        logout
    };
}
