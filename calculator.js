const {St, GObject, Clutter, Gio} = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const {NoExpression, UndefinedIdent, Parser} = Me.imports.parser;

// Calculator-------------------------------------------------------------------
// (calculator user interface)

class _Calculator extends PanelMenu.Button {
  _init () {
    super._init(0, 'Calculator', false);

    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.pcalc');

    // panel expression entry field
    this._initEntry();

    // popup; will have secondary expression entry field and help content
    this._initPopup();

    // panel icon
    // (do after settings bindings have been made)
    this._initIcon();

    // container (box) for entry and icon elements
    this._initContainer();

    // events
    this._initEvents();

    // parser
    this._parser = new Parser();
  }

  _initEntry () { // panel expression entry field
    this._exprEntry = new St.Entry({
      hint_text: 'Enter math expression',
      track_hover: true,
      can_focus: true,
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'expr-entry'
    });

    this._settings.bind(
      'allow-entry-on-panel',
      this._exprEntry,
      'visible',
      Gio.SettingsBindFlags.DEFAULT
    );
  }

  _initPopup () { // popup will have secondary expression entry field and help content
    const MENU_ITEM_WIDTH = 400;

    this._exprEntry2 = new St.Entry({
      hint_text: 'Enter a mathematical expression',
      track_hover: true,
      can_focus: true,
      width: MENU_ITEM_WIDTH,
      style_class: 'expr-entry2'
    });
    const menuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });
    menuItem.actor.add_actor(this._exprEntry2);
    this.menu.addMenuItem(menuItem);

    const helpText = new St.Label({
      text: this._helpContent(),
      width: MENU_ITEM_WIDTH,
      style_class: 'help-text'
    });
    this._helpMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });
    this._helpMenuItem.actor.add_actor(helpText);
    this.menu.addMenuItem(this._helpMenuItem);

    this._settings.bind(
      'show-help-on-popup',
      this._helpMenuItem,
      'visible',
      Gio.SettingsBindFlags.DEFAULT
    );
  }

  _initIcon () { // panel icon
    this._icon = new St.Icon({
      icon_name: this._iconName(),
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'system-status-icon'
    });
    this._settings.connect('changed', this._settingsChanged.bind(this));
  }

  _initContainer () { // container for entry and icon elements
    const calcBox = new St.BoxLayout();
    calcBox.add(this._exprEntry);
    calcBox.add(this._icon);
    this.actor.add_actor(calcBox);
  }

  _initEvents () { // events:
    this.connect('button_press_event', this._onButtonPressThis.bind(this));

    this._exprEntry.clutter_text.connect('button-release-event', this._onButtonReleaseEntry.bind(this));
    this._exprEntry.clutter_text.connect('activate', this._onActivateEntry.bind(this));

    this._exprEntry2.clutter_text.connect('button-release-event', this._onButtonReleaseEntry.bind(this));
    this._exprEntry2.clutter_text.connect('activate', this._onActivateEntry.bind(this));
    this._exprEntry2.clutter_text.connect('key_focus_out', this._onKeyFocusOutEntry.bind(this));
  }

  _onButtonPressThis () {
    this._exprEntry2.grab_key_focus();
  }

  _onButtonReleaseEntry (actor, event) {
    if (actor.get_cursor_position() !== -1 && actor.get_selection().length === 0) {
      actor.set_selection(0, actor.get_text().length); // doesn't work to do this on button-press-event or key_focus_in; don't know why
    }
  }

  _onKeyFocusOutEntry (actor, event) { // (not necessary for _exprEntry)
    const endIdx = actor.get_text().length;
    actor.set_selection(endIdx, endIdx); // clear selection, put cursor at end so it will be there when re-focused
  }

  _onActivateEntry (actor, event) {
    let result;
    try {
      const expr = actor.get_text();
      result = this._parser.eval(expr).toString();
    } catch (e) {
      if (e instanceof SyntaxError) {
        result = 'Syntax error';
      } else if (e instanceof UndefinedIdent) {
        result = '"' + e.ident + '" is undefined';
      } else if (e instanceof NoExpression) {
        result = '';
      } else {
        result = 'Unexpected error';
      }
    }
    this._exprEntry.set_text(result);
    this._exprEntry2.set_text(result);
  }

  _iconName () {
    if (this._exprEntry.visible && this._helpMenuItem.visible) {
      return 'dialog-question-symbolic';
    }
    return 'accessories-calculator-symbolic';
  }

  _settingsChanged () {
    this._icon.icon_name = this._iconName();
  }

  _helpContent () {
    return '\
An example of an expression is 2+4*8, which means multiply\n\
4 by 8 and add 2 to the result. Supported operators:\n\
    + addition\n\
    - subtraction and negation\n\
    * multiplication\n\
    / division\n\
    ^ or ** exponentiation (right-associative)\n\
\n\
Use parentheses to override operator precedence; e.g.,\n\
(2+4)*8 means add 2 to 4 and multiply the result by 8.\n\
\n\
The following special values and functions are available:\n\
    pi : Did you know that March 14 is Pi day?\n\
    e : Euler\'s number\n\
    last : The last calculated value\n\
    abs(x) : Absolute value of x\n\
    acos(x) : Arccosine of x, in radians\n\
    acosh(x) : Hyperbolic arccosine of x\n\
    asin(x) : Arcsine of x, in radians\n\
    asinh(x) : Hyperbolic arcsine of x\n\
    atan(x) : Arctangent of x between -pi and pi radians\n\
    atan2(y, x) : Arctangent of the quotient of its arguments\n\
    atanh(x) : Hyperbolic arctangent of x\n\
    cbrt(x) : Cubic root of x\n\
    ceil(x) : x rounded upwards to the nearest integer\n\
    cos(x) : Cosine of x (x is in radians)\n\
    cosh(x) : Hyperbolic cosine of x\n\
    exp(x) : Value of e raised to the power of x\n\
    floor(x) : x rounded downwards to the nearest integer\n\
    ln(x) or log(x) : Natural logarithm (base e) of x\n\
    random() : Random number between 0 and 1\n\
    round(x) : Rounds x to the nearest integer\n\
    sin(x) : Sine of x (x is in radians)\n\
    sinh(x) : Hyperbolic sine of x\n\
    sqrt(x) : Square root of x\n\
    tan(x) : Tangent of an angle\n\
    tanh(x) : Hyperbolic tangent of a number\n\
    trunc(x) : Integer part of a number x';
  }
}

const Calculator = GObject.registerClass(_Calculator);
