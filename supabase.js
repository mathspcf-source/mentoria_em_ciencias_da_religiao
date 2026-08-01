// ============================================================
//  SUPABASE - CONFIGURAÇÃO
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
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

// ============================================================
//  VARIÁVEIS GLOBAIS
// ============================================================
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
//  GERENCIAMENTO DE SESSÃO
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
//  MÉTODOS CRUD - CORRIGIDOS
// ============================================================

async function buscarTodos(tabela, filtros = {}) {
    let query = sb.from(tabela).select('*');
    
    if (filtros.eq) {
        for (const [key, value] of Object.entries(filtros.eq)) {
            query = query.eq(key, value);
        }
    }
    
    if (filtros.order) {
        query = query.order(filtros.order.column, { ascending: filtros.order.ascending !== false });
    }
    
    if (filtros.limit) {
        query = query.limit(filtros.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function buscarPorId(tabela, id) {
    const { data, error } = await sb
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

async function criarRegistro(tabela, dados) {
    const { data, error } = await sb
        .from(tabela)
        .insert(dados)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function atualizarRegistro(tabela, id, dados) {
    const { data, error } = await sb
        .from(tabela)
        .update(dados)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function removerRegistro(tabela, id) {
    const { error } = await sb
        .from(tabela)
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

async function desativarRegistro(tabela, id) {
    const { error } = await sb
        .from(tabela)
        .update({ ativo: false })
        .eq('id', id);
    
    if (error) throw error;
}

// ============================================================
//  MÉTODOS ESPECÍFICOS - CORRIGIDOS
// ============================================================

async function obterEstatisticas() {
    try {
        const [professores, alunos, turmas, pendentes] = await Promise.all([
            sb.from('professores').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('alunos').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('turmas').select('id', { count: 'exact', head: true }).eq('ativo', true),
            sb.from('pagamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente')
        ]);

        return {
            professores: professores.count || 0,
            alunos: alunos.count || 0,
            turmas: turmas.count || 0,
            pendentes: pendentes.count || 0
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { professores: 0, alunos: 0, turmas: 0, pendentes: 0 };
    }
}

async function buscarTurmasDoProfessor(professorId) {
    try {
        return await buscarTodos('turmas', {
            eq: { professor_id: professorId, ativo: true }
        });
    } catch (error) {
        console.error('Erro ao buscar turmas do professor:', error);
        return [];
    }
}

async function buscarAlunosDaTurma(turmaId) {
    try {
        return await buscarTodos('alunos', {
            eq: { turma_id: turmaId, ativo: true }
        });
    } catch (error) {
        console.error('Erro ao buscar alunos da turma:', error);
        return [];
    }
}

async function buscarEncontrosDaTurma(turmaId) {
    try {
        return await buscarTodos('encontros', {
            eq: { turma_id: turmaId },
            order: { column: 'data', ascending: true }
        });
    } catch (error) {
        console.error('Erro ao buscar encontros da turma:', error);
        return [];
    }
}

async function buscarTrabalhosDoAluno(alunoId) {
    try {
        return await buscarTodos('trabalhos', {
            eq: { aluno_id: alunoId },
            order: { column: 'created_at', ascending: false }
        });
    } catch (error) {
        console.error('Erro ao buscar trabalhos do aluno:', error);
        return [];
    }
}

async function buscarPagamentosDoAluno(alunoId) {
    try {
        return await buscarTodos('pagamentos', {
            eq: { aluno_id: alunoId }
        });
    } catch (error) {
        console.error('Erro ao buscar pagamentos do aluno:', error);
        return [];
    }
}

async function confirmarPagamento(pagamentoId) {
    try {
        return await atualizarRegistro('pagamentos', pagamentoId, { status: 'pago' });
    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        throw error;
    }
}

async function enviarTrabalho(dados) {
    try {
        const trabalho = {
            id: uid(),
            ...dados,
            data_envio: new Date().toISOString().split('T')[0],
            status: 'aguardando'
        };
        return await criarRegistro('trabalhos', trabalho);
    } catch (error) {
        console.error('Erro ao enviar trabalho:', error);
        throw error;
    }
}

async function devolverTrabalho(trabalhoId, dados) {
    try {
        const update = {
            ...dados,
            status: 'devolvido',
            data_devolucao: new Date().toISOString().split('T')[0]
        };
        return await atualizarRegistro('trabalhos', trabalhoId, update);
    } catch (error) {
        console.error('Erro ao devolver trabalho:', error);
        throw error;
    }
}

// ============================================================
//  MÉTODOS PARA BIBLIOTECA - CORRIGIDOS
// ============================================================

async function buscarMateriais(tipo = null) {
    try {
        const filtros = { order: { column: 'created_at', ascending: false } };
        if (tipo) {
            filtros.eq = { tipo };
        }
        return await buscarTodos('biblioteca', filtros);
    } catch (error) {
        console.error('Erro ao buscar materiais:', error);
        return [];
    }
}

async function buscarMateriaisPorTipo(tipo) {
    try {
        return await buscarTodos('biblioteca', {
            eq: { tipo },
            order: { column: 'created_at', ascending: false }
        });
    } catch (error) {
        console.error('Erro ao buscar materiais por tipo:', error);
        return [];
    }
}

// ============================================================
//  MÉTODOS PARA FOTOS DE PERFIL - CORRIGIDOS
// ============================================================

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
        console.error('Erro ao salvar foto de perfil:', error);
        throw error;
    }
}

async function buscarFotoPerfil(userKey) {
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
        console.error('Erro ao buscar foto de perfil:', error);
        return null;
    }
}

// ============================================================
//  MÉTODOS PARA BACKUP - CORRIGIDOS
// ============================================================

async function exportarBackup() {
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

async function restaurarBackup(dados) {
    try {
        const ordem = ['configuracoes', 'planos', 'fotos_perfil', 'biblioteca', 'pagamentos', 'trabalhos', 'encontros', 'alunos', 'turmas', 'professores'];
        
        for (const tabela of ordem) {
            try {
                await sb.from(tabela).delete().neq('id', '0');
            } catch (e) {
                // Ignora erro se tabela estiver vazia
            }
            
            if (dados[tabela] && dados[tabela].length > 0) {
                for (const registro of dados[tabela]) {
                    try {
                        await sb.from(tabela).insert(registro);
                    } catch (e) {
                        console.warn(`Erro ao restaurar ${tabela}:`, e);
                    }
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
            } catch (e) {
                // Ignora erro se tabela não existir
            }
        }
        
        await sb.from('configuracoes').upsert({ chave: 'admin_senha', valor: 'admin123' }, { onConflict: 'chave' });
    } catch (error) {
        console.error('Erro ao apagar dados:', error);
        throw error;
    }
}

// ============================================================
//  EXPORTAÇÃO PARA USO EM OUTROS ARQUIVOS
// ============================================================

// Garantir que todas as funções estejam disponíveis globalmente
window.sb = sb;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.ADMIN_EMAIL = ADMIN_EMAIL;
window.SESSION_DURATION = SESSION_DURATION;
window.currentUser = currentUser;
window.currentUserId = currentUserId;

window.uid = uid;
window.$ = $;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;

window.verificarSessao = verificarSessao;
window.criarSessao = criarSessao;
window.destruirSessao = destruirSessao;
window.logout = logout;
window.verificarAutenticacao = verificarAutenticacao;

window.buscarTodos = buscarTodos;
window.buscarPorId = buscarPorId;
window.criarRegistro = criarRegistro;
window.atualizarRegistro = atualizarRegistro;
window.removerRegistro = removerRegistro;
window.desativarRegistro = desativarRegistro;

window.obterEstatisticas = obterEstatisticas;
window.buscarTurmasDoProfessor = buscarTurmasDoProfessor;
window.buscarAlunosDaTurma = buscarAlunosDaTurma;
window.buscarEncontrosDaTurma = buscarEncontrosDaTurma;
window.buscarTrabalhosDoAluno = buscarTrabalhosDoAluno;
window.buscarPagamentosDoAluno = buscarPagamentosDoAluno;
window.confirmarPagamento = confirmarPagamento;
window.enviarTrabalho = enviarTrabalho;
window.devolverTrabalho = devolverTrabalho;

window.buscarMateriais = buscarMateriais;
window.buscarMateriaisPorTipo = buscarMateriaisPorTipo;

window.salvarFotoPerfil = salvarFotoPerfil;
window.buscarFotoPerfil = buscarFotoPerfil;

window.exportarBackup = exportarBackup;
window.restaurarBackup = restaurarBackup;
window.apagarTodosOsDados = apagarTodosOsDados;

console.log('✅ Supabase configurado com sucesso!');
console.log('📊 URL:', SUPABASE_URL);
console.log('🔑 Chave:', SUPABASE_KEY.substring(0, 20) + '...');
