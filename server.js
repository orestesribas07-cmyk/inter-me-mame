const express = require('express');
const { Pool } = require('pg'); // Usando 'pg' para PostgreSQL
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
// USA A PORTA FORNECIDA PELO RENDER (ambiente de produção) OU 3000 localmente.
const PORT = process.env.PORT || 3000; 

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public'))); 

// --- CONFIGURAÇÃO DA SESSÃO ---
app.use(session({
    secret: 'o-segredo-final-do-inter-me-mame',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// --- CONEXÃO COM O BANCO DE DADOS (USANDO VARIÁVEL DE AMBIENTE) ---

// Usa a DATABASE_URL fornecida pelo Render. Removido o fallback local para garantir 
// que a conexão só tente o PostgreSQL remoto, resolvendo erros de deploy.
const connectionString = process.env.DATABASE_URL; 

const pool = new Pool({
    connectionString: connectionString,
    // ESSENCIAL para a conexão segura (SSL) no Render
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT 1 + 1 AS solution', (err, res) => {
    if (err) { 
        console.error('Erro ao conectar com o banco de dados PostgreSQL:', err.message); 
    } else {
        console.log('Conectado com sucesso ao banco de dados PostgreSQL!');
    }
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function checkAuth(req, res, next) {
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: 'Acesso não autorizado. Faça o login.' });
    }
    next();
}

// --- ROTAS DA API E ARQUIVOS ---

// ROTA PARA SERVIR O PAINEL DE ADMINISTRAÇÃO (dashboard.html)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ROTA DE LOGIN (PÚBLICA)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Gamarra' && password === 'lucasgp120') { 
        req.session.loggedIn = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// ROTA PARA VERIFICAR LOGIN (PÚBLICA)
app.get('/api/check-auth', (req, res) => {
    res.json({ loggedIn: !!req.session.loggedIn });
});

// ROTAS DE LEITURA (PÚBLICAS)
app.get('/api/noticias', (req, res) => { pool.query("SELECT * FROM Noticias ORDER BY data DESC", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results.rows }); }); });
app.get('/api/elenco', (req, res) => { pool.query("SELECT * FROM Elenco", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results.rows }); }); });
app.get('/api/partidas', (req, res) => { pool.query("SELECT * FROM Partidas WHERE tipo IN ('proximo', 'ultimo') LIMIT 2", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results.rows }); }); });

// --- ROTAS PROTEGIDAS (PRECISAM DE LOGIN) ---
// Note que os placeholders mudaram de ? para $1, $2, etc., para o PostgreSQL

app.post('/api/noticias', checkAuth, (req, res) => { 
    const { titulo, resumo, imagem } = req.body; 
    if (!titulo || !resumo || !imagem) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } 
    const sql = "INSERT INTO Noticias (titulo, resumo, imagem) VALUES ($1, $2, $3) RETURNING id";
    pool.query(sql, [titulo, resumo, imagem], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao salvar notícia.' }); } 
        res.status(201).json({ message: 'Notícia criada com sucesso!', data: { id: result.rows[0].id } });
    }); 
});

app.put('/api/noticias/:id', checkAuth, (req, res) => { 
    const { id } = req.params; 
    const { titulo, resumo, imagem } = req.body; 
    if (!titulo || !resumo || !imagem) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } 
    const sql = "UPDATE Noticias SET titulo = $1, resumo = $2, imagem = $3 WHERE id = $4";
    pool.query(sql, [titulo, resumo, imagem, id], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao atualizar notícia.' }); } 
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Notícia atualizada com sucesso!' }); 
        } else { 
            res.status(404).json({ error: 'Notícia não encontrada.' }); 
        } 
    }); 
});

app.delete('/api/noticias/:id', checkAuth, (req, res) => { 
    const { id } = req.params; 
    const sql = "DELETE FROM Noticias WHERE id = $1";
    pool.query(sql, [id], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao excluir notícia.' }); } 
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Notícia excluída com sucesso!' }); 
        } else { 
            res.status(404).json({ error: 'Notícia não encontrada.' }); 
        } 
    }); 
});

app.post('/api/elenco', checkAuth, (req, res) => { 
    const { nome, posicao, gols, avatar_url } = req.body; 
    if (!nome || !posicao || avatar_url === undefined || gols === undefined) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } 
    const sql = "INSERT INTO Elenco (nome, posicao, gols, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id";
    pool.query(sql, [nome, posicao, gols, avatar_url], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao salvar membro.' }); } 
        res.status(201).json({ message: 'Membro adicionado com sucesso!', data: { id: result.rows[0].id } });
    }); 
});

app.put('/api/elenco/:id', checkAuth, (req, res) => { 
    const { id } = req.params; 
    const { nome, posicao, gols, avatar_url } = req.body; 
    if (!nome || !posicao || avatar_url === undefined || gols === undefined) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } 
    const sql = "UPDATE Elenco SET nome = $1, posicao = $2, gols = $3, avatar_url = $4 WHERE id = $5";
    pool.query(sql, [nome, posicao, gols, avatar_url, id], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao atualizar membro.' }); } 
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Membro atualizado com sucesso!' }); 
        } else { 
            res.status(404).json({ error: 'Membro não encontrado.' }); 
        } 
    }); 
});

app.delete('/api/elenco/:id', checkAuth, (req, res) => { 
    const { id } = req.params; 
    const sql = "DELETE FROM Elenco WHERE id = $1";
    pool.query(sql, [id], (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao excluir membro.' }); } 
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Membro excluído com sucesso!' }); 
        } else { 
            res.status(404).json({ error: 'Membro não encontrado.' }); 
        } 
    }); 
});

app.put('/api/partidas', checkAuth, (req, res) => { 
    const { tipo, adversario, data_hora, placar } = req.body; 
    if (!tipo || !adversario) { return res.status(400).json({ error: 'Tipo e adversário são obrigatórios.' }); } 
    let sql, params; 
    if (tipo === 'proximo') { 
        sql = "UPDATE Partidas SET adversario = $1, data_hora = $2 WHERE tipo = 'proximo'";
        params = [adversario, data_hora]; 
    } else if (tipo === 'ultimo') { 
        sql = "UPDATE Partidas SET adversario = $1, placar = $2 WHERE tipo = 'ultimo'";
        params = [adversario, placar]; 
    } else { 
        return res.status(400).json({ error: 'Tipo de partida inválido.' }); 
    } 
    pool.query(sql, params, (err, result) => { 
        if (err) { return res.status(500).json({ error: 'Erro ao atualizar partida.' }); } 
        res.status(200).json({ message: 'Partida atualizada com sucesso!' }); 
    }); 
});


// --- INICIA O SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});