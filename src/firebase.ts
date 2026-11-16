import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testFirestoreConnection();

async function syncGoogleUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Kreator Google').slice(0, 120);
  const email = (user.email || '').slice(0, 254);
  const photoURL = (user.photoURL || '').slice(0, 500);

  try {
    const snap = await getDocFromServer(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        displayName,
        email,
        ...(photoURL ? { photoURL } : {}),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName,
        ...(photoURL ? { photoURL } : {}),
        authProvider: 'google.com',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('insufficient')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function authenticateWithGoogle(mode: 'signin' | 'signup'): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: mode === 'signup' ? 'select_account consent' : 'select_account',
  });

  const credential = await signInWithPopup(auth, provider);
  await syncGoogleUserProfile(credential.user);
  return credential.user;
}
