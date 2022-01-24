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
  // preloads html input
  if (urlParams.get('html')) {
    editor.getDoc().setValue(atob(urlParams.get('html').replaceAll(' ', '+')))
  }
  // switch to css input type
  if (urlParams.get('css')){
    $("#useCss").prop("checked", true);
    $("#xpath").val("h1.title::attr(class)");
  }
  // preloads xpath input
  if (urlParams.get('xpath')) {
    $("#xpath").val(atob(urlParams.get('xpath').replaceAll(' ', '+')))
  }
  // switch=0 disabled input type switch
  if (urlParams.get('switch') === "0"){
    $("#input-switch").hide();
  }
  $xpath.on('keyup', evalSelectorUpdateResult);
  $xpath.on('keyup', createShareLink);
  $("#useCss").on('click', evalSelectorUpdateResult);
  $("#useCss").on('click', createShareLink);
  $("#editor").on('keyup', evalSelectorUpdateResult);
  $("#editor").on('keyup', createShareLink);
}

function createShareLink() {
  let html = btoa(editor.getDoc().getValue());
  let xpath = btoa($xpath.val());
  let new_url = new URL(window.location.href.trim('/') + "#editor");
  new_url.searchParams.set('html', html);
  new_url.searchParams.set('xpath', xpath);
  if ($('#useCss').is(':checked')){
    new_url.searchParams.set('css', 1)
  }
  $("#share").val(new_url);
  return new_url.toString();
}


function evalXPath() {
  var $node = $($.parseXML(editor.getDoc().getValue()));
  if ($node == undefined) {
    return ""
  }
  var xpathExpr = $xpath.val();
  console.log('xpath expr', xpathExpr);
  return $node.xpath(xpathExpr);
}

function evalCss(){
  var $node = $($.parseXML(editor.getDoc().getValue()));
  if ($node == undefined) {
    return ""
  }
  var cssExpr = $xpath.val();
  console.log('css expr', cssExpr);

  // handle ::attr(<name>) pseudo element functionality
  attrPseudo = cssExpr.match(/attr\((.+?)\)/)
  if (attrPseudo){
    return $node.find(cssExpr.split("::attr")[0]).map(
      (i, el) => {return el.attributes !== undefined ? el.attributes[attrPseudo[1]].value: ""}
      );
  }
  // handle ::text pseudo element functionality
  if (cssExpr.endsWith("::text")){
    return $($node.find(cssExpr.replace('::text', ""))[0]).xpath('.//text()');
  }
  return $node.find(cssExpr);
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

function evalSelectorUpdateResult() {
  try {
    var nodes = $('#useCss').is(':checked') ? evalCss(): evalXPath() ;
    var htmlNodes = $.map(nodes, function (node) {
      return nodeToString(node);
    });

    result.getDoc().setValue(htmlNodes.join('\n'))
    $xpath.attr('aria-invalid', 'false');
    $xpath.removeClass("is-danger");
    $xpath.addClass("is-success");
    console.info('nodes', nodes);
  } catch (e) {
    $xpath.removeClass("is-success");
    $xpath.addClass("is-danger");
    result.getDoc().setValue("ERROR: " + e.message);
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", function() {
    initEditors(); 
    evalSelectorUpdateResult();
});