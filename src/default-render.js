import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

/**
 * Default render function using unified/remark
 * @param {string} source
 * @param {Object} options
 * @param {Object} _context - Not used in this implementation but kept for API consistency
 * @returns {string}
 */
export default function defaultRender(source, options, _context) {
  const {
    gfm = true,
    pedantic = false,
    tables = true,
    sanitize = false,
    // smartLists and smartypants are kept for API compatibility but not used in unified
    // eslint-disable-next-line no-unused-vars
    smartLists = true,
    // eslint-disable-next-line no-unused-vars
    smartypants = false,
    extended = {}
  } = options;

  // Start with basic processor
  let processor = unified()
    .use(remarkParse, {
      gfm,
      commonmark: !pedantic
    })
    .use(remarkGfm, {
      tables,
      strikethrough: true,
      autolink: gfm
    });

  // Add any extended remark plugins if provided
  if (extended.remarkPlugins) {
    for (const plugin of extended.remarkPlugins) {
      if (Array.isArray(plugin)) {
        processor = processor.use(plugin[0], plugin[1]);
      } else {
        processor = processor.use(plugin);
      }
    }
  }

  // Transform to HTML
  processor = processor.use(remarkRehype, {
    allowDangerousHtml: !sanitize
  });

  // Include raw HTML if not sanitizing
  if (!sanitize) {
    processor = processor.use(rehypeRaw);
  }

  // Add any extended rehype plugins if provided
  if (extended.rehypePlugins) {
    for (const plugin of extended.rehypePlugins) {
      if (Array.isArray(plugin)) {
        processor = processor.use(plugin[0], plugin[1]);
      } else {
        processor = processor.use(plugin);
      }
    }
  }

  // Add stringify
  processor = processor.use(rehypeStringify);

  // Process the markdown content
  return processor.process(source).then((result) => {
    // Just trim the result, the tests now normalize HTML for comparison
    return String(result).trim();
  });
}
