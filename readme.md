# pcalc

A text-based calculator that lives on the panel (top bar), out of the way of
your work.

In it's default configuration, it presents an entry field on the panel in which
a mathematical expression can be entered and evaluated, and it presents an icon
that can be pressed (clicked) to present a popup with a larger entry field and
help information.

The calculator can be configured to not present the entry field on the panel, in
which case it's icon can be pressed (clicked) to present the popup with the
larger entry field.

The calculator can also be configured to not present help information on the
popup, in which case the popup will just have the larger entry field.

An example of an expression is 2+4*8, which means multiply 4 by 8 and add 2 to
the result.

Supported operators:\
    + addition\
    - subtraction and negation\
    * multiplication\
    / division\
    ^ or ** exponentiation (right-associative)\

Use parentheses to override operator precedence; e.g.,
(2+4)*8 means add 2 to 4 and multiply the result by 8.

The following special values and functions are available:\
    pi : Did you know that March 14 is Pi day?\
    e : Euler\'s number\
    last : the last calculated value\
    abs(x) : absolute value of x\
    acos(x) : arccosine of x, in radians\
    acosh(x) : hyperbolic arccosine of x\
    asin(x) : arcsine of x, in radians\
    asinh(x) : hyperbolic arcsine of x\
    atan(x) : arctangent of x between -pi and pi radians\
    atanh(x) : hyperbolic arctangent of x\
    cbrt(x) : cubic root of x\
    ceil(x) : x rounded upwards to the nearest integer\
    cos(x) : cosine of x (x is in radians)\
    cosh(x) : hyperbolic cosine of x\
    exp(x) : value of e raised to the power of x\
    floor(x) : x rounded downwards to the nearest integer\
    ln(x) or log(x) : natural logarithm (base e) of x\
    random() : random number between 0 and 1\
    round(x) : rounds x to the nearest integer\
    sin(x) : sine of x (x is in radians)\
    sinh(x) : hyperbolic sine of x\
    sqrt(x) : square root of x\
    tan(x) : tangent of an angle\
    tanh(x) : hyperbolic tangent of a number\
    trunc(x) : integer part of a number x\
    tanh(x) : hyperbolic tangent of a number\
    trunc(x) : integer part of a number x';\
