const assert = require('node:assert').strict;

// Import the plugin using CommonJS format
const markdown = require('../lib/index.cjs');

// Import metalsmith
const Metalsmith = require('metalsmith');

describe('metalsmith-unified-markdown (CommonJS)', () => {
  // Verify the module loads correctly and exports a function
  it('should be properly importable as a CommonJS module', () => {
    assert.strictEqual(typeof markdown, 'function', 'Plugin should be a function when required with CommonJS');
    assert.strictEqual(typeof markdown(), 'function', 'Plugin should return a function when called');
  });

  // Basic functionality test to verify the plugin works with CommonJS
  it('should run without errors in CommonJS', (done) => {
    // Create mock markdown files
    const files = {
      'test.md': {
        title: 'Test Post',
        contents: Buffer.from('# Hello World\n\nThis is a test.')
      }
    };

    // Create metalsmith instance
    const ms = Metalsmith('/tmp').metadata({});

    // Run the plugin with default options
    const plugin = markdown();

    plugin(files, ms, (err) => {
      if (err) {return done(err);}

      // Verify the markdown file was converted to HTML
      assert.ok(!files['test.md'], 'Markdown file should be removed');
      assert.ok(files['test.html'], 'HTML file should be created');
      assert.ok(files['test.html'].contents.toString().includes('<h1>'), 'Content should include h1 tag');

      done();
    });
  });
});
