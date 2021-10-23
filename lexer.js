// Lexer------------------------------------------------------------------------
// scans an expression string as a sequence of "tokens", which serves as input
// to the parser

const TOK_UNKNOWN = 0; const TOK_END = 1; const TOK_NUM = 2; const TOK_ADD = 3;
const TOK_SUB = 4; const TOK_MUL = 5; const TOK_DIV = 6; const TOK_EXP = 7;
const TOK_LPAREN = 8; const TOK_RPAREN = 9; const TOK_IDENT = 10;
const TOK_COMMA = 11;
// if token constant added/removed from above then make sure to update parser.js
// imports list

const Lexer = class Lexer {
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
      return { id: TOK_NUM, val: this._expr.substring(idxStart, this._idx) };
      // parser will do conversion to numeric type
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
      case ',':
        id = TOK_COMMA; break;
    }
    ++this._idx;
    return { id: id, val: null };
  }

  _tryNumber () {
    let idx2 = this._idx;
    let digits = false;
    let dpoint = false;
    const decimalPattern = /[0-9]/;
    let digitPattern = decimalPattern;

    // number begins with radix prefix (0b, 0o, 0x), decimal digit or decimal point
    const subLen = this._exprLen - this._idx;
    if (subLen >= 2 && this._expr[idx2] === '0' && /[bB]/.test(this._expr[idx2 + 1])) {
      digitPattern = /[01]/;
      idx2 += 2;
    } else if (subLen >= 2 && this._expr[idx2] === '0' && /[oO]/.test(this._expr[idx2 + 1])) {
      digitPattern = /[0-7]/;
      idx2 += 2;
    } else if (subLen >= 2 && this._expr[idx2] === '0' && /[xX]/.test(this._expr[idx2 + 1])) {
      digitPattern = /[0-9a-fA-F]/;
      idx2 += 2;
    } else if (subLen >= 1 && decimalPattern.test(this._expr[idx2])) {
      digits = true;
      ++idx2;
    } else if (subLen >= 1 && this._expr[idx2] === '.') {
      dpoint = true;
      ++idx2;
    } else {
      return;
    }

    while (idx2 !== this._exprLen) {
      if (digitPattern.test(this._expr[idx2])) {
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
    }

    if (digits) { // check for 'e' exponential notation
      let idx3 = idx2;
      if (idx3 !== this._exprLen && /[eE]/.test(this._expr[idx3])) {
        ++idx3;
        if (idx3 !== this._exprLen && /[+-]/.test(this._expr[idx3])) {
          ++idx3;
        }
        if (idx3 !== this._exprLen && decimalPattern.test(this._expr[idx3])) {
          ++idx3;
          while (decimalPattern.test(this._expr[idx3])) {
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
};
