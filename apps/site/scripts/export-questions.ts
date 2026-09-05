import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getQuestionsForExport, LOCALES } from '@birb-math/content-schema';
import { getDb } from '@birb-math/content-schema/src/client';
import {
  compileQuestionForExport,
  assertValidNumericCorrectAnswer,
  assertValidShortTextAnswer,
  assertValidMatchingPairs,
} from '../src/lib/export-question';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');

async function main() {
  const db = getDb();

  for (const locale of LOCALES) {
    const questions = await getQuestionsForExport(db, locale);

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

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, `questions.${locale}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(exported, null, 2));
    console.log(`Exported ${exported.length} question(s) to ${outputPath}`);
  }
}

main();
