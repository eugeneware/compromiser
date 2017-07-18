const tape = require('tape');
const it = require('tape-promise').default(tape);
const compromiser = require('..');
const fs = require('fs');
const path = require('path');

it('should be able to resolve a promise', async (t) => {
  t.plan(1);
  let file = path.join(__dirname, 'fixtures', 'test.txt');
  let c = compromiser();
  fs.readFile(file, 'utf8', c.callback);
  let data = await c;
  t.equal(data, 'hello, world\n');
  t.end();
});

it('should be able to reject a promise', async (t) => {
  t.plan(1);
  let file = path.join(__dirname, 'fixtures', 'not-there.txt');
  let c = compromiser();
  fs.readFile(file, 'utf8', c.callback);
  try {
    let data = await c;
  } catch (err) {
    t.equal(err.code, 'ENOENT');
  }
  t.end();
});

it('should be able to resolve a promise with multiple callback arguments', async (t) => {
  t.plan(1);
  let file = path.join(__dirname, 'fixtures', 'test.txt');
  let c = compromiser(true);
  c.callback(null, 'one', 2);
  let data = await c;
  t.deepEqual(data, ['one', 2]);
  t.end();
});

it('should be able to resolve event emitters', async (t) => {
  t.plan(1);
  let file = path.join(__dirname, 'fixtures', 'test.txt');
  let data = '';
  let c = compromiser();
  fs.createReadStream(file, 'utf8')
    .on('data', (chunk) => data += chunk)
    .once('error', c.reject)
    .once('end', c.resolve);
  await c;
  t.equal(data, 'hello, world\n');
  t.end();
});
