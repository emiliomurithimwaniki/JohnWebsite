/* Firebase initialization wrapper. Fill in your Firebase config below. */
(function(){
  // TODO: Replace with your Firebase project config
  const firebaseConfig = {
    apiKey: "AIzaSyAmw4Vnuypf7NkSCFKpHv54hT03sNuBFRw",
    authDomain: "johnplumber-f0147.firebaseapp.com",
    projectId: "johnplumber-f0147",
    storageBucket: "johnplumber-f0147.firebasestorage.app",
    messagingSenderId: "45715386338",
    appId: "1:45715386338:web:8646126b64977eae4693bb",
    measurementId: "G-E3JBJNXK5C"
  };

  // Load Firebase SDKs from CDN
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js'
  ];

  function load(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init(){
    for (const s of scripts) { await load(s); }
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    window.fb = {
      app, auth, db, storage,
      authSignIn: (email, password) => auth.signInWithEmailAndPassword(email, password),
      authSignOut: () => auth.signOut(),
      onAuth: (cb) => auth.onAuthStateChanged(cb),
    };
    // Notify listeners that Firebase is ready
    try {
      window.dispatchEvent(new CustomEvent('fb-ready'));
    } catch (e) {
      // ignore
    }
  }

  init().catch(err => console.error('Firebase init error', err));
})();
