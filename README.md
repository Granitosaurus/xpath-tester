# Xpath Tester Tool

Standalone tool for testing xpath. Licensed GPLv3

Live at: http://granitosaur.us/xpath-tester/

![screenshot](/screenshot.png)

## Url parameters

- "switch=0" - disabled input switch
- "css=1" - set css as default input type  
- "xpath=<base64 text>"\* - sets input to provided value on load
- "html=<base64 text>"\* - sets html input to provided value on load

\* - note that browsers often have url limit so you should keep these short

## Extras

Css selectors also provide extra pseudo-elements as used in [parsel] package:

- `::attr(<name>)` - will extract node's attribute. e.g. `span::attr(class)` will return class attribute (`foo`) of `<span class="foo">` node
- `::text` - will extract node's text value. e.g. `span::text` will return `foo` of `<span>foo</span>` node.
 
[parsel]: https://github.com/scrapy/parsel
