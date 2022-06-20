import { _get } from '../lib/util';

const template = document.createElement('template');
template.innerHTML = `
<style>
    #note {
        border-bottom: 1px solid rgba(0,0,0,0.1);
        transition: all 0.8s;
    }
    .notif {
        padding: 11px 21px 11px 7px;
        font-size: .85em;
        width: 100%;
        display: block;
    }
    .pullright  {
        display: inline-block;
        width: 50%;
        text-align: right;
    }
    .pullleft {
        display: inline-block;
        width: 50%;
        text-align: left;
    }
    .notif .subtext {
        padding-top: 10px;
        font-size: 85%;
        color: #6a6b6c;
    }
    .notif .subtext.pullright {
        padding-top: 4px;
    }
    .accessibilityText {
        height: 0;
        width: 0;
        text-indent: -99999px;
    }
</style>
<div id="note" role="region" aria-live="polite">
    <div id="a11yalert" class="accessibilityText" role="alert"></div>
    <div id="notification" class="notif" role="alert"></div>
</div>
`;

// tab results
"<div class='results pullleft'>" +
results.length +
tab_or_tabs +
' matching "' +
search_term +
'"</div>',
"<div class='subtext pullright'>CTRL+S to search history</div>",
true

// accessibility text
"<div class='results'>" +
self.myTabs.length +
' open tabs</div>',
null,
false

// searching history
"<div class='results'>History search for \"" +
searchTerm +
'"</div>',
"<div class='subtext'>Searching history...</div>",
true

// HISTORY_SEARCH_RESULTS
"<div class='results'>Found " +
historyMatches.length +
' ' +
plural +
' matching "' +
searchTerm +
'"</div>',
null,
true

export const FeedbackStateConfig = {
    type: DISPLAY_TYPE.NO_DISPLAY,
    count: 0,
    text: '',
};

export const DISPLAY_TYPE = Object.freeze({
    NO_DISPLAY: -1,
    TAB_DEFAULT: 0,
    TAB_SEARCH_RESULTS: 1,
    SEARCHING_HISTORY: 2,
    HISTORY_SEARCH_RESULTS: 3,
});

const RenderTemplate = ({ type, count, text }) => {
    if (type === DISPLAY_TYPE.TAB_DEFAULT) {
        return `<div class='results'>${count} open tabs</div>`;
    }
    if (type === DISPLAY_TYPE.SEARCHING_HISTORY) {
        return `<div class='results'>History search for \"${text}</div>
        <div class='subtext'>Searching history...</div>`;
    }
    if (type === DISPLAY_TYPE.TAB_SEARCH_RESULTS) {
        return `<div class='results pullleft'>${count} 
        tab_or_tabs +
        ' matching "' +
        ${text} +
        </div>
        "<div class='subtext pullright'>CTRL+S to search history</div>",`
    }
};

class Feedback extends HTMLElement {
    static get observedAttributes() {
        return ['stateData'];
    }
    set stateData(dataObject) {
        this._stateData = dataObject;
    }
    get stateData() {
        return this._stateData;
    }
    constructor(props) {
        super(props);
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.rootElem = this.shadowRoot.getElementById('note');
        this.notification = this.shadowRoot.getElementById('notification');
        this.a11yalert = this.shadowRoot.getElementById('a11yalert');
        if (props && _get(props, 'type') && _get(props, 'count') && _get(props, 'text')) {
            this.stateData = props;
        } else {
            this.stateData = FeedbackStateConfig;
        }
    }
    render() {

    }
}

export default Feedback;