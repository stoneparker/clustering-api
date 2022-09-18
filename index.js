const cluster = require('cluster');
const { fork } = require('child_process');
const express = require('express');
const fastq = require('fastq');

if (cluster.isPrimary) {
  const WORKERS_QUANTITY = 2;

  for (let i = 0; i < WORKERS_QUANTITY; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    const worker = cluster.workers[id];

    worker.on('message', (msg) => {
      console.log(`New message - worker ${worker.process.pid}:`, msg);
    });
  }
} else {
  console.log(`Worker ${process.pid} started`);
  runServer();
}

function runServer() {
  // TO DO: iniciar subprocessos. no worker da fila, escolher o subprocesso com round robin e pedir execução da soma
  // const child1 = fork('./src/children/child1.js');
  // const child2 = fork('./src/children/child2.js');
  // const child3 = fork('./src/children/child3.js');

  const SERVER_PORT = 4444;

  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send(`Hello world from worker ${process.pid}.`);
  });

  app.get('/sum/:operand1/:operand2', (req, res) => {
    const { operand1, operand2 } = req.params;

    // TO DO: entender como o worker é processado, considerando as concorrências
    const queue = fastq(({ operand1, operand2 }) => {
      const sum = Number(operand1) + Number(operand2);

      process.send({ sum });
      res.json({ sum });
    }, 3);

    queue.push({ operand1, operand2 }, (err) => {
      if (err) throw err;
    });
  });

  app.listen(SERVER_PORT, () => {
    console.log(`App listening on port ${SERVER_PORT}`);
  });
}
