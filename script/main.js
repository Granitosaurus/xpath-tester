
$(function(){
  var $xpath = $("#xpath");

  function evalXPath() {
    var $node = $($.parseXML(editor.getDoc().getValue()));
    if ($node == undefined){
      return ""
    }
    var xpathExpr = $xpath.val();
    console.log('expr', xpathExpr);
    return $node.xpath(xpathExpr);
  }

  function nodeToString(node) {
    if (node.nodeType == undefined)  // text result
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
      var htmlNodes = $.map(nodes, function(node){
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

  $xpath.on('keyup', evalXPathUpdateResult);
  $("#editor").on('keyup', evalXPathUpdateResult);
  evalXPathUpdateResult();
})