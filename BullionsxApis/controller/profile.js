const connect = require('../config/Mysqlcon');
const asyncMiddleware = require('../middleware/async');

const EDITABLE_FIELDS = [
    'first_name', 'last_name', 'username', 'language',
    'country', 'city', 'address', 'bio', 'image'
];

exports.getProfile = asyncMiddleware(async (req, res) => {
    const conn = await connect();
    const [rows] = await conn.query(
        `SELECT id, user_id, first_name, last_name, username, email, phone,
                googleauth, referral_id, referral_status, language, country,
                city, address, bio, image, status, verified, created,
                ip, remarks, withdraw_status, deposit_status, trade_status, mobile_pin
         FROM dbt_user WHERE user_id = ?`,
        [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(rows[0]);
});

exports.updateProfile = asyncMiddleware(async (req, res) => {
    const { email, phone, password, user_id, password_reset_token, id, ...body } = req.body;

    if (email !== undefined) {
        return res.status(400).json({ message: 'Email cannot be changed through this endpoint.' });
    }
    if (phone !== undefined) {
        return res.status(400).json({ message: 'Phone number cannot be changed through this endpoint.' });
    }
    if (password !== undefined) {
        return res.status(400).json({ message: 'Password cannot be changed through this endpoint.' });
    }
    if (user_id !== undefined) {
        return res.status(400).json({ message: 'user_id cannot be changed.' });
    }
    if (password_reset_token !== undefined) {
        return res.status(400).json({ message: 'password_reset_token cannot be changed through this endpoint.' });
    }
    if (id !== undefined) {
        return res.status(400).json({ message: 'id cannot be changed.' });
    }

    const updates = {};
    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    const extraKeys = Object.keys(body).filter(k => !EDITABLE_FIELDS.includes(k));
    if (extraKeys.length > 0) {
        return res.status(400).json({ message: `Unexpected fields: ${extraKeys.join(', ')}` });
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No editable fields provided.' });
    }

    const conn = await connect();
    await conn.query('UPDATE dbt_user SET ? WHERE user_id = ?', [updates, req.user.user_id]);

    const [rows] = await conn.query(
        `SELECT id, user_id, first_name, last_name, username, email, phone,
                googleauth, referral_id, referral_status, language, country,
                city, address, bio, image, status, verified, created,
                ip, remarks, withdraw_status, deposit_status, trade_status, mobile_pin
         FROM dbt_user WHERE user_id = ?`,
        [req.user.user_id]
    );

    res.status(200).json(rows[0]);
});
