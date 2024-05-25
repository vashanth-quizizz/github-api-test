const { Octokit } = require("@octokit/rest");
const { v4: uuid } = require('uuid');
const { get_pr_info } = require('./openai');

let octokit;

async function writeToRoutes({
  owner, repo, branchName, commitMessage, fileObj,
}) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: fileObj.file_path,
  });
  const content = Buffer.from(fileData.content, 'base64').toString();
  const searchString = 'return this.register(Router(), [';
  const insertIndex = content.indexOf(searchString) + searchString.length;
  const newContent = fileObj.code;
  const updatedContent = `${content.slice(0, insertIndex)}\n${newContent},\n${content.slice(insertIndex)}`;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: fileObj.file_path,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });
}

async function writeToControllers({
  owner, repo, branchName, commitMessage, fileObj,
}) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: fileObj.file_path,
  });
  const content = Buffer.from(fileData.content, 'base64').toString();
  let updatedContent = '';

  if (fileObj.code.imports) {
    updatedContent = `${fileObj.code.imports}\n${content}`;
  }

  if (fileObj.code.main) {
    updatedContent = `${updatedContent.slice(0, updatedContent.length - 2)}\n${fileObj.code.main}\n}`;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: fileObj.file_path,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });
}

async function writeToPrompt({
  owner, repo, branchName, commitMessage, fileObj,
}) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: fileObj.file_path,
  });
  const content = Buffer.from(fileData.content, 'base64').toString();
  const newContent = fileObj.code;
  const updatedContent = `${content}\n${newContent}\n`;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: fileObj.file_path,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });
}

async function writeToDto({
  owner, repo, branchName, commitMessage, fileObj,
}) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: fileObj.file_path,
  });
  const content = Buffer.from(fileData.content, 'base64').toString();
  const newContent = fileObj.code;
  const updatedContent = `${content}\n${newContent}\n`;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: fileObj.file_path,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });
}

async function writeToService({
  owner, repo, branchName, commitMessage, fileObj,
}) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: fileObj.file_path,
  });
  const content = Buffer.from(fileData.content, 'base64').toString();
  let updatedContent = '';

  if (fileObj.code.imports) {
    updatedContent = `${fileObj.code.imports}\n${content}`;
  }

  if (fileObj.code.inside_interface) {
    const searchString = 'export interface IQuestionsService {';
    const insertIndex = updatedContent.indexOf(searchString) + searchString.length;
    updatedContent = `${updatedContent.slice(0, insertIndex)}\n${fileObj.code.inside_interface}\n${updatedContent.slice(insertIndex)}`;
  }

  if (fileObj.code.inside_service) {
    updatedContent = `${updatedContent.slice(0, updatedContent.length - 2)}\n${fileObj.code.inside_service}\n}`;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: fileObj.file_path,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });
}

async function initOctoKit() {
  octokit = new Octokit({

    auth: 'placeholder',
    request: {
      fetch,
    },
  });
}

async function createPR({ files, task_description, image_url }) {
  await initOctoKit();
  const owner = 'quizizz';
  const repo = 'ai-service';
  const branchName = `use-case-${uuid()}`;
  const prInfo = await get_pr_info(task_description);
  const prTitle = prInfo.prTitle;
  const prDescription = `${prInfo.prDescription}<br /><br /><img src="${image_url}" alt="image" width="500" height="500">`;

  try {
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    });
    const defaultBranch = repoData.default_branch;
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const sha = refData.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });

    await writeToRoutes({ owner, repo, branchName, commitMessage: 'writing to routes', fileObj: files.code.route });
    await writeToControllers({ owner, repo, branchName, commitMessage: 'writing to controllers', fileObj: files.code.controller });
    await writeToPrompt({ owner, repo, branchName, commitMessage: 'writing to prompt', fileObj: files.code.prompt });
    await writeToDto({ owner, repo, branchName, commitMessage: 'writing to dto', fileObj: files.code.dto });
    await writeToService({ owner, repo, branchName, commitMessage: 'writing to service', fileObj: files.code.service });

    const { data: prData } = await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      body: prDescription,
      head: branchName,
      base: defaultBranch,
    });

    return prData.html_url;
  } catch (error) {
    console.error(`Error creating PR: ${error.message}`);
    throw error;
  }
}


module.exports = {
  createPR
};
