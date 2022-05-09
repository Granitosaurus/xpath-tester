const DEFAULT_HTML = `
<html>
  <head>
    <title>Page Title</title>
  </head>
  <body>
    <h1 class="title">Page header by <a href="#">company</a></h1>
    <p>This is the first paragraph</p>
    <p>This is the second paragraph</p>
  </body>
</html>
`
const template = document.createElement('template');
template.innerHTML = `
<link rel="stylesheet" href="style/bulma-switch.min.css">
<link rel="stylesheet" href="style/codemirror.css">
<link rel="stylesheet" href="style/widget.css">
<div class="selector-widget">
  <div id="editor" class="box" title="html input editor">
    <!-- html input editor will be inserted here by js -->
  </div>
  <div class="input-box" id="selector-input" title="selector input field">
    <input class="input" type="text" id="xpath" value="//div" placeholder="enter your xpath here">
    <div id="input-switch">
      <label for="useCss">xpath</label>
      <input id="useCss" type="checkbox" name="switchExample" class="switch is-info">
      <label for="useCss">css</label>
    </div>
  </div>
  <div id="result" class="box" title="selector results">
    <!-- results editor will be inserted here by js -->
  </div>
</div>
</div>
`

function nodeToString(node) {
    if (node.nodeType == undefined) // text result
        return node
    if (node.nodeType == 2)
        return node.value;
    if (node.nodeType == 3)
        return node.wholeText;
    if (node.nodeType == 8)
        return "<!--" + node.textContent + "-->";
    return node.outerHTML;
}

function unescapeHtml(encoded) {
    var elem = document.createElement('textarea');
    elem.innerHTML = encoded;
    return elem.value;
}


class SelectorWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.xpath = this.shadowRoot.querySelector('#xpath');
        this.xpath.value = this.getAttribute('input');
        this.selector_switch = this.shadowRoot.querySelector('#input-switch>input');
        if (this.getAttribute("mode") == 'css') {
            this.selector_switch.checked = true;
        }
        if (this.getAttribute("mode") == 'xpath') {
            this.selector_switch.checked = false;
        }
        this.result = CodeMirror(this.shadowRoot.querySelector('#result'), {
            value: "",
            lineNumbers: false,
            height: "auto",
            mode: "xml"
        });
        let editorContent = this.innerHTML ? unescapeHtml(this.innerHTML) : DEFAULT_HTML;
        editorContent = html_beautify(editorContent, {"indent_size": 2, 'wrap_line_length': 80}).trim();
        this.editor = this.shadowRoot.querySelector('#editor');
        this.editor = CodeMirror(this.editor, {
            value: editorContent,
            mode: "xml"
        });

        this.evalSelectorUpdateResult();
        this.xpath.addEventListener('keyup', this.evalSelectorUpdateResult.bind(this))
        this.selector_switch.addEventListener('change', this.evalSelectorUpdateResult.bind(this))
    }

    evalSelectorUpdateResult() {
        try {
            var nodes = this.selector_switch.checked ? this.evalCss() : this.evalXPath();
            var htmlNodes = $.map(nodes, function (node) {
                return nodeToString(node);
            });
            this.result.getDoc().setValue(html_beautify(htmlNodes.join('\n'), {'indend_size': 2, "wrap_line_length": 80}));
            this.xpath.setAttribute('aria-invalid', 'false');
            this.xpath.classList.remove("is-danger");
            this.xpath.classList.add("is-success");
            console.info('nodes', nodes);
        } catch (e) {
            this.xpath.classList.remove("is-success");
            this.xpath.classList.add("is-danger");
            this.result.getDoc().setValue("ERROR: " + e.message);
            console.error(e);
            console.log(this.result);
        }
    }

    evalXPath() {
        var $node = $($.parseXML(this.editor.getDoc().getValue()));
        if ($node == undefined) {
            return ""
        }
        console.log($node);
        console.log('using xpath: ' + this.xpath.value);
        var xpathExpr = this.xpath.value;
        console.log('xpath expr', xpathExpr);
        return $node.xpath(xpathExpr);
    }

    evalCss() {
        var $node = $($.parseXML(this.editor.getDoc().getValue()));
        if ($node == undefined) {
            return ""
        }
        let cssExpr = this.xpath.value;
        console.log('css expr', cssExpr);

        // handle ::attr(<name>) pseudo element functionality
        let attrPseudo = cssExpr.match(/attr\((.+?)\)/)
        if (attrPseudo) {
            return $node.find(cssExpr.split("::attr")[0]).map(
                (i, el) => {
                    return el.attributes !== undefined ? el.attributes[attrPseudo[1]].value : ""
                }
            );
        }
        // handle ::text pseudo element functionality
        if (cssExpr.endsWith("::text")) {
            return $($node.find(cssExpr.replace('::text', ""))[0]).xpath('.//text()');
        }
        return $node.find(cssExpr);
    }
}

window.customElements.define('selector-widget', SelectorWidget);
