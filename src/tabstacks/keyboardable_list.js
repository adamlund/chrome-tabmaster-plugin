export const KEYMAP = Object.freeze({
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
});
export const DIRECTION = Object.freeze({
    NEXT: 1,
    PREVIOUS: 2,
    INTO: 3,
    BACK: 4,
});
export const SELECTABLEITEMS =
    "a[href]:not([disabled]):not([tabindex='-1']),\
    input:not([type='hidden']):not([disabled]):not([tabindex='-1']),\
    button:not([disabled]):not([tabindex='-1']),\
    select:not([disabled]):not([tabindex='-1']),\
    textarea:not([disabled]):not([tabindex='-1']),\
    iframe:not([tabindex='-1']),\
    [tabindex]:not([tabindex='-1']),\
    [contentEditable=true]:not([tabindex='-1'])";

/**
 * KeyboardableList
 * Takes an element and adds directional key listeners to the items within it.
 * Only items that can have focus will have listeners added to them.
 * The parent element will be treated with ARIA role='menu', selectable items will be treated with role='menuitem'
 * @type {{init: KeyboardableList.init, focusOn: KeyboardableList.focusOn, setDropmenu: KeyboardableList.setDropmenu, generate: KeyboardableList.generate}}
 */
const KeyboardableList = {
    init: function(menuElement, options) {
        const _self = this;

        const defaults = {
            // 0 = wrap, 1 = nowrap  -1=do nothing
            tab_mode: -1,
            shadowDOMQuery: null,
        };

        this.opts = Object.assign({}, defaults, options);
        this.menuElement = menuElement;
        this.menuElement.setAttribute('role', 'menu');
        this.menulistitems = [];
        this.menulistitems = [].slice.call(
            this.menuElement.querySelectorAll(SELECTABLEITEMS)
        );

        // Provide a string to append elements that contain shadow DOM, as querySelectorAll does not apply
        if (this.opts.shadowDOMQuery) {
            const nodeList = [].slice.call(
                this.menuElement.querySelectorAll(this.opts.shadowDOMQuery)
            );
            nodeList.forEach(node => {
                const sublist = [].slice.call(
                    node.shadowRoot.querySelectorAll(SELECTABLEITEMS)
                );
                this.menulistitems = this.menulistitems.concat(sublist);
            });
        }

        // .Commented out for now -- but the proper treatment for menus is to add role='presentation' attribute to the menu item container
        // menulistitems.forEach(function(listitem, listitemindex) {
        //   listitem.setAttribute("role", "presentation");
        // });

        this.menulistitems.forEach(function(menuitem) {
            menuitem.setAttribute('role', 'menuitem');

            menuitem.addEventListener('keydown', function(kevt) {
                switch (kevt.keyCode || kevt.which) {
                    case KEYMAP['DOWN']:
                        _self.focusOn(DIRECTION['NEXT'], menuitem, kevt);
                        break;

                    case KEYMAP['UP']:
                        _self.focusOn(DIRECTION['PREVIOUS'], menuitem, kevt);
                        break;
                }
            });
        });

        return this;
    },

    focusOn: function(direction, menuitem, event) {
        const l = this.menulistitems.length;
        const p = this.menulistitems.indexOf(menuitem);

        switch (direction) {
            case DIRECTION['PREVIOUS']:
                if (this.opts.tab_mode === 0 && p === 0) {
                    this.menulistitems[l - 1].focus();
                    if (event) event.preventDefault();
                } else if (p !== 0) {
                    this.menulistitems[p - 1].focus();
                    if (event) event.preventDefault();
                }
                break;

            case DIRECTION['NEXT']:
                if (this.opts.tab_mode === 0 && p === l - 1) {
                    this.menulistitems[0].focus();
                    if (event) event.preventDefault();
                } else if (p !== l - 1) {
                    this.menulistitems[p + 1].focus();
                    if (event) event.preventDefault();
                }
                break;
        }
    },
    focusNext: function() {
        const active = this.menulistitems.indexOf(document.activeElement);

        if (active > -1)
            this.focusOn(DIRECTION.NEXT, this.menulistitems[active], null);
        else if (this.menulistitems.length > 0)
            this.focusOn(DIRECTION.NEXT, this.menulistitems[0], null);
        else
            throw new Error(
                'KeyboardableList.focusNext called but there is no list element in focus'
            );
    },
    focusPrevious: function() {
        const active = this.menulistitems.indexOf(document.activeElement);

        if (active > -1)
            this.focusOn(DIRECTION.PREVIOUS, this.menulistitems[active], null);
        else if (this.menulistitems.length > 0)
            this.focusOn(DIRECTION.PREVIOUS, this.menulistitems[0], null);
        else
            throw new Error(
                'KeyboardableList.focusNext called but there is no list element in focus'
            );
    },
    /**
     * Add reference to the parent dropmenu -- to close it upon certain actions
     * @param dropMenu
     */
    setDropmenu: function(dropMenu) {
        this.dropMenu = dropMenu;
    },

    getMenuListItems: function() {
        return this.menulistitems;
    },

    generate: function(menuElement, options) {
        return Object.create(KeyboardableList).init(menuElement, options);
    },
};
export default KeyboardableList;
