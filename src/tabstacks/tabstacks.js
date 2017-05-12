/** Copyright (c) 2017 Adam Lund http://adamlund.design **/

/**
 * TabMasterModel JS
 * Uses a basic form of MVC for presenting opened tabs to the user.
 * tabstacks.js functions as the model-view, Chromium as the actual controller, and the popup html as the view
 *
 * No external JS dependencies.
 * No calls to external services via http at any time.
 * All JavaScript other than provided by the Chromium and Browser API, are written by the author.
 *
 */

var TabMasterModel = {
  init: function () {

    var self = this;

    this.myWindowIDs = [];
    this.myTabs = [];
    this.MSPERDAY = 86400000; //milliseconds per day
    this.SEARCH_DURATION = 5; //days

    chrome.tabs.query({}, function getAllTheTabs(tabs){

      tabs.forEach(function (tab, tabindex) {

        self.myTabs.push(tab);

        // check for the last tab of the last window -- this is the final callback
        if(tabindex === (tabs.length-1)) {
          self.renderList();
        }

      });

    });

  },
  showTab: function(tab){

    chrome.tabs.update(tab.id, { "active" : true, "highlighted" : true }, function(tab){

      chrome.windows.update(tab.windowId, { "focused" : true }, function(){ });

    });
  },

  renderList: function(){
    var self = this,
     list = document.createElement("ul"),
     i = self.myTabs.length;

    self.myWindowIDs = [];

    while(i--){

      if(!self.myWindowIDs.includes(self.myTabs[i].windowId))
        self.myWindowIDs.push(self.myTabs[i].windowId);

      list.appendChild(self.___renderTab( self.myTabs[i] ) );

    }

    document.getElementById("tab-count").innerHTML = ""+self.myTabs.length;
    document.getElementById("window-count").innerHTML = ""+self.myWindowIDs.length;

    document.getElementById("open_tabs").appendChild(list);

    KeyboardableList.generate(list);

    this.___setNote(""+self.myTabs.length+" open tabs", null, false);

    this.clearButton(false);
  },

  ___renderTab: function(tab){
    var tabref    = document.createElement("BUTTON"),
     faviconSpan     = document.createElement("SPAN"),
     favicon      = document.createElement("IMG"),
     titletxt     = document.createElement("SPAN"),
     row          = document.createElement("LI");

    tabref.setAttribute("data-tabid", tab.id);
    tabref.setAttribute("data-windowid", tab.windowId);
    tabref.setAttribute("data-url", tab.url);

    faviconSpan.className = "favicon";
    favicon.setAttribute("src", (typeof tab.favIconUrl === 'undefined' ? "img/icon-blank-tab.svg" : tab.favIconUrl));
    faviconSpan.appendChild(favicon);

    tabref.appendChild(faviconSpan);
    titletxt.innerText = tab.title;
    tabref.appendChild(titletxt);

    row.appendChild(tabref);

    tabref.addEventListener('click', function __clickAndShowTab() {
      chrome.tabs.get( parseInt(this.getAttribute("data-tabid")), TabMasterModel.showTab );
    });

    favicon.addEventListener('error', function __faviconLoadError(err){
      err.target.src = "img/icon-blank-tab.svg";
      err.preventDefault();
    });

    return row;
  },

  ___setNote: function(textLine1, textLine2, visible){

    this.clearList("note");

    var note = document.createElement("div");
    note.className = visible ? "notif" : "accessibilityText";
    note.setAttribute('role', 'alert');
    note.textContent = textLine1;

    document.getElementById("note").appendChild(note);

    // search recent browser history, user might have closed the tab
    if(textLine2){
      var sh = document.createElement("div");
      sh.textContent = textLine2;
      note.appendChild(sh);
      return sh;
    }

    return note;

  },

  filterTabs: function(search_term){

    var self = this;

    if(!search_term || search_term.length === 0){
      self.clearList("open_tabs");
      self.clearList("note");
      self.renderList();
      return false;
    }

    // needs to be case insensitive
    var re = new RegExp(search_term, "i");

    // do check for
    var results = this.myTabs.filter(function(the_tab){
      return re.test(the_tab.url) || re.test(the_tab.title);
    });

    self.clearList("open_tabs");
    self.clearList("note");

    if(!results || results.length === 0){

      var sh = self.___setNote("No open tabs matching \""+search_term+"\"", "searching history...", true);

      self.clearButton(true);
      self.searchHistory(search_term, sh);
      return false;
    }

    var list = document.createElement('ul');

    results.forEach(function(tab){
      list.appendChild(self.___renderTab(tab));
    });
    document.getElementById("open_tabs").appendChild(list);
    KeyboardableList.generate(list);

    self.clearButton(true);
    self.___setNote(""+results.length+" tabs matching \""+search_term+"\"", null, true);

  },

  clearList: function (element_id) {
    var node = document.getElementById(element_id);
    var last;
    while (last = node.lastChild) node.removeChild(last);
    this.mySearchField.focus();
  },

  attachListeners: function(search_elem, button_elem){
    var self = this;
    this.mySearchField = search_elem;
    this.myClearButton = button_elem;

    search_elem.addEventListener('keyup', function __keypressAndFilterEvent(event) {
      if(event.keyCode === 40) {
        document.getElementById("open_tabs").querySelector('button, a').focus();
        event.preventDefault();
      }
      else {
        self.filterTabs( event.target.value );
      }
    });
    button_elem.addEventListener('click', function __clearAndRenderEvent(event) {
      search_elem.value = "";
      self.clearList("open_tabs");
      self.clearList("note");
      self.renderList();
    });
  },

  clearButton: function(show_or_no){
    if(this.myClearButton){
      switch(show_or_no){
        case true:
          if(this.myClearButton.classList.contains("show")){
            return false;
          }
          this.myClearButton.className = "show";
          break;
        case false:
          if(this.myClearButton.classList.contains("hide")){
            return false;
          }
          this.myClearButton.className = "hide";
          break;
      }
      return true;
    }
  },
  __makelink: function(history_item){ // pass a history item
    var link = document.createElement("A");
    link.setAttribute("href", history_item.url);
    link.setAttribute("title", history_item.url);
    link.textContent = history_item.title && history_item.title.length > 0 ? history_item.title : history_item.url;
    link.setAttribute("target", "_blank");
    return link;
  },
  __renderLinks: function(history_array){
    var self = this;
    var list = document.createElement("ul");

    history_array.sort(function(a, b){
      return b.visitCount - a.visitCount;
    });

    history_array.forEach(function(histitem){
      var li = document.createElement("LI"),
       note = document.createElement("DIV");

      li.appendChild(self.__makelink(histitem));

      note.innerHTML = "Last visited: "+new Date(histitem.lastVisitTime).toDateString();
      note.innerHTML += histitem.visitCount > 1 ? " viewed <strong>"+histitem.visitCount +"</strong> times" : "";

      li.appendChild(note);
      li.className = "histItem";
      list.appendChild(li);

    });
    return list;
  },
  searchHistory: function(searchterm, textUpdate){

    var self = this, newtime;
    newtime = Date.now() - (self.SEARCH_DURATION  * self.MSPERDAY ); // search within # days of search duration

    chrome.history.search({ text: searchterm, startTime: newtime, maxResults: 25}, function(history_array){

      if(history_array && history_array.length > 0){
        self.clearList("open_tabs");

        var list = self.__renderLinks(history_array);
        textUpdate.textContent = " "+history_array.length;
        textUpdate.textContent += history_array.length > 1 ? " links in history" : " link in history";

        document.getElementById("open_tabs").appendChild(list);
        KeyboardableList.generate(list);
      }
      else {
        textUpdate.textContent = "No history items found either. Searched back to "+new Date(newtime).toDateString();
      }

    });
  }
};

document.addEventListener('DOMContentLoaded', function() {

  var tabModel = Object.create(TabMasterModel);
  tabModel.init();
  tabModel.attachListeners(document.getElementById('tabSearch'), document.getElementById('resetButton'));

});