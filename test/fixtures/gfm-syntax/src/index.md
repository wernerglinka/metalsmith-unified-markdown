# GitHub Flavored Markdown Test File

This file demonstrates GitHub Flavored Markdown (GFM) features that extend beyond standard CommonMark.

## Table Support

| Feature | Supported in GFM | Supported in CommonMark |
|---------|:----------------:|:----------------------:|
| Tables | ✅ | ❌ |
| Strikethrough | ✅ | ❌ |
| Autolinks | ✅ | ❌ |
| Task Lists | ✅ | ❌ |
| Emoji shortcodes | ✅ | ❌ |

## Strikethrough Text

This is ~~strikethrough text~~ using tilde characters.

## Automatic URL Linking

Plain URLs are automatically linked in GFM: https://example.com

## Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested task

## Emoji Shortcodes

:smile: :rocket: :books: :metal:

## Fenced Code Blocks with Syntax Highlighting

```javascript
function testGfm() {
  console.log("This is GitHub Flavored Markdown");
  return true;
}
```

```css
.gfm-specific {
  color: #0366d6;
  font-weight: bold;
}
```

## Extended Autolinks

GFM will automatically link references like #123 (issue numbers) and @username (users).

## HTML Tag Support

<details>
<summary>Click to expand</summary>
This content is initially hidden but can be expanded.
</details>

## Footnotes

Here's a sentence with a footnote reference[^1].

[^1]: This is the footnote content.

## Line Breaks

GFM treats a single newline as a soft break when rendering.
Like this line, which will appear right after the previous one.

But a paragraph break still requires two newlines.

## Indented Code

    // This is indented code
    const four = 2 + 2;
    
## Highlight Markers

GFM often supports ==highlighted text== (though implementation varies).