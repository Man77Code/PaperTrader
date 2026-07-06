const connect = require('../config/Mysqlcon');

module.exports = async function (req, res, next) {
    try {
        const conn = await connect();
        const [rows] = await conn.query(
            'SELECT is_admin FROM dbt_user WHERE user_id = ?',
            [req.user.user_id]
        );
        if (!rows.length || !rows[0].is_admin) {
            return res.status(403).json({ status: 0, message: 'Admin access required.' });
        }
        next();
    } catch (err) {
        console.error('adminAuth error:', err);
        return res.status(500).json({ status: 0, message: 'Internal server error.' });
    }
};
