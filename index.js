const express = require('express');
const app = express();
const port = 3000;
const { createPR } = require('./github');
const { generate_code, image_to_task } = require('./openai');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'image/png', limit: '10mb' }));

app.post('/create-pr', async (req, res) => {
  console.log(req.body);
  const inputParams = ['owner', 'repo', 'branchName', 'prTitle', 'prBody', 'files'];

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

app.post("/generate-code", async (req, res) => {
  try {
      const response = await generate_code(req.body);
      res.json({ code: response });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});

app.post("/image-to-task", async (req, res) => {
  try {
      const response = await image_to_task(req.body.toString('base64'));
      res.json(response);
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});

app.listen(process.env.PORT || port, () => {
  console.log(`Server running at http://localhost:${port}`);
});