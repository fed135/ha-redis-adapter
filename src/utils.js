/**
 * Utilities
 */

/* Methods -------------------------------------------------------------------*/

function exp(progress, start, end) {
  return start + (end - start) * (progress * progress);
}

function tween(opts) {
  let step = 0;

  return function _tweenStep(progress) {
    if (progress === undefined) step++;
    return (opts.curve || exp)(Math.min(1, ((progress === undefined) ? step : progress / (opts.steps || 1))), opts.base, opts.limit);
  };
}

/* Exports -------------------------------------------------------------------*/

module.exports = { exp, tween };
