import type { ComputeEngine, BoxedExpression, BoxedFunction } from '@cortex-js/compute-engine';

// Lazily imported (it's 1.1 MB minified — comparable to mathlive's own
// size, which already justified a dynamic import for MathField in
// sub-project B1) and cached at module scope so repeated equivalence
// checks in one page session (grading several math-mode questions in the
// same simulado) pay the ~24ms construction cost once, not per call.
let enginePromise: Promise<ComputeEngine> | null = null;

function getSharedEngine(): Promise<ComputeEngine> {
  if (!enginePromise) {
    enginePromise = import('@cortex-js/compute-engine')
      .then(({ ComputeEngine: ComputeEngineClass }) => new ComputeEngineClass())
      .catch((error) => {
        // Don't cache a rejected promise forever — a transient failure
        // (e.g. offline at the exact moment of grading) shouldn't
        // permanently break every later equivalence check in the session.
        enginePromise = null;
        throw error;
      });
  }
  return enginePromise;
}

// A resolved Quantity's magnitude is its first operand (`ops[0]`);
// `expr.re` is NaN for a Quantity node — it doesn't unwrap through units
// on its own. Anything that didn't resolve to a plain number or a
// resolved Quantity (e.g. an unevaluated `5 km - 5 s` from incompatible
// units) also has `re = NaN`, and is correctly never zero.
function isZero(expr: BoxedExpression, tolerance = 1e-9): boolean {
  if (expr.operator === 'Quantity') {
    return Math.abs((expr as BoxedFunction).ops[0].re) <= tolerance;
  }
  if (Number.isNaN(expr.re)) return false;
  return Math.abs(expr.re) <= tolerance;
}

/**
 * Checks whether two LaTeX math expressions are mathematically equivalent
 * — not just textually identical. Handles algebraic/trigonometric
 * identities (via simplification) and physical-unit conversion (via
 * numeric evaluation), each of which the other alone does not cover:
 * `simplify()` never performs unit conversion, and `.N()` cannot fully
 * resolve an expression that still has a free variable in it.
 */
export async function isEquivalentExpression(userLatex: string, acceptedLatex: string): Promise<boolean> {
  if (userLatex.trim() === '' || acceptedLatex.trim() === '') return false;

  let engine: ComputeEngine;
  try {
    engine = await getSharedEngine();
  } catch {
    return false;
  }

  const a = engine.parse(userLatex);
  const b = engine.parse(acceptedLatex);
  if (!a.isValid || !b.isValid) return false;

  const direct = a.isEqual(b);
  if (direct === true) return true;
  if (direct === false) return false;

  // `isEqual` returned undefined (cannot cheaply decide) — cascade
  // through two fallbacks, cheapest and most broadly applicable first.
  const diff = engine.box(['Subtract', a, b]);

  if (isZero(diff.simplify())) return true;

  return isZero(diff.N());
}
