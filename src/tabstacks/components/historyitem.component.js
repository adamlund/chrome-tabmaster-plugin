import { _get } from '../lib/util.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
    a {
        display: flex;
        flex-direction: column;
        padding: 11px 21px 11px 7px;
        margin: 0;
        font-size: .85em;
        border: none;
        text-align: left;
        cursor: pointer;
        text-decoration: none;
        background-color: #F5F5F5;
        box-shadow: inset 0 0 0 0 #F5F5F5;
        transition: box-shadow .33s;
    }
    a:hover,
    a:focus {
        background-color: #fff;
    }
    a:focus {
        outline: none;
        box-shadow: inset 0 0 0 3px rgba(17,148,246,1);
        z-index: 10000;
    }
    .historyitem-title {
        max-width: 385px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .historyitem-url,
    .historyitem-visits {
        font-size: 85%;
        margin-top: 3px;
        color: #787878;
        max-width: 385px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
<a role="menuitem" target="_blank">
    <span class="historyitem-title"></span>
    <span class="historyitem-url"></span>
    <span class="historyitem-visits"></span>
</a>
`;

class HistoryItemLink extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'url', 'visits'];
    }
    set title(title) {
        this._title = title;
        this.titleElem.innerHTML = this.title;
    }
    get title() {
        return this._title;
    }
    set url(url) {
        this._url = url;
        this.anchorElem.setAttribute('href', this.url);
        this.anchorElem.setAttribute('title', this.url);
        this.urlElem.innerHTML = this.url;
    }
    get url() {
        return this._url;
    }
    set visits({ visitCount, lastVisitTime }) {
        this._visits = { visitCount, lastVisitTime };
        this.visitsElem.innerHTML =
            'Last visited: ' +
            new Date(this.visits.lastVisitTime).toDateString();
        this.visitsElem.innerHTML +=
            visitCount > 1
                ? ' viewed <strong>' +
                  this.visits.visitCount +
                  '</strong> times'
                : '';
    }
    get visits() {
        return this._visits;
    }
    constructor(props) {
        super(props);

        // set up DOM from template
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.anchorElem = this.shadowRoot.querySelector('a');
        this.titleElem = this.shadowRoot.querySelector(
            'span.historyitem-title'
        );
        this.urlElem = this.shadowRoot.querySelector('span.historyitem-url');
        this.visitsElem = this.shadowRoot.querySelector(
            'span.historyitem-visits'
        );

        // set UI/DOM properties from props or defaults
        this.title = _get(props, 'title') || '';
        this.visits = _get(props, 'visits') || {
            visitCount: 0,
            lastVisitTime: 0,
        };
        this.url = _get(props, 'url') || '';
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (HistoryItemLink.observedAttributes.includes(name)) {
            this[name] = newValue;
        }
    }
}
export default HistoryItemLink;
