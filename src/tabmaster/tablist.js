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
    var container = document.createElement("DIV");

    document.getElementById("tab-count").innerHTML = ""+self.myTabs.length;
    document.getElementById("window-count").innerHTML = ""+self.myWindowIDs.length;



    self.myTabs.forEach(function(tab){
      var row = self.renderTab(tab);
      container.appendChild(row);
    });

    document.getElementById("open_tabs").appendChild(container);

    this.clearButton(false);
  },

  renderTab: function(tab){
    var tabref    = document.createElement("BUTTON"),
     favicon      = document.createElement("IMG"),
     titletxt     = document.createElement("SPAN"),
     row          = document.createElement("DIV");

    tabref.setAttribute("data-tabid", tab.id);
    tabref.setAttribute("data-windowid", tab.windowId);
    tabref.setAttribute("data-url", tab.url);

    favicon.setAttribute("src", (typeof tab.favIconUrl === 'undefined' ? "img/icon-blank-tab.svg" : tab.favIconUrl));

    tabref.appendChild(favicon);
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

    var results = this.myTabs.filter(function(the_tab){
      return the_tab.title.includes(search_term) || the_tab.url.includes(search_term);
    });

    self.clearList();

    if(!results || results.length === 0){
      var note = document.createElement("div");
      note.className = "notif";
      note.setAttribute('role', 'alert');
      note.textContent = "No results matching "+search_term;
      document.getElementById("open_tabs").appendChild(note);
      self.clearButton(true);
      return false;
    }

    results.forEach(function(tab){
      document.getElementById("open_tabs").appendChild(self.renderTab(tab));
    });
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
  searchHistory: function(searchterm){
    chrome.history.search(function(history_array){

    });
  }
};

document.addEventListener('DOMContentLoaded', function() {

  var tabModel = Object.create(TabMasterModel);
  tabModel.init();
  tabModel.attachListeners(document.getElementById('tabSearch'), document.getElementById('resetButton'));

});