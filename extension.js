const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Mainloop = imports.mainloop;

// Lexer------------------------------------------------------------------------
// scans an expression string as a sequence of "tokens", which serves as input
// to the parser

const TOK_UNKNOWN = 0; const TOK_END = 1; const TOK_NUM = 2; const TOK_ADD = 3;
const TOK_SUB = 4; const TOK_MUL = 5; const TOK_DIV = 6; const TOK_EXP = 7;
const TOK_LPAREN = 8; const TOK_RPAREN = 9; const TOK_IDENT = 10;

class Lexer {
  constructor (expr) { // expr: expression string
    this._expr = expr;
    this._idx = 0;
    this._exprLen = expr.length;
    this._token0 = null;
  }

  getToken () { // consume a token
    const token = this._token0;
    this._token0 = null;
    if (token === null) {
      return this._getToken();
    }
    return token;
  }

  peekToken () { // peek at but don't consume a token
    if (this._token0 === null) {
      this._token0 = this._getToken();
    }
    return this._token0;
  }

  _getToken () {
    for (;;) { // test for end of input or skip whitespace
      if (this._idx === this._exprLen) {
        return { id: TOK_END, val: null };
      }
      if (/\s/.test(this._expr[this._idx])) { // whitespace
        ++this._idx;
      } else {
        break;
      }
    }

    const idxStart = this._idx;

    // test for number
    this._tryNumber();
    if (idxStart !== this._idx) {
      return { id: TOK_NUM, val: +this._expr.substring(idxStart, this._idx) };
      // note + in front of substring, which converts string to number
    }

    // test for identifier
    this._tryIdent();
    if (idxStart !== this._idx) {
      return { id: TOK_IDENT, val: this._expr.substring(idxStart, this._idx) };
    }

    let id = TOK_UNKNOWN;
    switch (this._expr[idxStart]) {
      case '+':
        id = TOK_ADD; break;
      case '-':
        id = TOK_SUB; break;
      case '^':
        id = TOK_EXP; break;
      case '*':
        if (this._expr[idxStart + 1] === '*') {
          id = TOK_EXP;
          ++this._idx;
          break;
        }
        id = TOK_MUL; break;
      case '/':
        id = TOK_DIV; break;
      case '(':
        id = TOK_LPAREN; break;
      case ')':
        id = TOK_RPAREN; break;
    }
    ++this._idx;
    return { id: id, val: null };
  }

  _tryNumber () {
    let idx2 = this._idx;
    let digits = false;
    let dpoint = false;
    for (;;) {
      if (/[0-9]/.test(this._expr[idx2])) {
        digits = true;
        ++idx2;
      } else if (this._expr[idx2] === '.') {
        if (dpoint) {
          break;
        }
        dpoint = true;
        ++idx2;
      } else {
        break;
      }
      if (idx2 === this._exprLen) {
        break;
      }
    }

    if (digits) { // check for 'e' exponential notation
      let idx3 = idx2;
      if (idx3 !== this._exprLen && /[eE]/.test(this._expr[idx3])) {
        ++idx3;
        if (idx3 !== this._exprLen && /[+-]/.test(this._expr[idx3])) {
          ++idx3;
        }
        let digitRegEx = /[0-9]/;
        if (idx3 !== this._exprLen && digitRegEx.test(this._expr[idx3])) {
          ++idx3;
          while (digitRegEx.test(this._expr[idx3])) {
            ++idx3;
          }
          idx2 = idx3;
        }
      }
    }

    if (digits) {
      this._idx = idx2;
    }
  }

  _tryIdent () {
    if (!/[_a-zA-Z]/.test(this._expr[this._idx])) {
      return;
    }
    ++this._idx;
    while (this._idx !== this._exprLen && /[_0-9a-zA-Z]/.test(this._expr[this._idx])) {
      ++this._idx;
    }
  }
}

// Parser-----------------------------------------------------------------------
// evaluates expressions

class NoExpression {} // exception

class UndefinedIdent { // exception
  constructor (ident) {
    this.ident = ident; // identifier string
  }
}

class Parser {
  constructor () {
    this._last_val = 0.0;
  }

  eval (expr) {
    this._lexer = new Lexer(expr);
    if (this._lexer.peekToken().id === TOK_END) {
      throw new NoExpression();
    }
    const val = this._expression();
    if (this._lexer.peekToken().id !== TOK_END) {
      throw new SyntaxError();
    }
    this._last_val = val;
    return val;
  }

  _expression () {
    // <_expression> ::= <_multiplicitiveExpr> [ ( "+" | "-" ) <_multiplicitiveExpr> ]...
    let lhs = this._multiplicitiveExpr();
    for (;;) {
      if (this._lexer.peekToken().id === TOK_ADD) {
        this._lexer.getToken();
        lhs += this._multiplicitiveExpr();
      } else if (this._lexer.peekToken().id === TOK_SUB) {
        this._lexer.getToken();
        lhs -= this._multiplicitiveExpr();
      } else {
        break;
      }
    }
    return lhs;
  }

  _multiplicitiveExpr () {
    // <_multiplicitiveExpr> ::= <_exponentialExpr> [ ( "*" | "/" ) <_exponentialExpr> ]...
    let lhs = this._exponentialExpr();
    for (;;) {
      if (this._lexer.peekToken().id === TOK_MUL) {
        this._lexer.getToken();
        lhs *= this._exponentialExpr();
      } else if (this._lexer.peekToken().id === TOK_DIV) {
        this._lexer.getToken();
        lhs /= this._exponentialExpr();
      } else {
        break;
      }
    }
    return lhs;
  }

  _exponentialExpr () {
    // <_exponentialExpr> ::= ( "+" | "-" ) <_exponentialExpr>
    //                      | <_baseExpr> [ ( "**" | "^" ) <_exponentialExpr> ]
    // note: exponentation is right-associative
    if (this._lexer.peekToken().id === TOK_ADD) {
      this._lexer.getToken();
      return +this._exponentialExpr();
    }

    if (this._lexer.peekToken().id === TOK_SUB) {
      this._lexer.getToken();
      return -this._exponentialExpr();
    }

    let lhs = this._baseExpr();
    if (this._lexer.peekToken().id === TOK_EXP) {
      this._lexer.getToken();
      lhs **= this._exponentialExpr();
    }
    return lhs;
  }

  _baseExpr () {
    // <_baseExpr> ::= <number> | <_groupExpr> | <_identExpr>
    const id = this._lexer.peekToken().id;
    if (id === TOK_NUM) { // <number>
      return this._lexer.getToken().val;
    }
    if (id === TOK_LPAREN) {
      return this._groupExpr();
    }
    return this._identExpr();
  }

  _groupExpr () {
    // <_groupExpr> ::= "(" <_expression> ")"
    if (this._lexer.getToken().id !== TOK_LPAREN) {
      throw new SyntaxError();
    }
    const val = this._expression();
    if (this._lexer.getToken().id !== TOK_RPAREN) {
      throw new SyntaxError();
    }
    return val;
  }

  _emptyGroupExpr () {
    // <_emptyGroupExpr> ::= "()"
    if (this._lexer.getToken().id !== TOK_LPAREN || this._lexer.getToken().id !== TOK_RPAREN) {
      throw new SyntaxError();
    }
  }

  _identExpr () {
    // <_identExpr> ::= "pi" | "e" | "last" | <function call>
    // <function call> ::= <unary fn ident> <_groupExpr>
    //                   | <nullary fn ident> <_emptyGroupExpr>
    const token = this._lexer.getToken();
    if (token.id !== TOK_IDENT) {
      throw new SyntaxError();
    }

    switch (token.val) {
      case 'pi':
        return Math.PI;
      case 'e':
        return Math.E;
      case 'last':
        return this._last_val;
      case 'abs':
        return Math.abs(this._groupExpr());
      case 'acos':
        return Math.acos(this._groupExpr());
      case 'acosh':
        return Math.acosh(this._groupExpr());
      case 'asin':
        return Math.asin(this._groupExpr());
      case 'asinh':
        return Math.asinh(this._groupExpr());
      case 'atan':
        return Math.atan(this._groupExpr());
      case 'atanh':
        return Math.atanh(this._groupExpr());
      case 'cbrt':
        return Math.cbrt(this._groupExpr());
      case 'ceil':
        return Math.ceil(this._groupExpr());
      case 'cos':
        return Math.cos(this._groupExpr());
      case 'cosh':
        return Math.cosh(this._groupExpr());
      case 'exp':
        return Math.exp(this._groupExpr());
      case 'floor':
        return Math.floor(this._groupExpr());
      case 'log':
      case 'ln':
        return Math.log(this._groupExpr());
      case 'random':
        this._emptyGroupExpr(); return Math.random();
      case 'round':
        return Math.round(this._groupExpr());
      case 'sin':
        return Math.sin(this._groupExpr());
      case 'sinh':
        return Math.sinh(this._groupExpr());
      case 'sqrt':
        return Math.sqrt(this._groupExpr());
      case 'tan':
        return Math.tanh(this._groupExpr());
      case 'trunc':
        return Math.trunc(this._groupExpr());
      default:
        throw new UndefinedIdent(token.val);
    }
  }
}

// Calculator-------------------------------------------------------------------
// (calculator ui object)

const Calculator = new Lang.Class({
  Name: 'Calculator',
  Extends: PanelMenu.Button,

  _init () {
    this.parent(0.0, 'Calculator', false);
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
  },

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
  },

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
  },

  _initIcon () { // panel icon
    this._icon = new St.Icon({
      icon_name: this._iconName(),
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'system-status-icon'
    });
    this._settings.connect('changed', Lang.bind(this, this._settingsChanged));
  },

  _initContainer () { // container for entry and icon elements
    const calcBox = new St.BoxLayout();
    calcBox.add(this._exprEntry);
    calcBox.add(this._icon);
    this.actor.add_actor(calcBox);
  },

  _initEvents () { // events:
    this.connect('button_press_event', Lang.bind(this, function (actor, event) {
      this._exprEntry2.grab_key_focus();
    }));

    this._exprEntry.clutter_text.connect('key_focus_in', Lang.bind(this, this._on_key_focus_in));
    this._exprEntry.clutter_text.connect('button-release-event', Lang.bind(this, this._on_button_release));
    this._exprEntry.clutter_text.connect('activate', Lang.bind(this, this._on_activate));

    this._exprEntry2.clutter_text.connect('key_focus_in', Lang.bind(this, this._on_key_focus_in));
    this._exprEntry2.clutter_text.connect('button-release-event', Lang.bind(this, this._on_button_release));
    this._exprEntry2.clutter_text.connect('activate', Lang.bind(this, this._on_activate));
  },

  _on_key_focus_in (actor, event) {
    actor._exprFocusedIn = true;
  },

  _on_button_release (actor, event) {
    if (actor._exprFocusedIn) {
      actor.set_selection(0, actor.get_text().length); // doesn't work to simply do this in _on_key_focus_in; don't know why
      actor._exprFocusedIn = false;
    }
  },

  _on_activate (actor, event) {
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
    actor.set_selection(0, result.length);
  },

  _iconName () {
    if (this._exprEntry.visible && this._helpMenuItem.visible) {
      return 'dialog-question-symbolic';
    }
    return 'accessories-calculator-symbolic';
  },

  _settingsChanged () {
    this._icon.icon_name = this._iconName();
  },

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
    last : the last calculated value\n\
    abs(x) : absolute value of x\n\
    acos(x) : arccosine of x, in radians\n\
    acosh(x) : hyperbolic arccosine of x\n\
    asin(x) : arcsine of x, in radians\n\
    asinh(x) : hyperbolic arcsine of x\n\
    atan(x) : arctangent of x between -pi and pi radians\n\
    atanh(x) : hyperbolic arctangent of x\n\
    cbrt(x) : cubic root of x\n\
    ceil(x) : x rounded upwards to the nearest integer\n\
    cos(x) : cosine of x (x is in radians)\n\
    cosh(x) : hyperbolic cosine of x\n\
    exp(x) : value of e raised to the power of x\n\
    floor(x) : x rounded downwards to the nearest integer\n\
    ln(x) or log(x) : natural logarithm (base e) of x\n\
    random() : random number between 0 and 1\n\
    round(x) : rounds x to the nearest integer\n\
    sin(x) : sine of x (x is in radians)\n\
    sinh(x) : hyperbolic sine of x\n\
    sqrt(x) : square root of x\n\
    tan(x) : tangent of an angle\n\
    tanh(x) : hyperbolic tangent of a number\n\
    trunc(x) : integer part of a number x\n\
    tanh(x) : hyperbolic tangent of a number\n\
    trunc(x) : integer part of a number x';
  }
});

// main program-----------------------------------------------------------------

let calculator;

function init () {
}

function enable () {
  calculator = new Calculator();
  Main.panel.addToStatusArea('tpcalc-indicator', calculator);
}

function disable () {
  calculator.destroy();
}
