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
  init: function (elem) {

    var self = this;

    this.myElem = elem;

    this.myWindowIDs = [];
    this.myTabs = [];
    this.MSPERDAY = 86400000; //milliseconds per day
    this.SEARCH_DURATION = 30; //days
    this.searchTerm = "";
    this.keyboardableList = null;

    chrome.tabs.query({}, function getAllTheTabs(tabs){

      var i = tabs.length-1;
      for(i; i >= 0; i=i-1){
        self.myTabs.push(tabs[i]);
      }
      self.renderList();

      // tabs.forEach(function (tab, tabindex) {
      //
      //   self.myTabs.push(tab);
      //
      //   // check for the last tab of the last window -- this is the final callback
      //   if(tabindex === (tabs.length-1)) {
      //     self.renderList();
      //   }
      //
      // });

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

      if(i < self.myTabs.length-1 && self.myTabs[i].windowId !== self.myTabs[i+1].windowId){

        var wb = document.createElement('li');
        wb.className = "window-break";
        list.append(wb);
      }

      list.appendChild(self.___renderTab( self.myTabs[i] ) );

    }

    document.getElementById("tab-count").innerText = ""+self.myTabs.length;
    document.getElementById("window-count").innerText = ""+self.myWindowIDs.length;
    document.getElementById("tab-count-label").innerText = self.myTabs.length > 1 ? "tabs": "tab";
    document.getElementById("window-count-label").innerText = self.myWindowIDs.length > 1 ? "windows" : "window";

    document.getElementById("open_tabs").appendChild(list);

    this.___setNote("<div class='results'>"+self.myTabs.length+" open tabs</div>", null, false);

    this.clearButton(false);

    this.keyboardableList = KeyboardableList.generate(this.myElem);

  },

  ___renderTab: function(tab){
    var tabref    = document.createElement("BUTTON"),
     faviconSpan     = document.createElement("SPAN"),
     favicon      = document.createElement("IMG"),
     titletxt     = document.createElement("SPAN"),
     row          = document.createElement("LI"),
        self = this;

    row.setAttribute("role", "presentation");

    tabref.setAttribute("data-tabid", tab.id);
    tabref.setAttribute("data-windowid", tab.windowId);
    tabref.setAttribute("data-url", tab.url);
    tabref.setAttribute("aria-label", tab.title);

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

    tabref.addEventListener('keyup', function __deleteTab(kevt){
      if(kevt.keyCode === 8 || kevt.keyCode === 46){
          var btn = kevt.target;
          self.__removeTab( parseInt(btn.getAttribute("data-tabid")), btn);
      }
    });

    
    // TODO: Add context menu for delete, pin, and bookmark
    // tabref.addEventListener('contextmenu', function(ctxevt){
    //   ctxevt.preventDefault();
    // });

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
    note.innerHTML = textLine1;

    document.getElementById("note").appendChild(note);

    // return handle to second line if there is one
    if(textLine2){
      var sh = document.createElement("template");
      sh.innerHTML = textLine2;
      var v = sh.content.firstChild;
      note.appendChild(v);
      return v;
    }

    return note;

  },

  __removeTab: function(tabNum, target){

    // remove the tab object reference from model
    // search through the model to return the tab with id matching parameter
    var tindex = this.myTabs.findIndex(function(tab){
      return tab.id === tabNum;
    });

    // remove the button and LI from DOM
    var t = this.keyboardableList.getMenuListItems().indexOf(target);

    // set focus to the next thing if there is one, previous, or the input field
    if(this.keyboardableList.menulistitems.length > 2 && t < this.keyboardableList.menulistitems.length-1)
      this.keyboardableList.focusNext();

    else
      this.keyboardableList.focusPrevious();

    if(t > -1)
      this.keyboardableList.getMenuListItems().splice(t, 1);

    this.myTabs.splice(tindex, 1);
    target.parentElement.remove();

    // remove tab from chrome
    chrome.tabs.remove( tabNum );

  },

  filterTabs: function(search_term){

    var self = this;

    self.searchTerm = search_term;

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

      self.searchHistory(search_term);
      return false;
    }

    var list = document.createElement('ul');

    results.forEach(function(tab){
      list.appendChild(self.___renderTab(tab));
    });
    document.getElementById("open_tabs").appendChild(list);
    self.keyboardableList = KeyboardableList.generate(self.myElem);

    self.clearButton(true);
    var tab_or_tabs = results.length > 1 ? " tabs" : " tab";
    self.___setNote("<div class='results pullleft'>"+results.length+tab_or_tabs+" matching \""+search_term+"\"</div>", "<div class='subtext pullright'>CTRL+S to search history</div>", true);

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
      if(event.target.value !== self.searchTerm)
        self.filterTabs( event.target.value );

      else if(event.ctrlKey && event.keyCode === 83){
        self.searchHistory(event.target.value);
      }
    });
    
    button_elem.addEventListener('click', function __clearAndRenderEvent(event) {
      search_elem.value = "";
      self.clearList("open_tabs");
      self.clearList("note");
      self.renderList();
    });

    document.getElementById('open_tabs').addEventListener('click', function(cevent){
      if(cevent.target.getAttribute('data-tabid')){
          var tgt = parseInt(cevent.target.getAttribute('data-tabid'));
          //chrome.tabs.get( tgt, TabMasterModel.showTab );
          self.showTab(tgt);
          cevent.preventDefault();
      }

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
          if(this.myClearButton.hasAttribute("disabled")){
              this.myClearButton.removeAttribute("disabled");
          }
          break;
        case false:
          if(this.myClearButton.classList.contains("hide")){
            return false;
          }
          this.myClearButton.className = "hide";
          this.myClearButton.setAttribute("disabled", "true");
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
  
  searchHistory: function(searchterm){

    var self = this,
    newtime = Date.now() - (self.SEARCH_DURATION  * self.MSPERDAY ); // search within # days of search duration

    self.clearButton(true);

    var textUpdate = self.___setNote("<div class='results'>No open tabs matching \""+searchterm+"\"</div>", "<div class='subtext'>searching history...</div>", true);

    chrome.history.search({ text: searchterm, startTime: newtime, maxResults: 25}, function(history_array){

      if(history_array && history_array.length > 0){
        self.clearList("open_tabs");

        var list = self.__renderLinks(history_array);
        var plural = history_array.length > 1 ? " links in history" : " link in history";

        self.___setNote("<div class='results'>Found "+history_array.length+" "+plural+" matching \""+searchterm+"\"</div>", null, true);

        document.getElementById("open_tabs").appendChild(list);
        self.keyboardableList = KeyboardableList.generate(self.myElem);
      }
      else {
        textUpdate.textContent = "No history items found either. Searched back to "+new Date(newtime).toDateString();
      }

    });
  }
};

document.addEventListener('DOMContentLoaded', function() {

  var tabModel = Object.create(TabMasterModel);
  tabModel.init(document.getElementById('tabstacks'));
  tabModel.attachListeners(document.getElementById('tabSearch'), document.getElementById('resetButton'));


});