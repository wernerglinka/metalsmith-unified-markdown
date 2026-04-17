import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Metalsmith from 'metalsmith';
import markdown from '../src/index.js';

function normalizeHtml(html) {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('metalsmith-unified-markdown with micromark', () => {
  const testDir = join(__dirname, 'fixtures/micromark-test');
  const srcDir = join(testDir, 'src');
  const buildDir = join(testDir, 'build');

  before(() => {
    if (!existsSync(srcDir)) {
      mkdirSync(srcDir, { recursive: true });
    }

    const testContent = `
# Micromark Test

This is a paragraph with **bold** and *italic* text.

## Lists

- Item 1
- Item 2
- Item 3

## Code Block

\`\`\`javascript
function example() {
  return "This is a code block";
}
\`\`\`

## Table

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

[Link to example](https://example.com)

## Raw HTML

<div class="custom-class">
  <p>This is raw HTML in markdown.</p>
</div>

`;

    writeFileSync(join(srcDir, 'test.md'), testContent, 'utf8');

    const extendedContent = `
# Extended Plugins Test

This content should be processed with custom plugins.

* List item 1
* List item 2

[Reference link][example]

[example]: https://example.com
`;

    writeFileSync(join(srcDir, 'extended.md'), extendedContent, 'utf8');
  });

  it('should convert markdown to html using micromark', (_t, done) => {
    const sourceContent = readFileSync(join(srcDir, 'test.md'), 'utf8');
    assert.ok(sourceContent.includes('<div class="custom-class">'), 'Source file should contain raw HTML');

    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(
        markdown({
          useMicromark: true
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        try {
          const output = readFileSync(join(buildDir, 'test.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);

          assert.ok(normalizedOutput.includes(normalizeHtml('<h1>Micromark Test</h1>')), 'Should have h1');
          assert.ok(normalizedOutput.includes(normalizeHtml('<strong>bold</strong>')), 'Should have bold text');
          assert.ok(normalizedOutput.includes(normalizeHtml('<em>italic</em>')), 'Should have italic text');
          assert.ok(normalizedOutput.includes(normalizeHtml('<ul>')), 'Should have unordered list');
          assert.ok(normalizedOutput.includes(normalizeHtml('<li>Item 1</li>')), 'Should have list items');
          assert.ok(
            normalizedOutput.includes(normalizeHtml('<pre>')) || normalizedOutput.includes(normalizeHtml('<pre ')),
            'Should have code block'
          );
          assert.ok(normalizedOutput.includes(normalizeHtml('<table>')), 'Should have table');
          assert.ok(normalizedOutput.includes(normalizeHtml('<a href="https://example.com">')), 'Should have link');

          assert.ok(output.includes('This is raw HTML in markdown'), 'Should preserve text content');

          assert.ok(
            output.includes('custom-class') || output.includes('This is raw HTML'),
            'Should preserve HTML content in some form'
          );

          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('should handle gfm extensions properly', (_t, done) => {
    const gfmContent = `
# GFM Test

## Strikethrough

~~This is strikethrough text~~

## Autolink

https://example.com

## Task List

- [x] Completed task
- [ ] Incomplete task
`;

    writeFileSync(join(srcDir, 'gfm.md'), gfmContent, 'utf8');

    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(
        markdown({
          useMicromark: true,
          engineOptions: {
            gfm: true
          }
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        try {
          const output = readFileSync(join(buildDir, 'gfm.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);

          assert.ok(
            normalizedOutput.includes(normalizeHtml('<del>This is strikethrough text</del>')),
            'Should have strikethrough'
          );
          assert.ok(
            normalizedOutput.includes(normalizeHtml('<a href="https://example.com">https://example.com</a>')),
            'Should have autolink'
          );
          assert.ok(normalizedOutput.includes('type="checkbox"'), 'Should have task list checkboxes');

          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('should work without GFM extensions when disabled', (_t, done) => {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(
        markdown({
          useMicromark: true,
          engineOptions: {
            gfm: false
          }
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        try {
          const output = readFileSync(join(buildDir, 'gfm.html'), 'utf8');

          assert.ok(!output.includes('<del>This is strikethrough text</del>'), 'Should not have strikethrough');

          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('should sanitize HTML when sanitize option is enabled', (_t, done) => {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(
        markdown({
          useMicromark: true,
          engineOptions: {
            sanitize: true
          }
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        try {
          const output = readFileSync(join(buildDir, 'test.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);

          assert.ok(
            !normalizedOutput.includes(normalizeHtml('<div class="custom-class">')),
            'Should not include raw HTML when sanitize is true'
          );

          assert.ok(
            normalizedOutput.includes(normalizeHtml('<h1>Micromark Test</h1>')),
            'Should still process regular markdown'
          );

          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('should process markdown with extended plugins pathway', (_t, done) => {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(
        markdown({
          useMicromark: true,
          engineOptions: {
            extended: {
              remarkPlugins: [() => (tree) => tree]
            }
          }
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        try {
          const output = readFileSync(join(buildDir, 'extended.html'), 'utf8');

          assert.ok(
            output.includes('<h1>Extended Plugins Test</h1>'),
            'Should process markdown with extended plugins pipeline'
          );
          assert.ok(output.includes('<li>List item 1</li>'), 'Should process lists through extended pipeline');
          assert.ok(
            output.includes('<a href="https://example.com">Reference link</a>'),
            'Should process reference links through extended pipeline'
          );

          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
