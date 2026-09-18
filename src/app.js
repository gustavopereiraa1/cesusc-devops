const express = require('express');

const app = express();
const port = 3000;

app.get('/index', (req, res) => {
    res.sendFile('views/index.html', { root: __dirname });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});