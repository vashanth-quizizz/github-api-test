const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: 'random'
});

const owner = 'quizizz';
const repo = 'ai-service';
const branchName = 'test-branch';
const filePath = 'src/services/questions/questions.service.ts';
const commitMessage = 'Update service file';
const prTitle = 'Update service file';
const prBody = 'PR Body random';

async function createPR() {
  try {
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
    const newContent = `
async newFunction(
  body: summarizeQuestionInputBodyType,
): Promise<Result<AIServiceResponse>> {
  const { grades, subjects } = body.payload.quizDetails || {};

  const question = getQuestionTextForAnswerExplanation(body.payload.question);

  // Quiz Details handling
  let gradeSuffix = '\nGrade: K-12';

  let subjectSuffix = '';

  const llmRequest: LLMRequest = {
    prompt: {
      template: SUMMARIZE_QUESTION_PROMPT_TEMPLATE,
    },
    templateVariables: {
      question,
      gradeSuffix,
      subjectSuffix,
    },
    formatter: {
      zodSchema: z.object(summarizeQuestionSchema),
    },
    modelParams: {
      modelName: MODEL_NAMES.GPT_35_TURBO,
      timeout: 60000,
      temperature: 0,
      ...body.modelParams,
    },
    requestMeta: {
      eventName: 'summarizeQuestion',
      ...body.meta,
    },
  };
  return this.llmService.handle(llmRequest);
}
    `;
    const updatedContent = content.slice(0, content.length - 2) + newContent + '}\n}';

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
  } catch (error) {
    console.error(`Error creating PR: ${error.message}`);
  }
}

createPR();
