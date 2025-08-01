const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'call_logs.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to the call_logs database.');
                this.initializeDatabase();
            }
        });
    }

    initializeDatabase() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS call_logs (
                call_id TEXT PRIMARY KEY,
                customer_name TEXT,
                ani TEXT,
                call_type TEXT,
                sbc_type TEXT,
                start_time DATETIME,
                end_time DATETIME,
                duration INTEGER,
                status TEXT,
                actions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`;

        this.db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating call_logs table:', err);
            } else {
                console.log('call_logs table initialized successfully.');
            }
        });
    }

    async logCall({ callId, customerName, ani, callType, sbcType, startTime, status, actions }) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO call_logs (call_id, customer_name, ani, call_type, sbc_type, start_time, status, actions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                sql,
                [
                    callId,
                    customerName,
                    ani,
                    callType,
                    sbcType,
                    startTime,
                    status,
                    JSON.stringify(actions)
                ],
                function(err) {
                    if (err) {
                        console.error('Error logging call:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    updateCallStatus(callId, status, action) {
        const sql = `
            UPDATE call_logs
            SET status = ?,
                actions = json_insert(COALESCE(actions, '[]'), '$[' || json_array_length(COALESCE(actions, '[]')) || ']', ?),
                end_time = CASE WHEN ? IN ('ended', 'failed') THEN CURRENT_TIMESTAMP ELSE end_time END,
                duration = CASE WHEN ? IN ('ended', 'failed') THEN
                    ROUND((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(start_time)) * 86400)
                    ELSE duration END
            WHERE call_id = ?`;

        const actionData = JSON.stringify({
            type: action,
            timestamp: new Date().toISOString(),
            status: status
        });

        return new Promise((resolve, reject) => {
            this.db.run(sql, [status, actionData, status, status, callId], function(err) {
                if (err) {
                    console.error('Error updating call status:', err);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getCallHistory(filters = {}) {
        let sql = 'SELECT * FROM call_logs';
        const params = [];
        const conditions = [];

        if (filters.customerName) {
            conditions.push('customer_name LIKE ?');
            params.push(`%${filters.customerName}%`);
        }

        if (filters.ani) {
            conditions.push('ani LIKE ?');
            params.push(`%${filters.ani}%`);
        }

        if (filters.startDate) {
            conditions.push('DATE(start_time) >= DATE(?)');
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            conditions.push('DATE(start_time) <= DATE(?)');
            params.push(filters.endDate);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY start_time DESC';

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching call history:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();