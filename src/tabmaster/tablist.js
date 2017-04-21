// Copyright (c) 2017 Adam Lund

var TabMasterModel = {

  init: function () {
    var self = this;

    this.myWindowIDs = [];
    this.myTabs = [];

    chrome.windows.getAll({"populate": true}, function getWindows(windows) {

      var done = false;

      windows.forEach(function (win, windex) {
        self.myWindowIDs.push(win.id);

        // each window, get its tabs
        chrome.tabs.getAllInWindow(win.id, function getTabs(tabs) {

          tabs.forEach(function (tab, tabindex) {

            self.myTabs.push(tab);

            // check for the last tab of the last window -- this is the final callback
            if(windex === (windows.length-1) && tabindex === (tabs.length-1)) {
              done = true;
            }

          });

          // once all callbacks are complete set the DOM
          if(done) {
            self.renderList();
          }

        });

      });

    });

  },
  showTab: function(tab){

    chrome.tabs.update(tab.id, { "active" : true, "highlighted" : true }, function(tab){

      chrome.windows.update(tab.windowId, { "focused" : true }, function(){ });

    });
  },

  renderList: function(){
    var self = this;
    var list = document.createElement("ul");

    document.getElementById("tab-count").innerHTML = ""+self.myTabs.length;
    document.getElementById("window-count").innerHTML = ""+self.myWindowIDs.length;

    self.myTabs.forEach(function(tab){
      list.appendChild(self.___renderTab(tab));
    });

    document.getElementById("open_tabs").appendChild(list);

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

    tabref.addEventListener('click', function() {
      chrome.tabs.get( parseInt(this.getAttribute("data-tabid")), TabMasterModel.showTab );
    });

    favicon.addEventListener('error', function(err){
      err.target.src = "img/icon-blank-tab.svg";
      err.preventDefault();
    });

    return row;
  },

  filterTabs: function(search_term){

    var self = this;

    if(!search_term || search_term.length === 0){
      self.clearList();
      self.renderList();
      return false;
    }

    // needs to be case insensitive
    var re = new RegExp(search_term, "i");

    // do check for
    var results = this.myTabs.filter(function(the_tab){
      return the_tab.url.includes(search_term) || re.test(the_tab.title);
    });

    self.clearList();

    if(!results || results.length === 0){
      var note = document.createElement("div");
      note.className = "notif";
      note.setAttribute('role', 'alert');
      note.textContent = "No open tabs matching "+search_term;
      document.getElementById("open_tabs").appendChild(note);
      self.clearButton(true);

      // search recent (24hrs) browser history, user might have closed the tab
      var sh = document.createElement("div");
      sh.textContent = "searching history...";
      note.appendChild(sh);

      self.searchHistory(search_term, sh);
      return false;
    }

    var list = document.createElement('ul');

    results.forEach(function(tab){
      list.appendChild(self.___renderTab(tab));
    });
    document.getElementById("open_tabs").appendChild(list);
    self.clearButton(true);

  },

  clearList: function () {
    var node = document.getElementById("open_tabs");
    var last;
    while (last = node.lastChild) node.removeChild(last);
    this.mySearchField.focus();
  },

  attachListeners: function(search_elem, button_elem){
    var self = this;
    this.mySearchField = search_elem;
    this.myClearButton = button_elem;

    search_elem.addEventListener('keyup', function(event) {
      self.filterTabs( event.target.value );
    });
    button_elem.addEventListener('click', function(event) {
      search_elem.value = "";
      self.clearList();
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
          break
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
    link.textContent = history_item.title && history_item.title.length > 0 ? history_item.title : history_item.url;
    link.setAttribute("target", "_blank");
    return link;
  },
  __renderLinks: function(history_array){
    var self = this;
    var list = document.createElement("ul");

    history_array.forEach(function(histitem){
      var li = document.createElement("LI");
      li.appendChild(self.__makelink(histitem));
      list.appendChild(li);
    });
    return list;
  },
  searchHistory: function(searchterm, textUpdate){

    var self = this;

    chrome.history.search({ text: searchterm, maxResults: 100}, function(history_array){

      if(history_array && history_array.length > 0){
        textUpdate.textContent = " "+history_array.length+" links found in history";

        document.getElementById("open_tabs").appendChild(self.__renderLinks(history_array));
      }
      else {
        textUpdate.textContent = "";
      }

    });
  }
};

document.addEventListener('DOMContentLoaded', function() {

  var tabModel = Object.create(TabMasterModel);
  tabModel.init();
  tabModel.attachListeners(document.getElementById('tabSearch'), document.getElementById('resetButton'));

});