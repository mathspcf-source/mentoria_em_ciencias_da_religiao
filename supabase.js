// ============================================================
//  SUPABASE - CONFIGURAÇÃO
//  MentorCR - Ciências da Religião
// ============================================================

const SUPABASE_URL = 'https://ggnjrzqzjdjhqnjaefom.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbmpyenF6amRqaHFuamFlZm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTM2NzcsImV4cCI6MjEwMTEyOTY3N30.rQ4vcgc_nx2m4-hz6J434kbjWd4Gcn_vsPZLyg7osHQ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'admin@mentorcr.com';
const SESSION_DURATION = 2 * 60 * 60 * 1000;

let currentUser = null;
let currentUserId = null;

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function $(id) {
    return document.getElementById(id);
}

function showLoading() {
    const el = document.getElementById('loading');
    if (el) el.classList.add('show');
}

function hideLoading() {
    const el = document.getElementById('loading');
    if (el) el.classList.remove('show');
}

function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);

    setTimeout(() => t.remove(), 2500);
}

function openModal(id) {
    const el = document.getElementById('modal' + id);
    if (el) el.classList.add('show');
}

function closeModal(id) {
    const el = document.getElementById('modal' + id);
    if (el) el.classList.remove('show');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
};

function verificarSessao() {
    const sessionData = localStorage.getItem('mentorcr_session');
    if (!sessionData) return null;

    try {
        const session = JSON.parse(sessionData);
        if (Date.now() - session.timestamp > SESSION_DURATION) {
            destruirSessao();
            return null;
        }
        return session;
    } catch (e) {
        destruirSessao();
        return null;
    }
}

function criarSessao(tipo, id, nome) {
    const session = {
        tipo: tipo,
        id: id,
        nome: nome,
        timestamp: Date.now()
    };

    localStorage.setItem('mentorcr_session', JSON.stringify(session));
    localStorage.setItem('mentorcr_user_id', id);
    localStorage.setItem('mentorcr_user_nome', nome);
    localStorage.setItem('mentorcr_user_tipo', tipo);

    currentUser = session;
    currentUserId = id;
}

function destruirSessao() {
    localStorage.removeItem('mentorcr_session');
    localStorage.removeItem('mentorcr_user_id');
    localStorage.removeItem('mentorcr_user_nome');
    localStorage.removeItem('mentorcr_user_tipo');

    currentUser = null;
    currentUserId = null;
}

function logout() {
    destruirSessao();
    window.location.href = 'index.html';
}

function verificarAutenticacao(tipoPermitido) {
    const session = verificarSessao();

    if (!session) {
        window.location.href = 'index.html';
        return false;
    }

    if (tipoPermitido && session.tipo !== tipoPermitido) {
        window.location.href = 'index.html';
        return false;
    }

    currentUser = session;
    currentUserId = session.id;

    const sidebarNome = document.getElementById('sidebarNome');
    if (sidebarNome) {
        sidebarNome.textContent = session.nome || (session.tipo === 'admin' ? 'Administrador' : session.tipo);
    }

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar && session.nome) {
        sidebarAvatar.textContent = session.nome.charAt(0).toUpperCase();
    }

    return true;
}

setInterval(() => {
    sb.from('configuracoes')
        .select('valor')
        .eq('chave', 'admin_senha')
        .single()
        .then(() => {})
        .catch(() => {});
}, 240000);
