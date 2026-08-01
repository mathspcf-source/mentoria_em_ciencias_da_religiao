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

/**
 * Gera um ID único para novos registros
 * @returns {string} ID único
 */
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Obtém um elemento do DOM pelo ID
 * @param {string} id - ID do elemento
 * @returns {HTMLElement} Elemento encontrado
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Exibe o overlay de loading
 */
function showLoading() {
    const el = document.getElementById('loading');
    if (el) el.classList.add('show');
}

/**
 * Oculta o overlay de loading
 */
function hideLoading() {
    const el = document.getElementById('loading');
    if (el) el.classList.remove('show');
}

/**
 * Exibe uma notificação toast
 * @param {string} msg - Mensagem a ser exibida
 */
function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);

    setTimeout(() => t.remove(), 2500);
}

/**
 * Abre um modal
 * @param {string} id - ID do modal (sem o prefixo 'modal')
 */
function openModal(id) {
    const el = document.getElementById('modal' + id);
    if (el) el.classList.add('show');
}

/**
 * Fecha um modal
 * @param {string} id - ID do modal (sem o prefixo 'modal')
 */
function closeModal(id) {
    const el = document.getElementById('modal' + id);
    if (el) el.classList.remove('show');
}

/**
 * Fecha modal ao clicar fora
 */
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
};

// ============================================================
//  GERENCIAMENTO DE SESSÃO
// ============================================================

/**
 * Verifica se a sessão atual é válida
 * @returns {Object|null} Dados da sessão ou null
 */
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

/**
 * Cria uma nova sessão
 * @param {string} tipo - Tipo de usuário ('admin', 'professor', 'aluno')
 * @param {string} id - ID do usuário
 * @param {string} nome - Nome do usuário
 */
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

/**
 * Destroi a sessão atual
 */
function destruirSessao() {
    localStorage.removeItem('mentorcr_session');
    localStorage.removeItem('mentorcr_user_id');
    localStorage.removeItem('mentorcr_user_nome');
    localStorage.removeItem('mentorcr_user_tipo');

    currentUser = null;
    currentUserId = null;
}

/**
 * Realiza logout do usuário
 */
function logout() {
    destruirSessao();
    window.location.href = 'index.html';
}

/**
 * Verifica autenticação e redireciona se necessário
 * @param {string} tipoPermitido - Tipo de usuário permitido
 * @returns {boolean} True se autenticado
 */
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

    // Atualiza nome na sidebar
    const sidebarNome = document.getElementById('sidebarNome');
    if (sidebarNome) {
        sidebarNome.textContent = session.nome || (session.tipo === 'admin' ? 'Administrador' : session.tipo);
    }

    // Atualiza avatar na sidebar
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar && session.nome) {
        sidebarAvatar.textContent = session.nome.charAt(0).toUpperCase();
    }

    return true;
}

// ============================================================
//  KEEP ALIVE
//  Mantém a sessão ativa com requisições periódicas
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
//  EXPORTAÇÃO
//  Para uso em outros arquivos (quando suportado)
// ============================================================

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

// ============================================================
//  MÉTODOS AUXILIARES PARA CRUD
// ============================================================

/**
 * Busca todos os registros de uma tabela
 * @param {string} tabela - Nome da tabela
 * @param {Object} filtros - Filtros para a consulta
 * @returns {Promise<Array>} Lista de registros
 */
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

/**
 * Busca um único registro por ID
 * @param {string} tabela - Nome da tabela
 * @param {string} id - ID do registro
 * @returns {Promise<Object>} Registro encontrado
 */
async function buscarPorId(tabela, id) {
    const { data, error } = await sb
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Cria um novo registro
 * @param {string} tabela - Nome da tabela
 * @param {Object} dados - Dados a serem inseridos
 * @returns {Promise<Object>} Registro criado
 */
async function criarRegistro(tabela, dados) {
    const { data, error } = await sb
        .from(tabela)
        .insert(dados)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Atualiza um registro
 * @param {string} tabela - Nome da tabela
 * @param {string} id - ID do registro
 * @param {Object} dados - Dados a serem atualizados
 * @returns {Promise<Object>} Registro atualizado
 */
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

/**
 * Remove um registro
 * @param {string} tabela - Nome da tabela
 * @param {string} id - ID do registro
 * @returns {Promise<void>}
 */
async function removerRegistro(tabela, id) {
    const { error } = await sb
        .from(tabela)
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

/**
 * Desativa um registro (soft delete)
 * @param {string} tabela - Nome da tabela
 * @param {string} id - ID do registro
 * @returns {Promise<void>}
 */
async function desativarRegistro(tabela, id) {
    const { error } = await sb
        .from(tabela)
        .update({ ativo: false })
        .eq('id', id);
    
    if (error) throw error;
}

// ============================================================
//  MÉTODOS ESPECÍFICOS PARA O SISTEMA
// ============================================================

/**
 * Obtém estatísticas para o dashboard
 * @returns {Promise<Object>} Estatísticas
 */
async function obterEstatisticas() {
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
}

/**
 * Busca turmas de um professor
 * @param {string} professorId - ID do professor
 * @returns {Promise<Array>} Lista de turmas
 */
async function buscarTurmasDoProfessor(professorId) {
    return buscarTodos('turmas', {
        eq: { professor_id: professorId, ativo: true }
    });
}

/**
 * Busca alunos de uma turma
 * @param {string} turmaId - ID da turma
 * @returns {Promise<Array>} Lista de alunos
 */
async function buscarAlunosDaTurma(turmaId) {
    return buscarTodos('alunos', {
        eq: { turma_id: turmaId, ativo: true }
    });
}

/**
 * Busca encontros de uma turma
 * @param {string} turmaId - ID da turma
 * @returns {Promise<Array>} Lista de encontros
 */
async function buscarEncontrosDaTurma(turmaId) {
    return buscarTodos('encontros', {
        eq: { turma_id: turmaId },
        order: { column: 'data', ascending: true }
    });
}

/**
 * Busca trabalhos de um aluno
 * @param {string} alunoId - ID do aluno
 * @returns {Promise<Array>} Lista de trabalhos
 */
async function buscarTrabalhosDoAluno(alunoId) {
    return buscarTodos('trabalhos', {
        eq: { aluno_id: alunoId },
        order: { column: 'created_at', ascending: false }
    });
}

/**
 * Busca pagamentos de um aluno
 * @param {string} alunoId - ID do aluno
 * @returns {Promise<Array>} Lista de pagamentos
 */
async function buscarPagamentosDoAluno(alunoId) {
    return buscarTodos('pagamentos', {
        eq: { aluno_id: alunoId }
    });
}

/**
 * Confirma um pagamento
 * @param {string} pagamentoId - ID do pagamento
 * @returns {Promise<void>}
 */
async function confirmarPagamento(pagamentoId) {
    await atualizarRegistro('pagamentos', pagamentoId, { status: 'pago' });
}

/**
 * Envia um trabalho
 * @param {Object} dados - Dados do trabalho
 * @returns {Promise<Object>} Trabalho criado
 */
async function enviarTrabalho(dados) {
    const trabalho = {
        id: uid(),
        ...dados,
        data_envio: new Date().toISOString().split('T')[0],
        status: 'aguardando'
    };
    return criarRegistro('trabalhos', trabalho);
}

/**
 * Devolve um trabalho com barema
 * @param {string} trabalhoId - ID do trabalho
 * @param {Object} dados - Dados da devolução
 * @returns {Promise<Object>} Trabalho atualizado
 */
async function devolverTrabalho(trabalhoId, dados) {
    const update = {
        ...dados,
        status: 'devolvido',
        data_devolucao: new Date().toISOString().split('T')[0]
    };
    return atualizarRegistro('trabalhos', trabalhoId, update);
}

// ============================================================
//  MÉTODOS PARA BIBLIOTECA
// ============================================================

/**
 * Busca todos os materiais da biblioteca
 * @param {string} tipo - Filtro por tipo ('livro', 'artigo' ou null)
 * @returns {Promise<Array>} Lista de materiais
 */
async function buscarMateriais(tipo = null) {
    const filtros = { order: { column: 'created_at', ascending: false } };
    if (tipo) {
        filtros.eq = { tipo };
    }
    return buscarTodos('biblioteca', filtros);
}

/**
 * Busca materiais por tipo
 * @param {string} tipo - Tipo do material ('livro' ou 'artigo')
 * @returns {Promise<Array>} Lista de materiais
 */
async function buscarMateriaisPorTipo(tipo) {
    return buscarTodos('biblioteca', {
        eq: { tipo },
        order: { column: 'created_at', ascending: false }
    });
}

// ============================================================
//  MÉTODOS PARA FOTOS DE PERFIL
// ============================================================

/**
 * Salva ou atualiza a foto de perfil
 * @param {string} userKey - Chave do usuário (ex: 'admin', 'prof_123', 'aluno_456')
 * @param {string} fotoBase64 - Foto em Base64
 * @returns {Promise<Object>} Registro salvo
 */
async function salvarFotoPerfil(userKey, fotoBase64) {
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
}

/**
 * Busca a foto de perfil de um usuário
 * @param {string} userKey - Chave do usuário
 * @returns {Promise<string|null>} Foto em Base64 ou null
 */
async function buscarFotoPerfil(userKey) {
    const { data, error } = await sb
        .from('fotos_perfil')
        .select('foto_base64')
        .eq('user_key', userKey)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
    }
    return data ? data.foto_base64 : null;
}

// ============================================================
//  MÉTODOS PARA BACKUP
// ============================================================

/**
 * Exporta todos os dados do sistema
 * @returns {Promise<Object>} Objeto com todos os dados
 */
async function exportarBackup() {
    const tabelas = ['configuracoes', 'planos', 'professores', 'turmas', 'alunos', 'encontros', 'trabalhos', 'pagamentos', 'biblioteca', 'fotos_perfil'];
    const backup = {};
    
    for (const tabela of tabelas) {
        const { data } = await sb.from(tabela).select('*');
        backup[tabela] = data || [];
    }
    
    return backup;
}

/**
 * Restaura dados de um backup
 * @param {Object} dados - Dados do backup
 * @returns {Promise<void>}
 */
async function restaurarBackup(dados) {
    const ordem = ['configuracoes', 'planos', 'fotos_perfil', 'biblioteca', 'pagamentos', 'trabalhos', 'encontros', 'alunos', 'turmas', 'professores'];
    
    for (const tabela of ordem) {
        // Limpa a tabela
        try {
            await sb.from(tabela).delete().neq('id', '0');
        } catch (e) {
            // Ignora erro se tabela estiver vazia
        }
        
        // Insere os dados do backup
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
}

/**
 * Apaga todos os dados do sistema
 * @returns {Promise<void>}
 */
async function apagarTodosOsDados() {
    const ordem = ['fotos_perfil', 'biblioteca', 'pagamentos', 'trabalhos', 'encontros', 'alunos', 'turmas', 'professores', 'planos'];
    
    for (const tabela of ordem) {
        try {
            await sb.from(tabela).delete().neq('id', '0');
        } catch (e) {
            // Ignora erro se tabela não existir
        }
    }
    
    // Recria a senha do admin
    await sb.from('configuracoes').upsert({ chave: 'admin_senha', valor: 'admin123' }, { onConflict: 'chave' });
}
