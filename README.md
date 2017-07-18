# compromiser

A Promise that's also a callback. Helpful for adapting callback APIs and event emitters for async/await code.

[![build status](https://secure.travis-ci.org/eugeneware/compromiser.png)](http://travis-ci.org/eugeneware/compromiser)

## Installation

This module is installed via npm:

``` bash
$ npm install compromiser
```

## Background

Promises are great, and tools like `util.promisify()` help to convert callbacks to promises,
but fall short of many other use case such as event emitters, which makes writing neat
async/await code really annoying if you want to wait for the result before continuing execution.

Here's a typical example WITHOUT using `compromiser` where you have to wrap the async stuff
inside a promise and `await` on it, otherwise the control flow would 'fall through':

``` js
async function main() {
  let contents = '';
  // have to wrap async work inside a promise so you can await for it.
  let p = new Promise((resolve, reject) => {
    fs.createReadStream('/etc/passwd', 'utf8')
      .on('data', (chunk) => contents += chunk)
      .once('error', reject)
      .once('end', () => resolve(contents));
  });
  try {
    // if we don't await for the promise above, we would fall through here when we
    // want to "block" and wait for the async behaviour to complete.
    let data = await c;
    console.log(data);
    // prints out contents of /etc/passwd
  } catch (err) {
    console.error(err);
  }
}
main().catch(console.error);
```

Here's the same code using `compromiser`:

``` js
const compromiser = require('compromiser');
const fs = require('fs');

async function main() {
  let contents = '';
  let c = compromiser();
  // pass `c.reject` or `c.resolve` through to regular event emitter functions
  fs.createReadStream('/etc/passwd', 'utf8')
    .on('data', (chunk) => contents += chunk)
    .once('error', c.reject)
    .once('end', () => c.resolve(contents));

  try {
    let data = await c;
    console.log(data);
    // prints out contents of /etc/passwd
  } catch (err) {
    console.error(err);
  }
}
main().catch(console.error);
```

### Standard Callback Example

And if you can't be bothered `promisifying` everything then you can use `compromiser` to
resolver promises by passing in `c.callback` where a regular error-first callback would be expected:

``` js
const compromiser = require('compromiser');
const fs = require('fs');

async function main() {
  let c = compromiser();
  fs.readFile('/etc/passwd', 'utf8', c.callback);
  try {
    let data = await c;
    console.log(data);
    // prints out contents of /etc/passwd
  } catch (err) {
    console.error(err);
  }
}
main().catch(console.error);
```

## Multiple callback arguments

There are a few callbacks that may take multiple callback arguments. To get these, you can pass
through `true` as the argument for `compromiser()` which will `spread` the callback arguments
and return them as an array.

Here's an example with `request`:

``` js
const request = require('request');
const compromised = require('compromised');

async function main() {
  let c = compromised(true);
  request('http://example.com/test.html', c);
  try {
    // the two return variables in the (err, response, body) callback will
    // be returned in an array.
    let [response, body] = await c;
    console.log(response, body);
  } catch (err) {
    // the error will appear here
    console.error(err);
  }
}
main().catch(console.error);

```

## API

### `compromiser([spread = false])`

Creates a new instance of a compromiser `Promise`. Passing `true` through as
the `spread` argument will return multiple callback arguments back as an array.

The default is `false`.

The instance of compromiser is a Promise. It does have a few other methods
added which are detailed below.

### `compromiser#resolve(value)`

Resolve the underlying promise

### `compromiser#reject(err)`

Reject the underlying `Promise` with an error.

### `compromiser#callback(err, results)`

Returns a node.js `thunk` (a function with the signature `c(err, results)`.

Pass this to a node.js style callback and then based on the result of the
callback, the undelrying `Promise` will be resolved/rejected.

If the `compromiser` was created with `spread = true` then you can call this
function with multiple callback results and they will be resolved as an array.
