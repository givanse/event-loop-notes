#!/usr/bin/env node

// https://medium.com/the-node-js-collection/what-you-should-know-to-really-understand-the-node-js-event-loop-and-its-metrics-c4907b19da4c
// https://blog.risingstack.com/node-js-at-scale-understanding-node-js-event-loop/#event-loop
// https://html.spec.whatwg.org/multipage/webappapis.html#task-queue

// The event loop as a process is a set of phases with specific tasks that are processed in a round-robin manner.

const chalk = require('chalk');
const fs = require('fs');

const logger = {
  // timers
  t: function() {
    console.log(chalk.blue('     timers phase queue'), ...arguments);
  },
  // poll phase (IO Callbacks)
  // it has a hard maximum (system dependent) before it stops polling for more events.
  p: function() {
    console.log(chalk.yellow('  poll phase queue'), ...arguments);
  },
  // pending callbacks (some system operations)
  pc: function() {
    console.log(chalk.gray('pending callbacks'), ...arguments);
  },
  /**
   * nextTick is not really the next tick, its just `immediate` and then
   * setImmediate is not really immediate at all, its more like the next tick 
   *  - Bert Belder
   */
  // check 
  // runs immediately after the poll phase completed or has become idle
  // fires on the following iteration or 'tick' of the event loop
  immediate: function() {
    console.log(chalk.magenta('   check phase'), ...arguments);
  },
  // Tick - Will resolve before the event loop continues.
  // It allows you to "starve" your I/O by making recursive process.nextTick() calls
  // Alternative phrasing:
  //   Allow the script to run to completion before executing the callback.
  tick: function() {
    console.log(chalk.cyan('    tick'), ...arguments);
  },
  // close events
  ce: function() {
    console.log(chalk.gray('close events'), ...arguments);
  },
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

function blockQueue(ms) {
  const startCallback = Date.now();
  while (Date.now() - startCallback < ms) {
    // do nothing
  }
}

const arr = [

  () => {
    const m = 0;
    const scheduled = Date.now();
    setTimeout(function() {
      const delay = Date.now() - scheduled;
      logger.t(`timeout ${m} (delay ${delay})`);
    }, m);
    console.log(`setTimeout(${m}) scheduled`);
  },

  () => {
    const m = 1000;
    const scheduled = Date.now();
    setTimeout(function() {
      const delay = Date.now() - scheduled - m;
      logger.t(`timeout ${m} (delay ${delay})`);
    }, m);
    console.log(`setTimeout(${m}) scheduled`);
  },

  () => {
    const m = 0;
    const scheduled = Date.now();
    const id = setInterval(function() {
      const delay = Date.now() - scheduled;
      logger.t(`interval ${m} (delay ${delay})`);
      clearInterval(id);
    }, m);
    console.log(`setInterval(${m}) scheduled`);
  },

  () => {
    const total = 2;
    let count = 1;
    const m = 1000;
    const scheduled = Date.now();
    const id = setInterval(function() {
      let delay = Date.now() - scheduled;
      delay -= m * count;
      logger.t(`interval ${m} ${count}/${total} (delay ${delay})`);
      count++;
      if (count > total) clearInterval(id);
    }, m);
    console.log(`setInterval(${m}) scheduled`);
  },

  /*() =>  {
    const m = 1000;
    fs.readFile('index.js', function(err/*, data/) {
      if (err) throw err;
      blockQueue(m);
      logger.p(`read index.js (blocking ${m})`);
    });
    console.log(`readFile (block ${m}) scheduled`);
  },*/

  () =>  {
    const m = 2000;
    fs.readFile('index.js', function(err/*, data*/) {
      if (err) throw err;
      blockQueue(m);
      logger.p(`read index.js (blocking ${m})`);

      global.setImmediate(function() {
        logger.immediate('setImmediate');
      });
    });
    console.log(`readFile (block ${m}) scheduled`);

  },

  () => {
    // setImmediate() is actually a special timer that runs in a separate phase of the event loop.
    // It uses a libuv API that schedules callbacks to execute after the poll phase has completed.
    /**
     * The main advantage to using setImmediate() over setTimeout() is setImmediate() will always be executed
     * before any timers if scheduled within an I/O cycle, independently of how many timers are present.
     */
    global.setImmediate(function() {
      logger.immediate('setImmediate');
    });
    console.log(`setImmediate scheduled`);
  },

  () => {
    process.nextTick(function() {
      logger.tick('nextTick');
    });
    console.log(`nextTick scheduled`);
  },

];

function run() {
  shuffle(arr);

  console.log(chalk.white('start scheduling'));
  for (const fn of arr) {
    fn();
  }
  console.log(chalk.white('done scheduling\n'));
}


global.setImmediate(function() { console.log('on main: immediate'); });
global.setTimeout(function() { console.log('on main: timeout'); }, 0);
process.nextTick(function() { console.log('on main: next tick'); });

run();

console.log('on main: event loop for main complete');
