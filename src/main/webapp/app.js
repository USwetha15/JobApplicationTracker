/* ============================================================
   Job Application Tracker — app.js
   Place in: webapp/js/app.js
   ============================================================ */

/* ============================================================
   DATA
   ============================================================ */

let applications = JSON.parse(localStorage.getItem('job-apps')) || [
  { id:1, company:"Google",    role:"Frontend Engineer",      location:"Remote",        salary:"₹25–35 LPA", status:"interview",  date:"2026-03-01", priority:"high",   url:"", notes:"Referred by a friend. 3 rounds: DSA, System Design, HR." },
  { id:2, company:"Razorpay",  role:"Full Stack Developer",   location:"Bangalore",     salary:"₹18–24 LPA", status:"screening",  date:"2026-03-05", priority:"high",   url:"", notes:"Applied via LinkedIn. Recruiter reached out in 2 days." },
  { id:3, company:"Swiggy",    role:"React Developer",        location:"Hybrid",        salary:"₹15–20 LPA", status:"applied",    date:"2026-03-10", priority:"medium", url:"", notes:"Applied via company portal." },
  { id:4, company:"Zoho",      role:"Software Engineer",      location:"Chennai",       salary:"₹10–14 LPA", status:"offer",      date:"2026-02-20", priority:"medium", url:"", notes:"Got offer letter. Negotiating salary." },
  { id:5, company:"Infosys",   role:"Systems Engineer",       location:"Chennai",       salary:"₹6–8 LPA",   status:"rejected",   date:"2026-02-15", priority:"low",    url:"", notes:"Rejected after first technical round." },
  { id:6, company:"Freshworks","role":"Junior Developer",     location:"Remote",        salary:"₹12–16 LPA", status:"applied",    date:"2026-03-15", priority:"medium", url:"", notes:"" },
];

let nextId       = applications.length ? Math.max(...applications.map(a => a.id)) + 1 : 1;
let filterStatus = 'all';
let viewMode     = 'grid';
let editingId    = null;
let deletingId   = null;

/* ============================================================
   PERSIST
   ============================================================ */
function save() {
  localStorage.setItem('job-apps', JSON.stringify(applications));
}

/* ============================================================
   COLORS
   ============================================================ */
const LOGO_COLORS = [
  '#2563eb','#7c3aed','#db2777','#d97706',
  '#16a34a','#0891b2','#dc2626','#4f46e5',
];

function logoColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
  const total      = applications.length;
  const screening  = applications.filter(a => a.status === 'screening').length;
  const interview  = applications.filter(a => a.status === 'interview').length;
  const offer      = applications.filter(a => a.status === 'offer').length;
  const rejected   = applications.filter(a => a.status === 'rejected').length;
  const responded  = screening + interview + offer + rejected;
  const rate       = total ? Math.round((responded / total) * 100) : 0;

  document.getElementById('s-total').textContent    = total;
  document.getElementById('s-screen').textContent   = screening;
  document.getElementById('s-interview').textContent = interview;
  document.getElementById('s-offer').textContent    = offer;
  document.getElementById('s-rejected').textContent = rejected;
  document.getElementById('s-rate').textContent     = rate + '%';
}

/* ============================================================
   RENDER CARDS
   ============================================================ */
function renderCards() {
  const container  = document.getElementById('cards-container');
  const emptyState = document.getElementById('empty-state');
  const search     = document.getElementById('search-input').value.toLowerCase();

  let filtered = applications.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch = !search ||
      a.company.toLowerCase().includes(search) ||
      a.role.toLowerCase().includes(search) ||
      (a.location || '').toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  if (viewMode === 'list') {
    container.className = 'cards-container list-view';
    container.innerHTML = filtered.map(a => buildListCard(a)).join('');
  } else {
    container.className = 'cards-container';
    container.innerHTML = filtered.map(a => buildGridCard(a)).join('');
  }

  updateStats();
}

/* ---------- Grid Card ---------- */
function buildGridCard(a) {
  const color = logoColor(a.company);
  const initial = a.company[0].toUpperCase();
  const days  = daysSince(a.date);

  return `
    <div class="app-card status-${a.status}">
      <div class="card-top">
        <div class="company-logo" style="background:${color}">${initial}</div>
        <div class="card-badges">
          <span class="status-badge badge-${a.status}">${statusLabel(a.status)}</span>
          <span class="priority-badge priority-${a.priority}">${a.priority}</span>
        </div>
      </div>

      <div class="card-company">${a.company}</div>
      <div class="card-role">${a.role}</div>

      <div class="card-meta">
        ${a.location ? `<span class="meta-item"><span class="meta-icon">📍</span>${a.location}</span>` : ''}
        ${a.salary   ? `<span class="meta-item"><span class="meta-icon">💰</span>${a.salary}</span>`   : ''}
        ${a.date     ? `<span class="meta-item"><span class="meta-icon">📅</span>${days}</span>`       : ''}
        ${a.url      ? `<span class="meta-item"><a href="${a.url}" target="_blank" style="color:var(--blue);text-decoration:none;">🔗 Link</a></span>` : ''}
      </div>

      ${a.notes ? `<div class="card-notes">${a.notes}</div>` : ''}

      <div class="card-actions">
        <button class="card-btn" onclick="openEditModal(${a.id})">✎ Edit</button>
        <button class="card-btn" onclick="quickStatus(${a.id})">⟳ Status</button>
        <button class="card-btn delete" onclick="openDeleteModal(${a.id})">✕ Delete</button>
      </div>
    </div>
  `;
}

/* ---------- List Card ---------- */
function buildListCard(a) {
  const color   = logoColor(a.company);
  const initial = a.company[0].toUpperCase();
  const days    = daysSince(a.date);

  return `
    <div class="app-card status-${a.status}">
      <div class="list-row">
        <div class="company-logo" style="background:${color};width:36px;height:36px;font-size:14px;flex-shrink:0">${initial}</div>
        <div class="list-info">
          <div class="card-company">${a.company}</div>
          <div class="card-role">${a.role}${a.location ? ' · ' + a.location : ''}</div>
        </div>
        <div class="list-meta">
          ${a.salary ? `<span class="meta-item">💰 ${a.salary}</span>` : ''}
          <span class="meta-item">📅 ${days}</span>
          <span class="status-badge badge-${a.status}">${statusLabel(a.status)}</span>
          <span class="priority-badge priority-${a.priority}">${a.priority}</span>
        </div>
        <div class="list-actions">
          <button class="card-btn" onclick="openEditModal(${a.id})" style="padding:6px 12px">Edit</button>
          <button class="card-btn delete" onclick="openDeleteModal(${a.id})" style="padding:6px 12px">Delete</button>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   HELPERS
   ============================================================ */
function statusLabel(s) {
  return { applied:'Applied', screening:'Screening', interview:'Interview', offer:'Offer', rejected:'Rejected' }[s] || s;
}

function daysSince(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return diff + ' days ago';
}

/* Cycle to next status on quick click */
function quickStatus(id) {
  const order = ['applied','screening','interview','offer','rejected'];
  const app   = applications.find(a => a.id === id);
  if (!app) return;
  const idx   = order.indexOf(app.status);
  app.status  = order[(idx + 1) % order.length];
  save();
  renderCards();
}

/* ============================================================
   FILTER & VIEW
   ============================================================ */
function setFilter(status, el) {
  filterStatus = status;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderCards();
}

function setView(mode, el) {
  viewMode = mode;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderCards();
}

/* ============================================================
   MODAL — ADD / EDIT
   ============================================================ */
function openModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Application';
  document.getElementById('save-btn').textContent    = 'Save Application';
  clearForm();
  // Default date to today
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.add('open');
  document.getElementById('f-company').focus();
}

function openEditModal(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  editingId = id;

  document.getElementById('modal-title').textContent = 'Edit Application';
  document.getElementById('save-btn').textContent    = 'Update Application';

  document.getElementById('f-company').value  = app.company;
  document.getElementById('f-role').value     = app.role;
  document.getElementById('f-location').value = app.location || '';
  document.getElementById('f-salary').value   = app.salary   || '';
  document.getElementById('f-status').value   = app.status;
  document.getElementById('f-date').value     = app.date     || '';
  document.getElementById('f-url').value      = app.url      || '';
  document.getElementById('f-priority').value = app.priority || 'medium';
  document.getElementById('f-notes').value    = app.notes    || '';

  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  editingId = null;
}

function handleBackdropClick(e) {
  if (e.target.id === 'modal') closeModal();
}

function clearForm() {
  ['f-company','f-role','f-location','f-salary','f-date','f-url','f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-status').value   = 'applied';
  document.getElementById('f-priority').value = 'medium';
}

function saveApplication() {
  const company = document.getElementById('f-company').value.trim();
  const role    = document.getElementById('f-role').value.trim();

  if (!company || !role) {
    document.getElementById('f-company').style.borderColor = company ? '' : 'var(--red)';
    document.getElementById('f-role').style.borderColor    = role    ? '' : 'var(--red)';
    return;
  }

  // Reset borders
  document.getElementById('f-company').style.borderColor = '';
  document.getElementById('f-role').style.borderColor    = '';

  const data = {
    company,
    role,
    location: document.getElementById('f-location').value.trim(),
    salary:   document.getElementById('f-salary').value.trim(),
    status:   document.getElementById('f-status').value,
    date:     document.getElementById('f-date').value,
    url:      document.getElementById('f-url').value.trim(),
    priority: document.getElementById('f-priority').value,
    notes:    document.getElementById('f-notes').value.trim(),
  };

  if (editingId) {
    const idx = applications.findIndex(a => a.id === editingId);
    if (idx !== -1) applications[idx] = { ...applications[idx], ...data };
  } else {
    applications.unshift({ id: nextId++, ...data });
  }

  save();
  closeModal();
  renderCards();
}

/* ============================================================
   DELETE MODAL
   ============================================================ */
function openDeleteModal(id) {
  deletingId = id;
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  deletingId = null;
  document.getElementById('delete-modal').classList.remove('open');
}

function handleDeleteBackdrop(e) {
  if (e.target.id === 'delete-modal') closeDeleteModal();
}

function confirmDelete() {
  applications = applications.filter(a => a.id !== deletingId);
  save();
  closeDeleteModal();
  renderCards();
}

/* ============================================================
   DATE
   ============================================================ */
function updateHeaderDate() {
  document.getElementById('header-date').textContent =
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderDate();
  updateStats();
  renderCards();
});