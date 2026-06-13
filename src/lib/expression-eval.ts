/**
 * Safe math expression evaluator
 * Replaces the unsafe Function() constructor usage
 * Supports: +, -, *, /, parentheses, and variable substitution
 */

export function evaluateExpression(
  expression: string,
  variables: Record<string, number | undefined>
): number {
  // Replace Chinese variables
  let normalized = expression
    .replace(/有效分数/g, 'effectiveScore')
    .replace(/分数/g, 'score')
    .replace(/速度/g, 'speed');

  // Substitute variables
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      normalized = normalized.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
    }
  }

  // Tokenize and evaluate
  const tokens = tokenize(normalized);
  const result = parseExpression(tokens, 0);
  return result.value;
}

interface ParseResult {
  value: number;
  pos: number;
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');

  while (i < s.length) {
    const ch = s[i];

    // Number (including decimals)
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = '';
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) {
        num += s[i++];
      }
      tokens.push(num);
      continue;
    }

    // Operators and parens
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }

    // Skip unknown characters
    i++;
  }

  return tokens;
}

// Expression = Term (('+' | '-') Term)*
function parseExpression(tokens: string[], pos: number): ParseResult {
  let result = parseTerm(tokens, pos);

  while (result.pos < tokens.length) {
    const op = tokens[result.pos];
    if (op === '+' || op === '-') {
      const right = parseTerm(tokens, result.pos + 1);
      result = {
        value: op === '+' ? result.value + right.value : result.value - right.value,
        pos: right.pos
      };
    } else {
      break;
    }
  }

  return result;
}

// Term = Factor (('*' | '/') Factor)*
function parseTerm(tokens: string[], pos: number): ParseResult {
  let result = parseFactor(tokens, pos);

  while (result.pos < tokens.length) {
    const op = tokens[result.pos];
    if (op === '*' || op === '/') {
      const right = parseFactor(tokens, result.pos + 1);
      result = {
        value: op === '*' ? result.value * right.value : result.value / right.value,
        pos: right.pos
      };
    } else {
      break;
    }
  }

  return result;
}

// Factor = Number | '(' Expression ')' | '-' Factor
function parseFactor(tokens: string[], pos: number): ParseResult {
  if (pos >= tokens.length) {
    return { value: 0, pos };
  }

  const token = tokens[pos];

  // Unary minus
  if (token === '-') {
    const result = parseFactor(tokens, pos + 1);
    return { value: -result.value, pos: result.pos };
  }

  // Parentheses
  if (token === '(') {
    const result = parseExpression(tokens, pos + 1);
    // Skip closing paren
    return { value: result.value, pos: result.pos + 1 };
  }

  // Number
  const num = parseFloat(token);
  if (!isNaN(num)) {
    return { value: num, pos: pos + 1 };
  }

  return { value: 0, pos: pos + 1 };
}
