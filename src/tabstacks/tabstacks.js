/** Copyright (c) 2020 Adam Lund http://adamlund.design **/
import TabNavButton from './components/tabnavbutton.component.js';
import HistoryItemLink from './components/historyitem.component.js';
import KeyboardableList from './keyboardable_list.js';
import { _searchinside, noop } from './lib/util.js';

/**
 * TabMasterModel JS
 * Uses a basic form of MVC for presenting opened tabs to the user.
 * tabstacks.js functions as the model-view, Chromium as the actual controller, and the popup html as the view
 *
 * No external JS dependencies.
 * No calls to external services via http at any time.
 * All JavaScript other than provided by the Chromium and Browser API, are written by the author.
 */
const TabMasterModel = {
    init: function(elem) {
        this.myElem = elem;
        this.myTabs = [];
        this.myWindows = new Map();
        this.myHistoryItems = [];
        this.MSPERDAY = 86400000; //milliseconds per day
        this.SEARCH_DURATION = 90; //days
        this.searchTerm = '';
        this.keyboardableList = null;
        this.renderList();
    },
    updateHeader: function() {
        const header = document.querySelector('header-stats');
        // set values in the web component
        header.windows = this.myWindows.size;
        header.tabs = this.myTabs.length;
    },
    showTab: function(tab) {
        chrome.tabs.update(
            tab.id,
            { active: true, highlighted: true },
            function(tab) {
                chrome.windows.update(
                    tab.windowId,
                    { focused: true },
                    noop
                );
            }
        );
    },
    renderList: function() {
        let self = this;
        this.myWindows = new Map();
        this.myTabs = [];
        let list = document.createElement('ul');

        const getWindows = new Promise(resolve => {
            chrome.windows.getAll({ populate: true }, windows => {
                resolve(windows);
            });
        });
        getWindows.then(windows => {
            windows.forEach(win => {
                self.myWindows.set(win.id, win);
                self.myTabs = win.focused
                    ? [...win.tabs, ...self.myTabs]
                    : [...self.myTabs, ...win.tabs];
            });
            let i = 0;
            while (i < self.myTabs.length) {
                if (
                    i > 0 &&
                    self.myTabs[i].windowId !== self.myTabs[i - 1].windowId
                ) {
                    const wb = document.createElement('li');
                    wb.className = 'window-break';
                    list.append(wb);
                }
                list.appendChild(self.___renderTab(self.myTabs[i]));
                i++;
            }
            this.updateHeader();

            // reset the list in case there are items
            this.clearList('open_tabs');
            document.getElementById('open_tabs').appendChild(list);

            this.___setNote(
                "<div class='results'>" +
                    self.myTabs.length +
                    ' open tabs</div>',
                null,
                false
            );

            this.clearButton(false);

            this.keyboardableList = KeyboardableList.generate(this.myElem, {
                shadowDOMQuery: 'tab-button',
            });
            i++;
        });
    },

    ___renderTab: function(tab) {
        const props = {
            url: tab.url,
            label: tab.title,
            tab_id: tab.id,
            window_id: tab.window_id,
            favicon: tab.favIconUrl,
        };
        const tnb = new TabNavButton(props);
        const row = document.createElement('LI');
        const self = this;

        row.setAttribute('role', 'presentation');

        row.appendChild(tnb);

        tnb.addEventListener('tabChange', evt => {
            chrome.tabs.get(evt.detail.tab_id, TabMasterModel.showTab);
        });
        tnb.addEventListener('tabDelete', evt => {
            self.__removeTab(evt.detail.tab_id, evt.target);
        });

        // TODO: Add context menu for delete, pin, and bookmark
        // tabref.addEventListener('contextmenu', function(ctxevt){
        //   ctxevt.preventDefault();
        // });

        return row;
    },

    ___setNote: function(textLine1, textLine2, visible) {
        this.clearList('note');

        const note = document.createElement('div');
        note.className = visible ? 'notif' : 'accessibilityText';
        note.setAttribute('role', 'alert');
        note.innerHTML = textLine1;

        document.getElementById('note').appendChild(note);

        // return handle to second line if there is one
        if (textLine2) {
            const sh = document.createElement('template');
            sh.innerHTML = textLine2;
            const v = sh.content.firstChild;
            note.appendChild(v);
            return v;
        }

        return note;
    },
    __removeTab: function(tabNum, target) {
        chrome.tabs.query({}, tabs => {
            if (tabs.findIndex(tab => tab.id === tabNum) >= 0) {
                chrome.tabs.remove(tabNum);
            }
        });
    },
    filterTabs: function(search_term) {
        const self = this;
        self.searchTerm = search_term;

        if (!search_term || search_term.length === 0) {
            self.clearList('open_tabs');
            self.clearList('note');
            self.renderList();
            return false;
        }

        // do check for
        const results = _searchinside(this.myTabs, search_term, [
            'url',
            'title',
        ]);

        self.clearList('open_tabs');
        self.clearList('note');

        if (!results || results.length === 0) {
            self.searchHistory(search_term);
            return false;
        }

        const list = document.createElement('ul');

        results.forEach(function(tab) {
            list.appendChild(self.___renderTab(tab));
        });
        document.getElementById('open_tabs').appendChild(list);
        self.keyboardableList = KeyboardableList.generate(self.myElem, {
            shadowDOMQuery: 'tab-button',
        });

        self.clearButton(true);
        const tab_or_tabs = results.length > 1 ? ' tabs' : ' tab';
        self.___setNote(
            "<div class='results pullleft'>" +
                results.length +
                tab_or_tabs +
                ' matching "' +
                search_term +
                '"</div>',
            "<div class='subtext pullright'>CTRL+S to search history</div>",
            true
        );
    },

    clearList: function(element_id) {
        const node = document.getElementById(element_id);
        let last;
        while ((last = node.lastChild)) node.removeChild(last);
        this.mySearchField.focus();
    },

    attachListeners: function(search_elem, button_elem) {
        const self = this;
        this.mySearchField = search_elem;
        this.myClearButton = button_elem;

        search_elem.addEventListener('keyup', function __keypressAndFilterEvent(
            event
        ) {
            event.preventDefault();
            if (event.ctrlKey && event.keyCode === 83) {
                self.searchHistory(event.target.value);
            } else if (event.target.value !== self.searchTerm) {
                self.filterTabs(event.target.value);
            }
        });

        button_elem.addEventListener('click', function __clearAndRenderEvent(
            event
        ) {
            search_elem.value = '';
            self.clearList('open_tabs');
            self.clearList('note');
            self.renderList();
        });

        chrome.tabs.onRemoved.addListener(function __refreshTabList() {
            self.renderList();
            if (self.searchTerm !== '') {
                self.filterTabs(self.searchTerm);
            }
        });
    },

    clearButton: function(show_or_no) {
        if (this.myClearButton) {
            switch (show_or_no) {
                case true:
                    if (this.myClearButton.classList.contains('show')) {
                        return false;
                    }
                    this.myClearButton.className = 'show';
                    if (this.myClearButton.hasAttribute('disabled')) {
                        this.myClearButton.removeAttribute('disabled');
                    }
                    break;
                case false:
                    if (this.myClearButton.classList.contains('hide')) {
                        return false;
                    }
                    this.myClearButton.className = 'hide';
                    this.myClearButton.setAttribute('disabled', 'true');
                    break;
            }
            return true;
        }
    },
    __renderLinks: function(historyArray) {
        const list = document.createElement('ul');

        historyArray.sort(function(a, b) {
            return b.visitCount - a.visitCount;
        });

        historyArray.forEach(function(historyItem) {
            const li = document.createElement('LI');

            const histItemProps = {
                url: historyItem.url,
                title:
                    historyItem.title && historyItem.title.length > 0
                        ? historyItem.title
                        : historyItem.url,
                visits: {
                    lastVisitTime: historyItem.lastVisitTime,
                    visitCount: historyItem.visitCount,
                },
            };
            const histLink = new HistoryItemLink(histItemProps);
            li.appendChild(histLink);
            li.className = 'histItem';
            list.appendChild(li);
        });
        return list;
    },
    searchHistory: function(searchTerm) {
        const self = this,
            searchWithinMSec =
                Date.now() - self.SEARCH_DURATION * self.MSPERDAY; // search within # days of search duration

        self.clearButton(true);

        const textUpdate = self.___setNote(
            "<div class='results'>History search for \"" +
                searchTerm +
                '"</div>',
            "<div class='subtext'>Searching history...</div>",
            true
        );
        self.clearList('open_tabs');

        const runHistoryFilter = () => {
            if (self.myHistoryItems && self.myHistoryItems.length > 0) {
                const historyMatches = _searchinside(
                    self.myHistoryItems,
                    searchTerm,
                    ['url', 'title']
                );
                const list = self.__renderLinks(historyMatches);
                const plural =
                    historyMatches.length === 1
                        ? ' link in history'
                        : ' links in history';

                self.___setNote(
                    "<div class='results'>Found " +
                        historyMatches.length +
                        ' ' +
                        plural +
                        ' matching "' +
                        searchTerm +
                        '"</div>',
                    null,
                    true
                );

                document.getElementById('open_tabs').appendChild(list);
                self.keyboardableList = KeyboardableList.generate(self.myElem, {
                    shadowDOMQuery: 'history-item',
                });
            } else {
                textUpdate.textContent =
                    'No history items found. Searched back to ' +
                    new Date(searchWithinMSec).toDateString();
            }
        };

        if (self.myHistoryItems && self.myHistoryItems.length > 0) {
            runHistoryFilter();
        } else {
            // first time, run history search and cache results
            chrome.history.search(
                { text: '', startTime: searchWithinMSec, maxResults: 2500 },
                function(historyArray) {
                    self.myHistoryItems = historyArray;
                    runHistoryFilter();
                }
            );
        }
    },
};

document.addEventListener('DOMContentLoaded', function() {
    var tabModel = Object.create(TabMasterModel);
    tabModel.init(document.getElementById('tabstacks'));
    tabModel.attachListeners(
        document.getElementById('tabSearch'),
        document.getElementById('resetButton')
    );
});
