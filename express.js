const express = require('express');
const app = express();
const port = 3000;
const { createPR } = require('./index');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/create-pr', async (req, res) => {
  const inputParams = ['owner', 'repo', 'branchName', 'commitMessage', 'prTitle', 'prBody', 'files'];

  for (const param of inputParams) {
    if (!req.body[param]) {
      res.status(400).send(`Missing required parameter: ${param}`);
      return;
    }
  }

  try {
    const githubUrl = await createPR({
      owner: req.body.owner,
      repo: req.body.repo,
      branchName: req.body.branchName,
      commitMessage: req.body.commitMessage,
      prTitle: req.body.prTitle,
      prBody: req.body.prBody,
      files: req.body.files
    });
    return res.json({
      status: 'success',
      url: githubUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating PR');
    return;
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});