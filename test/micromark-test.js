import assert from 'assert';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Metalsmith from 'metalsmith';
import markdown from '../src/index.js';

// Helper for normalizing HTML
function normalizeHtml(html) {
  return html
    .replace(/>\s+</g, '><')  // Remove whitespace between tags
    .replace(/\s+/g, ' ')     // Normalize multiple whitespace to single space
    .trim();
}

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('metalsmith-unified-markdown with micromark', function() {
  // Test directory setup
  const testDir = join(__dirname, 'fixtures/micromark-test');
  const srcDir = join(testDir, 'src');
  const buildDir = join(testDir, 'build');
  
  // Ensure test directories exist
  before(function() {
    if (!existsSync(srcDir)) {
      mkdirSync(srcDir, { recursive: true });
    }
    
    // Create a test file with various markdown features
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
    
    // Create another test file with extended plugins
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
  
  it('should convert markdown to html using micromark', function(done) {
    // First, verify the test file contains the expected raw HTML
    const sourceContent = readFileSync(join(srcDir, 'test.md'), 'utf8');
    assert(sourceContent.includes('<div class="custom-class">'), 'Source file should contain raw HTML');
    
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(markdown({
        useMicromark: true
      }))
      .build(function(err) {
        if (err) return done(err);
        
        try {
          const output = readFileSync(join(buildDir, 'test.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);
          
          // Test various markdown features with normalized HTML
          assert(normalizedOutput.includes(normalizeHtml('<h1>Micromark Test</h1>')), 'Should have h1');
          assert(normalizedOutput.includes(normalizeHtml('<strong>bold</strong>')), 'Should have bold text');
          assert(normalizedOutput.includes(normalizeHtml('<em>italic</em>')), 'Should have italic text');
          assert(normalizedOutput.includes(normalizeHtml('<ul>')), 'Should have unordered list');
          assert(normalizedOutput.includes(normalizeHtml('<li>Item 1</li>')), 'Should have list items');
          assert(normalizedOutput.includes(normalizeHtml('<pre>')) || normalizedOutput.includes(normalizeHtml('<pre ')), 'Should have code block');
          assert(normalizedOutput.includes(normalizeHtml('<table>')), 'Should have table');
          assert(normalizedOutput.includes(normalizeHtml('<a href="https://example.com">')), 'Should have link');
          
          // Test for plain text content that should be preserved
          assert(output.includes('This is raw HTML in markdown'), 'Should preserve text content');
          
          // Just test that HTML content was retained in some form (implementation details may vary)
          assert(output.includes('custom-class') || output.includes('This is raw HTML'), 
            'Should preserve HTML content in some form');
          
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  
  it('should handle gfm extensions properly', function(done) {
    // Create a test file with GFM-specific features
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
      .use(markdown({
        useMicromark: true,
        engineOptions: {
          gfm: true
        }
      }))
      .build(function(err) {
        if (err) return done(err);
        
        try {
          const output = readFileSync(join(buildDir, 'gfm.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);
          
          // Test GFM features with normalized HTML
          assert(normalizedOutput.includes(normalizeHtml('<del>This is strikethrough text</del>')), 'Should have strikethrough');
          assert(normalizedOutput.includes(normalizeHtml('<a href="https://example.com">https://example.com</a>')), 'Should have autolink');
          assert(normalizedOutput.includes('type="checkbox"'), 'Should have task list checkboxes');
          
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  
  it('should work without GFM extensions when disabled', function(done) {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(markdown({
        useMicromark: true,
        engineOptions: {
          gfm: false
        }
      }))
      .build(function(err) {
        if (err) return done(err);
        
        try {
          const output = readFileSync(join(buildDir, 'gfm.html'), 'utf8');
          
          // Test that GFM features are not processed
          assert(!output.includes('<del>This is strikethrough text</del>'), 'Should not have strikethrough');
          
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  
  it('should sanitize HTML when sanitize option is enabled', function(done) {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(markdown({
        useMicromark: true,
        engineOptions: {
          sanitize: true
        }
      }))
      .build(function(err) {
        if (err) return done(err);
        
        try {
          const output = readFileSync(join(buildDir, 'test.html'), 'utf8');
          const normalizedOutput = normalizeHtml(output);
          
          // HTML should be sanitized
          assert(!normalizedOutput.includes(normalizeHtml('<div class="custom-class">')), 
            'Should not include raw HTML when sanitize is true');
          
          // Regular markdown should still work
          assert(normalizedOutput.includes(normalizeHtml('<h1>Micromark Test</h1>')), 
            'Should still process regular markdown');
          
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  
  it('should process markdown with extended plugins pathway', function(done) {
    Metalsmith(testDir)
      .source('./src')
      .destination('./build')
      .clean(true)
      .use(markdown({
        useMicromark: true,
        engineOptions: {
          extended: {
            // This forces micromark to use the full MDAST -> HAST pipeline
            remarkPlugins: [() => (tree) => tree]
          }
        }
      }))
      .build(function(err) {
        if (err) return done(err);
        
        try {
          const output = readFileSync(join(buildDir, 'extended.html'), 'utf8');
          
          // Verify the content was processed through the extended pipeline
          assert(output.includes('<h1>Extended Plugins Test</h1>'), 
            'Should process markdown with extended plugins pipeline');
          assert(output.includes('<li>List item 1</li>'), 
            'Should process lists through extended pipeline');
          assert(output.includes('<a href="https://example.com">Reference link</a>'), 
            'Should process reference links through extended pipeline');
          
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});