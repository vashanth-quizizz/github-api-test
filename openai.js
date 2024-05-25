const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: 'placeholder'
});

async function generate_code(input) {
    const { task_description, input_variables, output_variables } = input;
    
    const prompt = `Example:
    Task: Given a question, summarize the question and return the notice and wonder for correct and incorrect answers.
    Input Variables: question (query, options, answer, type), quizDetails (grades, subjects)
    Output Variables: correct (notice - Notice for correct answer, wonder - Wonder for correct answer), incorrect (notice - Notice for incorrect answer, wonder - Wonder for incorrect answer)
    Output:
    \`\`\`json
    {
        'thought': 'Names:\n    - Route: POST /questions/summarize-question\n    - Controller: summarizeQuestion\n    - Service: summarizeQuestion.\n    - DTO: summarizeQuestionInput, summarizeQuestionInputBodyType, summarizeQuestionOutputBodyType\n    - Prompt: SUMMARIZE_QUESTION_PROMPT_TEMPLATE\nFiles:\n    - Route: src/routes/http/index.ts\n    - Controller: src/controllers/questions.controller.ts\n    - Service: src/services/questions/questions.service.ts\n    - DTO: src/services/questions/questions.dtos.ts\n    - Prompt: src/services/questions/prompts.ts'
        'route': {
            'file_path': 'src/routes/http/index.ts',
            'code': '{\n    method: 'post',\n    route: '/questions/summarize-question',\n    middlewares: middlewares,\n    controller: this.questionsController.summarizeQuestion(),\n}',
        },
        'dto': {
            'file_path': 'src/services/questions/questions.dtos.ts',
            'code': 'export const summarizeQuestionInput = {\n  body: z.object({\n    payload: z.object({\n      question: z.object({\n        query: z.string(),\n        options: z.any().optional(),\n        answer: z.any(),\n        type: z.string(),\n      }),\n      quizDetails: z.object({\n        grades: z.array(z.string()).optional(),\n        subjects: z.array(z.string()).optional(),\n      }),\n    }),\n    modelParams: ModelParamsSchema,\n    meta: RequestMetaSchema,\n  }),\n};\n\n
    
    export type summarizeQuestionInputBodyType = z.infer<\n  typeof summarizeQuestionInput.body\n>;\n\nexport const summarizeQuestionOutputBodyType = {\n  correct: z\n    .object({\n      notice: z.string().describe('Notice for correct answer'),\n      wonder: z.string().describe('Wonder for correct answer'),\n    })\n    .describe('Notice-wonder block for correct answer'),\n  incorrect: z\n    .object({\n      notice: z.string().describe('Notice for incorrect answer'),\n      wonder: z.string().describe('Wonder for incorrect answer'),\n    })\n    .describe('Notice-wonder block for incorrect answer'),\n};',
        }
        'controller': {
            'file_path': 'src/controllers/questions.controller.ts',
            'code': {
                'imports': 'import { summarizeQuestionInputBodyType } from '@app/services/questions/questions.dtos';',
                'main': '  summarizeQuestion() {\n    const questionsService = this.questionsService;\n    return {\n      name: 'summarize-question-controller',\n      validate: (req: { body: summarizeQuestionInputBodyType }) => {\n        const {\n          body: {\n            payload: { question },\n          },\n        } = req;\n        if (!(question?.query || '').trim()) {\n          return {\n            error: {\n              details: [{ message: 'question is empty' }],\n            },\n            value: req.body,\n          };\n        }\n        if (question?.answer === undefined || question?.answer === null) {\n          return {\n            error: {\n              details: [{ message: 'answer is empty' }],\n            },\n            value: req.body,\n          };\n        }\n      },\n      async exec(req: { body: summarizeQuestionInputBodyType }) {\n        const data = await questionsService.summarizeQuestion(req.body);\n        return {\n          data,\n        };\n      },\n    };\n  }',
            }
        },
        'service': {
            'file_path': 'src/services/questions/questions.service.ts',
            'code': {
                'imports': 'import { SUMMARIZE_QUESTION_PROMPT_TEMPLATE } from './prompts';\nimport {  summarizeQuestionInputBodyType, summarizeQuestionOutputBodyType } from './questions.dtos';',
                'inside_interface': '    summarizeQuestion(\n        body: summarizeQuestionInputBodyType,\n    ): Promise<Result<AIServiceResponse>>;',
                'inside_service': '    async summarizeQuestion(\n        body: summarizeQuestionInputBodyType,\n        ): Promise<Result<AIServiceResponse>> {\n        const { grades, subjects } = body.payload.quizDetails || {};\n        let questionPartialPrompt = \`\\nQuestion Details:\\n""\"\nQuestion: $\{body.payload.question.query}\`;\n        if (body.payload.question.options) {\n            questionPartialPrompt += \`\\nOptions: $\{body.payload.question.options.join(', ')}\`;\n        }\n        if (body.payload.question.answer) {\n            questionPartialPrompt += \`\\nAnswer: $\{body.payload.question.answer}\`;\n        }\n        if (body.payload.question.type) {\n            questionPartialPrompt += \`\\nType: $\{body.payload.question.type}\`;\n        }\n        questionPartialPrompt += '\\n"""';\n        let gradePartialPrompt = '';\n        if (grades && grades.length) {\n            gradePartialPrompt = \`\\nGrade: $\{grades.join(', ')}\`;\n        }\n        let subjectPartialPrompt = '';\n        if (subjects && subjects.length) {\n            subjectPartialPrompt = \`\\nSubject: $\{subjects.join(', ')}\`;\n        }\n        const llmRequest: LLMRequest = {\n            prompt: {\n                template: SUMMARIZE_QUESTION_PROMPT_TEMPLATE,\n            },\n            templateVariables: {\n                questionPartialPrompt,\n                gradePartialPrompt,\n                subjectPartialPrompt,\n            },\n            formatter: {\n                zodSchema: z.object(summarizeQuestionOutputBodyType),\n            },\n            modelParams: {\n                modelName: MODEL_NAMES.GPT_35_TURBO,\n                timeout: 60000,\n                temperature: 0,\n                ...body.modelParams,\n            },\n            requestMeta: {\n                eventName: 'summarizeQuestion',\n                ...body.meta,\n            },\n        };\n        return this.llmService.handle(llmRequest);\n    }',
            }
        },
        'prompt': {
            'file_path': 'src/services/questions/prompts.ts',
            'code': 'export const SUMMARIZE_QUESTION_PROMPT_TEMPLATE =\n  'Notice and Wonder are fun and engaging ways to spark the sense of curiosity that leads students to understand that what they have learnt is everywhere!' +\n  '\\nBy asking "What do you notice? What do you think?" We help our students see problems in big-picture ways.' +\n  '\\nSelf-confidence, reflective skills, and engagement soar, and students discover that the goal is not to be "over and done," but to discover multiple strategies for tackling a problem.' +\n  '\\nFor the question given below, create 1 notice and 1 wonder for a student who has just finished attempting this quiz.' +\n  '\\nIt should explain the concept in the question properly to the student irrespective of whether they did it correct or incorrect.' +\n  '\\nCreate notice and wonder for both cases if the student\'s answer is correct and incorrect' +\n  '\\nDo not assume the student\'s answer choice or mention the correct/incorrect answer in the output.' +\n  '{questionPartialPrompt}' +\n  '{gradePartialPrompt}' +\n  '{subjectPartialPrompt}' +\n  '\\nFor each notice and wonder point, go into depth and explain about the concept of the question and what the student could learn more from the question' +\n  '\\nBe creative. Don\'t be too professional. Be casual and relatable' +\n  '\\nProvide a summary. Use emojis wherever relevant.' +\n  '\\nYou cannot use the provided options in the output generated' +\n  '\\n{formatInstructions}';',
        }
    }
    \`\`\`
    
    Possible values for Files:
    - Route: src/routes/http/index.ts
    - Controller: src/controllers/questions.controller.ts, src/controllers/prompt.controller.ts, src/controllers/text.controller.ts
    - Service: src/services/questions/questions.service.ts, src/services/prompt/prompt.service.ts, src/services/text/text.service.ts
    - DTO: src/services/questions/questions.dtos.ts, src/services/prompt/prompts.dtos.ts, src/services/text/text.dtos.ts
    - Prompt: src/services/questions/prompts.ts, src/services/prompt/prompts.ts, src/services/text/prompts.ts
    
    Possible values for Routes:
    - POST /questions/<task> (If main input is a question)
    - POST /prompts/<task> (If main input is a prompt)
    - POST /text/<task> (If main input is a text)
    
    No interfaces or classes are supposed to be created as part of this task. They can be assumed to already exist. Only the required functions, variables, constants and types should be created.
    Make sure to create partial prompts for each variable and handle them in the service. The final prompt should look fine even if any of the partial prompts are empty.
    
    Given a task and input variables, the code generator will generate the required code for the route, controller, service, DTO and prompt. The code generator will also provide the final output in JSON format.
    Make sure that the thought is specific to the below task, input and output variables. The route, controller, service, DTO and prompt should be created based on the thought and the task. Do not create it based on the example provided.
    Task: ${task_description}
    Input Variables: ${input_variables}
    Output Variables: ${output_variables}
    Output: `;
    const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
        temperature: 0,
        response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content);
}

async function image_to_task(base64Image) {
  const prompt = `I've an AI code generator that takes a detailed task description, input variables and output variables and creates a Github pull request for that task.

  Example for a task where a question, grade (optional), subject (optional) is taken as input and the output is an an object containing notice and wonder for correct and incorrect answers for that question.
  {
      "task_description": "Given a question, give the notice and wonder for correct and incorrect answers. Notice and Wonder are fun and engaging ways to spark the sense of curiosity that leads students to understand that what they have learnt is everywhere! Students observe or read about a new concept and discuss or write about what they notice about that image or text and what they wonder about that image or text.",
      "input_variables": "question (query, options - optional, answer, type), grade - optional, subject - optional",
      "output_variables": "correct (notice, wonder), incorrect (notice, wonder)"
  }
  
  As a side note, a question always contains (query, options - optional, answer - optional, type).
  
  Look at the attached design and come up with the detailed task description, input variables and output variables.
  Always return in JSON format: {"task_description": <task_description>, "input_variables": <input_variables_str>, "output_variables": <output_variables_str>}`
  const response = await openai.chat.completions.create({
      messages: [{
        role: 'user',
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              "url": "data:image/png;base64," + base64Image,
            },
          }
        ],
      }],
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content);
}

async function get_pr_info(task_description) {
  const prompt = `
    Task: I need a JSON object which has prTitle, prDescription and this should be generated based for this task: ${task_description}.
    Context: I have a code generator that takes a detailed task description, input variables and output variables and creates a Github pull request for that task.
  `;
  const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
 
module.exports = {
  generate_code,
  image_to_task,
  get_pr_info,
};