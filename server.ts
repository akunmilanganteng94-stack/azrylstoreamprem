import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { callAmSendApi, callAmVerifApi, callAmBulkApi } from './server/amService.js';
import { User } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Parsers
app.use(express.json());

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// In-flight mutex set to prevent double clicks / race conditions
const pendingOrders = new Set<string>();

// Middleware: Authenticate Session Token
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);

  if (!token) {
    res.status(401).json({ error: 'Sesi tidak valid atau belum login' });
    return;
  }

  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Sesi berakhir, silakan login kembali' });
    return;
  }

  if (user.status === 'suspended' || user.isBlocked) {
    res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh administrator' });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Require Admin Role
function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Akses khusus administrator ditolak' });
      return;
    }
    next();
  });
}

// ==========================================
// PUBLIC & AUTH ROUTES
// ==========================================

// Public Store Settings
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ settings });
});

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      res.status(400).json({ error: 'Username tidak boleh kosong' });
      return;
    }

    if (username.trim().length < 3) {
      res.status(400).json({ error: 'Username minimal 3 karakter' });
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Format email tidak valid' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password minimal 6 karakter' });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
      return;
    }

    // Check duplicate username or email
    const existing = db.getUserByUsernameOrEmail(username.trim()) || db.getUserByUsernameOrEmail(email.trim());
    if (existing) {
      res.status(400).json({ error: 'Username atau email sudah terdaftar' });
      return;
    }

    const newUser = db.createUser(username, email, password);
    const token = db.createSession(newUser.id);

    res.status(201).json({
      message: 'Pendaftaran berhasil!',
      user: newUser,
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mendaftar' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/email dan password wajib diisi' });
      return;
    }

    const userRecord = db.getUserByUsernameOrEmail(identifier);
    if (!userRecord) {
      res.status(401).json({ error: 'Akun tidak ditemukan. Periksa kembali username/email Anda.' });
      return;
    }

    if (!db.verifyUserPassword(userRecord, password)) {
      res.status(401).json({ error: 'Password yang Anda masukkan salah' });
      return;
    }

    if (userRecord.status === 'suspended' || userRecord.isBlocked) {
      res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh admin. Silakan hubungi admin.' });
      return;
    }

    const token = db.createSession(userRecord.id);
    const { passwordHash: _, salt: __, ...publicUser } = userRecord;

    res.json({
      message: 'Login berhasil!',
      user: publicUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat login' });
  }
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  let user = db.getUserById(req.user!.id);
  if (user && user.role !== 'admin') {
    await db.refreshUsersFromFirestore();
    user = db.getUserById(req.user!.id);
  }
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }
  const { passwordHash: _, salt: __, ...publicUser } = user;
  res.json({ user: publicUser });
});

// Force sync role from Firebase Firestore
app.post('/api/auth/sync-role', authMiddleware, async (req: Request, res: Response) => {
  try {
    await db.refreshUsersFromFirestore();
    const user = db.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }
    const { passwordHash: _, salt: __, ...publicUser } = user;
    res.json({
      message: 'Sinkronisasi role dari Firebase berhasil',
      user: publicUser,
      isAdmin: publicUser.role === 'admin',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal sinkronisasi dari Firebase: ' + err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ message: 'Logout berhasil' });
});

// Forgot Password Flow
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email wajib diisi' });
    return;
  }

  const user = db.getUserByUsernameOrEmail(email);
  if (!user) {
    res.status(404).json({ error: 'Email tidak terdaftar di AZRYLSTORE' });
    return;
  }

  res.json({
    message: 'Permintaan reset terkirim. Silakan hubungi WhatsApp Admin dengan menyertakan email Anda untuk pemulihan instan.',
    contactAdmin: true,
  });
});

// Change Password Handler (supports both /api/user/change-password and /api/auth/change-password)
const handleChangePassword = (req: Request, res: Response) => {
  const currentPass = req.body.oldPassword || req.body.currentPassword;
  const newPass = req.body.newPassword;
  const confirmNewPass = req.body.confirmNewPassword;

  const user = db.getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  if (!currentPass || !db.verifyUserPassword(user, currentPass)) {
    res.status(400).json({ error: 'Password saat ini salah' });
    return;
  }

  if (!newPass || newPass.length < 6) {
    res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    return;
  }

  if (confirmNewPass !== undefined && newPass !== confirmNewPass) {
    res.status(400).json({ error: 'Konfirmasi password baru tidak cocok' });
    return;
  }

  db.updateUserPassword(user.id, newPass);
  res.json({ message: 'Password berhasil diperbarui!' });
};

app.post('/api/auth/change-password', authMiddleware, handleChangePassword);
app.post('/api/user/change-password', authMiddleware, handleChangePassword);

// ==========================================
// USER DASHBOARD & DEPOSITS
// ==========================================

// Dashboard Stats
app.get('/api/user/dashboard', authMiddleware, (req: Request, res: Response) => {
  const user = db.getUserById(req.user!.id);
  const orders = db.getUserOrders(req.user!.id);
  const txs = db.getUserTransactions(req.user!.id);
  const settings = db.getSettings();

  const totalOrders = orders.length;
  const successOrders = orders.filter((o) => o.status === 'SUCCESS').length;
  const pendingOrders = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PENDING').length;

  res.json({
    stats: {
      balance: user?.balance ?? 0,
      totalOrders,
      successOrders,
      pendingOrders,
      totalTransactions: txs.length,
      accountStatus: user?.status ?? 'active',
      announcement: settings.announcement,
    },
    recentOrders: orders.slice(0, 5),
  });
});

// Get User Deposits
app.get('/api/deposits', authMiddleware, (req: Request, res: Response) => {
  const deposits = db.getUserDeposits(req.user!.id);
  res.json({ deposits });
});

// Create Deposit Request
app.post('/api/deposits', authMiddleware, (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    if (settings.isStoreOpen === false) {
      res.status(403).json({
        error: settings.closeReason || 'Toko sedang tutup. Layanan pengisian saldo sementara dinonaktifkan.',
      });
      return;
    }

    const { amount, payerName, paymentMethod, proofNote } = req.body;
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount < settings.minDeposit) {
      res.status(400).json({
        error: `Nominal deposit minimal Rp${settings.minDeposit.toLocaleString('id-ID')}`,
      });
      return;
    }

    if (!payerName || typeof payerName !== 'string' || !payerName.trim()) {
      res.status(400).json({ error: 'Nama pengguna/pengirim wajib diisi' });
      return;
    }

    const method = paymentMethod === 'DANA' ? 'DANA' : 'QRIS';
    const deposit = db.createDeposit(
      req.user!.id,
      req.user!.username,
      numAmount,
      method,
      payerName.trim(),
      proofNote
    );

    res.status(201).json({
      message: 'Deposit berhasil dibuat! Silakan lakukan pembayaran.',
      deposit,
      paymentDetails: {
        amount: numAmount,
        qrImage: settings.qrImage,
        danaNumber: settings.danaNumber,
        danaName: settings.danaName,
      },
    });
  } catch (err: any) {
    console.error('Create deposit error:', err);
    res.status(500).json({ error: 'Gagal membuat deposit' });
  }
});

// User marks "Saya Sudah Bayar"
app.post('/api/deposits/:id/confirm-paid', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deposit = db.confirmDepositUserPaid(id, req.user!.id);
  if (!deposit) {
    res.status(404).json({ error: 'Deposit tidak ditemukan' });
    return;
  }
  res.json({
    message: 'Konfirmasi terkirim! Status deposit kini PENDING. Saldo akan otomatis bertambah setelah disetujui admin.',
    deposit,
  });
});

// User Transactions
app.get('/api/transactions', authMiddleware, (req: Request, res: Response) => {
  const transactions = db.getUserTransactions(req.user!.id);
  res.json({ transactions });
});

// ==========================================
// AM PREMIUM ORDERS
// ==========================================

// Get User Orders
app.get('/api/orders', authMiddleware, (req: Request, res: Response) => {
  let orders = db.getUserOrders(req.user!.id);
  const { status, product, search } = req.query;

  if (status && typeof status === 'string' && status !== 'ALL') {
    orders = orders.filter((o) => o.status === status);
  }
  if (product && typeof product === 'string' && product !== 'ALL') {
    orders = orders.filter((o) => o.product === product);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.gmail && o.gmail.toLowerCase().includes(q)) ||
        (o.result && o.result.toLowerCase().includes(q))
    );
  }

  res.json({ orders });
});

// Order Detail
app.get('/api/orders/:id', authMiddleware, (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order || order.userId !== req.user!.id) {
    res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    return;
  }
  res.json({ order });
});

// Order AM Premium Eceran
app.post('/api/orders/eceran', authMiddleware, async (req: Request, res: Response) => {
  const lockKey = `eceran_${req.user!.id}`;
  if (pendingOrders.has(lockKey)) {
    res.status(429).json({ error: 'Pesanan sedang diproses. Mohon tunggu sebentar...' });
    return;
  }

  try {
    pendingOrders.add(lockKey);
    const settings = db.getSettings();

    if (settings.isStoreOpen === false) {
      res.status(403).json({
        error: settings.closeReason || 'Toko sedang tutup. Pemesanan sementara tidak dapat diproses.',
      });
      return;
    }

    const { gmail, verificationLink } = req.body;
    const price = settings.priceEceran;

    if (!gmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail.trim())) {
      res.status(400).json({ error: 'Alamat Gmail tidak valid' });
      return;
    }

    const cleanGmail = gmail.trim().toLowerCase();

    // Check balance
    const currentUser = db.getUserById(req.user!.id);
    if (!currentUser || currentUser.balance < price) {
      res.status(400).json({
        error: `Tidak cukup saldo. Saldo Anda Rp${(currentUser?.balance || 0).toLocaleString('id-ID')}, dibutuhkan Rp${price.toLocaleString('id-ID')}`,
        required: price,
        currentBalance: currentUser?.balance || 0,
      });
      return;
    }

    // Deduct balance atomically
    const deductRes = db.adjustUserBalance(
      req.user!.id,
      -price,
      'ORDER_AM',
      `ORDER-${Date.now()}`,
      `Pembelian AM Premium Eceran (${cleanGmail})`
    );

    if (!deductRes.success) {
      res.status(400).json({ error: deductRes.error || 'Gagal memotong saldo' });
      return;
    }

    // Create Order Record in DB
    const order = db.createOrder(
      req.user!.id,
      req.user!.username,
      'AM_ECERAN',
      1,
      price,
      cleanGmail,
      verificationLink
    );

    // If user didn't supply a verification link yet, call API Send (Step 1)
    if (!verificationLink || !verificationLink.trim()) {
      console.log(`[ORDER] Sending AM verification link for ${order.id} to ${cleanGmail}`);
      const sendResult = await callAmSendApi(cleanGmail);

      if (sendResult.success) {
        const updated = db.updateOrder(order.id, {
          status: 'PROCESSING',
          apiResponse: sendResult.rawResponse,
          result: `Link verifikasi telah dikirim ke ${cleanGmail}. Silakan tempelkan link dari email Alight Creative untuk mengaktifkan.`,
        });

        res.status(200).json({
          success: true,
          message: 'Link verifikasi Alight Motion telah dikirim ke email Gmail Anda! Silakan periksa inbox/spam Gmail Anda, lalu masukkan tautan verifikasi di bawah ini.',
          order: updated,
          requiresLink: true,
          currentBalance: deductRes.user?.balance,
        });
        return;
      } else {
        const errorMsg = sendResult.message || 'Gagal mengirim link verifikasi ke Gmail';
        db.updateOrder(order.id, {
          status: 'FAILED',
          errorMessage: errorMsg,
          apiResponse: sendResult.rawResponse,
          result: `Pengiriman link gagal: ${errorMsg}`,
        });

        const refundRes = db.adjustUserBalance(
          req.user!.id,
          price,
          'REFUND',
          order.id,
          `Auto-refund pesanan gagal ${order.id} (Gagal kirim link AM Eceran)`
        );

        if (refundRes.success) {
          db.updateOrder(order.id, {
            status: 'REFUNDED',
            errorMessage: `${errorMsg} (Dana Rp${price.toLocaleString('id-ID')} telah dikembalikan otomatis ke saldo Anda)`,
          });
        }

        res.status(400).json({
          error: `${errorMsg}. Dana Rp${price.toLocaleString('id-ID')} telah dikembalikan ke saldo Anda.`,
          order: db.getOrderById(order.id),
          currentBalance: refundRes.user?.balance || currentUser.balance,
        });
        return;
      }
    }

    // If user already supplied link upfront: Call Backend AM Verif API directly
    console.log(`[ORDER] Processing direct AM Verif for ${order.id} (${cleanGmail}) with link`);
    const apiResult = await callAmVerifApi(cleanGmail, verificationLink.trim());

    if (apiResult.success) {
      const updated = db.updateOrder(order.id, {
        status: 'SUCCESS',
        apiResponse: apiResult.rawResponse,
        result: apiResult.result || `Aktivasi AM Premium sukses untuk ${cleanGmail}`,
        completedAt: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        message: 'Selamat! AM Premium Eceran berhasil diaktifkan!',
        order: updated,
        requiresLink: false,
        currentBalance: deductRes.user?.balance,
      });
    } else {
      const errorMsg = apiResult.message || 'API Alight Motion gagal memproses verifikasi link';
      db.updateOrder(order.id, {
        status: 'FAILED',
        errorMessage: errorMsg,
        apiResponse: apiResult.rawResponse,
        result: `Aktivasi gagal: ${errorMsg}`,
      });

      const refundRes = db.adjustUserBalance(
        req.user!.id,
        price,
        'REFUND',
        order.id,
        `Auto-refund pesanan gagal ${order.id} (AM Premium Eceran)`
      );

      if (refundRes.success) {
        db.updateOrder(order.id, {
          status: 'REFUNDED',
          errorMessage: `${errorMsg} (Dana sebesar Rp${price.toLocaleString('id-ID')} telah dikembalikan otomatis ke saldo Anda)`,
        });
      }

      res.status(400).json({
        error: `${errorMsg}. Dana Rp${price.toLocaleString('id-ID')} telah otomatis dikembalikan ke saldo Anda.`,
        order: db.getOrderById(order.id),
        currentBalance: refundRes.user?.balance || currentUser.balance,
      });
    }
  } catch (err: any) {
    console.error('Order eceran error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses pesanan eceran' });
  } finally {
    pendingOrders.delete(lockKey);
  }
});

// Submit Verification Link for existing Eceran Order
app.post('/api/orders/:id/submit-link', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { link } = req.body;
    const order = db.getOrderById(req.params.id);

    if (!order || order.userId !== req.user!.id) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }

    if (!link || !link.trim()) {
      res.status(400).json({ error: 'Link verifikasi wajib diisi' });
      return;
    }

    if (!order.gmail) {
      res.status(400).json({ error: 'Email pada pesanan ini tidak ditemukan' });
      return;
    }

    console.log(`[ORDER] Submitting verification link for order ${order.id}:`, link);
    db.updateOrder(order.id, { verificationLink: link.trim() });

    const apiResult = await callAmVerifApi(order.gmail, link.trim());

    if (apiResult.success && apiResult.status !== 'REQUIRES_LINK') {
      const updated = db.updateOrder(order.id, {
        status: 'SUCCESS',
        apiResponse: apiResult.rawResponse,
        result: apiResult.result || `Aktivasi AM Premium sukses diverifikasi via link!`,
        completedAt: new Date().toISOString(),
      });
      res.json({ message: 'Verifikasi berhasil! AM Premium sudah aktif.', order: updated });
    } else {
      const updated = db.updateOrder(order.id, {
        errorMessage: apiResult.message,
        apiResponse: apiResult.rawResponse,
      });
      res.status(400).json({ error: apiResult.message || 'Link verifikasi tidak valid atau kedaluwarsa', order: updated });
    }
  } catch (err: any) {
    console.error('Submit link error:', err);
    res.status(500).json({ error: 'Gagal mengirim link verifikasi' });
  }
});

// Order AM Premium Bulk
app.post('/api/orders/bulk', authMiddleware, async (req: Request, res: Response) => {
  const lockKey = `bulk_${req.user!.id}`;
  if (pendingOrders.has(lockKey)) {
    res.status(429).json({ error: 'Pesanan bulk sedang diproses. Mohon tunggu...' });
    return;
  }

  try {
    pendingOrders.add(lockKey);
    const settings = db.getSettings();

    if (settings.isStoreOpen === false) {
      res.status(403).json({
        error: settings.closeReason || 'Toko sedang tutup. Pemesanan sementara tidak dapat diproses.',
      });
      return;
    }

    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < settings.bulkMin || qty > settings.bulkMax) {
      res.status(400).json({
        error: `Jumlah order bulk harus antara ${settings.bulkMin} dan ${settings.bulkMax} akun`,
      });
      return;
    }

    const totalPrice = qty * settings.priceBulk;

    // Check balance
    const currentUser = db.getUserById(req.user!.id);
    if (!currentUser || currentUser.balance < totalPrice) {
      res.status(400).json({
        error: `Tidak cukup saldo. Saldo Anda Rp${(currentUser?.balance || 0).toLocaleString('id-ID')}, dibutuhkan Rp${totalPrice.toLocaleString('id-ID')}`,
        required: totalPrice,
        currentBalance: currentUser?.balance || 0,
      });
      return;
    }

    // Deduct balance atomically
    const deductRes = db.adjustUserBalance(
      req.user!.id,
      -totalPrice,
      'ORDER_AM',
      `BULK-${Date.now()}`,
      `Pembelian AM Premium Bulk (${qty} akun)`
    );

    if (!deductRes.success) {
      res.status(400).json({ error: deductRes.error || 'Gagal memotong saldo' });
      return;
    }

    // Create Order Record
    const order = db.createOrder(
      req.user!.id,
      req.user!.username,
      'AM_BULK',
      qty,
      totalPrice
    );

    // Call Backend AM Bulk API
    console.log(`[ORDER] Processing AM Bulk ${order.id} for ${qty} accounts...`);
    const apiResult = await callAmBulkApi(qty);

    if (apiResult.success) {
      const updated = db.updateOrder(order.id, {
        status: 'SUCCESS',
        apiResponse: apiResult.rawResponse,
        result: apiResult.result || `${qty} Akun AM Premium Bulk siap digunakan.`,
        completedAt: new Date().toISOString(),
      });
      res.status(200).json({
        message: `Berhasil! ${qty} Akun AM Premium Bulk telah siap di Riwayat Pesanan!`,
        order: updated,
        currentBalance: deductRes.user?.balance,
      });
    } else {
      const errorMsg = apiResult.message || 'API AM Bulk gagal membuat akun';
      db.updateOrder(order.id, {
        status: 'FAILED',
        errorMessage: errorMsg,
        apiResponse: apiResult.rawResponse,
        result: `Gagal proses bulk: ${errorMsg}`,
      });

      const refundRes = db.adjustUserBalance(
        req.user!.id,
        totalPrice,
        'REFUND',
        order.id,
        `Auto-refund pesanan gagal ${order.id} (AM Premium Bulk ${qty} akun)`
      );

      if (refundRes.success) {
        db.updateOrder(order.id, {
          status: 'REFUNDED',
          errorMessage: `${errorMsg} (Dana sebesar Rp${totalPrice.toLocaleString('id-ID')} telah dikembalikan ke saldo)`,
        });
      }

      res.status(200).json({
        warning: true,
        message: `Gagal memproses bulk: ${errorMsg}. Dana Rp${totalPrice.toLocaleString('id-ID')} telah otomatis dikembalikan ke saldo Anda.`,
        order: db.getOrderById(order.id),
        currentBalance: refundRes.user?.balance || currentUser.balance,
      });
    }
  } catch (err: any) {
    console.error('Order bulk error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses pesanan bulk' });
  } finally {
    pendingOrders.delete(lockKey);
  }
});

// ==========================================
// ADMIN PANEL ROUTES (PROTECTED)
// ==========================================

// Admin Overview / Stats
const getAdminStats = (req: Request, res: Response) => {
  const users = db.getAllUsers();
  const deposits = db.getAllDeposits();
  const orders = db.getAllOrders();

  const totalUsers = users.length;
  const totalUserBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalDepositAmount = deposits
    .filter((d) => d.status === 'APPROVED')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING');
  const depositPendingCount = pendingDeposits.length;
  const depositPendingAmount = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);

  const totalOrders = orders.length;
  const orderProcessing = orders.filter((o) => o.status === 'PROCESSING').length;
  const orderSuccess = orders.filter((o) => o.status === 'SUCCESS').length;
  const orderFailed = orders.filter((o) => o.status === 'FAILED').length;
  const orderRefunded = orders.filter((o) => o.status === 'REFUNDED').length;
  const totalOrderVolume = orders
    .filter((o) => o.status === 'SUCCESS')
    .reduce((sum, o) => sum + o.price, 0);

  const statsObj = {
    totalUsers,
    totalUserBalance,
    totalDepositAmount,
    totalDeposits: totalDepositAmount,
    pendingDeposits: depositPendingCount,
    depositPendingCount,
    depositPendingAmount,
    totalOrders,
    orderProcessing,
    orderSuccess,
    orderFailed,
    orderRefunded,
    totalOrderVolume,
    totalRevenue: totalOrderVolume,
  };

  res.json({
    stats: statsObj,
    overview: statsObj,
  });
};

app.get('/api/admin/overview', adminMiddleware, getAdminStats);
app.get('/api/admin/stats', adminMiddleware, getAdminStats);

// Admin Users List & Search
app.get('/api/admin/users', adminMiddleware, (req: Request, res: Response) => {
  let users = db.getAllUsers();
  const { search } = req.query;

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    users = users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  const orders = db.getAllOrders();
  const deposits = db.getAllDeposits();

  const userStats = users.map((u) => {
    const userOrders = orders.filter((o) => o.userId === u.id);
    const userDeposits = deposits.filter((d) => d.userId === u.id && d.status === 'APPROVED');
    return {
      ...u,
      totalOrdersCount: userOrders.length,
      totalDepositAmount: userDeposits.reduce((sum, d) => sum + d.amount, 0),
    };
  });

  res.json({ users: userStats });
});

// Admin Suspend / Activate User
app.post('/api/admin/users/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ error: 'Status harus active atau suspended' });
    return;
  }

  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  db.updateUserStatus(user.id, status);
  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
    `Mengubah status @${user.username} menjadi ${status}`,
    user.username
  );

  res.json({ message: `Status @${user.username} berhasil diubah menjadi ${status}` });
});

// Admin Block / Unblock User
app.post('/api/admin/users/:id/block', adminMiddleware, (req: Request, res: Response) => {
  const { isBlocked } = req.body;
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  const shouldBlock = typeof isBlocked === 'boolean' ? isBlocked : !user.isBlocked;
  db.setUserBlocked(user.id, shouldBlock);
  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    shouldBlock ? 'BLOCK_USER' : 'UNBLOCK_USER',
    `Mengubah status blokir @${user.username} menjadi ${shouldBlock ? 'DIBLOKIR' : 'AKTIF'}`,
    user.username
  );

  res.json({
    message: `Akun @${user.username} berhasil ${shouldBlock ? 'diblokir' : 'dibuka blokirnya'}!`,
    user: db.getUserById(user.id),
  });
});

// Admin Adjust User Balance
app.post('/api/admin/users/:id/balance', adminMiddleware, (req: Request, res: Response) => {
  const { amount, amountDelta, type, reason } = req.body;
  let delta = 0;

  if (amountDelta !== undefined) {
    delta = parseInt(amountDelta, 10);
  } else if (amount !== undefined) {
    const rawAmt = parseInt(amount, 10);
    delta = type === 'deduct' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
  }

  if (isNaN(delta) || delta === 0) {
    res.status(400).json({ error: 'Nominal penyesuaian saldo tidak valid' });
    return;
  }

  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  const adj = db.adjustUserBalance(
    user.id,
    delta,
    'ADMIN_ADJUST',
    `ADJ-${Date.now()}`,
    reason || `Penyesuaian manual oleh admin @${req.user!.username}`
  );

  if (!adj.success) {
    res.status(400).json({ error: adj.error || 'Gagal mengubah saldo' });
    return;
  }

  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    'ADJUST_BALANCE',
    `Penyesuaian saldo @${user.username} sebesar ${delta > 0 ? '+' : ''}Rp${delta.toLocaleString('id-ID')}. Alasan: ${reason || 'Manual adjust'}`,
    user.username
  );

  res.json({
    message: `Saldo @${user.username} berhasil disesuaikan! Saldo sekarang: Rp${adj.user?.balance.toLocaleString('id-ID')}`,
    user: adj.user,
  });
});

// Admin Reset User Password
app.post('/api/admin/users/:id/reset-password', adminMiddleware, (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    return;
  }

  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }

  db.updateUserPassword(user.id, newPassword);
  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    'RESET_PASSWORD',
    `Reset password akun @${user.username}`,
    user.username
  );

  res.json({ message: `Password @${user.username} berhasil direset.` });
});

// Admin Deposits List
app.get('/api/admin/deposits', adminMiddleware, (req: Request, res: Response) => {
  let deposits = db.getAllDeposits();
  const { status, search } = req.query;

  if (status && typeof status === 'string' && status !== 'ALL') {
    deposits = deposits.filter((d) => d.status === status);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    deposits = deposits.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.payerName.toLowerCase().includes(q)
    );
  }

  res.json({ deposits });
});

// Admin Approve Deposit
app.post('/api/admin/deposits/:id/approve', adminMiddleware, (req: Request, res: Response) => {
  const result = db.approveDeposit(req.params.id, req.user!.username);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({
    message: `Deposit ${req.params.id} berhasil disetujui! Saldo user telah bertambah Rp${result.deposit?.amount.toLocaleString('id-ID')}.`,
    deposit: result.deposit,
  });
});

// Admin Reject Deposit
app.post('/api/admin/deposits/:id/reject', adminMiddleware, (req: Request, res: Response) => {
  const { reason } = req.body;
  const result = db.rejectDeposit(req.params.id, req.user!.username, reason);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({
    message: `Deposit ${req.params.id} telah ditolak. Saldo user tidak bertambah.`,
    deposit: result.deposit,
  });
});

// Admin Orders List
app.get('/api/admin/orders', adminMiddleware, (req: Request, res: Response) => {
  let orders = db.getAllOrders();
  const { status, product, search } = req.query;

  if (status && typeof status === 'string' && status !== 'ALL') {
    orders = orders.filter((o) => o.status === status);
  }
  if (product && typeof product === 'string' && product !== 'ALL') {
    orders = orders.filter((o) => o.product === product);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.username.toLowerCase().includes(q) ||
        (o.gmail && o.gmail.toLowerCase().includes(q))
    );
  }

  res.json({ orders });
});

// Admin Retry Order
app.post('/api/admin/orders/:id/retry', adminMiddleware, async (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order tidak ditemukan' });
    return;
  }

  db.updateOrder(order.id, { status: 'PROCESSING', errorMessage: undefined });

  if (order.product === 'AM_ECERAN' && order.gmail) {
    const apiResult = await callAmVerifApi(order.gmail, order.verificationLink);
    if (apiResult.success && apiResult.status !== 'REQUIRES_LINK') {
      const updated = db.updateOrder(order.id, {
        status: 'SUCCESS',
        apiResponse: apiResult.rawResponse,
        result: apiResult.result || `Sukses aktivasi via retry admin`,
        completedAt: new Date().toISOString(),
      });
      res.json({ message: 'Retry order eceran berhasil!', order: updated });
    } else {
      const updated = db.updateOrder(order.id, {
        status: 'FAILED',
        errorMessage: apiResult.message,
        apiResponse: apiResult.rawResponse,
      });
      res.status(400).json({ error: apiResult.message || 'Retry order eceran gagal', order: updated });
    }
  } else if (order.product === 'AM_BULK') {
    const apiResult = await callAmBulkApi(order.quantity);
    if (apiResult.success) {
      const updated = db.updateOrder(order.id, {
        status: 'SUCCESS',
        apiResponse: apiResult.rawResponse,
        result: apiResult.result,
        completedAt: new Date().toISOString(),
      });
      res.json({ message: 'Retry order bulk berhasil!', order: updated });
    } else {
      const updated = db.updateOrder(order.id, {
        status: 'FAILED',
        errorMessage: apiResult.message,
        apiResponse: apiResult.rawResponse,
      });
      res.status(400).json({ error: apiResult.message || 'Retry order bulk gagal', order: updated });
    }
  } else {
    res.status(400).json({ error: 'Informasi pesanan tidak lengkap untuk retry' });
  }
});

// Admin Refund Order
app.post('/api/admin/orders/:id/refund', adminMiddleware, (req: Request, res: Response) => {
  const { reason } = req.body;
  const result = db.refundOrder(req.params.id, req.user!.username, reason);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({
    message: `Order ${req.params.id} berhasil di-refund. Dana Rp${result.order?.price.toLocaleString('id-ID')} telah dikembalikan ke saldo user.`,
    order: result.order,
  });
});

// Admin Update Order Status Manually
app.post('/api/admin/orders/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { status, resultText } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order tidak ditemukan' });
    return;
  }

  const updated = db.updateOrder(order.id, {
    status,
    result: resultText || order.result,
    completedAt: status === 'SUCCESS' ? new Date().toISOString() : order.completedAt,
  });

  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    'MANUAL_ORDER_UPDATE',
    `Update status order ${order.id} manual ke ${status}`,
    order.username
  );

  res.json({ message: 'Status order berhasil diperbarui', order: updated });
});

// Admin Toggle Buka / Tutup Toko
app.post('/api/admin/toggle-store', adminMiddleware, (req: Request, res: Response) => {
  const { isStoreOpen, closeReason } = req.body;
  const current = db.getSettings();
  const nextOpen = typeof isStoreOpen === 'boolean' ? isStoreOpen : !current.isStoreOpen;

  const updated = db.updateSettings({
    isStoreOpen: nextOpen,
    ...(closeReason !== undefined ? { closeReason } : {}),
  });

  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    nextOpen ? 'STORE_OPEN' : 'STORE_CLOSE',
    `Mengubah status toko menjadi: ${nextOpen ? 'BUKA' : 'TUTUP'}`
  );

  res.json({
    message: `Status toko berhasil diubah menjadi ${nextOpen ? 'BUKA' : 'TUTUP'}`,
    settings: updated,
  });
});

// Admin Settings (GET, PUT, POST)
app.get('/api/admin/settings', adminMiddleware, (req: Request, res: Response) => {
  res.json({ settings: db.getSettings() });
});

const handleSaveAdminSettings = (req: Request, res: Response) => {
  const newSettings = req.body;
  const updated = db.updateSettings(newSettings);
  db.addAdminLog(
    req.user!.id,
    req.user!.username,
    'UPDATE_SETTINGS',
    'Memperbarui konfigurasi harga, nomor DANA, status buka/tutup toko, atau info lainnya'
  );
  res.json({ message: 'Pengaturan toko berhasil disimpan!', settings: updated });
};

app.put('/api/admin/settings', adminMiddleware, handleSaveAdminSettings);
app.post('/api/admin/settings', adminMiddleware, handleSaveAdminSettings);

// Admin Audit Logs
app.get('/api/admin/logs', adminMiddleware, (req: Request, res: Response) => {
  const logs = db.getAdminLogs();
  res.json({ logs });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AZRYLSTORE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
