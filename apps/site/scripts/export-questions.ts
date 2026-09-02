import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQuestionsForExport } from '@birb-math/content-schema';
import { getDb } from '@birb-math/content-schema/src/client';
import {
  compileQuestionForExport,
  assertValidNumericCorrectAnswer,
  assertValidShortTextAnswer,
  assertValidMatchingPairs,
} from '../src/lib/export-question';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../public/data/questions.json');

async function main() {
  const db = getDb();
  const questions = await getQuestionsForExport(db);

  for (const question of questions) {
    if (question.type === 'numeric') {
      assertValidNumericCorrectAnswer(question);
    }
    if (question.type === 'short_text') {
      assertValidShortTextAnswer(question);
    }
    if (question.type === 'matching') {
      assertValidMatchingPairs(question);
    }
  }

  const exported = await Promise.all(questions.map(compileQuestionForExport));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(exported, null, 2));
  console.log(`Exported ${exported.length} question(s) to ${OUTPUT_PATH}`);
}

main();
