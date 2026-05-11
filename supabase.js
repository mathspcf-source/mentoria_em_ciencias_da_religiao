// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://sejnrydyaoawzthnprvq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlam5yeWR5YW9hd3p0aG5wcnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTQyNjYsImV4cCI6MjA5MzkzMDI2Nn0.2GXQUF8drgT8HKLLp4YHT6vi0iBUjVdjw1t-ft1xsRA';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = 'admin@mentorcr.com';
let currentUser = null;
let currentUserId = null;

// ==================== UTILS ====================
const $ = (id) => document.getElementById(id);
const showLoading = () => $('loading').classList.add('show');
const hideLoading = () => $('loading').classList.remove('show');

function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function openModal(id) {
    $(id).classList.add('show');
}

function closeModal(id) {
    $(id).classList.remove('show');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
};

// ==================== KEEP ALIVE ====================
setInterval(() => {
    sb.from('configuracoes').select('valor').eq('chave', 'admin_senha').single().then(() => {}).catch(() => {});
}, 240000);

// ==================== LOGOUT ====================
function logout() {
    currentUser = null;
    currentUserId = null;
    window.location.href = 'index.html';
}
