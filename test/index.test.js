import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readFileSync } from 'node:fs';
import Metalsmith from 'metalsmith';
import markdownIt from 'markdown-it';
import markdown from '../src/index.js';
import defaultRender from '../src/default-render.js';

function normalizeHtml(html) {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/<br>\s+/g, '<br>')
    .replace(/<\/a>\s+\(/g, '</a>(')
    .replace(/<summary>(.*?)<\/summary>\s+/g, '<summary>$1</summary>')
    .trim();
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const { name } = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
let expandWildcardKeypath;

function msCommon(dir) {
  return Metalsmith(dir).env('DEBUG', process.env.DEBUG);
}

describe('metalsmith-unified-markdown', () => {
  before(async () => {
    const imported = await import('../src/expand-wildcard-keypath.js');
    expandWildcardKeypath = imported.default;
  });

  it('should export a named plugin function matching package.json name', () => {
    const nameParts = name.split('/');
    const namechars = nameParts.length > 1 ? nameParts[1] : name;
    const camelCased = namechars.split('').reduce((str, char, i) => {
      str += namechars[i - 1] === '-' ? char.toUpperCase() : char === '-' ? '' : char;
      return str;
    }, '');
    assert.equal(markdown().name, camelCased);
  });

  it('should not crash the metalsmith build when using default options', (_t, done) => {
    msCommon('test/fixtures/default')
      .use(markdown())
      .build((err, files) => {
        assert.equal(err, null);
        assert.ok(files['index.html'], 'Output file exists');
        assert.ok(files['index.html'].contents.toString().includes('<h1>'), 'Contains HTML heading');
        done();
      });
  });

  it('should treat "true" option as default', (_t, done) => {
    const filePath = join('subfolder', 'index.html');
    function getFiles() {
      return {
        [join('subfolder', 'index.md')]: {
          contents: Buffer.from('"hello"')
        }
      };
    }

    Promise.all([
      new Promise((resolve) => {
        const files = getFiles();
        markdown(true)(files, msCommon(__dirname), () => {
          resolve(files);
        });
      }),
      new Promise((resolve) => {
        const files = getFiles();
        markdown()(files, msCommon(__dirname), () => {
          resolve(files);
        });
      }),
      new Promise((resolve) => {
        const files = getFiles();
        markdown({
          engineOptions: {
            sanitize: true
          }
        })(files, msCommon(__dirname), () => {
          resolve(files);
        });
      })
    ])
      .then(([defaultsTrue, defaults, sanitize]) => {
        assert.equal(defaults[filePath].contents.toString(), defaultsTrue[filePath].contents.toString());

        const defaultTrueHTML = defaultsTrue[filePath].contents.toString();
        const sanitizeHTML = sanitize[filePath].contents.toString();

        assert.ok(normalizeHtml(sanitizeHTML).includes(normalizeHtml('<p>"hello"</p>')));
        assert.ok(defaultTrueHTML.includes('<p>"hello"</p>'), 'Default settings should convert markdown');

        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should convert markdown files', (_t, done) => {
    msCommon('test/fixtures/basic')
      .source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          engineOptions: {
            smartypants: true
          }
        })
      )
      .build((err, files) => {
        if (err) {
          return done(err);
        }
        assert.ok(files['index.html'], 'Output file exists');
        done();
      });
  });

  it('should skip non-markdown files', (_t, done) => {
    const files = { 'index.css': {} };
    markdown(true)(files, msCommon(__dirname), () => {
      assert.deepEqual(files, { 'index.css': {} });
      done();
    });
  });

  it('should make globalRefs available to all files', (_t, done) => {
    msCommon('test/fixtures/globalrefs')
      .use(
        markdown({
          keys: ['frontmatter_w_markdown'],
          globalRefs: {
            core_plugin_layouts: 'https://github.com/metalsmith/layouts',
            'core_plugin_in-place': 'https://github.com/metalsmith/in-place',
            core_plugin_collections: 'https://github.com/metalsmith/collections',
            core_plugin_markdown: 'https://github.com/metalsmith/markdown "with title"'
          }
        })
      )
      .build((err, files) => {
        if (err) {
          done(err);
        }
        try {
          const actual = files['index.html'].frontmatter_w_markdown.trim();
          assert.ok(
            actual.includes('<a href="https://github.com/metalsmith/markdown" title="with title">markdown</a>'),
            'Should contain link with title attribute'
          );

          const content = files['index.html'].contents.toString();
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/layouts">@metalsmith/layouts</a>'),
            'Should contain layouts link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/in-place">@metalsmith/in-place</a>'),
            'Should contain in-place link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/collections"></a>'),
            'Should contain collections link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/markdown" title="with title">markdown</a>'),
            'Should contain markdown link with title'
          );

          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('should load globalRefs from a JSON source file', (_t, done) => {
    msCommon('test/fixtures/globalrefs-meta')
      .metadata({
        global: {
          links: {
            core_plugin_layouts: 'https://github.com/metalsmith/layouts',
            'core_plugin_in-place': 'https://github.com/metalsmith/in-place',
            core_plugin_collections: 'https://github.com/metalsmith/collections',
            core_plugin_markdown: 'https://github.com/metalsmith/markdown "with title"'
          }
        }
      })
      .use(
        markdown({
          globalRefs: 'global.links'
        })
      )
      .build((err, files) => {
        if (err) {
          done(err);
        }
        try {
          const content = files['index.html'].contents.toString();
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/layouts">@metalsmith/layouts</a>'),
            'Should contain layouts link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/in-place">@metalsmith/in-place</a>'),
            'Should contain in-place link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/collections"></a>'),
            'Should contain collections link'
          );
          assert.ok(
            content.includes('<a href="https://github.com/metalsmith/markdown" title="with title">markdown</a>'),
            'Should contain markdown link with title'
          );

          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('should throw when the globalRefs metadata key is not found', (_t, done) => {
    msCommon('test/fixtures/globalrefs-meta')
      .use(
        markdown({
          globalRefs: 'not_found'
        })
      )
      .process((err) => {
        try {
          assert.ok(err instanceof Error);
          assert.ok(err.name, 'Error metalsmith-unified-markdown');
          assert.ok(err.message, 'globalRefs not found in metalsmith.metadata().not_found');
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('should allow using any markdown parser through the render option', (_t, done) => {
    let mdIt;
    msCommon('test/fixtures/keys')
      .use(
        markdown({
          keys: ['custom'],
          render(source, opts, context) {
            if (!mdIt) {
              mdIt = new markdownIt(opts);
            }
            if (context.key === 'contents') {
              return mdIt.render(source);
            }
            return mdIt.renderInline(source);
          }
        })
      )
      .process((err, files) => {
        if (err) {
          done(err);
        }
        try {
          assert.equal(files['index.html'].custom, '<em>a</em>');
          assert.equal(
            files['index.html'].contents.toString(),
            [
              '<h1>A Markdown Post</h1>\n',
              '<p>With some &quot;amazing&quot;, <em>riveting</em>, <strong>coooonnnntent</strong>.</p>\n'
            ].join('')
          );
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('should allow a "keys" option', (_t, done) => {
    msCommon('test/fixtures/keys')
      .use(
        markdown({
          keys: ['custom'],
          engineOptions: {
            smartypants: true
          }
        })
      )
      .build((err, files) => {
        if (err) {
          return done(err);
        }
        const customContent = files['index.html'].custom.trim();
        assert.ok(customContent.includes('<em>a</em>'), 'Should contain emphasized text');
        done();
      });
  });

  it('should parse nested key paths', (_t, done) => {
    msCommon('test/fixtures/nested-keys')
      .source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          keys: ['custom', 'nested.key.path'],
          engineOptions: {
            smartypants: true
          }
        })
      )
      .build((err, files) => {
        if (err) {
          return done(err);
        }

        assert.ok(files['index.html'], 'Output file exists');
        assert.ok(files['index.html'].nested, 'Nested object exists');
        assert.ok(files['index.html'].nested.key, 'Nested key object exists');
        assert.ok(files['index.html'].nested.key.path, 'Nested key path value exists');

        done();
      });
  });

  it('should log a warning when a key is not renderable (= not a string)', (_t, done) => {
    const ms = msCommon('test/fixtures/default');
    const output = [];
    const Debugger = () => {};
    Object.assign(Debugger, {
      info: () => {},
      warn: (...args) => {
        output.push(['warn', ...args]);
      },
      error: () => {}
    });

    ms.use(() => {
      ms.debug = () => Debugger;
    })
      .use(
        markdown({
          keys: ['not_a_string']
        })
      )
      .process((err) => {
        if (err) {
          done(err);
        }
        try {
          assert.deepEqual(output.slice(0, 1), [
            ['warn', 'Couldn\'t render key "%s" of target "%s": not a string', 'not_a_string', 'index.md']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('< v2.0.0 should move legacy engine options in object root to options.engineOptions', (_t, done) => {
    const ms = msCommon('test/fixtures/basic');
    const output = [];
    const Debugger = (...args) => {
      output.push(['log', ...args]);
    };
    Object.assign(Debugger, {
      info: (...args) => {
        output.push(['info', ...args]);
      },
      warn: (...args) => {
        output.push(['warn', ...args]);
      },
      error: (...args) => {
        output.push(['error', ...args]);
      }
    });

    ms.use(() => {
      ms.debug = () => Debugger;
    })
      .use(
        markdown({
          gfm: true,
          smartypants: false,
          engineOptions: {}
        })
      )
      .process((err) => {
        if (err) {
          done(err);
        }
        try {
          assert.deepEqual(output.slice(0, 2), [
            [
              'warn',
              'Starting from version 2.0 marked engine options will need to be specified as options.engineOptions'
            ],
            ['warn', 'Moved engine options %s to options.engineOptions', 'gfm, smartypants']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('should render keys in metalsmith.metadata()', (_t, done) => {
    const ms = msCommon('test/fixtures/basic');
    ms.env('DEBUG', '@metalsmith/mardown*')
      .metadata({
        markdownRefs: {
          defined_link: 'https://globalref.io'
        },
        has_markdown: '**[globalref_link][defined_link]**'
      })
      .use(
        markdown({
          keys: {
            global: ['has_markdown']
          },
          globalRefs: 'markdownRefs'
        })
      )
      .process((err) => {
        if (err) {
          done(err);
        }
        try {
          const actual = ms.metadata().has_markdown.trim();
          const expected = '<p><strong><a href="https://globalref.io">globalref_link</a></strong></p>';
          assert.equal(actual, expected);
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it('expandWildCardKeyPath should throw if root is not an object', () => {
    try {
      expandWildcardKeypath(null, [], '*');
    } catch (err) {
      assert.equal(err.name, 'EINVALID_ARGUMENT');
      assert.equal(err.message, 'root must be an object or array');
    }
  });

  it('expandWildCardKeyPath should throw if keypaths is not an array of arrays or strings', () => {
    try {
      expandWildcardKeypath({}, [false], '*');
    } catch (err) {
      assert.equal(err.name, 'EINVALID_ARGUMENT');
      assert.equal(err.message, 'keypaths must be strings or arrays of strings');
    }
  });

  it('should recognize a keys option loop placeholder', (_t, done) => {
    msCommon('test/fixtures/array-index-keys')
      .source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          keys: ['arr.*', 'objarr.*.prop', 'wildcard.faq.*.*', 'wildcard.titles.*'],
          wildcard: '*',
          engineOptions: {
            smartypants: true
          }
        })
      )
      .build((err, files) => {
        if (err) {
          return done(err);
        }

        assert.ok(files['index.html'], 'Output file exists');
        assert.ok(files['index.html'].arr, 'Array exists');
        assert.equal(files['index.html'].arr.length, 3, 'Array should have 3 items');
        assert.ok(files['index.html'].objarr, 'Object array exists');
        assert.equal(files['index.html'].objarr.length, 3, 'Object array should have 3 items');
        assert.ok(files['index.html'].wildcard, 'Wildcard object exists');
        assert.ok(files['index.html'].wildcard.faq, 'FAQ array exists');
        assert.ok(files['index.html'].wildcard.titles, 'Titles object exists');

        done();
      });
  });

  it('should accept additional remark plugins through engineOptions.extended', (_t, done) => {
    msCommon('test/fixtures/basic')
      .source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          engineOptions: {
            gfm: true,
            tables: true,
            sanitize: false,
            extended: {
              remarkPlugins: [],
              rehypePlugins: []
            }
          }
        })
      )
      .build((err, files) => {
        if (err) {
          return done(err);
        }
        assert.ok(files['index.html'], 'Output file exists');
        done();
      });
  });

  it('should process markdown with the default render function', (_t, done) => {
    const markdownText = '# Test Heading\n\nThis is **bold** text with a [link](https://example.com).';

    defaultRender(markdownText, {}, {})
      .then((html) => {
        assert.ok(html.includes('<h1>Test Heading</h1>'));
        assert.ok(html.includes('<strong>bold</strong>'));
        assert.ok(html.includes('<a href="https://example.com">link</a>'));
        done();
      })
      .catch((err) => done(err));
  });

  it('should support remark plugins with options through extended option', (_t, done) => {
    const markdownText = '# Test Heading\n\nThis is **bold** text with a [link](https://example.com).';

    const mockPlugin1 = () => () => {};
    const mockPlugin2 = () => () => {};

    defaultRender(
      markdownText,
      {
        extended: {
          remarkPlugins: [[mockPlugin1, { option1: true }], mockPlugin2]
        }
      },
      {}
    )
      .then((html) => {
        assert.ok(html.includes('<h1>Test Heading</h1>'));
        done();
      })
      .catch((err) => done(err));
  });

  it('should support rehype plugins with options through extended option', (_t, done) => {
    const markdownText = '# Test Heading\n\nThis is **bold** text with a [link](https://example.com).';

    const mockPlugin1 = () => () => {};
    const mockPlugin2 = () => () => {};

    defaultRender(
      markdownText,
      {
        extended: {
          rehypePlugins: [[mockPlugin1, { option1: true }], mockPlugin2]
        }
      },
      {}
    )
      .then((html) => {
        assert.ok(html.includes('<h1>Test Heading</h1>'));
        done();
      })
      .catch((err) => done(err));
  });

  it('should correctly process CommonMark syntax', (_t, done) => {
    const ms = msCommon('test/fixtures/commonMark-syntax');

    ms.source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          engineOptions: {
            commonmark: true
          }
        })
      );

    ms.build((err, _files) => {
      if (err) {
        done(err);
        return;
      }

      try {
        const buildFile = readFileSync('test/fixtures/commonMark-syntax/build/index.html', 'utf8');

        assert.ok(buildFile.includes('CommonMark Test File'), 'Should have headline');
        assert.ok(buildFile.includes('<em>Italic text</em>'), 'Should include italic text');
        assert.ok(buildFile.includes('<strong>Bold text</strong>'), 'Should include bold text');
        assert.ok(buildFile.includes('<blockquote>'), 'Should include blockquotes');
        assert.ok(buildFile.includes('<ul>'), 'Should include unordered lists');
        assert.ok(buildFile.includes('<ol>'), 'Should include ordered lists');
        assert.ok(buildFile.includes('<code>code</code>'), 'Should include inline code');
        assert.ok(buildFile.includes('<pre>'), 'Should include code blocks');
        assert.ok(buildFile.includes('<a href="https://example.com">'), 'Should include links');
        assert.ok(buildFile.includes('<img src="https://example.com/image.jpg"'), 'Should include images');
        assert.ok(buildFile.includes('<hr>'), 'Should include horizontal rules');

        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should correctly process GitHub Flavored Markdown syntax', (_t, done) => {
    const ms = msCommon('test/fixtures/gfm-syntax');

    ms.source('src')
      .destination('build')
      .clean(true)
      .use(
        markdown({
          engineOptions: {
            gfm: true,
            tables: true
          }
        })
      );

    ms.build((err, _files) => {
      if (err) {
        done(err);
        return;
      }

      try {
        const buildFile = readFileSync('test/fixtures/gfm-syntax/build/index.html', 'utf8');

        assert.ok(buildFile.includes('GitHub Flavored Markdown Test File'), 'Should have headline');
        assert.ok(buildFile.includes('<table>'), 'Should include tables');
        assert.ok(buildFile.includes('<del>strikethrough text</del>'), 'Should include strikethrough');
        assert.ok(
          buildFile.includes('<a href="https://example.com">https://example.com</a>'),
          'Should include autolinks'
        );
        assert.ok(buildFile.includes('type="checkbox"'), 'Should include task lists');
        assert.ok(buildFile.includes('class="language-javascript"'), 'Should include syntax highlighting');
        assert.ok(buildFile.includes('data-footnotes'), 'Should include footnotes');

        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should handle errors in render function gracefully', (_t, done) => {
    const files = { 'test.md': { contents: Buffer.from('# Test') } };

    markdown({
      render: () => Promise.reject(new Error('Test error'))
    })(files, msCommon(__dirname), (err) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, 'Test error');
      done();
    });
  });

  it('should process nested keys with multiple wildcards', (_t, done) => {
    const files = {
      'test.md': {
        contents: Buffer.from('# Test'),
        data: {
          sections: [
            { items: [{ text: 'Item 1 *emphasis*' }, { text: 'Item 2 **bold**' }] },
            { items: [{ text: 'Item 3 `code`' }] }
          ]
        }
      }
    };

    markdown({
      keys: ['data.sections.*.items.*.text'],
      wildcard: '*'
    })(files, msCommon(__dirname), (err) => {
      if (err) {
        return done(err);
      }

      assert.ok(
        normalizeHtml(files['test.html'].data.sections[0].items[0].text).includes(normalizeHtml('<em>emphasis</em>')),
        'Should process emphasis in nested keys'
      );
      assert.ok(
        normalizeHtml(files['test.html'].data.sections[0].items[1].text).includes(
          normalizeHtml('<strong>bold</strong>')
        ),
        'Should process bold in nested keys'
      );
      assert.ok(
        normalizeHtml(files['test.html'].data.sections[1].items[0].text).includes(normalizeHtml('<code>code</code>')),
        'Should process code in nested keys'
      );
      done();
    });
  });

  it('should process all files concurrently', (_t, done) => {
    const files = {};
    for (let i = 0; i < 5; i++) {
      files[`test${i}.md`] = { contents: Buffer.from(`# Test ${i}`) };
    }

    let processedCount = 0;
    const customRender = (str) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          processedCount++;
          resolve(`<h1>Processed ${str}</h1>`);
        }, Math.random() * 50);
      });
    };

    markdown({
      render: customRender
    })(files, msCommon(__dirname), (err) => {
      if (err) {
        return done(err);
      }

      assert.equal(processedCount, 5);
      assert.equal(Object.keys(files).length, 5);

      for (let i = 0; i < 5; i++) {
        assert.ok(files[`test${i}.html`]);
        assert.ok(files[`test${i}.html`].contents.toString().includes('<h1>'));
      }

      done();
    });
  });

  it('should handle empty or invalid markdown gracefully', (_t, done) => {
    const files = {
      'empty.md': { contents: Buffer.from('') },
      'invalid.md': { contents: Buffer.from('```\nunclosed code block') }
    };

    markdown()(files, msCommon(__dirname), (err) => {
      if (err) {
        return done(err);
      }

      assert.ok(files['empty.html']);
      assert.ok(files['invalid.html']);
      done();
    });
  });
});
