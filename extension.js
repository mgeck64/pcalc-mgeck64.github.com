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
// (breaks up input expression into chunks (tokens), which serves as input to
// the parser)

const TOK_UNDEF = 0; const TOK_END = 1; const TOK_NUM = 2; const TOK_ADD = 3;
const TOK_SUB = 4; const TOK_MUL = 5; const TOK_DIV = 6; const TOK_EXP = 7;
const TOK_LPAREN = 8; const TOK_RPAREN = 9; const TOK_IDENT = 10;

class Lexer {
  constructor (expr) {
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
    }

    // test for identifier
    this._tryIdent();
    if (idxStart !== this._idx) {
      return { id: TOK_IDENT, val: this._expr.substring(idxStart, this._idx) };
    }

    let id = TOK_UNDEF;
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
        if (idx3 !== this._exprLen && /[0-9]/.test(this._expr[idx3])) {
          ++idx3;
          while (/[0-9]/.test(this._expr[idx3])) {
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
// (evaluates an expression)

class NoExpression {} // exception

class UndefinedIdent { // exception
  constructor (ident) {
    this.ident = ident;
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
    const val = this._additiveExpr();
    if (this._lexer.peekToken().id !== TOK_END) {
      throw SyntaxError();
    }
    this._last_val = val;
    return val;
  }

  _additiveExpr () {
    // <additiveExpr> ::= <multiplicitiveExpr> [ ( "+" | "-" ) <multiplicitiveExpr> ]...
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
    // <multiplicitiveExpr> ::= <exponentialExpr> [ ( "*" | "/" ) <exponentialExpr> ]...
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
    // <exponentialExpr> ::= ( "+" | "-" ) <exponentialExpr>
    //                     | <base> [ ( "**" | "^" ) <exponentialExpr> ]
    // exponentation is right-associative
    if (this._lexer.peekToken().id === TOK_ADD) {
      this._lexer.getToken();
      return +this._exponentialExpr(); // basically does nothing
    }

    if (this._lexer.peekToken().id === TOK_SUB) {
      this._lexer.getToken();
      return -this._exponentialExpr();
    }

    let lhs = this._base();
    if (this._lexer.peekToken().id === TOK_EXP) {
      this._lexer.getToken();
      lhs **= this._exponentialExpr();
    }
    return lhs;
  }

  _base () {
    // <base> ::= <number> | <group> | <identExpr>
    const id = this._lexer.peekToken().id;
    if (id === TOK_NUM) {
      return this._lexer.getToken().val;
    }
    if (id === TOK_LPAREN) {
      return this._group();
    }
    return this._identExpr();
  }

  _group () {
    // <group> ::= "(" <additiveExpr> ")"
    if (this._lexer.getToken().id !== TOK_LPAREN) {
      throw SyntaxError();
    }
    const val = this._additiveExpr();
    if (this._lexer.getToken().id !== TOK_RPAREN) {
      throw SyntaxError();
    }
    return val;
  }

  _emptyGroup () {
    // <emptyGroup> ::= "()"
    if (this._lexer.getToken().id !== TOK_LPAREN || this._lexer.getToken().id !== TOK_RPAREN) {
      throw SyntaxError();
    }
  }

  _identExpr () {
    // <identExpr> ::= pi | e | <unary_fn>
    // <unary_fn> ::= <ident> <group>
    const token = this._lexer.getToken();
    if (token.id !== TOK_IDENT) {
      throw SyntaxError();
    }

    switch (token.val) {
      case 'pi':
        return Math.PI;
      case 'e':
        return Math.E;
      case 'last':
        return this._last_val;
      case 'abs':
        return Math.abs(this._group());
      case 'acos':
        return Math.acos(this._group());
      case 'acosh':
        return Math.acosh(this._group());
      case 'asin':
        return Math.asin(this._group());
      case 'asinh':
        return Math.asinh(this._group());
      case 'atan':
        return Math.atan(this._group());
      case 'atanh':
        return Math.atanh(this._group());
      case 'cbrt':
        return Math.cbrt(this._group());
      case 'ceil':
        return Math.ceil(this._group());
      case 'cos':
        return Math.cos(this._group());
      case 'cosh':
        return Math.cosh(this._group());
      case 'exp':
        return Math.exp(this._group());
      case 'floor':
        return Math.floor(this._group());
      case 'log':
      case 'ln':
        return Math.log(this._group());
      case 'random':
        this._emptyGroup(); return Math.random();
      case 'round':
        return Math.round(this._group());
      case 'sin':
        return Math.sin(this._group());
      case 'sinh':
        return Math.sinh(this._group());
      case 'sqrt':
        return Math.sqrt(this._group());
      case 'tan':
        return Math.tanh(this._group());
      case 'trunc':
        return Math.trunc(this._group());
      default:
        throw new UndefinedIdent(token.val);
    }
  }
}

// Calculator-------------------------------------------------------------------
// (calculator ui object)

const VISIBLE_ICON_NAME = 'dialog-question-symbolic';
const NOT_VISIBLE_ICON_NAME = 'accessories-calculator-symbolic';

const Calculator = new Lang.Class({
  Name: 'Calculator',
  Extends: PanelMenu.Button,

  _init () {
    this.parent(0.0, 'Calculator', false);
    const HINT_TEXT = 'Enter math expression';

    // expression Entry input field and help Icon button:

    this._exprEntry = new St.Entry({
      hint_text: HINT_TEXT,
      track_hover: true,
      can_focus: true,
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'expr-entry'
    });

    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.tbcalc');
    this._settings.bind(
      'allow-entry-on-taskbar',
      this._exprEntry,
      'visible',
      Gio.SettingsBindFlags.DEFAULT
    );
    this._icon = new St.Icon({
      icon_name: this._exprEntry.visible ? VISIBLE_ICON_NAME : NOT_VISIBLE_ICON_NAME,
      style_class: 'system-status-icon'
    });
    this._settings.connect('changed', Lang.bind(this, this._settingsChanged));

    // container for Entry and Icon elements:

    this._calcBox = new St.BoxLayout();
    this._calcBox.add(this._exprEntry);
    this._calcBox.add(this._icon);
    this.actor.add_actor(this._calcBox);

    // help popup:

    const WIDTH = 375;

    this._exprEntry2 = new St.Entry({
      hint_text: 'Enter a mathematical expression',
      track_hover: true,
      can_focus: true,
      width: WIDTH,
      style_class: 'expr-entry2'
    });
    let helpItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });
    helpItem.actor.add_actor(this._exprEntry2);
    this.menu.addMenuItem(helpItem);

    const helpText = new St.Label({
      text: this._helpContent(),
      width: WIDTH,
      style_class: 'help-text'
    });
    helpItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });
    helpItem.actor.add_actor(helpText);
    this.menu.addMenuItem(helpItem);

    // events:

    this.connect('button_press_event', Lang.bind(this, function (actor, event) {
      this._exprEntry2.grab_key_focus();
    }));

    this._exprEntry.clutter_text.connect('key_focus_in', Lang.bind(this, this._on_key_focus_in));
    this._exprEntry.clutter_text.connect('button-release-event', Lang.bind(this, this._on_button_release));
    this._exprEntry.clutter_text.connect('activate', Lang.bind(this, this._on_activate));

    this._exprEntry2.clutter_text.connect('key_focus_in', Lang.bind(this, this._on_key_focus_in));
    this._exprEntry2.clutter_text.connect('button-release-event', Lang.bind(this, this._on_button_release));
    this._exprEntry2.clutter_text.connect('activate', Lang.bind(this, this._on_activate));

    // parser:

    this._parser = new Parser();
  },

  _on_key_focus_in (actor, event) {
    actor._exprFocusedIn = true;
  },

  _on_button_release (actor, event) {
    if (actor._exprFocusedIn) {
      actor.set_selection(0, actor.get_text().length); // can't simply do this in key_focus_in handler
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
        result = 'Internal error';
      }
    }
    this._exprEntry.set_text(result);
    this._exprEntry2.set_text(result);
    actor.set_selection(0, result.length);
  },

  _settingsChanged () {
    this._icon.icon_name = this._exprEntry.visible ? VISIBLE_ICON_NAME : NOT_VISIBLE_ICON_NAME;
  },

  _helpContent () {
    return '\
Expression example: 2+4*8, which means multiply 4 by 8\n\
and add 2 to the result. Supported operators:\n\
    + addition\n\
    - subtraction and negation\n\
    * multiplication\n\
    / division\n\
    ^ or ** exponentation (right-associative)\n\
\n\
Use parentheses to override operator precedence; e.g.,\n\
(2+4)*8 means add 2 to 4 and multiply the result by 8.\n\
\n\
The constants pi and e are available. Also available are\n\
the following math functions:\n\
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
    log(x) : natural logarithm (base e) of x\n\
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
