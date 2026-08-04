// Pins the test project id regardless of whatever .env.local happens to be
// pointed at (a real project, or nothing at all) - tests always target the
// "demo-" project the emulator suite runs under. FIRESTORE_EMULATOR_HOST /
// FIREBASE_AUTH_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST are injected
// automatically by `firebase emulators:exec`, which is how `npm test` runs
// this suite.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-kaleido";
