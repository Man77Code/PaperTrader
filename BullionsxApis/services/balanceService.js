class InsufficientBalanceError extends Error {
  constructor(available, requested, walletType) {
    super(`Insufficient ${walletType} balance: requested ${requested}, available ${available}`);
    this.name = 'InsufficientBalanceError';
    this.statusCode = 400;
    this.available = available;
    this.requested = requested;
    this.walletType = walletType;
  }
}

const WALLET_COLUMNS = { spot: 'balance', funding: 'fundwallet', share: 'sharewallet' };

async function ensureBalanceRow(conn, userId, currencySymbol) {
  const [rows] = await conn.query(
    'SELECT id, balance, sharewallet, fundwallet FROM dbt_balance WHERE user_id = ? AND currency_symbol = ?',
    [userId, currencySymbol]
  );
  if (!rows.length) {
    const [result] = await conn.query(
      'INSERT INTO dbt_balance (user_id, currency_symbol, balance, sharewallet, fundwallet) VALUES (?, ?, 0, 0, 0)',
      [userId, currencySymbol]
    );
    return { id: result.insertId, balance: 0, sharewallet: 0, fundwallet: 0 };
  }
  return rows[0];
}

async function getWalletBalance(conn, userId, currencySymbol, walletType) {
  const column = WALLET_COLUMNS[walletType];
  if (!column) throw new Error(`Invalid wallet type: ${walletType}. Must be spot, funding, or share.`);
  const [rows] = await conn.query(
    `SELECT ${column} as balance FROM dbt_balance WHERE user_id = ? AND currency_symbol = ? FOR UPDATE`,
    [userId, currencySymbol]
  );
  return rows.length ? parseFloat(rows[0].balance) : 0;
}

async function creditWallet(conn, { user_id, currency_symbol, walletType, amount, transaction_type, ip, fees = 0 }) {
  if (amount <= 0) throw new Error('Credit amount must be positive');
  const column = WALLET_COLUMNS[walletType];
  if (!column) throw new Error(`Invalid wallet type: ${walletType}`);

  const row = await ensureBalanceRow(conn, user_id, currency_symbol);
  await conn.query(
    `UPDATE dbt_balance SET ${column} = ${column} + ? WHERE id = ?`,
    [amount, row.id]
  );
  await conn.query(
    'INSERT INTO dbt_balance_log (balance_id, user_id, currency_symbol, transaction_type, transaction_amount, transaction_fees, ip, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [row.id, user_id, currency_symbol, transaction_type, amount, fees, ip || '0.0.0.0']
  );
}

async function debitWallet(conn, { user_id, currency_symbol, walletType, amount, transaction_type, ip, fees = 0 }) {
  if (amount <= 0) throw new Error('Debit amount must be positive');
  const column = WALLET_COLUMNS[walletType];
  if (!column) throw new Error(`Invalid wallet type: ${walletType}`);

  const row = await ensureBalanceRow(conn, user_id, currency_symbol);
  const currentBalance = parseFloat(row[column] || 0);
  const totalDebit = amount + fees;

  if (currentBalance < totalDebit) {
    throw new InsufficientBalanceError(currentBalance, totalDebit, walletType);
  }

  await conn.query(
    `UPDATE dbt_balance SET ${column} = ${column} - ? WHERE id = ?`,
    [totalDebit, row.id]
  );
  await conn.query(
    'INSERT INTO dbt_balance_log (balance_id, user_id, currency_symbol, transaction_type, transaction_amount, transaction_fees, ip, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [row.id, user_id, currency_symbol, transaction_type, amount, fees, ip || '0.0.0.0']
  );
}

async function transferBetweenWallets(conn, { user_id, currency_symbol, from, to, amount, ip }) {
  if (amount <= 0) throw new Error('Transfer amount must be positive');
  if (from === to) throw new Error('Source and destination wallets must differ');

  const fromType = from === 'spot' ? 'spot' : from === 'funding' ? 'funding' : 'share';
  const toType = to === 'spot' ? 'spot' : to === 'funding' ? 'funding' : 'share';

  const fromColumn = WALLET_COLUMNS[fromType];
  const toColumn = WALLET_COLUMNS[toType];

  const row = await ensureBalanceRow(conn, user_id, currency_symbol);

  const fromBalance = parseFloat(row[fromColumn] || 0);
  if (fromBalance < amount) {
    throw new InsufficientBalanceError(fromBalance, amount, fromType);
  }

  await conn.query(
    `UPDATE dbt_balance SET ${fromColumn} = ${fromColumn} - ?, ${toColumn} = ${toColumn} + ? WHERE id = ?`,
    [amount, amount, row.id]
  );

  await conn.query(
    'INSERT INTO dbt_balance_log (balance_id, user_id, currency_symbol, transaction_type, transaction_amount, transaction_fees, ip, date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [row.id, user_id, currency_symbol, `TRANSFER_${fromType.toUpperCase()}_TO_${toType.toUpperCase()}`, amount, 0, ip || '0.0.0.0']
  );
}

module.exports = {
  InsufficientBalanceError,
  WALLET_COLUMNS,
  ensureBalanceRow,
  getWalletBalance,
  creditWallet,
  debitWallet,
  transferBetweenWallets,
};
