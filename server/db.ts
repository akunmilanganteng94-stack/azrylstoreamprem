import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Deposit,
  Order,
  Transaction,
  AdminLog,
  StoreSettings,
} from '../src/types.js';
import {
  syncUserToFirestore,
  syncDepositToFirestore,
  syncOrderToFirestore,
  syncTransactionToFirestore,
  syncSettingsToFirestore,
  loadInitialDataFromFirestore,
  FirestoreUserRecord,
} from './firebase.js';

export interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  deposits: Deposit[];
  orders: Order[];
  transactions: Transaction[];
  admin_logs: AdminLog[];
  settings: StoreSettings;
  sessions: SessionRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function getInitialData(): DatabaseSchema {
  const adminSalt = generateSalt();
  const initialUsers: UserRecord[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@azrylstore.com',
      passwordHash: hashPassword('admin123', adminSalt),
      salt: adminSalt,
      balance: 100000,
      role: 'admin',
      status: 'active',
      isBlocked: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialSettings: StoreSettings = {
    isStoreOpen: true,
    closeReason: 'Toko sedang tutup sementara untuk pemeliharaan sistem. Silakan cek kembali nanti.',
    priceEceran: 300,
    priceBulk: 400,
    minDeposit: 1000,
    bulkMin: 1,
    bulkMax: 5,
    danaNumber: '085786683784',
    danaName: 'JEJE',
    qrImage: 'https://cdn.phototourl.com/free/2026-09-10-f548b8a3-78db-462f-bf15-59b7ce782943.jpg',
    amPhoto: 'https://cdn.phototourl.com/free/2026-09-10-6e54e472-9822-4fa7-91a2-e40f8ed111ac.jpg',
    waAdmin: 'https://wa.me/6285199219856',
    waChannel: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
    announcement: 'Server AM Premium 24/7 Aktif! Garansi akun aktif & support admin via WhatsApp.',
  };

  return {
    users: initialUsers,
    deposits: [],
    orders: [],
    transactions: [],
    admin_logs: [
      {
        id: 'log_init',
        adminId: 'usr_admin',
        adminUsername: 'admin',
        action: 'SYSTEM_INIT',
        description: 'Sistem AZRYLSTORE diinisialisasi',
        createdAt: new Date().toISOString(),
      },
    ],
    settings: initialSettings,
    sessions: [],
  };
}

class Database {
  private data: DatabaseSchema;
  private isFirestoreSynced = false;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.deposits) this.data.deposits = [];
        if (!this.data.orders) this.data.orders = [];
        if (!this.data.transactions) this.data.transactions = [];
        if (!this.data.admin_logs) this.data.admin_logs = [];
        if (!this.data.sessions) this.data.sessions = [];
        if (!this.data.settings) {
          this.data.settings = getInitialData().settings;
        } else {
          if (this.data.settings.isStoreOpen === undefined) {
            this.data.settings.isStoreOpen = true;
          }
          this.data.settings.amPhoto = 'https://cdn.phototourl.com/free/2026-09-10-6e54e472-9822-4fa7-91a2-e40f8ed111ac.jpg';
        }
      } catch (err) {
        console.error('Failed to parse existing DB file, initializing fresh store:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }

    // Trigger Firestore background initialization
    this.initFirestoreSync();
  }

  private async initFirestoreSync(): Promise<void> {
    try {
      const remoteData = await loadInitialDataFromFirestore();
      if (remoteData) {
        if (remoteData.settings) {
          this.data.settings = { ...this.data.settings, ...remoteData.settings };
        } else {
          // Sync current settings to Firestore for the first time
          syncSettingsToFirestore(this.data.settings);
        }

        if (remoteData.users && remoteData.users.length > 0) {
          // Merge remote users with local
          const remoteUserMap = new Map(remoteData.users.map((u) => [u.id, u]));
          for (const u of this.data.users) {
            if (!remoteUserMap.has(u.id)) {
              remoteUserMap.set(u.id, u);
              syncUserToFirestore(u);
            }
          }
          this.data.users = Array.from(remoteUserMap.values()) as UserRecord[];
        } else {
          // Seed local users to Firestore
          for (const u of this.data.users) {
            syncUserToFirestore(u);
          }
        }

        if (remoteData.deposits && remoteData.deposits.length > 0) {
          const depMap = new Map(remoteData.deposits.map((d) => [d.id, d]));
          for (const d of this.data.deposits) {
            if (!depMap.has(d.id)) {
              depMap.set(d.id, d);
              syncDepositToFirestore(d);
            }
          }
          this.data.deposits = Array.from(depMap.values());
        }

        if (remoteData.orders && remoteData.orders.length > 0) {
          const ordMap = new Map(remoteData.orders.map((o) => [o.id, o]));
          for (const o of this.data.orders) {
            if (!ordMap.has(o.id)) {
              ordMap.set(o.id, o);
              syncOrderToFirestore(o);
            }
          }
          this.data.orders = Array.from(ordMap.values());
        }

        if (remoteData.transactions && remoteData.transactions.length > 0) {
          const txMap = new Map(remoteData.transactions.map((t) => [t.id, t]));
          for (const t of this.data.transactions) {
            if (!txMap.has(t.id)) {
              txMap.set(t.id, t);
              syncTransactionToFirestore(t);
            }
          }
          this.data.transactions = Array.from(txMap.values());
        }

        this.save();
        this.isFirestoreSynced = true;
        console.log('[FIREBASE] Firestore bidirectionally synced with local memory cache.');
      }
    } catch (err: any) {
      console.error('[FIREBASE] Sync error during init:', err.message);
    }
  }

  private save(): void {
    try {
      const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving store to file:', err);
    }
  }

  // Auth & Users
  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByUsernameOrEmail(usernameOrEmail: string): UserRecord | undefined {
    const query = usernameOrEmail.toLowerCase().trim();
    return this.data.users.find(
      (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
    );
  }

  createUser(username: string, email: string, passwordPlain: string): User {
    const salt = generateSalt();
    const hash = hashPassword(passwordPlain, salt);
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      balance: 0,
      role: 'user',
      status: 'active',
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();

    // Persist to Firebase Firestore
    syncUserToFirestore(newUser);

    const { passwordHash: _, salt: __, ...publicUser } = newUser;
    return publicUser;
  }

  verifyUserPassword(user: UserRecord, passwordPlain: string): boolean {
    const hash = hashPassword(passwordPlain, user.salt);
    return hash === user.passwordHash;
  }

  updateUserPassword(userId: string, newPasswordPlain: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.salt = generateSalt();
    user.passwordHash = hashPassword(newPasswordPlain, user.salt);
    this.save();
    syncUserToFirestore(user);
    return true;
  }

  updateUserStatus(userId: string, status: 'active' | 'suspended'): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.status = status;
    user.isBlocked = status === 'suspended';
    this.save();
    syncUserToFirestore(user);
    return true;
  }

  setUserBlocked(userId: string, isBlocked: boolean): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.isBlocked = isBlocked;
    user.status = isBlocked ? 'suspended' : 'active';
    this.save();
    syncUserToFirestore(user);
    return true;
  }

  adjustUserBalance(
    userId: string,
    amountDelta: number,
    type: 'DEPOSIT' | 'ORDER_AM' | 'REFUND' | 'ADMIN_ADJUST',
    reference: string,
    description: string
  ): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User tidak ditemukan' };

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + amountDelta;
    if (balanceAfter < 0) {
      return { success: false, error: 'Saldo tidak mencukupi' };
    }

    user.balance = balanceAfter;

    // Log transaction
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      type,
      amount: Math.abs(amountDelta),
      balanceBefore,
      balanceAfter,
      reference,
      description,
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.unshift(tx);
    this.save();

    // Persist to Firebase Firestore
    syncUserToFirestore(user);
    syncTransactionToFirestore(tx);

    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { success: true, user: publicUser };
  }

  getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash: _, salt: __, ...u }) => u);
  }

  // Sessions
  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.data.sessions.push({
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    });
    this.save();
    return token;
  }

  getUserByToken(token: string): User | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(token);
      return null;
    }
    const user = this.getUserById(session.userId);
    if (!user) return null;
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return publicUser;
  }

  deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Deposits
  createDeposit(
    userId: string,
    username: string,
    amount: number,
    paymentMethod: 'QRIS' | 'DANA',
    payerName: string,
    proofNote?: string
  ): Deposit {
    const deposit: Deposit = {
      id: `DEP-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
      userId,
      username,
      amount,
      paymentMethod,
      status: 'PENDING',
      payerName,
      proofNote,
      createdAt: new Date().toISOString(),
    };
    this.data.deposits.unshift(deposit);
    this.save();

    // Persist to Firebase Firestore
    syncDepositToFirestore(deposit);

    return deposit;
  }

  getDepositById(id: string): Deposit | undefined {
    return this.data.deposits.find((d) => d.id === id);
  }

  getUserDeposits(userId: string): Deposit[] {
    return this.data.deposits.filter((d) => d.userId === userId);
  }

  getAllDeposits(): Deposit[] {
    return this.data.deposits;
  }

  confirmDepositUserPaid(id: string, userId: string): Deposit | null {
    const dep = this.getDepositById(id);
    if (!dep || dep.userId !== userId) return null;
    dep.status = 'PENDING';
    this.save();
    syncDepositToFirestore(dep);
    return dep;
  }

  approveDeposit(id: string, adminUsername: string): { success: boolean; deposit?: Deposit; error?: string } {
    const dep = this.getDepositById(id);
    if (!dep) return { success: false, error: 'Deposit tidak ditemukan' };
    if (dep.status !== 'PENDING') return { success: false, error: `Deposit sudah berstatus ${dep.status}` };

    const adj = this.adjustUserBalance(
      dep.userId,
      dep.amount,
      'DEPOSIT',
      dep.id,
      `Deposit Rp${dep.amount.toLocaleString('id-ID')} via ${dep.paymentMethod} disetujui`
    );

    if (!adj.success) {
      return { success: false, error: adj.error };
    }

    dep.status = 'APPROVED';
    dep.confirmedAt = new Date().toISOString();
    dep.confirmedBy = adminUsername;
    this.save();
    syncDepositToFirestore(dep);

    this.addAdminLog(
      'usr_admin',
      adminUsername,
      'APPROVE_DEPOSIT',
      `Menyetujui deposit ${dep.id} nominal Rp${dep.amount.toLocaleString('id-ID')} untuk @${dep.username}`,
      dep.username
    );

    return { success: true, deposit: dep };
  }

  rejectDeposit(id: string, adminUsername: string, reason?: string): { success: boolean; deposit?: Deposit; error?: string } {
    const dep = this.getDepositById(id);
    if (!dep) return { success: false, error: 'Deposit tidak ditemukan' };
    if (dep.status !== 'PENDING') return { success: false, error: `Deposit sudah berstatus ${dep.status}` };

    dep.status = 'REJECTED';
    dep.confirmedAt = new Date().toISOString();
    dep.confirmedBy = adminUsername;
    if (reason) dep.proofNote = (dep.proofNote ? dep.proofNote + ' | ' : '') + `Alasan tolak: ${reason}`;
    this.save();
    syncDepositToFirestore(dep);

    this.addAdminLog(
      'usr_admin',
      adminUsername,
      'REJECT_DEPOSIT',
      `Menolak deposit ${dep.id} nominal Rp${dep.amount.toLocaleString('id-ID')} untuk @${dep.username}`,
      dep.username
    );

    return { success: true, deposit: dep };
  }

  // Orders
  createOrder(
    userId: string,
    username: string,
    product: 'AM_ECERAN' | 'AM_BULK',
    quantity: number,
    price: number,
    gmail?: string,
    verificationLink?: string
  ): Order {
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
      userId,
      username,
      product,
      quantity,
      price,
      gmail,
      verificationLink,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };
    this.data.orders.unshift(order);
    this.save();
    syncOrderToFirestore(order);
    return order;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  getUserOrders(userId: string): Order[] {
    return this.data.orders.filter((o) => o.userId === userId);
  }

  getAllOrders(): Order[] {
    return this.data.orders;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const order = this.getOrderById(id);
    if (!order) return null;
    Object.assign(order, updates);
    this.save();
    syncOrderToFirestore(order);
    return order;
  }

  refundOrder(id: string, adminUsername: string, reason?: string): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderById(id);
    if (!order) return { success: false, error: 'Order tidak ditemukan' };
    if (order.status === 'REFUNDED') return { success: false, error: 'Order sudah di-refund' };

    const adj = this.adjustUserBalance(
      order.userId,
      order.price,
      'REFUND',
      order.id,
      `Refund pesanan ${order.id} (${order.product === 'AM_ECERAN' ? 'AM Eceran' : 'AM Bulk'}) Rp${order.price.toLocaleString('id-ID')}`
    );

    if (!adj.success) {
      return { success: false, error: adj.error };
    }

    order.status = 'REFUNDED';
    order.errorMessage = reason || 'Dibatalkan dan dana dikembalikan ke saldo.';
    this.save();
    syncOrderToFirestore(order);

    this.addAdminLog(
      'usr_admin',
      adminUsername,
      'REFUND_ORDER',
      `Refund order ${order.id} sebesar Rp${order.price.toLocaleString('id-ID')} untuk @${order.username}`,
      order.username
    );

    return { success: true, order };
  }

  // Transactions
  getUserTransactions(userId: string): Transaction[] {
    return this.data.transactions.filter((t) => t.userId === userId);
  }

  getAllTransactions(): Transaction[] {
    return this.data.transactions;
  }

  // Settings
  getSettings(): StoreSettings {
    return { ...this.data.settings };
  }

  updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    syncSettingsToFirestore(this.data.settings);
    return this.data.settings;
  }

  // Admin Logs
  addAdminLog(adminId: string, adminUsername: string, action: string, description: string, targetUser?: string): AdminLog {
    const log: AdminLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      adminUsername,
      action,
      targetUser,
      description,
      createdAt: new Date().toISOString(),
    };
    this.data.admin_logs.unshift(log);
    this.save();
    return log;
  }

  getAdminLogs(limit = 100): AdminLog[] {
    return this.data.admin_logs.slice(0, limit);
  }
}

export const db = new Database();
