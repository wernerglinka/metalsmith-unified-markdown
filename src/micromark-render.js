import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { gfmFromMarkdown } from 'mdast-util-gfm';

/**
 * Render markdown to HTML using micromark
 * This is a faster alternative to the full unified/remark pipeline
 *
 * @param {string} source - The markdown source
 * @param {Object} options - The render options
 * @param {Object} _context - The render context (unused but kept for API consistency)
 * @returns {Promise<string>} - The rendered HTML
 */
export default function micromarkRender(source, options, _context) {
  return new Promise((resolve) => {
    const {
      gfm: useGfm = true,
      // These options are kept for API compatibility but not used
      // eslint-disable-next-line no-unused-vars
      pedantic = false,
      // eslint-disable-next-line no-unused-vars
      tables = true,
      sanitize = false,
      // eslint-disable-next-line no-unused-vars
      smartLists = true,
      // eslint-disable-next-line no-unused-vars
      smartypants = false,
      // Extended options
      extended = {}
    } = options;

    let html;

    // Simple path: direct micromark parsing (fastest)
    if (!extended.remarkPlugins && !extended.rehypePlugins) {
      // Configure micromark extensions
      const extensions = [];
      const htmlExtensions = [];

      if (useGfm) {
        extensions.push(gfm());
        htmlExtensions.push(gfmHtml());
      }

      // Parse markdown to HTML directly with micromark
      html = micromark(source, {
        extensions,
        htmlExtensions
      });

      resolve(html.trim());
      return;
    }

    // For cases with plugins, we need to use the full MDAST -> HAST -> HTML pipeline
    // This is still faster than the full unified/remark stack

    // Step 1: Parse markdown to MDAST
    const mdastExtensions = [];
    if (useGfm) {
      mdastExtensions.push(gfmFromMarkdown());
    }

    const mdast = fromMarkdown(source, {
      extensions: useGfm ? [gfm()] : [],
      mdastExtensions
    });

    // Step 2: Convert MDAST to HAST
    const hast = toHast(mdast, {
      allowDangerousHtml: !sanitize
    });

    // Step 3: Convert HAST to HTML
    html = toHtml(hast, {
      allowDangerousHtml: !sanitize
    });

    resolve(html.trim());
  });
}
