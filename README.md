# metalsmith-unified-markdown

> **⚠️: This plugin is a fully functional proof-of-concept. It allows you to use the unified/remark ecosystem for markdown processing. However, it is not yet fully tested and may contain bugs. Use with caution.**

A Metalsmith plugin to render markdown files to HTML using the [unified/remark](https://unifiedjs.com/) ecosystem.

[![metalsmith: core plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![Coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/github/wernerglinka/metalsmith-unified-markdown/badge.svg)](https://snyk.io/test/github/wernerglinka/metalsmith-unified-markdown/badge)

## Features

- Compiles `.md` and `.markdown` files in `metalsmith.source()` to HTML using the modern unified/remark ecosystem
- Enables rendering file or metalsmith metadata keys to HTML through the `keys` option
- Adds support for reference-style links shared across all markdown files via `globalRefs`
- Supports wildcard expansion for keys
- Extensive plugin support for customizing markdown processing
- Optimized performance with optional micromark parser (1.7x faster than standard implementation)

## Why `metalsmith-unified-markdown`?

`metalsmith-unified-markdown` is inspired by `@metalsmith/markdown` but takes a modern approach by using the [unified/remark](https://unifiedjs.com/) ecosystem for Markdown processing. While maintaining full API compatibility with `@metalsmith/markdown`, this plugin offers several significant advantages:

- **Modern Architecture**: Built on the unified/remark ecosystem which represents current best practices in the JavaScript community
- **Extensive Plugin Ecosystem**: Access to hundreds of specialized plugins for tasks like table of contents generation, syntax highlighting, math equations, diagrams, and more
- **Standards Compliance**: Produces HTML5-compliant output with properly quoted attributes and modern syntax
- **Improved Performance**: Processes files in parallel for better speed with larger projects
- **Better Maintainability**: Benefits from the active development and security updates of the unified ecosystem
- **Tree-based Processing**: The AST (Abstract Syntax Tree) approach enables more sophisticated transformations
- **Developer Experience**: Better TypeScript support and modern JavaScript features

For most Metalsmith users, the transition to this plugin will be seamless, with the added benefit of gaining access to a rich ecosystem of processing plugins. Any differences in HTML output are primarily in formatting (whitespace, attribute quoting) and don't affect visual rendering or SEO.

## Installation

NPM:

```bash
npm install metalsmith-unified-markdown
```

Yarn:

```bash
yarn add metalsmith-unified-markdown
```

The plugin is available in both ESM and CommonJS formats, so it works seamlessly with both modern ES modules and traditional Node.js projects:

```js
// ESM
import markdown from 'metalsmith-unified-markdown';

// CommonJS
const markdown = require('metalsmith-unified-markdown');
```

## Usage

`metalsmith-unified-markdown` is powered by the [unified/remark](https://unifiedjs.com/) ecosystem, providing a modern, plugin-based approach to markdown processing.

```js
import markdown from 'metalsmith-unified-markdown';

// use defaults
metalsmith.use(markdown());

// use explicit defaults
metalsmith.use(
  markdown({
    wildcard: false,
    keys: [],
    engineOptions: {}
  })
);

// with custom options
metalsmith.use(
  markdown({
    engineOptions: {
      gfm: true,
      pedantic: false,
      tables: true,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      // Extended remark/rehype plugins
      extended: {
        remarkPlugins: [
          // Add remarkPlugins here
        ],
        rehypePlugins: [
          // Add rehypePlugins here
        ]
      }
    }
  })
);

// recommended for best performance
metalsmith.use(
  markdown({
    useMicromark: true, // Enable faster markdown processing
    engineOptions: {
      // Your engine options here
    }
  })
);
```

`metalsmith-unified-markdown` provides the following options:

| Option          | Type                                                | Default         | Description                                                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keys`          | `string[]` or `{files: string[], global: string[]}` | `{}`            | Key names of file metadata to render to HTML in addition to its `contents` - can be nested key paths                                                                                                                                                                       |
| `wildcard`      | `boolean`                                           | `false`         | Expand `*` wildcards in `keys` option keypaths                                                                                                                                                                                                                             |
| `globalRefs`    | `Object<string, string>` or `string`                | `{}`            | An object of `{ refname: 'link' }` pairs that will be made available for all markdown files and keys, or a `metalsmith.metadata()` keypath containing such object                                                                                                          |
| `render`        | `Function`                                          | `defaultRender` | Specify a custom render function with the signature `(source, engineOptions, context) => string`. `context` is an object with the signature `{ path:string, key:string }` where the `path` key contains the current file path, and `key` contains the target metadata key. |
| `engineOptions` | `Object`                                            | `{}`            | Options to pass to the unified/remark engine, detailed below                                                                                                                                                                                                               |
| `useMicromark`  | `boolean`                                           | `false`         | Enable the micromark parser for faster markdown processing (approximately 1.7x faster)                                                                                                                                                                                     |

#### Engine Options

The following options can be passed in the `engineOptions` object:

| Option                   | Type      | Default     | Description                         |
| ------------------------ | --------- | ----------- | ----------------------------------- |
| `gfm`                    | `boolean` | `true`      | Enable GitHub Flavored Markdown     |
| `pedantic`               | `boolean` | `false`     | Conform to the original markdown.pl |
| `tables`                 | `boolean` | `true`      | Enable GFM tables                   |
| `sanitize`               | `boolean` | `false`     | Sanitize the output HTML            |
| `smartLists`             | `boolean` | `true`      | Use smarter list behavior           |
| `smartypants`            | `boolean` | `false`     | Use "smart" typographic punctuation |
| `extended`               | `Object`  | `{}`        | Extended plugins configuration      |
| `extended.remarkPlugins` | `Array`   | `undefined` | Array of remark plugins to use      |
| `extended.rehypePlugins` | `Array`   | `undefined` | Array of rehype plugins to use      |

### Rendering metadata

You can render markdown to HTML in file or metalsmith metadata keys by specifying the `keys` option.
The `keys` option also supports dot-delimited key-paths. You can also use [globalRefs within them](#defining-a-dictionary-of-markdown-globalrefs)

```js
metalsmith
  .metadata({
    from_metalsmith_metadata: 'I _shall_ become **markdown** and can even use a [globalref][globalref_link]',
    markdownRefs: {
      globalref_link: 'https://johndoe.com'
    }
  })
  .use(
    markdown({
      keys: {
        files: ['html_desc', 'nested.data'],
        global: ['from_metalsmith_metadata']
      },
      globalRefs: 'markdownRefs'
    })
  );
```

You can even render all keys at a certain path by setting the `wildcard` option and using a globstar `*` in the keypaths.
This is especially useful for arrays like the `faq` below:

```js
metalsmith.use(
  markdown({
    wildcard: true,
    keys: ['html_desc', 'nested.data', 'faq.*.*']
  })
);
```

A file `page.md` with front-matter:

```md
---
html_desc: A **markdown-enabled** _description_
nested:
  data: '#metalsmith'
faq:
  - q: '**Question1?**'
    a: _answer1_
  - q: '**Question2?**'
    a: _answer2_
---
```

would be transformed into:

```json
{
  "html_desc": "A <strong>markdown-enabled</strong> <em>description</em>",
  "nested": {
    "data": "<h1 id=\"metalsmith\">metalsmith</h1>"
  },
  "faq": [
    { "q": "<p><strong>Question1?</strong></p>", "a": "<p><em>answer1</em></p>" },
    { "q": "<p><strong>Question2?</strong></p>", "a": "<p><em>answer2</em></p>" }
  ]
}
```

**Notes about the wildcard**

- It acts like the single bash globstar. If you specify `*` this would only match the properties at the first level of the metadata.
- If a wildcard keypath matches a key whose value is not a string, it will be ignored.
- It is set to `false` by default because it can incur some overhead if it is applied too broadly.

### Defining a dictionary of markdown globalRefs

Markdown allows users to define links in [reference style](https://www.markdownguide.org/basic-syntax/#reference-style-links) (`[]:`).
In a Metalsmith build it may be especially desirable to be able to refer to some links globally. The `globalRefs` options allows this:

```js
metalsmith.use(
  markdown({
    globalRefs: {
      twitter_link: 'https://twitter.com/johndoe',
      github_link: 'https://github.com/johndoe',
      photo: '/assets/img/me.png'
    }
  })
);
```

Now _contents of any file or metadata key_ processed by metalsmith-unified-markdown will be able to refer to these links as `[My Twitter][twitter_link]` or `![Me][photo]`. You can also store the globalRefs object of the previous example in a `metalsmith.metadata()` key and pass its keypath as `globalRefs` option instead.

This enables a flow where you can load the refs into global metadata from a source file with [@metalsmith/metadata](https://github.com/metalsmith/metadata), and use them both in markdown and templating plugins like [@metalsmith/layouts](https://github.com/metalsmith/layouts):

```js
metalsith
  .metadata({
    global: {
      links: {
        twitter: 'https://twitter.com/johndoe',
        github: 'https://github.com/johndoe'
      }
    }
  })
  // eg in a markdown file: [My Twitter profile][twitter]
  .use(markdown({ globalRefs: 'global.links' }))
  // eg in a handlebars layout: {{ global.links.twitter }}
  .use(layouts({ pattern: '**/*.html' }));
```

### Using unified/remark with plugins

You can add custom remark and rehype plugins to enhance markdown processing. First, install the plugins you need:

```bash
npm install remark-toc rehype-highlight
```

Then use them in your metalsmith configuration:

```js
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';

metalsmith.use(
  markdown({
    engineOptions: {
      gfm: true,
      tables: true,
      sanitize: false,
      // Extended options for adding plugins
      extended: {
        // Custom plugin configurations
        remarkPlugins: [[remarkToc, { heading: 'Table of Contents' }]],
        rehypePlugins: [[rehypeHighlight, { subset: ['javascript', 'css', 'html'] }]]
      }
    }
  })
);
```

### Custom render function

You can create a fully custom render function:

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';

metalsmith.use(
  markdown({
    render(source, options) {
      const { gfm = true, pedantic = false, tables = true, sanitize = false, extended = {} } = options;

      // Create processor
      const processor = unified()
        .use(remarkParse, {
          gfm,
          commonmark: !pedantic
        })
        .use(remarkGfm, {
          tables,
          strikethrough: true,
          autolink: gfm
        });

      // Add optional table of contents
      if (extended.toc) {
        processor.use(remarkToc, extended.toc);
      }

      // Transform to HTML
      processor.use(remarkRehype, {
        allowDangerousHtml: !sanitize
      });

      // Include raw HTML if not sanitizing
      if (!sanitize) {
        processor.use(rehypeRaw);
      }

      // Add syntax highlighting
      if (extended.highlight) {
        processor.use(rehypeHighlight, extended.highlight);
      }

      // Output HTML
      processor.use(rehypeStringify);

      // Process and return (matching the async implementation in default-render.js)
      return processor.process(source).then((result) => {
        return String(result).trim();
      });
    },
    engineOptions: {
      gfm: true,
      tables: true,
      extended: {
        toc: { heading: 'Table of Contents' },
        highlight: { subset: ['javascript', 'css', 'html'] }
      }
    }
  })
);
```

### Using another markdown library

If you don't want to use unified/remark, you can use another markdown rendering library through the `render` option. For example, this is how you could use [markdown-it](https://github.com/markdown-it/markdown-it) instead:

```js
import MarkdownIt from 'markdown-it'

let markdownIt
metalsmith.use(markdown({
  render(source, opts, context) {
    if (!markdownIt) markdownIt = new MarkdownIt(opts)
    if (context.key == 'contents') return mdIt.render(source)
    return markdownIt.renderInline(source)
  },
  // specify markdownIt options here
  engineOptions: { ... }
}))
```

### Performance Optimization with Micromark

For the best performance, you can enable the micromark parser, which is the underlying parser behind the unified/remark ecosystem:

```js
metalsmith.use(
  markdown({
    useMicromark: true // Enable micromark for faster parsing
  })
);
```

Micromark provides significantly faster markdown processing (approximately 1.7x improvement) while maintaining compatibility with the unified ecosystem. Our benchmark shows:

| Parser                   | Processing Time | Improvement |
| ------------------------ | --------------- | ----------- |
| Default (unified/remark) | 423.19ms        | —           |
| Micromark                | 254.66ms        | 1.7x faster |

For optimal performance on most projects, we recommend enabling the micromark option.

## Debug

To enable debug logs, set the `DEBUG` environment variable to `metalsmith-unified-markdown`:

Linux/Mac:

```
DEBUG=metalsmith-unified-markdown
```

Windows:

```
set DEBUG=metalsmith-unified-markdown
```

### CLI Usage

Add `metalsmith-unified-markdown` key to your `metalsmith.json` plugins key

```json
{
  "plugins": {
    "metalsmith-unified-markdown": {
      "engineOptions": {
        "gfm": true,
        "pedantic": false,
        "tables": true,
        "sanitize": false,
        "smartLists": true,
        "smartypants": false
      }
    }
  }
}
```

## Compatibility with @metalsmith/markdown

This plugin maintains compatibility with the API of `@metalsmith/markdown`, making it easy to adopt in existing projects. Here's what you should know:

### Handled Automatically

1. **Legacy Options Support**: Options like `gfm`, `tables`, etc. are automatically mapped to their unified/remark equivalents.

2. **Markdown Rendering**: Core markdown features like headings, lists, code blocks, and links work identically.

3. **File Extensions**: `.md` and `.markdown` files are automatically converted to `.html` just like before.

4. **Metadata Keys**: The `keys` option for processing markdown in metadata works the same way.

### Potential Adjustment Areas

1. **HTML Output**: The HTML output has slightly different whitespace/formatting. If you have tests comparing exact HTML output, they might need updating.

2. **Custom Renderers**: If you used marked's custom renderer system, you can now use the more powerful remark/rehype plugins through the `extended` options.

3. **Plugin System**: The plugin system uses `extended.remarkPlugins` and `extended.rehypePlugins` for adding functionality.

Most users should experience a smooth transition with no visible changes to their site output.

## License

[MIT](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/metalsmith-unified-markdown.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-unified-markdown
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/badge/license-MIT-blue
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-99%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-unified-markdown/actions/workflows/test.yml
