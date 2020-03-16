const template = document.createElement('template');
template.innerHTML = `
<style>
    .lbltxt {
        margin-right: 20px;
        margin-left: 0px;
        color: #787878;
        font-size: 75%;
        text-transform: uppercase;
    }
</style>
<div class="stats">
    <img src="../img/icon-tabs.svg" height="16" width="20" alt="Tab Count">
    <span id="tab-count"></span>
    <span id="tab-count-label" class="lbltxt">tabs</span>
    <img src="../img/icon-window.svg" height="16" width="20" alt="Window Count">
    <span id="window-count"></span>
    <span id="window-count-label" class="lbltxt">windows</span>
</div>
`;

class HeaderStats extends HTMLElement {
    static get observedAttributes() {
        return ['tabs', 'windows'];
    }
    set tabs(num) {
        this._tabs = num;
        this.tabCountElem.innerText = this.tabs;
        this.tabCountLabelElem.innerText = this.tabs > 1 ? 'tabs' : 'tab';
    }
    get tabs() {
        return this._tabs;
    }
    set windows(num) {
        this._windows = num;
        this.windowCountElem.innerText = this.windows;
        this.windowCountLabelElem.innerText =
            this.windows > 1 ? 'windows' : 'window';
    }
    get windows() {
        return this._windows;
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.tabCountElem = this.shadowRoot.getElementById('tab-count');
        this.tabCountLabelElem = this.shadowRoot.getElementById(
            'tab-count-label'
        );
        this.windowCountElem = this.shadowRoot.getElementById('window-count');
        this.windowCountLabelElem = this.shadowRoot.getElementById(
            'window-count-label'
        );
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (HeaderStats.observedAttributes.includes(name)) {
            this[name] = newValue;
        }
    }
}

export default HeaderStats;
