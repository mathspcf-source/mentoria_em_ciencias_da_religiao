const SUPABASE_URL = 'https://sejnrydyaoawzthnprvq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlam5yeWR5YW9hd3p0aG5wcnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTQyNjYsImV4cCI6MjA5MzkzMDI2Nn0.2GXQUF8drgT8HKLLp4YHT6vi0iBUjVdjw1t-ft1xsRA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = 'admin@mentorcr.com';
let currentUser = null, currentUserId = null;
const SESSION_DURATION = 2 * 60 * 60 * 1000;

function verificarSessao() {
    const sessionData = localStorage.getItem('mentorcr_session');
    if (!sessionData) return null;
    try {
        const session = JSON.parse(sessionData);
        if (Date.now() - session.timestamp > SESSION_DURATION) {
            localStorage.removeItem('mentorcr_session');
            localStorage.removeItem('mentorcr_user_id');
            localStorage.removeItem('mentorcr_user_nome');
            localStorage.removeItem('mentorcr_user_tipo');
            return null;
        }
        return session;
    } catch(e) { return null; }
}

function criarSessao(tipo, id, nome) {
    const session = { tipo, id, nome, timestamp: Date.now() };
    localStorage.setItem('mentorcr_session', JSON.stringify(session));
    localStorage.setItem('mentorcr_user_id', id);
    localStorage.setItem('mentorcr_user_nome', nome);
    localStorage.setItem('mentorcr_user_tipo', tipo);
}

function destruirSessao() {
    localStorage.removeItem('mentorcr_session');
    localStorage.removeItem('mentorcr_user_id');
    localStorage.removeItem('mentorcr_user_nome');
    localStorage.removeItem('mentorcr_user_tipo');
}

const $ = (id) => document.getElementById(id);
const showLoading = () => $('loading').classList.add('show');
const hideLoading = () => $('loading').classList.remove('show');

function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2100);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
function openModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.classList.remove('show'); };

function logout() {
    currentUser = null; currentUserId = null;
    destruirSessao();
    window.location.href = 'index.html';
}

setInterval(() => { sb.from('configuracoes').select('valor').eq('chave','admin_senha').single().then(()=>{}).catch(()=>{}); }, 240000);
