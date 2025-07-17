import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

const PORT = 8080;
const app = express();
const dbDir = join(process.cwd(), 'db');
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

// Serve static files (*.html, etc.)
app.use(express.static(process.cwd(), { extensions: ['html'] }));

// Serve quiz_interface.html at /quizzes
app.get('/', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
});

// API: get all quizzes for a module
app.get('/api/module', (req, res) => {
  let id = req.query.id;
  if (typeof id === 'string') id = id.trim().toLowerCase();
  const dbPath = join(dbDir, 'quiz-all.db');

  if (!existsSync(dbPath)) {
    return res.status(404).json({ error: 'Database not found' });
  }

  try {
    const db = new Database(dbPath, { readonly: true });
    let rows;

    if (id && /^[1-9]$/.test(id)) {
      const moduleKey = `module_${id}`;
      rows = db.prepare('SELECT * FROM quizzes WHERE quiz_number = ?').all(moduleKey);
    } else if (id === "all") {
      rows = db.prepare('SELECT * FROM quizzes').all();
    } else if (id) {
      // Any other non-empty id returns an empty array (invalid module)
      rows = [];
    } else {
      rows = [];
    }
    db.close();
    
    const quizzes = rows.map(row => ({
      ...row,
      answers: row.answers ? JSON.parse(row.answers) : undefined
    }));
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read module database', details: err.message, stack: err.stack });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});