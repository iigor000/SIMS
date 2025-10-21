# Role-Based Authentication System

## Overview

Your application now has a complete role-based authentication system with three user types:
- **Admin** - Full system access and management
- **Teacher** - Course and student management
- **Student** - Course enrollment and assignments

## How It Works

### 1. User Registration
When users register, they select their role from a dropdown menu. The role is stored in Firebase Realtime Database along with their profile information.

### 2. User Login
When users log in, the system:
1. Authenticates with Firebase Authentication
2. Fetches the user's role from the database
3. Redirects to the appropriate dashboard based on their role

### 3. Role-Based Routing
Each dashboard has protected routes:
- `/admin` - Admin Dashboard (only accessible to admins)
- `/teacher` - Teacher Dashboard (only accessible to teachers)
- `/student` - Student Dashboard (only accessible to students)

The router automatically checks roles and prevents unauthorized access.

### 4. Dynamic Navigation
The navigation bar shows different links based on the user's role:
- Admins see "Admin Dashboard"
- Teachers see "Teacher Dashboard"
- Students see "Student Dashboard"

A badge displays the user's role in the header.

## Database Structure

Users are stored in Firebase Realtime Database with this structure:

```json
{
  "users": {
    "userUID": {
      "email": "user@example.com",
      "displayName": "User Name",
      "role": "admin|teacher|student",
      "createdAt": "2025-10-21T..."
    }
  }
}
```

## Security Rules (Add to Firebase Console)

Update your Firebase Realtime Database rules to ensure proper access control:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Files Modified/Created

### Created:
- `src/views/AdminDashboard.vue` - Admin dashboard view
- `src/views/TeacherDashboard.vue` - Teacher dashboard view
- `src/views/StudentDashboard.vue` - Student dashboard view

### Modified:
- `src/views/LoginView.vue` - Added role selection dropdown
- `src/composables/useAuth.js` - Added role fetching logic
- `src/router/index.js` - Added role-based route protection
- `src/App.vue` - Added dynamic navigation based on role

## Usage

### Testing the System

1. **Register as Admin:**
   - Go to `/login`
   - Click "Register"
   - Select "Admin" role
   - Complete registration
   - You'll be redirected to `/admin`

2. **Register as Teacher:**
   - Same process, select "Teacher" role
   - Redirected to `/teacher`

3. **Register as Student:**
   - Same process, select "Student" role
   - Redirected to `/student`

### Customizing Dashboards

Each dashboard (AdminDashboard.vue, TeacherDashboard.vue, StudentDashboard.vue) is a template. You can customize them to add:
- Data tables
- Forms
- Charts and statistics
- Role-specific features

## Next Steps

1. **Add Role-Specific Features:**
   - Admin: User management, system settings
   - Teacher: Class management, grading
   - Student: Course enrollment, assignments

2. **Enhance Security:**
   - Add server-side role verification
   - Implement Firebase Security Rules for data access

3. **Improve UI:**
   - Add more detailed dashboard widgets
   - Create forms for data management
   - Add data visualization

## Example: Changing User Roles

To manually change a user's role in Firebase Console:
1. Go to Realtime Database
2. Find the user under `users/{userUID}`
3. Edit the `role` field
4. User must log out and log back in to see changes

## Troubleshooting

**Issue:** User sees wrong dashboard
- **Solution:** Check the user's role in Firebase Realtime Database

**Issue:** Navigation guard not working
- **Solution:** Make sure Firebase config is properly set up in `.env`

**Issue:** Role not fetching
- **Solution:** Check Firebase Realtime Database rules allow read access
