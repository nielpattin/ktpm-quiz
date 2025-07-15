// json_to_sqlite.js

import { readdirSync, readFileSync } from 'fs';
import { join, basename, extname } from 'path';
import Database from 'better-sqlite3';

const rawDir = 'json_vi';
const dbDir = 'db';

const files = readdirSync(rawDir).filter(f => extname(f) === '.json');

for (const file of files) {
  const jsonPath = join(rawDir, file);
  const dbName = basename(file, '.json') + '.db';
  const dbPath = join(dbDir, dbName);

  const quizzes = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const db = new Database(dbPath);

  // Extract quiz_number from file name
  // e.g. quiz_module_2.json -> module_2, quiz_1.json -> 1, quiz_2-3-4-5.json -> 2-3-4-5
  let quiz_number = basename(file, '.json');
  const match = quiz_number.match(/(?:quiz_)?(.+)/i);
  quiz_number = match ? match[1] : quiz_number;

  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      question_id TEXT PRIMARY KEY,
      question_text TEXT,
      question_type TEXT,
      answers TEXT,
      status TEXT,
      quiz_number TEXT
    )
  `);

  const grouped = {};
  for (const q of quizzes) {
    const key = q.question_text.trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  }

  const insert = db.prepare(
    'INSERT OR REPLACE INTO quizzes (question_id, question_text, question_type, answers, status, quiz_number) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const group of Object.values(grouped)) {
    for (const q of group) {
      const allFalse = q.answers.every(a => !a.is_correct);
      const status = allFalse ? 'all_false' : 'correct';
      insert.run(q.question_id, q.question_text, q.question_type, JSON.stringify(q.answers), status, quiz_number);
    }
  }

  db.close();
}