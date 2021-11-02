const { sum } = require('./sum');

function main() {
  for (let i = 1; i <= 10; i++) {
    console.log(`the sum of ${i} + ${i} is ${sum(i, i)}`);
  }
}

main();
