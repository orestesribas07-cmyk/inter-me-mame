// server.js (VERSÃO FINAL COMPLETA E CORRIGIDA COM LOGIN E PROTEÇÃO)

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURAÇÃO DA SESSÃO ---
app.use(session({
    secret: 'o-segredo-final-do-inter-me-mame',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- CONEXÃO COM O BANCO DE DADOS ---
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'inter_me_mame',
    port: 3306
});

pool.getConnection((err, connection) => {
    if (err) { console.error('Erro ao conectar com o banco de dados:', err.message); return; }
    console.log('Conectado com sucesso ao banco de dados MySQL!');
    connection.release();
});

// --- MIDDLEWARE DE AUTENTICAÇÃO (O NOSSO "SEGURANÇA") ---
function checkAuth(req, res, next) {
    if (!req.session.loggedIn) {
        return res.status(401).json({ error: 'Acesso não autorizado. Faça o login.' });
    }
    next();
}

// --- ROTAS DA API ---

// ROTA DE LOGIN (PÚBLICA)
app.post('/api/login', (req, res) => {
    console.log("Recebi uma tentativa de login com:", req.body); // O nosso espião
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
app.get('/api/noticias', (req, res) => { pool.query("SELECT * FROM Noticias ORDER BY data DESC", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results }); }); });
app.get('/api/elenco', (req, res) => { pool.query("SELECT * FROM Elenco", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results }); }); });
app.get('/api/partidas', (req, res) => { pool.query("SELECT * FROM Partidas WHERE tipo IN ('proximo', 'ultimo') LIMIT 2", (err, results) => { if (err) { return res.status(500).json({ "error": err.message }); } res.json({ data: results }); }); });

// --- ROTAS PROTEGIDAS (PRECISAM DE LOGIN) ---
app.post('/api/noticias', checkAuth, (req, res) => { const { titulo, resumo, imagem } = req.body; if (!titulo || !resumo || !imagem) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } const sql = "INSERT INTO Noticias (titulo, resumo, imagem) VALUES (?, ?, ?)"; pool.query(sql, [titulo, resumo, imagem], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao salvar notícia.' }); } res.status(201).json({ message: 'Notícia criada com sucesso!', data: { id: result.insertId } }); }); });
app.put('/api/noticias/:id', checkAuth, (req, res) => { const { id } = req.params; const { titulo, resumo, imagem } = req.body; if (!titulo || !resumo || !imagem) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } const sql = "UPDATE Noticias SET titulo = ?, resumo = ?, imagem = ? WHERE id = ?"; pool.query(sql, [titulo, resumo, imagem, id], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao atualizar notícia.' }); } if (result.affectedRows > 0) { res.status(200).json({ message: 'Notícia atualizada com sucesso!' }); } else { res.status(404).json({ error: 'Notícia não encontrada.' }); } }); });
app.delete('/api/noticias/:id', checkAuth, (req, res) => { const { id } = req.params; const sql = "DELETE FROM Noticias WHERE id = ?"; pool.query(sql, [id], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao excluir notícia.' }); } if (result.affectedRows > 0) { res.status(200).json({ message: 'Notícia excluída com sucesso!' }); } else { res.status(404).json({ error: 'Notícia não encontrada.' }); } }); });
app.post('/api/elenco', checkAuth, (req, res) => { const { nome, posicao, gols, avatar_url } = req.body; if (!nome || !posicao || avatar_url === undefined || gols === undefined) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } const sql = "INSERT INTO Elenco (nome, posicao, gols, avatar_url) VALUES (?, ?, ?, ?)"; pool.query(sql, [nome, posicao, gols, avatar_url], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao salvar membro.' }); } res.status(201).json({ message: 'Membro adicionado com sucesso!', data: { id: result.insertId } }); }); });
app.put('/api/elenco/:id', checkAuth, (req, res) => { const { id } = req.params; const { nome, posicao, gols, avatar_url } = req.body; if (!nome || !posicao || avatar_url === undefined || gols === undefined) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); } const sql = "UPDATE Elenco SET nome = ?, posicao = ?, gols = ?, avatar_url = ? WHERE id = ?"; pool.query(sql, [nome, posicao, gols, avatar_url, id], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao atualizar membro.' }); } if (result.affectedRows > 0) { res.status(200).json({ message: 'Membro atualizado com sucesso!' }); } else { res.status(404).json({ error: 'Membro não encontrado.' }); } }); });
app.delete('/api/elenco/:id', checkAuth, (req, res) => { const { id } = req.params; const sql = "DELETE FROM Elenco WHERE id = ?"; pool.query(sql, [id], (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao excluir membro.' }); } if (result.affectedRows > 0) { res.status(200).json({ message: 'Membro excluído com sucesso!' }); } else { res.status(404).json({ error: 'Membro não encontrado.' }); } }); });
app.put('/api/partidas', checkAuth, (req, res) => { const { tipo, adversario, data_hora, placar } = req.body; if (!tipo || !adversario) { return res.status(400).json({ error: 'Tipo e adversário são obrigatórios.' }); } let sql, params; if (tipo === 'proximo') { sql = "UPDATE Partidas SET adversario = ?, data_hora = ? WHERE tipo = 'proximo'"; params = [adversario, data_hora]; } else if (tipo === 'ultimo') { sql = "UPDATE Partidas SET adversario = ?, placar = ? WHERE tipo = 'ultimo'"; params = [adversario, placar]; } else { return res.status(400).json({ error: 'Tipo de partida inválido.' }); } pool.query(sql, params, (err, result) => { if (err) { return res.status(500).json({ error: 'Erro ao atualizar partida.' }); } res.status(200).json({ message: 'Partida atualizada com sucesso!' }); }); });


// --- INICIA O SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});