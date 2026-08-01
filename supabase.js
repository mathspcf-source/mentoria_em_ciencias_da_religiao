// ============================================================
//  SUPABASE - CONFIGURAÇÃO COMPLETA
//  MentorCR - Ciências da Religião
// ============================================================

const SUPABASE_URL = 'https://ggnjrzqzjdjhqnjaefom.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbmpyenF6amRqaHFuamFlZm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTM2NzcsImV4cCI6MjEwMTEyOTY3N30.rQ4vcgc_nx2m4-hz6J434kbjWd4Gcn_vsPZLyg7osHQ';

// ============================================================
//  CLIENTE SUPABASE
// ============================================================
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
//  CONSTANTES
// ============================================================
const ADMIN_EMAIL = 'admin@mentorcr.com';
const SESSION_DURATION = 2 * 60 * 60 * 1000;

let currentUser = null;
let currentUserId = null;

// ============================================================
//  UTILITÁRIOS
// ============================================================

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

// ============================================================
//  SESSÃO
// ============================================================

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

// ============================================================
//  KEEP ALIVE
// ============================================================

setInterval(() => {
    sb.from('configuracoes')
        .select('valor')
        .eq('chave', 'admin_senha')
        .single()
        .then(() => {})
        .catch(() => {});
}, 240000);

// ============================================================
//  FUNÇÕES CRUD
// ============================================================

async function buscarTodos(tabela, filtros = {}) {
    try {
        let query = sb.from(tabela).select('*');
        
        if (filtros.eq) {
            for (const [key, value] of Object.entries(filtros.eq)) {
                query = query.eq(key, value);
            }
        }
        
        if (filtros.order) {
            query = query.order(filtros.order.column, { 
                ascending: filtros.order.ascending !== false 
            });
        }
        
        if (filtros.limit) {
            query = query.limit(filtros.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar:', error);
        return [];
    }
}

async function buscarPorId(tabela, id) {
    try {
        const { data, error } = await sb
            .from(tabela)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar por ID:', error);
        return null;
    }
}

async function criarRegistro(tabela, dados) {
    try {
        const { data, error } = await sb
            .from(tabela)
            .insert(dados)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao criar registro:', error);
        throw error;
    }
}

async function atualizarRegistro(tabela, id, dados) {
    try {
        const { data, error } = await sb
            .from(tabela)
            .update(dados)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        throw error;
    }
}

async function removerRegistro(tabela, id) {
    try {
        const { error } = await sb
            .from(tabela)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao remover registro:', error);
        throw error;
    }
}

async function desativarRegistro(tabela, id) {
    try {
        const { error } = await sb
            .from(tabela)
            .update({ ativo: false })
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao desativar registro:', error);
        throw error;
    }
}

// ============================================================
//  FUNÇÕES ADMIN
// ============================================================

async function carregarDashboard() {
    try {
        const [professores, alunos, turmas, pendentes] = await Promise.all([
            sb.from('professores').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('alunos').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('turmas').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('pagamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente')
        ]);

        const stats = {
            professores: professores.count || 0,
            alunos: alunos.count || 0,
            turmas: turmas.count || 0,
            pendentes: pendentes.count || 0
        };

        // Atualizar elementos DOM
        const totalProfessores = document.getElementById('totalProfessores');
        const totalAlunos = document.getElementById('totalAlunos');
        const totalTurmas = document.getElementById('totalTurmas');
        const totalPendentes = document.getElementById('totalPendentes');
        const pendentesBadge = document.getElementById('pendentesBadge');

        if (totalProfessores) totalProfessores.textContent = stats.professores;
        if (totalAlunos) totalAlunos.textContent = stats.alunos;
        if (totalTurmas) totalTurmas.textContent = stats.turmas;
        if (totalPendentes) totalPendentes.textContent = stats.pendentes;
        if (pendentesBadge) pendentesBadge.textContent = stats.pendentes;

        return stats;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        return { professores: 0, alunos: 0, turmas: 0, pendentes: 0 };
    }
}

async function carregarTabelasAdmin() {
    try {
        const [professores, alunos, turmas, pagamentos, planos] = await Promise.all([
            sb.from('professores').select('*').eq('ativo', true),
            sb.from('alunos').select('*').eq('ativo', true),
            sb.from('turmas').select('*').eq('ativo', true),
            sb.from('pagamentos').select('*'),
            sb.from('planos').select('*')
        ]);

        const dados = {
            professores: professores.data || [],
            alunos: alunos.data || [],
            turmas: turmas.data || [],
            pagamentos: pagamentos.data || [],
            planos: planos.data || []
        };

        // Atualizar tabela de professores
        const tabelaProfessores = document.getElementById('tabelaProfessores');
        if (tabelaProfessores) {
            if (dados.professores.length === 0) {
                tabelaProfessores.innerHTML = '<tr><td colspan="4"><div class="empty-state">Nenhum professor cadastrado</div></td></tr>';
            } else {
                tabelaProfessores.innerHTML = dados.professores.map(p => `
                    <tr>
                        <td><strong>${p.nome}</strong></td>
                        <td>${p.email}</td>
                        <td>${p.especialidade || '-'}</td>
                        <td style="text-align:right">
                            <button class="btn btn-danger btn-xs" onclick="desativarProfessor('${p.id}')">Desativar</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Atualizar tabela de alunos
        const tabelaAlunos = document.getElementById('tabelaAlunos');
        if (tabelaAlunos) {
            if (dados.alunos.length === 0) {
                tabelaAlunos.innerHTML = '<tr><td colspan="5"><div class="empty-state">Nenhum aluno cadastrado</div></td></tr>';
            } else {
                tabelaAlunos.innerHTML = dados.alunos.map(a => {
                    const turma = dados.turmas.find(t => t.id === a.turma_id);
                    const pagamento = dados.pagamentos.find(p => p.aluno_id === a.id);
                    const status = pagamento ? (pagamento.status === 'pago' ? 
                        '<span class="badge badge-success">Pago</span>' : 
                        '<span class="badge badge-warning">Pendente</span>') : '-';
                    return `
                        <tr>
                            <td><strong>${a.nome}</strong></td>
                            <td>${a.email}</td>
                            <td>${turma ? turma.nome : '-'}</td>
                            <td>${status}</td>
                            <td style="text-align:right">
                                <button class="btn btn-danger btn-xs" onclick="desativarAluno('${a.id}')">Desativar</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Atualizar tabela de turmas
        const tabelaTurmas = document.getElementById('tabelaTurmas');
        if (tabelaTurmas) {
            if (dados.turmas.length === 0) {
                tabelaTurmas.innerHTML = '<tr><td colspan="6"><div class="empty-state">Nenhuma turma criada</div></td></tr>';
            } else {
                tabelaTurmas.innerHTML = dados.turmas.map(t => {
                    const professor = dados.professores.find(p => p.id === t.professor_id);
                    const qtd = dados.alunos.filter(a => a.turma_id === t.id).length;
                    const plano = dados.planos.find(p => p.id === t.plano_id);
                    return `
                        <tr>
                            <td><strong>${t.nome}</strong></td>
                            <td>${professor ? professor.nome : '-'}</td>
                            <td>${qtd}</td>
                            <td>R$ ${Number(t.valor).toFixed(2)}</td>
                            <td>${plano ? plano.nome : '-'}</td>
                            <td style="text-align:right">
                                <button class="btn btn-danger btn-xs" onclick="desativarTurma('${t.id}')">Desativar</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        return dados;
    } catch (error) {
        console.error('Erro ao carregar tabelas:', error);
        return { professores: [], alunos: [], turmas: [], pagamentos: [], planos: [] };
    }
}

// ============================================================
//  FUNÇÕES PROFESSOR
// ============================================================

async function carregarTurmasProfessor(professorId) {
    try {
        const { data, error } = await sb
            .from('turmas')
            .select('*')
            .eq('professor_id', professorId)
            .eq('ativo', true);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar turmas do professor:', error);
        return [];
    }
}

async function carregarEncontrosProfessor(professorId) {
    try {
        // Primeiro buscar turmas do professor
        const turmas = await carregarTurmasProfessor(professorId);
        const turmasIds = turmas.map(t => t.id);
        
        if (turmasIds.length === 0) return [];

        const { data, error } = await sb
            .from('encontros')
            .select('*')
            .in('turma_id', turmasIds)
            .order('data', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar encontros:', error);
        return [];
    }
}

async function carregarTrabalhosRevisao(professorId) {
    try {
        const turmas = await carregarTurmasProfessor(professorId);
        const turmasIds = turmas.map(t => t.id);
        
        if (turmasIds.length === 0) return [];

        const { data, error } = await sb
            .from('trabalhos')
            .select('*')
            .in('turma_id', turmasIds)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar trabalhos para revisão:', error);
        return [];
    }
}

// ============================================================
//  FUNÇÕES ALUNO
// ============================================================

async function carregarDadosAluno(alunoId) {
    try {
        const { data: aluno, error } = await sb
            .from('alunos')
            .select('*, turmas(*)')
            .eq('id', alunoId)
            .single();
        
        if (error) throw error;
        return aluno;
    } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
        return null;
    }
}

async function carregarTrabalhosAluno(alunoId) {
    try {
        const { data, error } = await sb
            .from('trabalhos')
            .select('*')
            .eq('aluno_id', alunoId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar trabalhos do aluno:', error);
        return [];
    }
}

async function carregarPagamentosAluno(alunoId) {
    try {
        const { data, error } = await sb
            .from('pagamentos')
            .select('*')
            .eq('aluno_id', alunoId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar pagamentos do aluno:', error);
        return [];
    }
}

// ============================================================
//  FUNÇÕES BIBLIOTECA
// ============================================================

async function carregarBiblioteca() {
    try {
        const { data, error } = await sb
            .from('biblioteca')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar biblioteca:', error);
        return [];
    }
}

async function salvarMaterialBiblioteca(dados) {
    try {
        const material = {
            id: dados.id || uid(),
            tipo: dados.tipo,
            titulo: dados.titulo,
            descricao: dados.descricao || '',
            link: dados.link
        };

        let result;
        if (dados.id) {
            const { data, error } = await sb
                .from('biblioteca')
                .update(material)
                .eq('id', dados.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await sb
                .from('biblioteca')
                .insert(material)
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        return result;
    } catch (error) {
        console.error('Erro ao salvar material:', error);
        throw error;
    }
}

async function removerMaterialBiblioteca(id) {
    try {
        const { error } = await sb
            .from('biblioteca')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao remover material:', error);
        throw error;
    }
}

// ============================================================
//  FUNÇÕES PERFIL
// ============================================================

async function carregarFotoPerfil(userKey) {
    try {
        const { data, error } = await sb
            .from('fotos_perfil')
            .select('foto_base64')
            .eq('user_key', userKey)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data ? data.foto_base64 : null;
    } catch (error) {
        console.error('Erro ao carregar foto:', error);
        return null;
    }
}

async function salvarFotoPerfil(userKey, fotoBase64) {
    try {
        const dados = {
            id: uid(),
            user_key: userKey,
            foto_base64: fotoBase64
        };
        
        const { data, error } = await sb
            .from('fotos_perfil')
            .upsert(dados, { onConflict: 'user_key' })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        throw error;
    }
}

// ============================================================
//  FUNÇÕES BACKUP
// ============================================================

async function exportarBackupCompleto() {
    try {
        const tabelas = ['configuracoes', 'planos', 'professores', 'turmas', 'alunos', 'encontros', 'trabalhos', 'pagamentos', 'biblioteca', 'fotos_perfil'];
        const backup = {};
        
        for (const tabela of tabelas) {
            const { data } = await sb.from(tabela).select('*');
            backup[tabela] = data || [];
        }
        
        return backup;
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        throw error;
    }
}

async function restaurarBackupCompleto(dados) {
    try {
        const ordem = ['configuracoes', 'planos', 'fotos_perfil', 'biblioteca', 'pagamentos', 'trabalhos', 'encontros', 'alunos', 'turmas', 'professores'];
        
        for (const tabela of ordem) {
            try {
                await sb.from(tabela).delete().neq('id', '0');
            } catch (e) {}
            
            if (dados[tabela] && dados[tabela].length > 0) {
                for (const registro of dados[tabela]) {
                    try {
                        await sb.from(tabela).insert(registro);
                    } catch (e) {}
                }
            }
        }
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        throw error;
    }
}

async function apagarTodosOsDados() {
    try {
        const ordem = ['fotos_perfil', 'biblioteca', 'pagamentos', 'trabalhos', 'encontros', 'alunos', 'turmas', 'professores', 'planos'];
        
        for (const tabela of ordem) {
            try {
                await sb.from(tabela).delete().neq('id', '0');
            } catch (e) {}
        }
        
        await sb.from('configuracoes').upsert({ chave: 'admin_senha', valor: 'admin123' }, { onConflict: 'chave' });
    } catch (error) {
        console.error('Erro ao apagar dados:', error);
        throw error;
    }
}

// ============================================================
//  FUNÇÕES DE DESATIVAÇÃO
// ============================================================

async function desativarProfessor(id) {
    if (!confirm('Desativar este professor?')) return;
    try {
        showLoading();
        await desativarRegistro('professores', id);
        hideLoading();
        toast('Professor desativado!');
        carregarTabelasAdmin();
    } catch (error) {
        hideLoading();
        toast('Erro ao desativar professor');
    }
}

async function desativarAluno(id) {
    if (!confirm('Desativar este aluno?')) return;
    try {
        showLoading();
        await desativarRegistro('alunos', id);
        hideLoading();
        toast('Aluno desativado!');
        carregarTabelasAdmin();
    } catch (error) {
        hideLoading();
        toast('Erro ao desativar aluno');
    }
}

async function desativarTurma(id) {
    if (!confirm('Desativar esta turma?')) return;
    try {
        showLoading();
        await desativarRegistro('turmas', id);
        hideLoading();
        toast('Turma desativada!');
        carregarTabelasAdmin();
    } catch (error) {
        hideLoading();
        toast('Erro ao desativar turma');
    }
}

async function desativarPlano(id) {
    if (!confirm('Desativar este plano?')) return;
    try {
        showLoading();
        await desativarRegistro('planos', id);
        hideLoading();
        toast('Plano desativado!');
        carregarTabelasAdmin();
    } catch (error) {
        hideLoading();
        toast('Erro ao desativar plano');
    }
}

// ============================================================
//  EXPORTAÇÃO GLOBAL
// ============================================================

// Supabase
window.sb = sb;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.ADMIN_EMAIL = ADMIN_EMAIL;

// Utilitários
window.uid = uid;
window.$ = $;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;

// Sessão
window.verificarSessao = verificarSessao;
window.criarSessao = criarSessao;
window.destruirSessao = destruirSessao;
window.logout = logout;
window.verificarAutenticacao = verificarAutenticacao;

// CRUD
window.buscarTodos = buscarTodos;
window.buscarPorId = buscarPorId;
window.criarRegistro = criarRegistro;
window.atualizarRegistro = atualizarRegistro;
window.removerRegistro = removerRegistro;
window.desativarRegistro = desativarRegistro;

// Admin
window.carregarDashboard = carregarDashboard;
window.carregarTabelasAdmin = carregarTabelasAdmin;
window.desativarProfessor = desativarProfessor;
window.desativarAluno = desativarAluno;
window.desativarTurma = desativarTurma;
window.desativarPlano = desativarPlano;

// Professor
window.carregarTurmasProfessor = carregarTurmasProfessor;
window.carregarEncontrosProfessor = carregarEncontrosProfessor;
window.carregarTrabalhosRevisao = carregarTrabalhosRevisao;

// Aluno
window.carregarDadosAluno = carregarDadosAluno;
window.carregarTrabalhosAluno = carregarTrabalhosAluno;
window.carregarPagamentosAluno = carregarPagamentosAluno;

// Biblioteca
window.carregarBiblioteca = carregarBiblioteca;
window.salvarMaterialBiblioteca = salvarMaterialBiblioteca;
window.removerMaterialBiblioteca = removerMaterialBiblioteca;

// Perfil
window.carregarFotoPerfil = carregarFotoPerfil;
window.salvarFotoPerfil = salvarFotoPerfil;

// Backup
window.exportarBackupCompleto = exportarBackupCompleto;
window.restaurarBackupCompleto = restaurarBackupCompleto;
window.apagarTodosOsDados = apagarTodosOsDados;

console.log('✅ Supabase configurado com sucesso!');
console.log('📊 URL:', SUPABASE_URL);
console.log('🔑 Chave:', SUPABASE_KEY.substring(0, 20) + '...');
console.log('📋 Funções disponíveis:', Object.keys(window).filter(k => k.startsWith('carregar') || k.startsWith('desativar') || k === 'toast' || k === 'showLoading' || k === 'hideLoading'));
