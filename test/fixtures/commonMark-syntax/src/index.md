# CommonMark Test File

This file demonstrates standard CommonMark syntax without GitHub Flavored Markdown extensions.

## Headers

# Level 1 Header
## Level 2 Header
### Level 3 Header
#### Level 4 Header
##### Level 5 Header
###### Level 6 Header

Alternative Level 1 Header
=========================

Alternative Level 2 Header
-------------------------

## Emphasis

*Italic text* or _also italic text_

**Bold text** or __also bold text__

***Bold and italic*** or ___also bold and italic___

## Blockquotes

> This is a blockquote.
> 
> It can span multiple paragraphs.
>
> > And it can be nested.

## Lists

### Unordered Lists

* Item 1
* Item 2
  * Nested item A
  * Nested item B
* Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested item 1
   2. Nested item 2
3. Third item

## Code

Inline `code` with backticks.

```
// Fenced code block
function test() {
  return "CommonMark";
}
```

    // Indented code block
    function indentedCode() {
      return "Four spaces";
    }

## Links

[Link with text](https://example.com)

[Link with title](https://example.com "Example Website")

<https://example.com> (Autolink without brackets)

## Images

![Alt text for image](https://example.com/image.jpg)

![Alt text with title](https://example.com/image.jpg "Image Title")

## Horizontal Rules

---

***

___

## Escaping Characters

\*Not italic\*

\`Not code\`

## Line Breaks

This line ends with two spaces.  
So this appears on a new line.

This line doesn't have trailing spaces.
But this still appears on the same line in CommonMark.

## Paragraphs

This is a paragraph.

This is another paragraph with a blank line in between.

## HTML

Standard CommonMark allows raw HTML:

<div class="custom-class">
  <p>This is raw HTML in CommonMark.</p>
</div>

## Backslash Escapes

\*literal asterisks\*

## Entity References

&copy; &amp; &lt; &gt;