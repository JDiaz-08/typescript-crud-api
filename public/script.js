let currentUser = null;

// Central fetch helper — attaches JWT to every request
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    handleLogout(null, true);
    return null;
  }
  return res;
}

// Page load
document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();

  if (!window.location.hash) window.location.hash = '#/';

  // Restore session from stored token
  const token = localStorage.getItem('auth_token');
  if (token) {
    const res = await apiFetch('/users/me');
    if (res && res.ok) {
      const user = await res.json();
      setAuthState(true, user);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  handleRouting();
  window.addEventListener('hashchange', handleRouting);
});

// Router
function handleRouting() {
  const hash  = window.location.hash || '#/';
  const route = hash.substring(2);

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const protectedRoutes = ['profile', 'employees', 'departments', 'accounts', 'requests'];
  const adminRoutes     = ['employees', 'departments', 'accounts'];

  if (protectedRoutes.includes(route) && !currentUser) {
    showToast('Please log in first', 'warning');
    navigateTo('#/login');
    return;
  }
  if (adminRoutes.includes(route) && currentUser?.role !== 'Admin') {
    showToast('Access denied. Admin only.', 'danger');
    navigateTo('#/');
    return;
  }

  const pageMap = {
    '': 'home-page', '/': 'home-page',
    'register': 'register-page', 'verify-email': 'verify-email-page',
    'login': 'login-page', 'profile': 'profile-page',
    'employees': 'employees-page', 'departments': 'departments-page',
    'accounts': 'accounts-page', 'requests': 'requests-page',
  };

  const pageId = pageMap[route] || 'home-page';

  if (route === 'verify-email') {
    const email = localStorage.getItem('unverified_email');
    if (email) document.getElementById('verify-email-display').textContent = email;
  }
  if (route === 'login' && localStorage.getItem('email_verified') === 'true') {
    document.getElementById('login-success-alert').classList.remove('d-none');
    localStorage.removeItem('email_verified');
  }

  if (route === 'profile')     renderProfile();
  if (route === 'employees')   renderEmployeesList();
  if (route === 'departments') renderDepartmentsList();
  if (route === 'accounts')    renderAccountsList();
  if (route === 'requests')    renderRequestsList();

  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
}

function navigateTo(hash) { window.location.hash = hash; }

function setAuthState(isAuth, user = null) {
  currentUser = user;
  const body  = document.body;
  if (isAuth && user) {
    body.classList.remove('not-authenticated');
    body.classList.add('authenticated');
    body.classList.toggle('is-admin', user.role === 'Admin');
    const displayName = user.lastName ? user.firstName + ' ' + user.lastName : user.firstName;
    document.getElementById('username-display').textContent = displayName;
  } else {
    body.classList.remove('authenticated', 'is-admin');
    body.classList.add('not-authenticated');
    currentUser = null;
  }
}

function initializeEventListeners() {
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('simulate-verify-btn').addEventListener('click', handleVerifyEmail);
  document.getElementById('add-employee-btn').addEventListener('click', () => showEmployeeForm());
  document.getElementById('cancel-employee-btn').addEventListener('click', hideEmployeeForm);
  document.getElementById('employee-form').addEventListener('submit', handleEmployeeSubmit);
  document.getElementById('add-department-btn').addEventListener('click', () => showDepartmentForm());
  document.getElementById('add-account-btn').addEventListener('click', () => showAccountForm());
  document.getElementById('cancel-account-btn').addEventListener('click', hideAccountForm);
  document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
  document.getElementById('new-request-btn').addEventListener('click', showRequestModal);
  document.getElementById('add-item-btn').addEventListener('click', addRequestItem);
  document.getElementById('request-form').addEventListener('submit', handleRequestSubmit);
}

// Register
async function handleRegister(e) {
  e.preventDefault();
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim().toLowerCase();
  const password  = document.getElementById('reg-password').value;

  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ title: 'Mr', firstName, lastName, email, password, confirmPassword: password, role: 'User' }),
  });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Registration failed', 'danger'); return; }

  localStorage.setItem('verify_token', data.verifyToken);
  localStorage.setItem('unverified_email', email);
  showToast('Account created! Please verify your email.', 'success');
  navigateTo('#/verify-email');
}

// Verify Email
async function handleVerifyEmail() {
  const token = localStorage.getItem('verify_token');
  if (!token) { showToast('No pending verification', 'warning'); return; }

  const res = await apiFetch('/auth/verify-email', {
    method: 'POST', body: JSON.stringify({ token }),
  });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Verification failed', 'danger'); return; }

  localStorage.removeItem('verify_token');
  localStorage.removeItem('unverified_email');
  localStorage.setItem('email_verified', 'true');
  showToast('Email verified successfully!', 'success');
  navigateTo('#/login');
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const res = await apiFetch('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Invalid credentials or unverified email', 'danger'); return; }

  localStorage.setItem('auth_token', data.token);

  const profileRes = await apiFetch('/users/me');
  if (!profileRes || !profileRes.ok) { showToast('Login succeeded but failed to load profile', 'warning'); return; }

  const user = await profileRes.json();
  setAuthState(true, user);
  showToast('Login successful!', 'success');
  navigateTo('#/profile');
}

// Logout
function handleLogout(e, silent = false) {
  if (e) e.preventDefault();
  localStorage.removeItem('auth_token');
  setAuthState(false);
  if (!silent) showToast('Logged out successfully', 'info');
  navigateTo('#/');
}

// Profile
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profile-content').innerHTML = `
    <div class="mb-3"><h4>${currentUser.firstName} ${currentUser.lastName || ''}</h4></div>
    <div class="mb-2"><strong>Email:</strong> ${currentUser.email}</div>
    <div class="mb-2"><strong>Role:</strong> ${currentUser.role}</div>
    <div class="mb-3"><strong>Verified:</strong> ${currentUser.verified ? '✅ Yes' : '❌ No'}</div>
    <button class="btn btn-primary" onclick="alert('Edit profile coming soon!')">Edit Profile</button>
  `;
}

// Accounts
async function renderAccountsList() {
  document.getElementById('accounts-list').innerHTML = '<p class="text-muted">Loading...</p>';
  const res = await apiFetch('/users');
  if (!res || !res.ok) { showToast('Failed to load accounts', 'danger'); return; }
  const accounts = await res.json();

  if (accounts.length === 0) {
    document.getElementById('accounts-list').innerHTML = '<div class="alert alert-info">No accounts found.</div>';
    return;
  }

  let html = `<table class="table table-striped"><thead><tr>
    <th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th>
  </tr></thead><tbody>`;
  accounts.forEach(acc => {
    html += `<tr>
      <td>${acc.firstName} ${acc.lastName || ''}</td>
      <td>${acc.email}</td><td>${acc.role}</td>
      <td>${acc.verified ? '✅' : '—'}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-primary"  onclick="editAccount(${acc.id})">Edit</button>
        <button class="btn btn-sm btn-warning"   onclick="resetPassword(${acc.id})">Reset PW</button>
        <button class="btn btn-sm btn-danger"    onclick="deleteAccount(${acc.id})">Delete</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('accounts-list').innerHTML = html;
}

function showAccountForm(accountId = null) {
  const container = document.getElementById('account-form-container');
  const form      = document.getElementById('account-form');
  if (accountId) {
    apiFetch(`/users/${accountId}`).then(async res => {
      if (!res || !res.ok) return;
      const acc = await res.json();
      document.getElementById('acc-firstname').value  = acc.firstName;
      document.getElementById('acc-lastname').value   = acc.lastName || '';
      document.getElementById('acc-email').value      = acc.email;
      document.getElementById('acc-password').value   = '';
      document.getElementById('acc-role').value       = acc.role;
      document.getElementById('acc-verified').checked = acc.verified;
      form.dataset.editId = accountId;
    });
  } else {
    form.reset();
    delete form.dataset.editId;
  }
  container.classList.remove('d-none');
}

function hideAccountForm() {
  document.getElementById('account-form-container').classList.add('d-none');
  document.getElementById('account-form').reset();
}

async function handleAccountSubmit(e) {
  e.preventDefault();
  const firstName = document.getElementById('acc-firstname').value.trim();
  const lastName  = document.getElementById('acc-lastname').value.trim();
  const email     = document.getElementById('acc-email').value.trim().toLowerCase();
  const password  = document.getElementById('acc-password').value;
  const role      = document.getElementById('acc-role').value;
  const verified  = document.getElementById('acc-verified').checked;
  const form      = document.getElementById('account-form');
  const editId    = form.dataset.editId;

  const body = editId
    ? { firstName, lastName, email, role, verified, ...(password ? { password, confirmPassword: password } : {}) }
    : { title: 'Mr', firstName, lastName, email, password, confirmPassword: password, role, verified };

  const res = await apiFetch(editId ? `/users/${editId}` : '/users',
    { method: editId ? 'PUT' : 'POST', body: JSON.stringify(body) });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Save failed', 'danger'); return; }

  showToast(editId ? 'Account updated' : 'Account created', 'success');
  hideAccountForm();
  renderAccountsList();
}

function editAccount(id) { showAccountForm(id); }

async function resetPassword(id) {
  const newPassword = prompt('Enter new password (minimum 6 characters):');
  if (newPassword === null) return;
  if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'danger'); return; }

  const res = await apiFetch(`/users/${id}`, {
    method: 'PUT', body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
  });
  if (!res) return;
  const data = await res.json();
  res.ok ? showToast('Password reset successfully', 'success') : showToast(data.message || 'Reset failed', 'danger');
}

async function deleteAccount(id) {
  if (currentUser && currentUser.id === id) { showToast('Cannot delete your own account', 'danger'); return; }
  if (!confirm('Delete this account? This action cannot be undone.')) return;
  const res = await apiFetch(`/users/${id}`, { method: 'DELETE' });
  if (!res) return;
  res.ok ? (showToast('Account deleted', 'info'), renderAccountsList()) : showToast('Delete failed', 'danger');
}

// Departments
async function renderDepartmentsList() {
  document.getElementById('departments-list').innerHTML = '<p class="text-muted">Loading...</p>';
  const res = await apiFetch('/departments');
  if (!res || !res.ok) { showToast('Failed to load departments', 'danger'); return; }
  const departments = await res.json();

  if (departments.length === 0) {
    document.getElementById('departments-list').innerHTML = '<div class="alert alert-info">No departments found.</div>';
    return;
  }

  let html = `<table class="table table-striped"><thead><tr>
    <th>Name</th><th>Description</th><th>Actions</th>
  </tr></thead><tbody>`;
  departments.forEach(dept => {
    html += `<tr>
      <td>${dept.name}</td><td>${dept.description || '—'}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id}, '${dept.name}', '${dept.description || ''}')">Edit</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteDepartment(${dept.id})">Delete</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('departments-list').innerHTML = html;
}

function showDepartmentForm(id = null, name = '', description = '') {
  const newName = prompt('Department name:', name);
  if (newName === null) return;
  const newDesc = prompt('Description (optional):', description);
  if (newDesc === null) return;

  apiFetch(id ? `/departments/${id}` : '/departments', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ name: newName, description: newDesc }),
  }).then(async res => {
    if (!res) return;
    const data = await res.json();
    res.ok
      ? (showToast(id ? 'Department updated' : 'Department created', 'success'), renderDepartmentsList())
      : showToast(data.message || 'Save failed', 'danger');
  });
}

function editDepartment(id, name, description) { showDepartmentForm(id, name, description); }

async function deleteDepartment(id) {
  if (!confirm('Delete this department?')) return;
  const res = await apiFetch(`/departments/${id}`, { method: 'DELETE' });
  if (!res) return;
  res.ok ? (showToast('Department deleted', 'info'), renderDepartmentsList()) : showToast('Delete failed', 'danger');
}

// Employees
async function renderEmployeesList() {
  document.getElementById('employees-list').innerHTML = '<p class="text-muted">Loading...</p>';
  const res = await apiFetch('/employees');
  if (!res || !res.ok) { showToast('Failed to load employees', 'danger'); return; }
  const employees = await res.json();

  if (employees.length === 0) {
    document.getElementById('employees-list').innerHTML = '<div class="alert alert-info">No employees found.</div>';
    return;
  }

  let html = `<table class="table table-striped"><thead><tr>
    <th>ID</th><th>Name</th><th>Position</th><th>Department</th><th>Hire Date</th><th>Actions</th>
  </tr></thead><tbody>`;
  employees.forEach(emp => {
    const userName = emp.user ? `${emp.user.firstName} ${emp.user.lastName || ''}` : `User #${emp.userId}`;
    const deptName = emp.department ? emp.department.name : 'N/A';
    html += `<tr>
      <td>${emp.employeeId}</td><td>${userName}</td>
      <td>${emp.position}</td><td>${deptName}</td><td>${emp.hireDate}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-primary" onclick="editEmployee(${emp.id})">Edit</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteEmployee(${emp.id})">Delete</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('employees-list').innerHTML = html;
}

async function showEmployeeForm(employeeId = null) {
  const container = document.getElementById('employee-form-container');
  const form      = document.getElementById('employee-form');

  const deptRes = await apiFetch('/departments');
  const depts   = deptRes && deptRes.ok ? await deptRes.json() : [];
  document.getElementById('emp-department').innerHTML =
    depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  if (employeeId) {
    const res = await apiFetch(`/employees/${employeeId}`);
    if (res && res.ok) {
      const emp = await res.json();
      document.getElementById('emp-id').value         = emp.employeeId;
      document.getElementById('emp-userid').value     = emp.userId;
      document.getElementById('emp-position').value   = emp.position;
      document.getElementById('emp-department').value = emp.departmentId;
      document.getElementById('emp-hiredate').value   = emp.hireDate;
      form.dataset.editId = employeeId;
    }
  } else {
    form.reset();
    delete form.dataset.editId;
  }
  container.classList.remove('d-none');
}

function hideEmployeeForm() {
  document.getElementById('employee-form-container').classList.add('d-none');
  document.getElementById('employee-form').reset();
}

async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const employeeId   = document.getElementById('emp-id').value.trim();
  const userId       = Number(document.getElementById('emp-userid').value);
  const position     = document.getElementById('emp-position').value.trim();
  const departmentId = Number(document.getElementById('emp-department').value);
  const hireDate     = document.getElementById('emp-hiredate').value;
  const form         = document.getElementById('employee-form');
  const editId       = form.dataset.editId;

  const res = await apiFetch(editId ? `/employees/${editId}` : '/employees', {
    method: editId ? 'PUT' : 'POST',
    body: JSON.stringify({ employeeId, userId, position, departmentId, hireDate }),
  });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Save failed', 'danger'); return; }

  showToast(editId ? 'Employee updated' : 'Employee added', 'success');
  hideEmployeeForm();
  renderEmployeesList();
}

function editEmployee(id)  { showEmployeeForm(id); }

async function deleteEmployee(id) {
  if (!confirm('Delete this employee record?')) return;
  const res = await apiFetch(`/employees/${id}`, { method: 'DELETE' });
  if (!res) return;
  res.ok ? (showToast('Employee deleted', 'info'), renderEmployeesList()) : showToast('Delete failed', 'danger');
}

// Requests
async function renderRequestsList() {
  document.getElementById('requests-list').innerHTML = '<p class="text-muted">Loading...</p>';
  const res = await apiFetch('/requests');
  if (!res || !res.ok) { showToast('Failed to load requests', 'danger'); return; }
  const requests = await res.json();

  if (requests.length === 0) {
    document.getElementById('requests-list').innerHTML = `
      <div class="alert alert-info">You have no requests yet.<br>
        <button class="btn btn-success mt-2" onclick="showRequestModal()">Create One</button>
      </div>`;
    return;
  }

  let html = `<table class="table table-striped"><thead><tr>
    <th>Date</th><th>Type</th><th>Items</th><th>Status</th>
  </tr></thead><tbody>`;
  requests.forEach(req => {
    const statusClass = { Approved: 'success', Rejected: 'danger', Pending: 'warning' }[req.status] || 'secondary';
    const itemsList   = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
    html += `<tr>
      <td>${req.date}</td><td>${req.type}</td><td>${itemsList}</td>
      <td><span class="badge bg-${statusClass}">${req.status}</span></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('requests-list').innerHTML = html;
}

function showRequestModal() {
  const modal = new bootstrap.Modal(document.getElementById('requestModal'));
  document.getElementById('request-form').reset();
  document.getElementById('request-items').innerHTML = `
    <div class="input-group mb-2">
      <input type="text"   class="form-control item-name" placeholder="Item name" required>
      <input type="number" class="form-control item-qty"  placeholder="Qty" value="1" min="1" required>
      <button type="button" class="btn btn-danger remove-item" disabled>×</button>
    </div>`;
  modal.show();
}

function addRequestItem() {
  const container = document.getElementById('request-items');
  const newRow    = document.createElement('div');
  newRow.className = 'input-group mb-2';
  newRow.innerHTML = `
    <input type="text"   class="form-control item-name" placeholder="Item name" required>
    <input type="number" class="form-control item-qty"  placeholder="Qty" value="1" min="1" required>
    <button type="button" class="btn btn-danger remove-item">×</button>`;
  newRow.querySelector('.remove-item').addEventListener('click', () => newRow.remove());
  container.appendChild(newRow);
}

async function handleRequestSubmit(e) {
  e.preventDefault();
  const type  = document.getElementById('req-type').value;
  const items = [];
  document.querySelectorAll('#request-items .input-group').forEach(row => {
    const name = row.querySelector('.item-name').value.trim();
    const qty  = parseInt(row.querySelector('.item-qty').value);
    if (name && qty > 0) items.push({ name, qty });
  });
  if (items.length === 0) { showToast('Please add at least one item', 'danger'); return; }

  const res = await apiFetch('/requests', { method: 'POST', body: JSON.stringify({ type, items }) });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) { showToast(data.message || 'Submit failed', 'danger'); return; }

  showToast('Request submitted successfully', 'success');
  bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
  renderRequestsList();
}

// Toast
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} alert-dismissible fade show`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 150); }, 2500);
}