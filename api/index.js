import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
// import multer from 'multer';
import Database from 'better-sqlite3';

const PORT = 8080;
const app = express();
const dbDir = join(process.cwd(), 'db');
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

// Multer setup for image uploads
// const imagesDir = join(process.cwd(), 'images');
// if (!existsSync(imagesDir)) mkdirSync(imagesDir);
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => cb(null, imagesDir),
//     filename: (req, file, cb) => {
//       // Use a temporary filename; we'll rename after parsing fields
//       cb(null, 'temp_' + Date.now() + extname(file.originalname).toLowerCase());
//     }
//   }),
//   fileFilter: (req, file, cb) => {
//     const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
//     cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
//   }
// });

// API: search quiz
// app.get('/api/search', (req, res) => {
//   const q = req.query.q || '';
//   const quiz = getClosestQuiz(q);
//   res.json(quiz || {});
// });


// API: get quiz by question_id
// app.get('/api/question', (req, res) => {
//   const id = req.query.id;
//   if (!id) return res.status(400).json({});
//   const row = db.prepare("SELECT * FROM quizzes WHERE question_id = ?").get(id);
//   if (!row) return res.json({});
//   res.json({
//     question_id: row.question_id,
//     question_text: row.question_text,
//     question_type: row.question_type,
//     answers: JSON.parse(row.answers)
//   });
// });

// API: get quiz by id (alias for /api/question)
// app.get('/api/search_by_id', (req, res) => {
//   const id = req.query.id;
//   if (!id) return res.status(400).json({});
//   const row = db.prepare("SELECT * FROM quizzes WHERE question_id = ?").get(id);
//   if (!row) return res.json({});
//   res.json({
//     question_id: row.question_id,
//     question_text: row.question_text,
//     question_type: row.question_type,
//     answers: JSON.parse(row.answers)
//   });
// });

// API: get image extension for question
// app.get('/api/question_image_ext', (req, res) => {
//   const { question_id } = req.query;
//   if (!question_id) return res.status(400).json({ ext: '' });
//   const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
//   for (const ext of exts) {
//     if (existsSync(join(imagesDir, question_id + ext))) {
//       return res.json({ ext });
//     }
//   }
//   res.json({ ext: '' });
// });

// API: upload image
// app.post('/api/upload_image', (req, res, next) => {
//   upload.any()(req, res, function (err) {
//     let question_id = req.body.question_id;
//     const file = req.files && req.files.find(f => f.fieldname === 'image');
//     if (err || !file || !question_id) {
//       return res.status(400).json({ success: false, error: err?.message || 'Missing file or question_id' });
//     }
//     // Remove old images for this question
//     const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
//     for (const ext of exts) {
//       const oldPath = join(imagesDir, question_id + ext);
//       if (existsSync(oldPath)) unlinkSync(oldPath);
//     }
//     // Rename uploaded file to question_id + ext
//     const newFilename = question_id + extname(file.originalname).toLowerCase();
//     const oldPath = file.path;
//     const newPath = join(imagesDir, newFilename);
//     renameSync(oldPath, newPath);
//     res.json({ success: true, filename: newFilename });
//   });
// });

// Serve images statically
// app.use('/images', express.static(imagesDir, {
//   maxAge: '30d', // Cache images for 30 days
//   immutable: true // Mark as immutable for aggressive caching
// }));

// Serve static files (*.html, etc.)
app.use(express.static(process.cwd(), { extensions: ['html'] }));

// Serve quiz_interface.html at /quizzes
app.get('/', (req, res) => {
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
});

// Serve quiz_search.html at root
// app.get('/quiz_search', (req, res) => {
//  res.sendFile(join(process.cwd(), 'quiz_search.html'));
// });

// API: get all quizzes for a module
app.get('/api/module', (req, res) => {
  const id = req.query.id;
  if (!id || !/^[1-8]$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing module id' });
  }
  const dbPath = join(dbDir, `quiz_module_${id}.db`);
  if (!existsSync(dbPath)) {
    return res.status(404).json({ error: 'Module database not found' });
  }
  try {
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare('SELECT * FROM quizzes').all();
    db.close();
    // Parse answers field if present
    const quizzes = rows.map(row => ({
      ...row,
      answers: row.answers ? JSON.parse(row.answers) : undefined
    }));
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read module database' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});