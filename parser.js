const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Lexer = Me.imports.lexer.Lexer;
const {
  TOK_UNKNOWN, TOK_END, TOK_NUM, TOK_ADD, TOK_SUB, TOK_MUL, TOK_DIV,
  TOK_EXP = 7, TOK_LPAREN, TOK_RPAREN, TOK_IDENT, TOK_COMMA
} = Me.imports.lexer;

// Parser-----------------------------------------------------------------------
// evaluates expressions

const NoExpression = class NoExpression {}; // exception

const UndefinedIdent = class UndefinedIdent { // exception
  constructor (ident) {
    this.ident = ident; // identifier string
  }
};

const Parser = class Parser {
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

  _binaryGroupExpr () {
    if (this._lexer.getToken().id !== TOK_LPAREN) {
      throw new SyntaxError();
    }
    const arg1 = this._expression();
    if (this._lexer.getToken().id !== TOK_COMMA) {
      throw new SyntaxError();
    }
    const arg2 = this._expression();
    if (this._lexer.getToken().id !== TOK_RPAREN) {
      throw new SyntaxError();
    }
    return { arg1, arg2 };
  }

  _identExpr () {
    // <_identExpr> ::= "pi" | "e" | "last" | <function call>
    // <function call> ::= <nullary fn ident> <_emptyGroupExpr>
    //                   | <unary fn ident> <_groupExpr>
    //                   | <binary fn ident> <_binaryGroupExpr>
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
      case 'atan2': {
        const args = this._binaryGroupExpr();
        return Math.atan2(args.arg1, args.arg2);
      }
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
};
