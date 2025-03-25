import Metalsmith from 'metalsmith';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import markdown from '../src/index.js';

// Get the directory name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create a benchmark test directory
const testDir = join(__dirname, 'fixtures/micromark-benchmark');
const srcDir = join(testDir, 'src');
// Build directory defined but not used in this file
// const buildDir = join(testDir, 'build');

// Ensure directories exist
if (!existsSync(srcDir)) {
  mkdirSync(srcDir, { recursive: true });
}

// Generate a large number of markdown files with different content
const fileCount = 50; // Adjust as needed
console.log(`Generating ${fileCount} markdown files for benchmark...`);

// Generate markdown files
for (let i = 1; i <= fileCount; i++) {
  const content = generateMarkdownContent(i);
  writeFileSync(join(srcDir, `file-${i}.md`), content, 'utf8');
}

// Run benchmark
runBenchmark()
  .then(() => console.log('Benchmark complete'))
  .catch((err) => console.error('Benchmark error:', err));

/**
 * Generate random markdown content
 * @param {number} index - File index
 * @returns {string} - Markdown content
 */
function generateMarkdownContent(index) {
  const headingCount = 5;
  const paragraphsPerHeading = 3;
  const sentencesPerParagraph = 5;
  let content = `# Markdown File ${index}\n\n`;

  for (let h = 1; h <= headingCount; h++) {
    content += `\n## Section ${h}\n\n`;

    for (let p = 1; p <= paragraphsPerHeading; p++) {
      let paragraph = '';

      for (let s = 1; s <= sentencesPerParagraph; s++) {
        paragraph += `This is sentence ${s} with some **bold text** and *italic text* and [a link](https://example.com/${index}/${h}/${p}/${s}). `;
      }

      content += `${paragraph}\n\n`;
    }

    // Add a code block
    content += '```javascript\n';
    content += `// Code block in file ${index}, section ${h}\n`;
    content += 'function example() {\n';
    content += '  return "This is a code block";\n';
    content += '}\n';
    content += '```\n\n';

    // Add a list
    content += '- List item 1\n';
    content += '- List item 2\n';
    content += '- List item 3\n\n';

    // Add a table
    content += '| Column 1 | Column 2 | Column 3 |\n';
    content += '| -------- | -------- | -------- |\n';
    content += `| Cell ${index}-1 | Cell ${h}-2 | Cell 3 |\n`;
    content += `| Another cell | More data | Extra info |\n\n`;
  }

  return content;
}

/**
 * Run a benchmark comparing default and micromark renderers
 * @returns {Promise<void>}
 */
function runBenchmark() {
  return new Promise((resolve, reject) => {
    // First run default renderer
    runSingleBenchmark('Default (unified/remark)', { useMicromark: false })
      .then(() => {
        // Then run micromark renderer
        return runSingleBenchmark('Micromark', { useMicromark: true });
      })
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Run a single benchmark with specific options
 * @param {string} label - Benchmark label
 * @param {Object} options - Plugin options
 * @returns {Promise<void>}
 */
function runSingleBenchmark(label, options) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning benchmark: ${label}`);
    console.time(`Build time (${label})`);

    const start = process.hrtime.bigint();

    const metalsmith = Metalsmith(testDir).source('./src').destination('./build').clean(true).use(markdown(options));

    metalsmith.build((err) => {
      if (err) {
        console.error(`Error building with ${label}:`, err);
        return reject(err);
      }

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e6; // Convert to milliseconds

      console.timeEnd(`Build time (${label})`);
      console.log(`Processed ${fileCount} files in ${duration.toFixed(2)}ms`);
      console.log(`Average time per file: ${(duration / fileCount).toFixed(2)}ms`);

      resolve();
    });
  });
}
