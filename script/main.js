var result=undefined;
var editor=undefined;
var $xpath=undefined;
var $share=undefined;

function initEditors() {
   $xpath = $("#xpath");
   $share = $("#share");
   result = CodeMirror(function (elt) {
    $("#result").append(elt);
  }, {
    value: "",
    lineNumbers: false,
    mode: "xml"
  });

  editor = CodeMirror(function (elt) {
    $("#editor").append(elt);
  }, {
    value: `<html>
  <head>
    <title>Page Title</title>
  </head>
  <body>
    <h1 class="title">Page header by <a href="#">company</a></h1>
    <p>This is the first paragraph</p>
    <p>This is the second paragraph</p>
  </body>
</html>`,
    mode: "xml"
  });
  var urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('html')) {
    editor.getDoc().setValue(atob(urlParams.get('html').replaceAll(' ', '+')))
  }
  if (urlParams.get('xpath')) {
    $("#xpath").val(atob(urlParams.get('xpath').replaceAll(' ', '+')))
  }
  $xpath.on('keyup', evalXPathUpdateResult);
  $xpath.on('keyup', createShareLink);
  $("#editor").on('keyup', evalXPathUpdateResult);
  $("#editor").on('keyup', createShareLink);
}

function createShareLink() {
  let html = btoa(editor.getDoc().getValue());
  let xpath = btoa($xpath.val());
  let new_url = new URL(window.location.href.trim('/') + "#editor");
  new_url.searchParams.set('html', html);
  new_url.searchParams.set('xpath', xpath);
  $("#share").val(new_url);
  // $share.val(new_url.toString());
  return new_url.toString();
  // window.open(new_url.toString(), '_blank');
}


// $(function () {

function evalXPath() {
  var $node = $($.parseXML(editor.getDoc().getValue()));
  if ($node == undefined) {
    return ""
  }
  var xpathExpr = $xpath.val();
  console.log('expr', xpathExpr);
  return $node.xpath(xpathExpr);
}

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

function evalXPathUpdateResult() {
  try {
    var nodes = evalXPath();
    var htmlNodes = $.map(nodes, function (node) {
      return nodeToString(node);
    });

    result.getDoc().setValue(htmlNodes.join('\n'))
    $xpath.attr('aria-invalid', 'false'),
      $xpath.removeClass("is-danger")
    $xpath.addClass("is-success")
    console.info('nodes', nodes);
  } catch (e) {
    $xpath.removeClass("is-success")
    $xpath.addClass("is-danger")
    result.getDoc().setValue("ERROR: " + e.message)
    console.error(e);
  }
}

// })

document.addEventListener("DOMContentLoaded", function() {
    initEditors(); 
    evalXPathUpdateResult();
});