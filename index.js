module.exports = compromiser;
function compromiser(spread = false) {
  let _resolve;
  let _reject;
  let p = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  p.resolve = _resolve;
  p.reject = _reject;
  p.callback = (err, ...data) => {
    if (err) return _reject(err);
    _resolve(spread ? data : data[0]);
  };
  return p;
}
