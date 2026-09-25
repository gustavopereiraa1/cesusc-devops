const sum = require('../src/sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum([1, 2])).toBe(3);
});

test('adds -1 + 1 to equal 0', () => {
  expect(sum([-1, 1])).toBe(0);
});

test('adds 1, 2, 3, 4, 5 to equal 15', () => {
  expect(sum([1, 2, 3, 4, 5])).toBe(15);
});
