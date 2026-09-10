import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { User, Deposit, Order, Transaction, StoreSettings } from '../src/types.js';

export const firebaseConfig = {
  apiKey: "AIzaSyCQiPFiPgZl57E4uw3aeHQa6pm6wZTbDTg",
  authDomain: "azrylampremnew.firebaseapp.com",
  projectId: "azrylampremnew",
  storageBucket: "azrylampremnew.firebasestorage.app",
  messagingSenderId: "1029417536019",
  appId: "1:1029417536019:web:5af896a73e8ccb90d5cde6",
  measurementId: "G-L6X19G1TPC"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore: Firestore = getFirestore(app);

console.log('[FIREBASE] Connected to Firebase Firestore project: azrylampremnew');

// Firestore Collection Names
const COLL_USERS = 'users';
const COLL_DEPOSITS = 'deposits';
const COLL_ORDERS = 'orders';
const COLL_TRANSACTIONS = 'transactions';
const COLL_SETTINGS = 'settings';

export interface FirestoreUserRecord extends Partial<User> {
  id: string;
  docId?: string;
  passwordHash?: string;
  salt?: string;
}

export async function syncUserToFirestore(user: FirestoreUserRecord): Promise<void> {
  try {
    const userDocRef = doc(firestore, COLL_USERS, user.id);
    await setDoc(userDocRef, { ...user, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err: any) {
    console.error(`[FIREBASE] Error saving user ${user.id} to Firestore:`, err.message);
  }
}

export async function syncDepositToFirestore(deposit: Deposit): Promise<void> {
  try {
    const depositDocRef = doc(firestore, COLL_DEPOSITS, deposit.id);
    await setDoc(depositDocRef, { ...deposit, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err: any) {
    console.error(`[FIREBASE] Error saving deposit ${deposit.id} to Firestore:`, err.message);
  }
}

export async function syncOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(firestore, COLL_ORDERS, order.id);
    await setDoc(orderDocRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err: any) {
    console.error(`[FIREBASE] Error saving order ${order.id} to Firestore:`, err.message);
  }
}

export async function syncTransactionToFirestore(tx: Transaction): Promise<void> {
  try {
    const txDocRef = doc(firestore, COLL_TRANSACTIONS, tx.id);
    await setDoc(txDocRef, { ...tx }, { merge: true });
  } catch (err: any) {
    console.error(`[FIREBASE] Error saving transaction ${tx.id} to Firestore:`, err.message);
  }
}

export async function syncSettingsToFirestore(settings: StoreSettings): Promise<void> {
  try {
    const settingsDocRef = doc(firestore, COLL_SETTINGS, 'store');
    await setDoc(settingsDocRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err: any) {
    console.error('[FIREBASE] Error saving settings to Firestore:', err.message);
  }
}

export async function loadInitialDataFromFirestore(): Promise<{
  users?: FirestoreUserRecord[];
  deposits?: Deposit[];
  orders?: Order[];
  transactions?: Transaction[];
  settings?: StoreSettings;
} | null> {
  try {
    console.log('[FIREBASE] Syncing initial data from Firebase Firestore (azrylampremnew)...');

    // 1. Settings
    let settings: StoreSettings | undefined;
    const settingsSnap = await getDoc(doc(firestore, COLL_SETTINGS, 'store'));
    if (settingsSnap.exists()) {
      settings = settingsSnap.data() as StoreSettings;
    }

    // 2. Users
    const usersSnap = await getDocs(collection(firestore, COLL_USERS));
    const users: FirestoreUserRecord[] = [];
    usersSnap.forEach((d) => {
      const data = d.data();
      users.push({
        ...data,
        id: d.id, // Primary doc ID from Firestore
        docId: d.id,
      } as unknown as FirestoreUserRecord);
    });

    // 3. Deposits
    const depositsSnap = await getDocs(collection(firestore, COLL_DEPOSITS));
    const deposits: Deposit[] = [];
    depositsSnap.forEach((d) => {
      deposits.push(d.data() as Deposit);
    });

    // 4. Orders
    const ordersSnap = await getDocs(collection(firestore, COLL_ORDERS));
    const orders: Order[] = [];
    ordersSnap.forEach((d) => {
      orders.push(d.data() as Order);
    });

    // 5. Transactions
    const txSnap = await getDocs(collection(firestore, COLL_TRANSACTIONS));
    const transactions: Transaction[] = [];
    txSnap.forEach((d) => {
      transactions.push(d.data() as Transaction);
    });

    console.log(
      `[FIREBASE] Firestore sync complete: ${users.length} users, ${deposits.length} deposits, ${orders.length} orders, ${transactions.length} txs, settings: ${Boolean(settings)}`
    );

    return {
      users: users.length > 0 ? users : undefined,
      deposits: deposits.length > 0 ? deposits : undefined,
      orders: orders.length > 0 ? orders : undefined,
      transactions: transactions.length > 0 ? transactions : undefined,
      settings,
    };
  } catch (err: any) {
    console.error('[FIREBASE] Failed loading initial data from Firestore:', err.message);
    return null;
  }
}

export async function fetchAllUsersFromFirestore(): Promise<FirestoreUserRecord[]> {
  try {
    const snap = await getDocs(collection(firestore, COLL_USERS));
    const list: FirestoreUserRecord[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        ...data,
        id: d.id,
      } as unknown as FirestoreUserRecord);
    });
    return list;
  } catch (err: any) {
    console.error('[FIREBASE] Error fetching users from Firestore:', err.message);
    return [];
  }
}

export function listenToFirestoreUsers(onUsersUpdated: (users: FirestoreUserRecord[]) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(firestore, COLL_USERS),
      (snapshot) => {
        const users: FirestoreUserRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          users.push({
            ...data,
            id: docSnap.id,
          } as unknown as FirestoreUserRecord);
        });
        console.log(`[FIREBASE REALTIME] Received update for ${users.length} users from Firestore`);
        onUsersUpdated(users);
      },
      (error) => {
        console.error('[FIREBASE REALTIME] Error listening to users collection:', error.message);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.error('[FIREBASE REALTIME] Failed to attach users listener:', err.message);
    return () => {};
  }
}

export function listenToFirestoreSettings(onSettingsUpdated: (settings: StoreSettings) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      doc(firestore, COLL_SETTINGS, 'store'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoreSettings;
          console.log('[FIREBASE REALTIME] Received settings update from Firestore');
          onSettingsUpdated(data);
        }
      },
      (error) => {
        console.error('[FIREBASE REALTIME] Error listening to settings:', error.message);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.error('[FIREBASE REALTIME] Failed to attach settings listener:', err.message);
    return () => {};
  }
}

export function listenToFirestoreDeposits(onDepositsUpdated: (deposits: Deposit[]) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(firestore, COLL_DEPOSITS),
      (snapshot) => {
        const list: Deposit[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            ...data,
            id: data.id || docSnap.id,
          } as Deposit);
        });
        console.log(`[FIREBASE REALTIME] Received update for ${list.length} deposits from Firestore`);
        onDepositsUpdated(list);
      },
      (error) => {
        console.error('[FIREBASE REALTIME] Error listening to deposits:', error.message);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.error('[FIREBASE REALTIME] Failed to attach deposits listener:', err.message);
    return () => {};
  }
}

