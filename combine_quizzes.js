import Database from 'better-sqlite3';
import { readdirSync, existsSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

const dbDir = 'db';
const allDbPath = join(dbDir, 'quiz-all.db');

// Delete existing quiz-all.db if it exists
if (existsSync(allDbPath)) {
  unlinkSync(allDbPath);
}

const allDb = new Database(allDbPath);

allDb.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    question_id TEXT PRIMARY KEY,
    question_text TEXT,
    question_type TEXT,
    answers TEXT,
    status TEXT,
    quiz_number TEXT
  )
`);

const insert = allDb.prepare(
  'INSERT OR REPLACE INTO quizzes (question_id, question_text, question_type, answers, status, quiz_number) VALUES (?, ?, ?, ?, ?, ?)'
);

const dbFiles = readdirSync(dbDir).filter(f => f.startsWith('quiz_module_') && f.endsWith('.db'));

allDb.transaction(() => {
  for (const file of dbFiles) {
    const moduleDbPath = join(dbDir, file);
    const moduleDb = new Database(moduleDbPath, { readonly: true });
    const rows = moduleDb.prepare('SELECT * FROM quizzes').all();
    
    for (const row of rows) {
      insert.run(row.question_id, row.question_text, row.question_type, row.answers, row.status, row.quiz_number);
    }
    moduleDb.close();
  }
})();

allDb.close();
console.log('All quiz modules combined into quiz-all.db');
