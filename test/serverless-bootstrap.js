const { spawn } = require('child_process');
var psTree = require('ps-tree');

let slsOfflineProcess;

var childrenPIDs;

before(function (done) {
  // increase mocha timeout for this hook to allow sls offline to start
  this.timeout(30000);

  console.log("[Tests Bootstrap] Start");

  startSlsOffline(function (err) {
    if (err) {
      return done(err);
    }

    console.log("[Tests Bootstrap] Done");
    done();
  });
});

after(function () {
  console.log("[Tests Teardown] Start");

  stopSlsOffline();

  console.log("[Tests Teardown] Done");
});

// Helper functions

function startSlsOffline(done) {
  slsOfflineProcess = spawn("serverless", ["offline", "start", "-s", "dev"], {shell: process.platform == 'win32'});

  console.log(`Serverless: Offline started with PID : ${slsOfflineProcess.pid}`);

  slsOfflineProcess.stdout.on('data', (data) => {
    if (data.includes("Offline [HTTP] listening on")) {
      console.log(data.toString().trim());
      psTree(slsOfflineProcess.pid, function (err, children) {
        childrenPIDs = children; // Save children
      });
      done();
    }
  });

  slsOfflineProcess.stderr.on('data', (errData) => {
    console.log(`Error starting Serverless Offline:\n${errData}`);
    done(errData);
  });

}

function stopSlsOffline() {

  console.log(`Stopping children process...`);
  childrenPIDs.forEach(p => {
    console.log(`Child: ${p.COMMAND} PID: ${p.PID}`);
    process.kill(p.PID, 'SIGTERM');
  });

  slsOfflineProcess.kill();
  console.log("Serverless Offline stopped");
}



