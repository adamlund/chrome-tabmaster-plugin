// Copyright (c) 2016 Adam Lund


/*
function getWindows(win) {
  targetWindow = win;
  chrome.tabs.getAllInWindow(targetWindow.id, getTabs);
}

function getTabs(tabs) {
  tabCount = tabs.length;
  // We require all the tab information to be populated.
  chrome.windows.getAll({"populate" : true}, moveTabs);
}
*/

var tab_count = 0;

function start(){
  chrome.windows.getAll({ "populate" : true }, listWindows);
}

function popWindow(tab){
  chrome.windows.update(tab.windowId, { "focused" : true }, function(){ });
}

function popTab(tab){
  chrome.tabs.update(tab.id, { "active" : true, "highlighted" : true }, popWindow)
}

function listTabs(tabs){
  var j = tabs.length-1,
    windiv = document.createElement("DIV");

  windiv.setAttribute("class", "windowbox");

  for( j; j >= 0; j--){
    var tab = tabs[j];
    windiv.appendChild( addTabTitle(tab.title, tab.id, tab.windowId, tab.url, tab.favIconUrl) );
  }

  document.getElementById("open_tabs").appendChild(windiv);

  tab_count +=tabs.length;
  updateTabCount(tab_count);
}

function listWindows(windows){
  var numWindows = windows.length;
  var i = windows.length-1;

  document.getElementById("window-count").innerHTML = ""+numWindows;

  for( i; i >= 0; i--){
    var thewin = windows[i];
    chrome.tabs.getAllInWindow(thewin.id, listTabs);
  }
}

function iconError(source){
  source.src = "img/icon-blank-tab.svg";
  return true;
}

function updateTabCount(count){
  document.getElementById("tab-count").innerHTML = ""+count;
}

function addTabTitle(title, id, windowid, url, favIconUrl){
  var tabref    = document.createElement("BUTTON"),
    favicon     = document.createElement("IMG"),
    titletxt    = document.createTextNode(title),
    row         = document.createElement("DIV");

  tabref.setAttribute("data-tabid", id);
  tabref.setAttribute("data-windowid", windowid);
  tabref.setAttribute("title", url);

  favicon.setAttribute("src", (typeof favIconUrl === 'undefined' ? "img/icon-blank-tab.svg" : favIconUrl));
  tabref.appendChild(favicon);
  tabref.appendChild(titletxt);

  row.appendChild(tabref);

  tabref.addEventListener('click', function() {
    chrome.tabs.get(parseInt(this.getAttribute("data-tabid")), popTab);
  });

  return row;
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

//chrome.browserAction.onClicked.addListener(start);

document.addEventListener('DOMContentLoaded', function() {
  start();
});
