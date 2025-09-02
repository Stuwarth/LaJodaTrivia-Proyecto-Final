import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export async function ensureAnonymousSignIn(): Promise<FirebaseAuthTypes.User | null> {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await auth().signInAnonymously();
          unsubscribe();
          resolve(cred.user);
        } catch (e) {
          unsubscribe();
          reject(e);
        }
      }
    });
  });
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.User> {
  const current = auth().currentUser;
  if (current && current.isAnonymous) {
    // Upgrade anonymous account by linking credentials
    const credential = auth.EmailAuthProvider.credential(email, password);
    const res = await current.linkWithCredential(credential);
    return res.user;
  }
  const res = await auth().signInWithEmailAndPassword(email, password);
  return res.user;
}

export async function registerWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.User> {
  const current = auth().currentUser;
  if (current && current.isAnonymous) {
    const credential = auth.EmailAuthProvider.credential(email, password);
    const res = await current.linkWithCredential(credential);
    return res.user;
  }
  const res = await auth().createUserWithEmailAndPassword(email, password);
  return res.user;
}
