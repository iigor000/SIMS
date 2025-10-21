# User Deletion Implementation Guide

## Current Implementation (Soft Delete)

The current system uses **soft deletion** which:
- Marks users as `deleted: true` in the Realtime Database
- Filters deleted users from the admin user list
- Prevents deleted users from logging in
- Auto-signs out deleted users if they're already logged in

### How It Works:

1. **Delete Action**: Sets `deleted: true` and `deletedAt` timestamp
2. **Login Prevention**: Checks for `deleted` flag during login and rejects
3. **Router Guard**: Checks for deleted users on every route and signs them out
4. **Admin View**: Filters out deleted users from the list

### Limitations:
- User accounts still exist in Firebase Authentication
- Deleted users technically still consume auth slots
- Users can't be "undeleted" easily

---

## Complete Solution: Firebase Functions

For **full deletion** from Firebase Authentication, you need Firebase Admin SDK on the server side.

### Step 1: Install Firebase Functions

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

Select:
- JavaScript or TypeScript
- Install dependencies

### Step 2: Create Delete User Function

Create/Edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Delete user from Authentication
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if request is from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Get the requesting user's data
  const requestingUserRef = admin.database().ref(`users/${context.auth.uid}`);
  const requestingUserSnapshot = await requestingUserRef.once('value');
  const requestingUser = requestingUserSnapshot.val();

  // Verify admin role
  if (!requestingUser || requestingUser.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users'
    );
  }

  const { uid } = data;

  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete from Realtime Database
    await admin.database().ref(`users/${uid}`).remove();

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete user: ' + error.message
    );
  }
});
```

### Step 3: Deploy Functions

```bash
firebase deploy --only functions
```

### Step 4: Update ManageUsers.vue

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteUserFunction = httpsCallable(functions, 'deleteUser');

// Update the deleteUser method:
const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  deleting.value = true;
  modalError.value = '';
  
  try {
    // Call the Firebase Function
    await deleteUserFunction({ uid: userToDelete.value.uid });
    
    // Refresh user list
    await fetchUsers();
    showDeleteModal.value = false;
    userToDelete.value = null;
  } catch (err) {
    console.error('Error deleting user:', err);
    modalError.value = err.message || 'Failed to delete user';
  } finally {
    deleting.value = false;
  }
};
```

### Step 5: Install Firebase Functions SDK

```bash
npm install firebase/functions
```

---

## Database Security Rules

Update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    }
  }
}
```

---

## Current vs Complete Solution Comparison

| Feature | Current (Soft Delete) | Complete (Functions) |
|---------|----------------------|----------------------|
| Prevents Login | ✅ Yes | ✅ Yes |
| Removes from User List | ✅ Yes | ✅ Yes |
| Deletes from Auth | ❌ No | ✅ Yes |
| Server-Side Security | ❌ No | ✅ Yes |
| Can Be Undone | ⚠️ Manual | ❌ Permanent |
| Setup Complexity | ✅ Simple | ⚠️ Requires Functions |

---

## Recommendation

**For Production**: Implement the Firebase Functions solution for complete deletion.

**For Development/Testing**: The current soft delete implementation works fine and prevents deleted users from accessing the system.

---

## Testing

1. **Create a test user**
2. **Delete the user** as admin
3. **Try to log in** with deleted credentials
4. **Expected**: Error message "This account has been deleted"

---

## Troubleshooting

### Issue: Deleted user can still log in
- Clear browser cache and cookies
- Check if user.deleted is properly set in database
- Verify router guard is checking for deleted flag

### Issue: Firebase Functions not working
- Check function logs: `firebase functions:log`
- Verify admin role is properly set
- Ensure Firebase Admin SDK is initialized
