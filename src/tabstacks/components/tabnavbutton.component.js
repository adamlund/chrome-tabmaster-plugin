import { _get } from '../lib/util.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
    button {
        display: flex;
        padding: 11px 21px 11px 7px;
        margin: 0;
        font-size: .80em;
        color: #333;
        width: 100%;
        border: none;
        text-align: left;
        cursor: pointer;
        background-color: #F5F5F5;
        box-shadow: inset 0 0 0 0 #F5F5F5;
        transition: box-shadow .33s;
    }
    button:hover,
    button:focus {
        background-color: #fff;
    }
    button:focus {
        outline: none;
        box-shadow: inset 0 0 0 3px rgba(17,148,246,1);
        z-index: 10000;
    }
    button img {
        width: 15px;
        height: 15px;
    }
    .truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    .transition {
        max-height: 0;
        transition: max-height 0.33s ease-out;
    }
    .favicon {
        width: 15px;
        height: 15px;
        margin-right: 10px;
    }
    .url {
        font-size: 85%;
        margin-top: 3px;
        color: #787878;
    }
    .text-display {
        display: flex;
        flex-direction: column;
        width: 350px;
    }
    .active {
        max-height: 25px;
        transition: max-height 0.33s ease-in;
    }
</style>
<button role="menuitem" class="tab-button">
    <div class="favicon"><img /></div>
    <div class="text-display">
        <div class="label truncate"></div>
        <div class="url truncate transition"></div>
    </div>
</button>
`;

class TabNavButton extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'url', 'favicon', 'window_id', 'tab_id'];
    }
    set label(text) {
        this._label = text;
        this.labelElem.innerText = this.label;
        this.buttonElem.setAttribute('aria-label', this.label);
    }
    get label() {
        return this._label;
    }
    set url(text) {
        this._url = text;
        this.buttonElem.setAttribute('title', this.url);
        this.urlTextElem.innerText = this.url;
    }
    get url() {
        return this._url;
    }
    set favicon(favicon_url) {
        this._favicon = favicon_url;
        this.faviconElem.setAttribute('src', this.favicon);
    }
    get favicon() {
        return this._favicon;
    }
    set window_id(id) {
        this._window_id = id;
    }
    get window_id() {
        return this._window_id;
    }
    set tab_id(id) {
        this._tab_id = id;
    }
    get tab_id() {
        return this._tab_id;
    }
    constructor(props) {
        super(props);

        // set up DOM from template
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.buttonElem = this.shadowRoot.querySelector('button');
        this.labelElem = this.shadowRoot.querySelector('.label');
        this.faviconElem = this.shadowRoot.querySelector('img');
        this.urlTextElem = this.shadowRoot.querySelector('.url');

        // set UI/DOM properties from props or defaults
        this.label = _get(props, 'label') || 'Unknown';
        this.favicon = _get(props, 'favicon') || '../img/icon-blank-tab.svg';
        this.url = _get(props, 'url') || '';
        this.window_id = _get(props, 'window_id') || 0;
        this.tab_id = _get(props, 'tab_id') || 0;
    }
    connectedCallback() {
        this.buttonElem.addEventListener('click', this, false);
        this.buttonElem.addEventListener('keyup', this, false);
        this.buttonElem.addEventListener('focus', this, false);
        this.buttonElem.addEventListener('mouseover', this, false);
        this.buttonElem.addEventListener('blur', this, false);
        this.buttonElem.addEventListener('mouseout', this, false);
        this.faviconElem.addEventListener('error', this, false);
    }
    disconnectedCallback() {
        this.buttonElem.removeEventListener('click', this);
        this.buttonElem.removeEventListener('keyup', this);
        this.buttonElem.removeEventListener('focus', this);
        this.buttonElem.removeEventListener('mouseover', this);
        this.buttonElem.removeEventListener('blur', this);
        this.buttonElem.removeEventListener('mouseout', this);
        this.faviconElem.removeEventListener('error', this);
    }
    handleEvent(event) {
        const eventDetail = {
            url: this.url,
            tab_id: this.tab_id,
            window_id: this.window_id,
        };
        switch(event.type) {
            case 'click':
                this.dispatchEvent(
                    new CustomEvent('tabChange', { detail: eventDetail })
                );
            break;
            case 'keyup':
                if (event.keyCode === 8 || event.keyCode === 46) {
                    this.dispatchEvent(
                        new CustomEvent('tabDelete', { detail: eventDetail })
                    );
                }
            break;
            case 'error':
                event.target.src = '../img/icon-blank-tab.svg';
                event.preventDefault();
            break;
            case 'blur':
            case 'mouseout':
                if (this.urlTextElem.classList.contains('active')) {
                    this.urlTextElem.classList.remove('active');
                }
            break;
            case 'mouseover':
            case 'focus':
                if (!this.urlTextElem.classList.contains('active')) {
                    this.urlTextElem.classList.add('active');
                }
            break;
            default:
                return false;
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (TabNavButton.observedAttributes.includes(name)) {
            this[name] = newValue;
        }
    }
}

export default TabNavButton;
