import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Calendar as CalendarIcon, 
  BarChart, Settings, Search, Bell, UserCircle, UploadCloud, TestTube,
  Trash2, Plus, Edit, Download
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [birthdays, setBirthdays] = useState({ thisMonth: [], upcoming: [] });
  const [systemUsers, setSystemUsers] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser')) || null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'user', password: '', permissions: [] });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editSystemUser, setEditSystemUser] = useState({ id: null, username: '', email: '', role: 'user', password: '', permissions: [] });
  const [uploadFile, setUploadFile] = useState(null);
  
  const [newEmp, setNewEmp] = useState({ name: '', email: '', phone: '', dateOfBirth: '', department: '' });
  const [editEmp, setEditEmp] = useState({ id: null, name: '', email: '', phone: '', dateOfBirth: '', department: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchData = async () => {
    try {
      const [empRes, bdayRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/birthdays`),
        axios.get(`${API_URL}/users`).catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data);
      setBirthdays(bdayRes.data);
      setSystemUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      console.log('Login attempt with missing credentials');
      setLoginError('Please enter username and password');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username: loginUsername, password: loginPassword });
      setCurrentUser(res.data);
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      setLoginError('');
    } catch (err) {
      console.log(`Login failed for user ${loginUsername}`);
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser, permissions: newUser.permissions.join(',') };
      await axios.post(`${API_URL}/users`, payload);
      setIsUserModalOpen(false);
      setNewUser({ username: '', email: '', role: 'user', password: '', permissions: [] });
      fetchData();
    } catch (error) {
      alert('Error adding user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/users/${id}`);
        fetchData();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  const openEditUserModal = (user) => {
    setEditSystemUser({
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      password: '',
      permissions: typeof user.permissions === 'string' ? user.permissions.split(',') : (user.permissions || [])
    });
    setIsEditUserModalOpen(true);
  };

  const handleEditSystemUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editSystemUser, permissions: editSystemUser.permissions.join(',') };
      await axios.put(`${API_URL}/users/${editSystemUser.id}`, payload);
      setIsEditUserModalOpen(false);
      fetchData();
      alert('User updated successfully');
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      await axios.post(`${API_URL}/employees/import`, formData);
      setIsImportModalOpen(false);
      fetchData();
      alert('Successfully imported data');
    } catch (error) {
      alert('Error importing data');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/employees`, newEmp);
      setIsAddModalOpen(false);
      setNewEmp({ name: '', email: '', phone: '', dateOfBirth: '', department: '' });
      fetchData();
    } catch (error) {
      alert('Error adding employee');
    }
  };

  const openEditModal = (emp) => {
    setEditEmp({ id: emp.id, name: emp.name, email: emp.email, phone: emp.phone, dateOfBirth: new Date(emp.dateOfBirth).toISOString().split('T')[0], department: emp.department });
    setIsEditModalOpen(true);
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/employees/${editEmp.id}`, editEmp);
      setIsEditModalOpen(false);
      fetchData();
      alert('Employee updated successfully');
    } catch (error) {
      alert('Error updating employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API_URL}/employees/${id}`);
        fetchData();
      } catch (error) {
        alert('Error deleting employee');
      }
    }
  };

  const sendTestDailyEmail = async () => {
    try {
      const res = await axios.post(`${API_URL}/notify/test-daily`);
      alert('✅ ' + res.data.message);
    } catch (error) {
      alert('❌ Failed to trigger test email. Check server console.');
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return alert('No data to export');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvString = [headers, ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const exportCsv = () => exportToCSV(employees, 'employees.csv');

  // Calculations
  const totalEmployees = employees.length;
  const thisMonthCount = birthdays.thisMonth.length;
  const nextMonth = (new Date().getMonth() + 1) % 12;
  const nextMonthCount = employees.filter(emp => new Date(emp.dateOfBirth).getMonth() === nextMonth).length;

  const deptData = Object.entries(employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const bdaysByMonthData = monthNames.map((m, i) => {
    return { name: m, count: employees.filter(emp => new Date(emp.dateOfBirth).getMonth() === i).length };
  });

  if (!currentUser) {
    return (
      <div className="modal-overlay" style={{ background: 'var(--background)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
          <div className="flex items-center gap-2 mb-6" style={{ justifyContent: 'center', color: 'var(--primary)' }}>
            <img src="/logo.png" alt="Logo" width="32" height="32" style={{ objectFit: 'contain' }} />
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Birthday System</h1>
          </div>
          <h2 className="mb-4" style={{ textAlign: 'center' }}>Login to your account</h2>
          {loginError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</div>}
          <form onSubmit={handleLogin} className="flex-col gap-4">
            <input type="text" placeholder="Username" required value={loginUsername} onChange={e => setLoginUsername(e.target.value)} style={{ marginBottom: '1rem' }} />
            <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ marginBottom: '1.5rem' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" width="28" height="28" style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ lineHeight: '1' }}>BIRTHDAY</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>SYSTEM</div>
          </div>
        </div>

        <nav className="sidebar-nav">
            {currentUser && (currentUser.role === 'admin' || (typeof currentUser.permissions === 'string' ? currentUser.permissions.split(',') : []).includes('dashboard')) && (
              <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                  <LayoutDashboard size={18} /> Dashboard
              </button>
            )}
            {currentUser && (currentUser.role === 'admin' || (typeof currentUser.permissions === 'string' ? currentUser.permissions.split(',') : []).includes('employees')) && (
              <button className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
                  <Users size={18} /> Employees
              </button>
            )}
            {currentUser && (currentUser.role === 'admin' || (typeof currentUser.permissions === 'string' ? currentUser.permissions.split(',') : []).includes('reports')) && (
              <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                  <BarChart size={18} /> Reports
              </button>
            )}
            {currentUser && (currentUser.role === 'admin' || (typeof currentUser.permissions === 'string' ? currentUser.permissions.split(',') : []).includes('users')) && (
              <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                  <UserCircle size={18} /> User Management
              </button>
            )}
            {currentUser && (currentUser.role === 'admin' || (typeof currentUser.permissions === 'string' ? currentUser.permissions.split(',') : []).includes('settings')) && (
              <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                  <Settings size={18} /> Settings
              </button>
            )}
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={() => setShowPwdModal(true)}>
                Change Password
            </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        <header className="top-header">
          <h2 style={{ textTransform: 'capitalize' }}>{activeTab}</h2>
          <div className="flex items-center gap-4">
            <button className="btn btn-secondary" onClick={sendTestDailyEmail} title="Test Daily Email">
              <TestTube size={16} /> Test Email
            </button>
            <Search size={20} color="var(--text-muted)" />
            <Bell size={20} color="var(--text-muted)" />
            <div className="flex items-center gap-2" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <UserCircle size={32} color="var(--text-muted)" />
              <div style={{ fontSize: '0.9rem', fontWeight: '500', textTransform: 'capitalize' }}>{currentUser.username}</div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
        <div className="dashboard-tab flex flex-col gap-6">
  {/* KPIs */}
  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
    <div className="kpi-card kpi-orange">
      <div className="kpi-title">Birthdays (This Month) <CalendarIcon size={16} /></div>
      <div className="kpi-value">{thisMonthCount}</div>
    </div>
    <div className="kpi-card kpi-red">
      <div className="kpi-title">Birthdays (Next Month) <CalendarIcon size={16} /></div>
      <div className="kpi-value">{nextMonthCount}</div>
    </div>
    <div className="kpi-card kpi-blue">
      <div className="kpi-title">Total Employees <Users size={16} /></div>
      <div className="kpi-value">{totalEmployees}</div>
      <div className="kpi-sub">Active records</div>
    </div>
  </div>

  {/* Charts */}
  <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
    <div className="card">
      <h3 className="kpi-title mb-4">Birthdays by Month</h3>
      <div style={{ height: '200px', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={bdaysByMonthData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="card">
      <h3 className="kpi-title mb-4">Employees by Department</h3>
      <div style={{ height: '200px', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={deptData} innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
              {deptData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  {/* Bottom Row */}
  <div className="card">
    <h3 className="kpi-title mb-4">Upcoming Birthdays (Next 7 Days)</h3>
    {birthdays.upcoming.length === 0 ? (
      <p style={{ marginTop: '1rem' }}>No upcoming birthdays in the next 7 days.</p>
    ) : (
      <table className="data-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Email</th>
            <th>Birthday Date</th>
          </tr>
        </thead>
        <tbody>
          {birthdays.upcoming.map((emp, i) => (
            <tr key={i}>
              <td style={{ fontWeight: '500' }}>{emp.name}</td>
              <td>{emp.department || '-'}</td>
              <td>{emp.email || '-'}</td>
              <td>{new Date(emp.dateOfBirth).toLocaleDateString('en-GB')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</div>

          )}

          {activeTab === 'employees' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2>All Staff ({employees.length})</h2>
                <div className="flex gap-4">
                  <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} /> Add Employee
                  </button>
                  <button className="btn btn-primary" onClick={() => setIsImportModalOpen(true)}>
                    <UploadCloud size={16} /> Import Excel
                  </button>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>DOB</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.department || '-'}</td>
                        <td>{emp.email || '-'}</td>
                        <td>{emp.phone || '-'}</td>
                        <td>{new Date(emp.dateOfBirth).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                            onClick={() => handleDeleteEmployee(emp.id)}
                            title="Delete Employee"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                            onClick={() => openEditModal(emp)}
                            title="Edit Employee"
                          >
<Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2>System Users ({systemUsers.length})</h2>
                <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                  <Plus size={16} /> Add User
                </button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Permissions</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemUsers.length === 0 ? (
                      <tr><td colSpan="5">No users found.</td></tr>
                    ) : (
                      systemUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email || '-'}</td>
                          <td><span style={{ textTransform: 'capitalize', padding: '4px 8px', background: 'var(--background)', borderRadius: '4px', fontSize: '0.8rem' }}>{user.role}</span></td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(typeof user.permissions === 'string' ? user.permissions.split(',') : []).map(p => (
                                <span key={p} style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--background)', borderRadius: '4px', border: '1px solid var(--border)' }}>{p}</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}
                              onClick={() => openEditUserModal(user)}
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card">
              <h2 className="mb-4">Export Staff Data</h2>
              <button className="btn btn-primary" onClick={exportCsv}>Download CSV</button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="card">
              <h2 className="mb-4">System Settings</h2>
              
              <div className="mb-6" style={{ marginBottom: '2rem' }}>
                <h3 className="mb-2">Appearance</h3>
                <div className="flex items-center gap-4">
                  <p>Current Theme: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong></p>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Import Staff Data</h2>
            <form onSubmit={handleImport} className="flex-col gap-4">
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setUploadFile(e.target.files[0])} required />
              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Import</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="flex-col gap-4">
              <input type="text" placeholder="Full Name" required value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="email" placeholder="Email Address" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="text" placeholder="Department" value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="text" placeholder="Phone Number" value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="date" required value={newEmp.dateOfBirth} onChange={e => setNewEmp({ ...newEmp, dateOfBirth: e.target.value })} style={{ marginBottom: '1rem' }} />

              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Change Password Modal */}
        {showPwdModal && (
          <div className="modal-overlay" onClick={() => setShowPwdModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="mb-4">Change Password</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.put(`${API_URL}/users/${currentUser.id}`, { password: newPassword });
                  // refresh user info
                  const res = await axios.post(`${API_URL}/auth/login`, { username: currentUser.username, password: newPassword });
                  setCurrentUser(res.data);
                  localStorage.setItem('currentUser', JSON.stringify(res.data));
                  setNewPassword('');
                  setShowPwdModal(false);
                  alert('Password updated');
                } catch (err) {
                  alert('Failed to update password');
                }
              }} className="flex-col gap-4">
                <input type="password" placeholder="New Password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ marginBottom: '1rem' }} />
                <input type="password" placeholder="Password (default 123456)" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ marginBottom: '1rem' }} />
                <div className="flex flex-col gap-2 mb-4">
                <label className="block mb-2 font-medium">Permissions (Select pages user can access):</label>
                <div className="flex flex-col gap-2">
                  {['dashboard','employees','reports','users','settings'].map(tab => (
                    <label key={tab} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox mr-2"
                        checked={newUser.permissions.includes(tab)}
                        onChange={e => {
                          const perms = e.target.checked ? [...newUser.permissions, tab] : newUser.permissions.filter(p => p !== tab);
                          setNewUser({ ...newUser, permissions: perms });
                        }}
                      />
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPwdModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Add System User</h2>
            <form onSubmit={handleAddUser} className="flex-col gap-4">
              <input type="text" placeholder="Username" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="email" placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="password" placeholder="Password (default 123456)" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ marginBottom: '1rem' }} />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ marginBottom: '1rem' }}>
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="flex flex-col gap-2 mb-4">
                <label className="block mb-2 font-medium">Permissions (Select pages user can access):</label>
                <div className="flex flex-col gap-2">
                  {['dashboard','employees','reports','users','settings'].map(tab => (
                    <label key={tab} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox mr-2"
                        checked={newUser.permissions.includes(tab)}
                        onChange={e => {
                          const perms = e.target.checked ? [...newUser.permissions, tab] : newUser.permissions.filter(p => p !== tab);
                          setNewUser({ ...newUser, permissions: perms });
                        }}
                      />
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit System User Modal */}
      {isEditUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Edit System User</h2>
            <form onSubmit={handleEditSystemUser} className="flex-col gap-4">
              <input type="text" placeholder="Username" required value={editSystemUser.username} onChange={e => setEditSystemUser({ ...editSystemUser, username: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="email" placeholder="Email Address" value={editSystemUser.email} onChange={e => setEditSystemUser({ ...editSystemUser, email: e.target.value })} style={{ marginBottom: '1rem' }} />
              <input type="password" placeholder="New Password (leave blank to keep current)" value={editSystemUser.password} onChange={e => setEditSystemUser({ ...editSystemUser, password: e.target.value })} style={{ marginBottom: '1rem' }} />
              <select value={editSystemUser.role} onChange={e => setEditSystemUser({ ...editSystemUser, role: e.target.value })} style={{ marginBottom: '1rem' }}>
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="flex flex-col gap-2 mb-4">
                <label className="block mb-2 font-medium">Permissions (Select pages user can access):</label>
                <div className="flex flex-col gap-2">
                  {['dashboard','employees','reports','users','settings'].map(tab => (
                    <label key={tab} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox mr-2"
                        checked={editSystemUser.permissions.includes(tab)}
                        onChange={e => {
                          const perms = e.target.checked ? [...editSystemUser.permissions, tab] : editSystemUser.permissions.filter(p => p !== tab);
                          setEditSystemUser({ ...editSystemUser, permissions: perms });
                        }}
                      />
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Edit Employee</h2>
            <form onSubmit={handleEditEmployee} className="flex-col gap-4">
               <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Name</label>
               <input type="text" required value={editEmp.name} onChange={e => setEditEmp({ ...editEmp, name: e.target.value })} style={{ marginBottom: '1rem' }} />
               <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email</label>
               <input type="email" value={editEmp.email} onChange={e => setEditEmp({ ...editEmp, email: e.target.value })} style={{ marginBottom: '1rem' }} />
               <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Phone</label>
               <input type="text" value={editEmp.phone} onChange={e => setEditEmp({ ...editEmp, phone: e.target.value })} style={{ marginBottom: '1rem' }} />
               <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Department</label>
               <input type="text" value={editEmp.department} onChange={e => setEditEmp({ ...editEmp, department: e.target.value })} style={{ marginBottom: '1rem', borderColor: 'var(--primary)' }} />

               <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Date of Birth</label>
               <input type="date" required value={editEmp.dateOfBirth} onChange={e => setEditEmp({ ...editEmp, dateOfBirth: e.target.value })} style={{ marginBottom: '1rem' }} />
              
              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
