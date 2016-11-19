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
  console.log("tab search loaded");
  chrome.windows.getAll({ "populate" : true }, listWindows);
}


function popWindow(tab){
  chrome.windows.update(tab.windowId, { "focused" : true }, function(){ });
}

function popTab(tab){
  chrome.tabs.update(tab.id, { "active" : true, "highlighted" : true }, popWindow)
}

function listTabs(tabs){
  var j = 0;
  for( j; j < tabs.length; j++){
    var tab = tabs[j];
    addTabTitle(tab.title, tab.id, tab.windowId, tab.url, tab.favIconUrl);
  }
  tab_count +=tabs.length;
  updateTabCount(tab_count);
}

function listWindows(windows){
  var numWindows = windows.length;
  var i = 0;

  document.getElementById("window-count").innerHTML = ""+numWindows;

  console.log(" "+ numWindows + " open windows");

  for( i; i < numWindows; i++){
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
  var namediv = document.createElement("DIV");

  var tabidattr = document.createAttribute("data-tabid");
  tabidattr.value = id;
  namediv.setAttributeNode(tabidattr);

  var winidattr = document.createAttribute("data-windowid");
  winidattr.value = windowid;
  namediv.setAttributeNode(winidattr);

  var titleurl = document.createAttribute("title");
  titleurl.value = url;
  namediv.setAttributeNode(titleurl);

  var favicon = document.createElement("IMG");
  var faviconsrc = document.createAttribute("src");
  faviconsrc.value = typeof favIconUrl === 'undefined' ? "img/icon-blank-tab.svg" : favIconUrl;
  favicon.setAttributeNode(faviconsrc);

  namediv.appendChild(favicon);

  var titletxt = document.createTextNode(title);
  namediv.appendChild(titletxt);




  document.getElementById("open_tabs").appendChild(namediv);
  namediv.addEventListener('click', function() {
    var myid = this.getAttribute("data-tabid");
    var mywinid = this.getAttribute("data-windowid");
    console.log("tab id is:"+myid+" win id:"+mywinid);

    chrome.tabs.get(parseInt(myid), popTab);

  });
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

//chrome.browserAction.onClicked.addListener(start);


document.addEventListener('DOMContentLoaded', function() { 
  start();
});

