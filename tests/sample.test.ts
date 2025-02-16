function sum(a: number, b: number): number {
    return a + b;
  }
  
test('adds 2 + 3 to equal 5', () => {
  expect(sum(2, 3)).toBe(5);
});
