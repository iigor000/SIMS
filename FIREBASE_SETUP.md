# Firebase Authentication Setup Instructions

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sims-d133a**
3. Click on the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app yet, click "Add app" and select the web icon (</>)
7. Copy the Firebase configuration values

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values with your actual Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=sims-d133a.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=sims-d133a
   VITE_FIREBASE_STORAGE_BUCKET=sims-d133a.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_DATABASE_URL=https://sims-d133a-default-rtdb.europe-west1.firebasedatabase.app/
   ```

## Step 3: Enable Authentication in Firebase

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started" if you haven't set it up yet
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 4: Configure Realtime Database Rules

1. In Firebase Console, go to "Realtime Database" in the left sidebar
2. Go to the "Rules" tab
3. Update the rules to allow authenticated users to read/write:

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

4. Click "Publish"

## Step 5: Run the Application

```bash
npm install
npm run dev
```

## Features

- ✅ User Registration
- ✅ User Login
- ✅ Protected Routes
- ✅ User Profile Display
- ✅ Logout Functionality
- ✅ User Data Storage in Realtime Database

## Usage

1. Navigate to `/login` to access the login/registration page
2. Register a new account or login with existing credentials
3. After successful authentication, you'll be redirected to the home page
4. Protected routes (Home, About) require authentication
5. Click "Logout" in the navigation to sign out

## Security Notes

- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Keep your Firebase API keys secure
- Configure proper security rules in Firebase Console
