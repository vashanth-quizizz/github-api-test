const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: 'random'
});

async function createPR({
  owner,
  repo,
  branchName,
  commitMessage,
  prTitle,
  prBody,
  files,
}) {
  try {
    const filePath = files[0].path;
    
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo
    });
    const defaultBranch = repoData.default_branch;

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    });
    const sha = refData.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha
    });

    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath
    });
    const content = Buffer.from(fileData.content, 'base64').toString();
    const newContent = files[0].content;
    const updatedContent = content.slice(0, content.length - 1) + "\n" + newContent + '\n}';

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: fileData.sha,
      branch: branchName
    });

    const { data: prData } = await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: defaultBranch
    });

    console.log(`Pull Request created: ${prData.html_url}`);

    return prData.html_url;
  } catch (error) {
    console.error(`Error creating PR: ${error.message}`);
  }
}

module.exports = {
  createPR
};
