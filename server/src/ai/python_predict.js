const { spawn } = require('child_process');

const predictWithPython = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['ai_model.py', JSON.stringify(inputData)]);

    let data = '';
    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (err) => {
      reject(err.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`Python script exited with code ${code}`);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};

module.exports = predictWithPython;