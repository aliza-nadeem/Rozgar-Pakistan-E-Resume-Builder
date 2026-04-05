import React, { useState, useEffect } from 'react';
import './App.css';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setMessage('Please enter both email and password');
            return;
        }
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                setMessage(data.message || 'Login failed');
            }
        } catch (error) {
            setMessage('Cannot connect to server. Is backend running on port 5000?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Rozgar Pakistan</h1>
                <p className="subtitle">E-Resume Builder Portal</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-login">
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                    {message && <p className="message error">{message}</p>}
                </form>
                <div className="demo-info">
                    <p><strong>Demo Credentials:</strong></p>
                    <p>Email: ali.raza@email.com</p>
                    <p>Password: password123</p>
                </div>
            </div>
        </div>
    );
}

function ExperienceTable({ data, onDelete, onEdit, statusMessage }) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <p>No work experience added yet.</p>
                <p>Add your first experience below!</p>
            </div>
        );
    }

    return (
        <>
            {statusMessage && (
                <div className={`inline-message ${statusMessage.type}`}>
                    {statusMessage.type === 'success' ? '✅' : '❌'} {statusMessage.text}
                </div>
            )}
            <table className="experience-table">
                <thead>
                    <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Years</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((job) => (
                        <tr key={job.ExpID}>
                            <td><strong>{job.JobTitle}</strong></td>
                            <td>{job.CompanyName}</td>
                            <td>{job.YearsWorked} year{job.YearsWorked > 1 ? 's' : ''}</td>
                            <td>
                                <span className={`badge ${job.IsCurrentJob ? 'current' : 'past'}`}>
                                    {job.IsCurrentJob ? '🟢 Current' : '⚪ Past'}
                                </span>
                            </td>
                            <td>
                                <button className="btn-edit" onClick={() => onEdit(job)}>
                                    ✏️ Edit
                                </button>
                                <button className="btn-delete" onClick={() => onDelete(job.ExpID)}>
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function AddExperienceForm({ userId, onSave }) {
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [yearsWorked, setYearsWorked] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (!jobTitle || !companyName || !yearsWorked) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }
        setIsSubmitting(true);
        setMessage('');
        try {
            const response = await fetch('http://localhost:5000/api/addExp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    UserID: userId,
                    JobTitle: jobTitle,
                    CompanyName: companyName,
                    YearsWorked: parseInt(yearsWorked)
                })
            });
            const result = await response.json();
            if (result.success) {
                setMessage({ type: 'success', text: '✅ Experience added successfully!' });
                setJobTitle('');
                setCompanyName('');
                setYearsWorked('');
                onSave();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage({ type: 'error', text: '❌ Error: ' + result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '❌ Failed to save experience' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-form-container">
            <h3>➕ Add New Experience</h3>
            <div className="add-form">
                <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job Title (e.g., Software Engineer)"
                />
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Name (e.g., Systems Ltd)"
                />
                <input
                    type="number"
                    value={yearsWorked}
                    onChange={(e) => setYearsWorked(e.target.value)}
                    placeholder="Years Worked"
                    min="1"
                    max="50"
                />
                <button onClick={handleSave} disabled={isSubmitting} className="btn-add">
                    {isSubmitting ? '⏳ Saving...' : '💾 Add Experience'}
                </button>
            </div>
            {message && (
                <div className={`inline-message ${message.type}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

function Dashboard({ user, onLogout }) {
    const [experience, setExperience] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        fetchExperience();
    }, [user.UserID]);

    const fetchExperience = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/getExp/${user.UserID}`);
            const result = await response.json();
            if (result.success) {
                setExperience(result.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleDelete = async (expId) => {
        if (!window.confirm('Delete this experience?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/deleteExp/${expId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                showMessage('success', '✅ Experience deleted successfully!');
                fetchExperience();
            } else {
                showMessage('error', '❌ Delete failed!');
            }
        } catch (error) {
            showMessage('error', '❌ Failed to connect to server!');
        }
    };

    const handleEdit = async (job) => {
        const newTitle = prompt('Enter new job title:', job.JobTitle);
        if (newTitle === null) return;

        const newCompany = prompt('Enter new company:', job.CompanyName);
        if (newCompany === null) return;

        const newYears = prompt('Enter years worked:', job.YearsWorked);
        if (newYears === null) return;

        if (!newTitle.trim() || !newCompany.trim() || !newYears) {
            showMessage('error', '❌ All fields are required!');
            return;
        }

        const yearsNum = parseInt(newYears);
        if (isNaN(yearsNum) || yearsNum < 1) {
            showMessage('error', '❌ Please enter a valid number for years!');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/updateExp/${job.ExpID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    JobTitle: newTitle.trim(),
                    CompanyName: newCompany.trim(),
                    YearsWorked: yearsNum,
                    IsCurrentJob: job.IsCurrentJob
                })
            });
            const result = await response.json();
            if (result.success) {
                showMessage('success', '✅ Experience updated successfully!');
                fetchExperience();
            } else {
                showMessage('error', '❌ Update failed: ' + result.message);
            }
        } catch (error) {
            showMessage('error', '❌ Failed to connect to server!');
        }
    };

    return (
        <div className="dashboard">
            <header className="header">
                <h1>🇵🇰 Rozgar Pakistan</h1>
                <div className="user-info">
                    {/* ✅ User Profile Info */}
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user.FullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.FullName}</span>
                            <span className="user-id">ID: {user.UserID}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="btn-logout">🚪 Logout</button>
                </div>
            </header>
            <main className="main-content">
                <div className="card">
                    <div className="card-header">
                        <h2>💼 Work Experience</h2>
                        <span className="exp-count">{experience.length} record{experience.length !== 1 ? 's' : ''}</span>
                    </div>
                    {loading ? (
                        <div className="loading">⏳ Loading experience data...</div>
                    ) : (
                        <ExperienceTable
                            data={experience}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            statusMessage={statusMessage}
                        />
                    )}
                </div>
                <div className="card">
                    <AddExperienceForm
                        userId={user.UserID}
                        onSave={fetchExperience}
                    />
                </div>
            </main>
        </div>
    );
}

function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="App">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;