## Adding tabbed content on specific staff client pages

Use this code for the system preferences:

IntranetmainUserblock, IntranetCirculationHomeHTML, IntranetReportsHomeHTML


``` html

<style type="text/css">

  ul#mptabs {
    list-style-type: none;
    margin: 30px 0 0 0;
    padding: 0 0 0.3em 0;
  }

  ul#mptabs li {
    display: inline;
  }

  ul#mptabs li a {
    color: #42454a;
    background-color: #dedbde;
    border: 1px solid #c9c3ba;
    border-bottom: none;
    padding: 0.3em;
    text-decoration: none;
  }

  ul#mptabs li a:hover {
    background-color: #f1f0ee;
  }

  ul#mptabs li a.selected {
    color: #000;
    background-color: #f1f0ee;
    font-weight: bold;
    padding: 0.7em 0.3em 0.38em 0.3em;
  }

  div.mptabContent {
    border: 1px solid #c9c3ba;
    padding: 0.5em;
    background-color: #f1f0ee;
  }

  div.mptabContent {
    padding: 2% 2% 2% 2%;
  }

  div.mptabContent.hide {
    display: none;
  }

</style>

<script type="text/javascript">
  //<![CDATA[
  var mptabLinks = new Array();
  var contentDivs = new Array();

  function init() {
    // Grab the mptab links and content divs from the page
    var mptabListItems = document.getElementById('mptabs').childNodes;
    for (var i = 0; i < mptabListItems.length; i++) {
      if (mptabListItems[i].nodeName == "LI") {
        var mptabLink = getFirstChildWithTagName(mptabListItems[i], 'A');
        var id = getHash(mptabLink.getAttribute('href'));
        mptabLinks[id] = mptabLink;
        contentDivs[id] = document.getElementById(id);
      }
    }
    // Assign onclick events to the mptab links, and
    // highlight the first mptab
    var i = 0;
    for (var id in mptabLinks) {
      mptabLinks[id].onclick = showmptab;
      mptabLinks[id].onfocus = function() {
        this.blur()
      };
      if (i == 0) mptabLinks[id].className = 'selected';
      i++;
    }
    // Hide all content divs except the first
    var i = 0;
    for (var id in contentDivs) {
      if (i != 0) contentDivs[id].className = 'mptabContent hide';
      i++;
    }
  }

  function showmptab() {
    var selectedId = getHash(this.getAttribute('href'));
    // Highlight the selected mptab, and dim all others.
    // Also show the selected content div, and hide all others.
    for (var id in contentDivs) {
      if (id == selectedId) {
        mptabLinks[id].className = 'selected';
        contentDivs[id].className = 'mptabContent';
      } else {
        mptabLinks[id].className = '';
        contentDivs[id].className = 'mptabContent hide';
      }
    }
    // Stop the browser following the link
    return false;
  }

  function getFirstChildWithTagName(element, tagName) {
    for (var i = 0; i < element.childNodes.length; i++) {
      if (element.childNodes[i].nodeName == tagName) return element.childNodes[i];
    }
  }

  function getHash(url) {
    var hashPos = url.lastIndexOf('#');
    return url.substring(hashPos + 1);
  }
  //]]>
</script>

<body onload="init()">
  <h1>Main heading</h1>
  <ul id="mptabs">
    <li><a href="#tabR01">Tab 1</a></li>
    <li><a href="#tabR02">Tab 2</a></li>
    <li><a href="#tabR03">Tab 3</a></li>
    <li><a href="#tabR04">Tab 4</a></li>
    <li><a href="#tabR05" style="display:none;">Tab 5</a></li>
  </ul>

  <!-- TABR 1 -->
  <div class="mptabContent" id="tabR01">
    <h2>Tab 1</h2>
    <div>
      <h3>Heading</h3>
      <p>Paragraph</p>
    </div>
  </div>

  <!-- TABR 2 -->
  <div class="mptabContent" id="tabR02">
    <h2>Tab 2</h2>
    <div>
      <h3>Heading</h3>
      <p>Paragraph</p>
    </div>
  </div>

  <!-- TABR 3 -->
  <div class="mptabContent" id="tabR03">
    <h2>Tab 3</h2>
    <div>
      <h3>Heading</h3>
      <p>Paragraph</p>
    </div>
  </div>

  <!-- TABR 4 -->
  <div class="mptabContent" id="tabR04">
    <h2>Tab 4</h2>
    <div>
      <h3>Heading</h3>
      <p>Paragraph</p>
    </div>
  </div>

  <!-- TABR 5 -->
  <div class="mptabContent" id="tabR05">
    <h2>Tab 5</h2>
    <div>
      <h3>Heading</h3>
      <p>Paragraph</p>
    </div>
  </div>
  <!-- END -->
</body>

```
