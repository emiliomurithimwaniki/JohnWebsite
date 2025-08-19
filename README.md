# John Plumbing Website

Static responsive site with Firebase for auth, Firestore, and Storage.

## Pages
- `index.html` Home
- `gallery.html` Public gallery (Firestore + Storage)
- `reviews.html` Public reviews (Firestore)
- `quote.html` Quote/Order form (Firestore)
- `contact.html` Contact + Map + WhatsApp
- `admin-login.html` Admin login (Firebase Auth)
- `admin.html` Admin dashboard (upload gallery, view orders, manage reviews)

## Setup
1. Create a Firebase project. Enable:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Hosting (optional for deployment)
2. In `assets/js/firebase.js`, paste your Firebase config object.
3. In Firebase Console, set Firestore rules appropriately (example permissive dev rules below, tighten for prod):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gallery/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /orders/{doc} { allow read, write: if true; }
    match /reviews/{doc} { allow read: if true; allow write: if true; }
  }
}
```
4. For Storage rules (allow read public, write only for authed admin):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
5. Create an admin user under Authentication.

## Run locally
Open `index.html` with a local server (recommended) to avoid CORS issues. For example, with VS Code Live Server or `python -m http.server`.

## Deploy (Firebase Hosting)
1. Install Firebase CLI and run `firebase init hosting` in this folder.
2. Set public directory to `.` and configure as single-page app: `No` (we are multi-page).
3. `firebase deploy`.

## Notes
- Update the phone number in pages to your real business number.
- Contact email is set to Johnplumber011@gmail.com.
