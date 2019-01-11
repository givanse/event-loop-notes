#!/usr/bin/env node

function test() {
  setImmediate(() => {
    console.log('immediate');
  });

  setTimeout(() => {
    console.log('timeout');
  }, 0);
}

function testAsync() {
  const p2 = new Promise(function(resolve) {
    setImmediate(() => {
      resolve('immediate');
    });
  });

  const p1 = new Promise(function(resolve) {
    setTimeout(() => {
      resolve('timeout');
    }, 0);
  });

  return Promise.all([p1, p2]);
}

async function run() {
  for (let i = 0; i < 5; i++) {
    test();
  }

  for (let i = 0; i < 5; i++) {
    const str = await testAsync();
    console.log(str.join(''));
  }
}

run();

