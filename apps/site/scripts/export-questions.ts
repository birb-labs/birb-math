import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, getQuestionsForExport } from '@birb-math/content-schema';
import { compileQuestionForExport, assertValidNumericCorrectAnswer } from '../src/lib/export-question';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../public/data/questions.json');

async function main() {
  const db = getDb();
  const questions = getQuestionsForExport(db);

  for (const question of questions) {
    if (question.type === 'numeric') {
      assertValidNumericCorrectAnswer(question);
    }
  }

  const exported = await Promise.all(questions.map(compileQuestionForExport));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(exported, null, 2));
  console.log(`Exported ${exported.length} question(s) to ${OUTPUT_PATH}`);
}

main();
