# metalsmith-unified-markdown

> **⚠️ This plugin is a fully functional proof-of-concept.** It allows you to use the unified/remark ecosystem for markdown processing. However, it is not yet fully tested and may contain bugs. Use with caution.

A Metalsmith plugin that renders markdown files to HTML using the [unified/remark](https://unifiedjs.com/) ecosystem, with an optional [micromark](https://github.com/micromark/micromark) fast path.

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![Coverage][coverage-badge]][coverage-url]
[![ESM][modules-badge]][npm-url]

> **Version 0.1.0** is ESM-only and requires Node.js 22+. See the migration guide below.

## Features

- Compiles `.md` and `.markdown` files in `metalsmith.source()` to HTML.
- Renders additional file or `metalsmith.metadata()` keys to HTML through the `keys` option.
- Supports reference-style links shared across all markdown files via `globalRefs`.
- Expands `*` wildcards in `keys` keypaths to render collections and arrays.
- Extensible via custom remark and rehype plugins through `engineOptions.extended`.
- Optional micromark parser (`useMicromark: true`) for faster processing.

## Installation

```bash
npm install metalsmith-unified-markdown
```

## Usage

```js
import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-unified-markdown';

Metalsmith(import.meta.dirname)
  .source('./src')
  .destination('./build')
  .use(markdown())
  .build((err) => {
    if (err) throw err;
  });
```

With custom options:

```js
metalsmith.use(
  markdown({
    engineOptions: {
      gfm: true,
      pedantic: false,
      tables: true,
      sanitize: false,
      extended: {
        remarkPlugins: [],
        rehypePlugins: []
      }
    }
  })
);
```

Fast path with micromark:

```js
metalsmith.use(
  markdown({
    useMicromark: true,
    engineOptions: {}
  })
);
```

## Options

| Option          | Type                                                | Default         | Description                                                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keys`          | `string[]` or `{files: string[], global: string[]}` | `{}`            | Key names of file metadata to render to HTML in addition to `contents` — can be nested key paths.                                                                                                                                                                          |
| `wildcard`      | `boolean`                                           | `false`         | Expand `*` wildcards in `keys` keypaths.                                                                                                                                                                                                                                   |
| `globalRefs`    | `Object<string, string>` or `string`                | `{}`            | An object of `{ refname: 'link' }` pairs made available for all markdown files and keys, or a `metalsmith.metadata()` keypath containing such an object.                                                                                                                   |
| `render`        | `Function`                                          | `defaultRender` | Custom render function with the signature `(source, engineOptions, context) => string`. `context` is `{ path, key }` where `path` is the current file path and `key` is the target metadata key.                                                                          |
| `engineOptions` | `Object`                                            | `{}`            | Options passed to the unified/remark engine (see below).                                                                                                                                                                                                                   |
| `useMicromark`  | `boolean`                                           | `false`         | Use the micromark parser for faster markdown processing.                                                                                                                                                                                                                   |

### Engine Options

| Option                   | Type      | Default     | Description                                            |
| ------------------------ | --------- | ----------- | ------------------------------------------------------ |
| `gfm`                    | `boolean` | `true`      | Enable GitHub Flavored Markdown.                       |
| `pedantic`               | `boolean` | `false`     | Conform to the original markdown.pl (disables CommonMark). |
| `tables`                 | `boolean` | `true`      | Enable GFM tables.                                     |
| `sanitize`               | `boolean` | `false`     | Sanitize the output HTML (drops raw HTML).             |
| `extended`               | `Object`  | `{}`        | Extended plugins configuration.                        |
| `extended.remarkPlugins` | `Array`   | `undefined` | Remark plugins to register on the processor.           |
| `extended.rehypePlugins` | `Array`   | `undefined` | Rehype plugins to register on the processor.           |

### Rendering metadata

You can render markdown to HTML in file or metalsmith metadata keys by specifying the `keys` option. Dot-delimited keypaths are supported, and `globalRefs` are resolved inside them:

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

Render all keys at a given path by enabling `wildcard` and using `*` in the keypaths. This is especially useful for arrays like the `faq` below:

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

is transformed to:

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

Notes about the wildcard:

- It behaves like a single bash globstar. `*` only matches the first level.
- A wildcard keypath that matches a non-string value is ignored.
- It is `false` by default because broad usage adds overhead.

### Defining a dictionary of markdown globalRefs

Markdown allows users to define links in [reference style](https://www.markdownguide.org/basic-syntax/#reference-style-links) (`[]:`). In a Metalsmith build it is often useful to share link references globally. The `globalRefs` option enables this:

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

Any file or metadata key processed by the plugin can then refer to these links as `[My Twitter][twitter_link]` or `![Me][photo]`. You can also store the refs in `metalsmith.metadata()` and pass their keypath as `globalRefs` instead. This makes it possible to load refs into global metadata from a source file with [@metalsmith/metadata](https://github.com/metalsmith/metadata) and use them in markdown and in templating plugins like [@metalsmith/layouts](https://github.com/metalsmith/layouts):

```js
metalsmith
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

Add custom remark and rehype plugins to extend markdown processing. First install the plugins you need:

```bash
npm install remark-toc rehype-highlight
```

Then register them via `engineOptions.extended`:

```js
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';

metalsmith.use(
  markdown({
    engineOptions: {
      gfm: true,
      tables: true,
      sanitize: false,
      extended: {
        remarkPlugins: [[remarkToc, { heading: 'Table of Contents' }]],
        rehypePlugins: [[rehypeHighlight, { subset: ['javascript', 'css', 'html'] }]]
      }
    }
  })
);
```

### Custom render function

You can supply your own render function:

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

      const processor = unified()
        .use(remarkParse, { gfm, commonmark: !pedantic })
        .use(remarkGfm, { tables, strikethrough: true, autolink: gfm });

      if (extended.toc) {
        processor.use(remarkToc, extended.toc);
      }

      processor.use(remarkRehype, { allowDangerousHtml: !sanitize });

      if (!sanitize) {
        processor.use(rehypeRaw);
      }

      if (extended.highlight) {
        processor.use(rehypeHighlight, extended.highlight);
      }

      processor.use(rehypeStringify);

      return processor.process(source).then((result) => String(result).trim());
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

If you prefer a different markdown library, pass it via the `render` option. For example, using [markdown-it](https://github.com/markdown-it/markdown-it):

```js
import MarkdownIt from 'markdown-it';

let markdownIt;
metalsmith.use(
  markdown({
    render(source, opts, context) {
      if (!markdownIt) markdownIt = new MarkdownIt(opts);
      if (context.key === 'contents') return markdownIt.render(source);
      return markdownIt.renderInline(source);
    },
    engineOptions: {
      /* markdown-it options */
    }
  })
);
```

### Using micromark

Enable the micromark parser with `useMicromark: true`:

```js
metalsmith.use(
  markdown({
    useMicromark: true
  })
);
```

When `engineOptions.extended.remarkPlugins` or `engineOptions.extended.rehypePlugins` are set, the micromark path falls back to the MDAST → HAST → HTML pipeline so custom plugins still run.

## Examples

### Basic

```js
import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-unified-markdown';

Metalsmith(import.meta.dirname)
  .source('./src')
  .destination('./build')
  .use(markdown())
  .build((err) => {
    if (err) throw err;
  });
```

### With remark/rehype plugins

```js
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';

Metalsmith(import.meta.dirname)
  .use(
    markdown({
      engineOptions: {
        gfm: true,
        extended: {
          remarkPlugins: [[remarkToc, { heading: 'Contents' }]],
          rehypePlugins: [rehypeHighlight]
        }
      }
    })
  )
  .build();
```

### Micromark fast path

```js
Metalsmith(import.meta.dirname)
  .use(
    markdown({
      useMicromark: true
    })
  )
  .build();
```

## Debug

Set the `DEBUG` environment variable to enable debug logs:

```
DEBUG=metalsmith-unified-markdown
```

### CLI Usage

Add `metalsmith-unified-markdown` to the plugins key of your `metalsmith.json`:

```json
{
  "plugins": {
    "metalsmith-unified-markdown": {
      "engineOptions": {
        "gfm": true,
        "pedantic": false,
        "tables": true,
        "sanitize": false
      }
    }
  }
}
```

## Migration from v0.0.x to v0.1.0

Version 0.1.0 modernizes the toolchain. The plugin API, options, and output are unchanged.

### Breaking Changes

1. **ESM only.** The CommonJS build is gone. Use `import markdown from 'metalsmith-unified-markdown'` from an ESM project. Node 22+ can still `require()` the ESM package thanks to stable `require(esm)` support, so CJS consumers are not locked out — but `import` is the authoritative syntax.
2. **Node.js 22+ required.** Earlier versions are unsupported. The plugin uses the native `node:test` runner and native coverage, both of which require Node 22+.
3. **No more `lib/` directory.** The package publishes directly from `src/`. If any code was importing deep paths like `metalsmith-unified-markdown/lib/...`, update it to use the public `import markdown from 'metalsmith-unified-markdown'` entry.

## Compatibility with @metalsmith/markdown

The plugin preserves the `@metalsmith/markdown` API where possible:

- Legacy root-level engine options (`gfm`, `tables`, etc.) are moved into `engineOptions` with a deprecation warning.
- Core markdown features (headings, lists, code blocks, links, etc.) behave the same.
- `.md` and `.markdown` files are converted to `.html` as before.
- The `keys` option for processing markdown in metadata works the same.

Differences to be aware of:

- HTML output whitespace and attribute quoting may differ slightly. Tests comparing exact strings may need updating.
- The `render` hook replaces marked's custom renderer system. Use remark/rehype plugins via `extended` for pipeline extensions.

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
[modules-badge]: https://img.shields.io/badge/module-ESM-blue
