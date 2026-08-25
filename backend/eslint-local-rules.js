/**
 * Local ESLint rules for COPPA compliance (FRAMEWORK.md Decision #29).
 * Referenced from .eslintrc.json via eslint-plugin-local-rules.
 */

// Blocked: exact-date-of-birth identifiers. The compliant pattern is
// birth_year (coarse, year-only) + is_under_13, not an exact DOB.
const DOB_PATTERN = /^(date_?of_?birth|dob|birth_?date)$/i;

// Blocked: exact-coordinate identifiers. Coarse location (city, zip) is
// fine; storing precise lat/long is not. Deliberately NOT matching bare
// "long" -- too common an English word/identifier (cache tiers, generic
// "long" naming) to use as a coordinate signal on its own.
const GPS_PATTERN = /^(lat(itude)?|lon(gitude)?|gps_?coord(inates)?)$/i;

function checkIdentifierName(node, name, context) {
  if (DOB_PATTERN.test(name)) {
    context.report({
      node,
      message:
        'COPPA (FRAMEWORK.md Decision #29): do not store an exact date of birth. ' +
        'Use birth_year (coarse) + is_under_13 instead.',
    });
  } else if (GPS_PATTERN.test(name)) {
    context.report({
      node,
      message:
        'COPPA (FRAMEWORK.md Decision #29): do not store precise GPS coordinates. ' +
        'Use a coarse location value (city, zip) if location is needed at all.',
    });
  }
}

'use strict';

module.exports = {
  'no-exact-dob-or-gps': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow identifiers that store an exact date of birth or precise GPS coordinates (COPPA schema minimization).',
      },
      schema: [],
    },
    create(context) {
      return {
        // Catches: const dob = ...; function f(date_of_birth) {}
        Identifier(node) {
          // Only flag declaration/binding positions, not every reference,
          // so a variable named `dob` is flagged once at its declaration
          // rather than at every subsequent use.
          const parent = node.parent;
          if (!parent) return;

          const isDeclarationOrParam =
            (parent.type === 'VariableDeclarator' && parent.id === node) ||
            (parent.type === 'FunctionDeclaration' && parent.params.includes(node)) ||
            (parent.type === 'ArrowFunctionExpression' && parent.params.includes(node)) ||
            (parent.type === 'FunctionExpression' && parent.params.includes(node));

          if (isDeclarationOrParam) {
            checkIdentifierName(node, node.name, context);
          }
        },
        // Catches: { date_of_birth: value } and interface fields
        Property(node) {
          if (node.key.type === 'Identifier') {
            checkIdentifierName(node.key, node.key.name, context);
          }
        },
        TSPropertySignature(node) {
          if (node.key && node.key.type === 'Identifier') {
            checkIdentifierName(node.key, node.key.name, context);
          }
        },
      };
    },
  },
};
