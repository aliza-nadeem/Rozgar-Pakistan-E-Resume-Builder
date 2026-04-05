// ============================================================================
// COMPLETE NODE.JS BACKEND SERVER
// Rozgar Pakistan - E-Resume Builder API
// ============================================================================
// This file combines all backend tasks into a fully functional server
// Run this with: node server.js
// ============================================================================

const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Enable CORS - allows React frontend to communicate with this backend
// Without this, browser will block requests from localhost:3000 to localhost:5000
app.use(cors());

// Parse JSON request bodies from React
app.use(express.json());

// ============================================================================
// DATABASE CONFIGURATION (Task 5)
// ============================================================================

const dbConfig = {
    user: 'sa',
    password: '123',
    server: 'localhost',
    port: 1433,
    database: 'RozgarDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let pool;

async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server successfully!');
        console.log('Database:', dbConfig.database);
        return true;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        console.log('\nTROUBLESHOOTING:');
        console.log('1. Is SQL Server running?');
        console.log('2. Is the password correct in dbConfig?');
        console.log('3. Is RozgarDB database created? Run SQL setup scripts first.');
        return false;
    }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// ----- HEALTH CHECK -----
app.get('/', (req, res) => {
    res.json({ 
        message: 'Rozgar Pakistan API is running!',
        endpoints: [
            'POST /api/login',
            'GET /api/getExp/:userId',
            'POST /api/addExp',
            'PUT /api/updateExp/:expId',
            'DELETE /api/deleteExp/:expId'
        ]
    });
});

// ----- LOGIN API (Task 1) -----
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Call the sp_LoginUser stored procedure
        const result = await pool.request()
            .input('Email', sql.VarChar(100), email)
            .input('Password', sql.VarChar(100), password)
            .execute('sp_LoginUser');
        
        if (result.recordset.length > 0) {
            res.json({
                success: true,
                message: 'Login successful!',
                user: result.recordset[0]
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: err.message
        });
    }
});

// ----- GET EXPERIENCE API (Task 2 - READ) -----
app.get('/api/getExp/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Call the sp_GetExperience stored procedure
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .execute('sp_GetExperience');
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (err) {
        console.error('Get experience error:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching experience',
            error: err.message
        });
    }
});

// ----- ADD EXPERIENCE API (Task 2 & 6 - CREATE) -----
app.post('/api/addExp', async (req, res) => {
    try {
        const { UserID, JobTitle, CompanyName, YearsWorked } = req.body;
        
        // Validate required fields
        if (!UserID || !JobTitle || !CompanyName || !YearsWorked) {
            return res.status(400).json({
                success: false,
                message: 'All fields required: UserID, JobTitle, CompanyName, YearsWorked'
            });
        }
        
        // Call the sp_AddExperience stored procedure
        const result = await pool.request()
            .input('UserID', sql.Int, UserID)
            .input('JobTitle', sql.VarChar(100), JobTitle)
            .input('CompanyName', sql.VarChar(100), CompanyName)
            .input('YearsWorked', sql.Int, YearsWorked)
            .execute('sp_AddExperience');
        
        res.json({
            success: true,
            message: 'Experience added successfully!',
            data: result.recordset[0]
        });
        
    } catch (err) {
        console.error('Add experience error:', err);
        res.status(500).json({
            success: false,
            message: 'Error adding experience',
            error: err.message
        });
    }
});

// ----- UPDATE EXPERIENCE API (UPDATE) -----
app.put('/api/updateExp/:expId', async (req, res) => {
    try {
        const expId = parseInt(req.params.expId);
        const { JobTitle, CompanyName, YearsWorked, IsCurrentJob } = req.body;
        
        await pool.request()
            .input('ExpID', sql.Int, expId)
            .input('JobTitle', sql.VarChar(100), JobTitle)
            .input('CompanyName', sql.VarChar(100), CompanyName)
            .input('YearsWorked', sql.Int, YearsWorked)
            .input('IsCurrentJob', sql.Bit, IsCurrentJob ? 1 : 0)
            .query(`
                UPDATE Experience 
                SET JobTitle = @JobTitle, 
                    CompanyName = @CompanyName, 
                    YearsWorked = @YearsWorked,
                    IsCurrentJob = @IsCurrentJob
                WHERE ExpID = @ExpID
            `);
        
        res.json({
            success: true,
            message: 'Experience updated successfully!'
        });
        
    } catch (err) {
        console.error('Update experience error:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating experience',
            error: err.message
        });
    }
});

// ----- DELETE EXPERIENCE API (DELETE) -----
app.delete('/api/deleteExp/:expId', async (req, res) => {
    try {
        const expId = parseInt(req.params.expId);
        
        await pool.request()
            .input('ExpID', sql.Int, expId)
            .query('DELETE FROM Experience WHERE ExpID = @ExpID');
        
        res.json({
            success: true,
            message: 'Experience deleted successfully!'
        });
        
    } catch (err) {
        console.error('Delete experience error:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting experience',
            error: err.message
        });
    }
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = 5000;  // React runs on 3000, so backend uses 5000

async function startServer() {
    // Connect to database first
    const connected = await connectToDatabase();
    
    if (!connected) {
        console.log('\nWARNING: Server starting without database connection.');
        console.log('API endpoints will not work until database is connected.\n');
    }
    
    // Start the Express server
    app.listen(PORT, () => {
        console.log('\n============================================');
        console.log('   ROZGAR PAKISTAN BACKEND SERVER');
        console.log('============================================');
        console.log(`API URL: http://localhost:${PORT}`);
        console.log('\nAvailable Endpoints:');
        console.log('  POST   /api/login          - User login');
        console.log('  GET    /api/getExp/:userId - Get experiences');
        console.log('  POST   /api/addExp         - Add experience');
        console.log('  PUT    /api/updateExp/:id  - Update experience');
        console.log('  DELETE /api/deleteExp/:id  - Delete experience');
        console.log('\nReact frontend should run on http://localhost:3000');
        console.log('============================================\n');
    });
}

// Start the server
startServer();

/*
============================================================================
HOW TO RUN:
============================================================================
1. Open terminal in the backend folder
2. Install dependencies: npm install express mssql cors
3. Make sure SQL Server is running with RozgarDB set up
4. Update the password in dbConfig if needed
5. Run: node server.js
6. Server starts on http://localhost:5000
============================================================================
*/
