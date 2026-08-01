// ============================================================
//  SUPABASE CONFIGURAÇÃO
//  Arquivo de configuração compartilhado entre todas as páginas
// ============================================================

// ===== CONFIGURAÇÃO =====
const SUPABASE_URL = 'https://sejnrydyaoawzthnprvq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlam5yeWR5YW9hd3p0aG5wcnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTQyNjYsImV4cCI6MjA5MzkzMDI2Nn0.2GXQUF8drgT8HKLLp4YHT6vi0iBUjVdjw1t-ft1xsRA';

// ===== CLIENTE SUPABASE =====
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== CONSTANTES =====
const ADMIN_EMAIL = 'admin@mentorcr.com';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

// ===== VARIÁVEIS GLOBAIS =====
let currentUser = null;
let currentUserId = null;

// ===== UTILITÁRIOS =====
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

// Fechar modal ao clicar fora
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
};

// ===== GERENCIAMENTO DE SESSÃO =====
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

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
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

    // Atualizar nome na sidebar se existir
    const sidebarNome = document.getElementById('sidebarNome');
    if (sidebarNome) {
        sidebarNome.textContent = session.nome || (session.tipo === 'admin' ? 'Administrador' : session.tipo);
    }

    // Atualizar avatar na sidebar
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar && session.nome) {
        sidebarAvatar.textContent = session.nome.charAt(0).toUpperCase();
    }

    return true;
}

// ===== KEEP ALIVE =====
// Mantém a sessão ativa com requisições periódicas
setInterval(() => {
    sb.from('configuracoes')
        .select('valor')
        .eq('chave', 'admin_senha')
        .single()
        .then(() => {})
        .catch(() => {});
}, 240000);

// ===== EXPORTAÇÃO =====
// Para uso em outros arquivos (quando suportado)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sb,
        SUPABASE_URL,
        SUPABASE_KEY,
        ADMIN_EMAIL,
        SESSION_DURATION,
        currentUser,
        currentUserId,
        uid,
        $,
        showLoading,
        hideLoading,
        toast,
        openModal,
        closeModal,
        verificarSessao,
        criarSessao,
        destruirSessao,
        logout,
        verificarAutenticacao
    };
}
