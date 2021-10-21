# pcalc

A text-based calculator that lives on the gnome panel (top bar), out of the way
of your work.

In it's default configuration, the calculator provides a text entry field on the
panel into which a mathematical expression can be entered for evaluation; the
calculator also provides an icon next to the entry field that can be pressed
(clicked) to present a popup that has a larger entry field and help information.

The calculator can be configured to disable the entry field on the panel so that
only the icon appears there; pressing (clicking) the icon presents the popup
having the larger entry field.

The calculator can also be configured to not show help information on the popup,
in which case the popup will have the larger entry field by itself.
## Basic guide for expressions
An example of an expression is 2+4*8, which means multiply 4 by 8 and add 2 to
the result.

Supported operators:\
&nbsp;&nbsp;&nbsp;&nbsp;+ addition\
&nbsp;&nbsp;&nbsp;&nbsp;- subtraction and negation\
&nbsp;&nbsp;&nbsp;&nbsp;* multiplication\
&nbsp;&nbsp;&nbsp;&nbsp;/ division\
&nbsp;&nbsp;&nbsp;&nbsp;^ or ** exponentiation (right-associative)

Use parentheses to override operator precedence; e.g.,
(2+4)*8 means add 2 to 4 and multiply the result by 8.

The following special values and functions are available:\
&nbsp;&nbsp;&nbsp;&nbsp;pi : Did you know that March 14 is Pi day?\
&nbsp;&nbsp;&nbsp;&nbsp;e : Euler\'s number\
&nbsp;&nbsp;&nbsp;&nbsp;last : the last calculated value\
&nbsp;&nbsp;&nbsp;&nbsp;abs(x) : absolute value of x\
&nbsp;&nbsp;&nbsp;&nbsp;acos(x) : arccosine of x, in radians\
&nbsp;&nbsp;&nbsp;&nbsp;acosh(x) : hyperbolic arccosine of x\
&nbsp;&nbsp;&nbsp;&nbsp;asin(x) : arcsine of x, in radians\
&nbsp;&nbsp;&nbsp;&nbsp;asinh(x) : hyperbolic arcsine of x\
&nbsp;&nbsp;&nbsp;&nbsp;atan(x) : arctangent of x between -pi and pi radians\
&nbsp;&nbsp;&nbsp;&nbsp;atanh(x) : hyperbolic arctangent of x\
&nbsp;&nbsp;&nbsp;&nbsp;cbrt(x) : cubic root of x\
&nbsp;&nbsp;&nbsp;&nbsp;ceil(x) : x rounded upwards to the nearest integer\
&nbsp;&nbsp;&nbsp;&nbsp;cos(x) : cosine of x (x is in radians)\
&nbsp;&nbsp;&nbsp;&nbsp;cosh(x) : hyperbolic cosine of x\
&nbsp;&nbsp;&nbsp;&nbsp;exp(x) : value of e raised to the power of x\
&nbsp;&nbsp;&nbsp;&nbsp;floor(x) : x rounded downwards to the nearest integer\
&nbsp;&nbsp;&nbsp;&nbsp;ln(x) or log(x) : natural logarithm (base e) of x\
&nbsp;&nbsp;&nbsp;&nbsp;random() : random number between 0 and 1\
&nbsp;&nbsp;&nbsp;&nbsp;round(x) : rounds x to the nearest integer\
&nbsp;&nbsp;&nbsp;&nbsp;sin(x) : sine of x (x is in radians)\
&nbsp;&nbsp;&nbsp;&nbsp;sinh(x) : hyperbolic sine of x\
&nbsp;&nbsp;&nbsp;&nbsp;sqrt(x) : square root of x\
&nbsp;&nbsp;&nbsp;&nbsp;tan(x) : tangent of an angle\
&nbsp;&nbsp;&nbsp;&nbsp;tanh(x) : hyperbolic tangent of a number\
&nbsp;&nbsp;&nbsp;&nbsp;trunc(x) : integer part of a number x\
&nbsp;&nbsp;&nbsp;&nbsp;tanh(x) : hyperbolic tangent of a number\
&nbsp;&nbsp;&nbsp;&nbsp;trunc(x) : integer part of a number x
