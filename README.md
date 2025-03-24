## Summary

This plugin offers optimized markdown processing using the micromark parser.

### Micromark Parser (Fastest Option)

For the best performance, enable the micromark parser:

```js
metalsmith.use(
  markdown({
    useMicromark: true // Enable micromark for faster parsing
  })
);
```

Micromark provides significantly faster markdown processing (approximately 1.7x improvement) while maintaining compatibility with the unified ecosystem. Our benchmark shows:

| Parser | Processing Time | Improvement |
|--------|-----------------|-------------|
| Default (unified/remark) | 423.19ms | — |
| Micromark | 254.66ms | 1.7x faster |

### Performance Recommendation

Our benchmark tests show that micromark provides the best performance for processing markdown files. It's approximately 70% faster than the default unified/remark pipeline while maintaining full feature compatibility.

For optimal performance, we recommend using:

```js
metalsmith.use(
  markdown({
    useMicromark: true
  })
);
```