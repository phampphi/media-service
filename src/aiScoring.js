
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({ project: process.env.GCP_PROJECT_ID, location: process.env.GCP_API_LOCATION });
const EssayResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_ESSAY);
const SWTResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_SWT);
const SSTResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_SST);

export const scoreEssay = async function (topic, text) {
  if (!topic || !text) return '';

  const generativeModel = vertexAI.getGenerativeModel({
    model: process.env.GCP_VERTEX_MODEL_ID,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: EssayResponseSchema
    },
    systemInstruction: {
      role: 'system',
      parts: [{ "text": process.env.GCP_VERTEX_INSTRUCTION }]
    },
  });

  const prompt = `${process.env.GCP_VERTEX_PROMPT_ESSAY} Topic:'${topic}' Answer:'${text}'`;
  console.log('prompt: ', prompt);

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: process.env.GCP_VERTEX_INSTRUCTION_ESSAY }] },
  };
  const resp = await generativeModel.generateContent(request);
  const contentResponse = resp.response.candidates[0].content.parts[0].text;
  const result = JSON.parse(contentResponse.replaceAll('```', '').replaceAll('json', '').replaceAll('essayScore:', 'score:'));

  console.log('result: ', result);
  return result;
}

export const scoreSWT = async function (topic, text) {
  if (!topic || !text) return '';

  const generativeModel = vertexAI.getGenerativeModel({
    model: process.env.GCP_VERTEX_MODEL_ID,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SWTResponseSchema
    },
    systemInstruction: {
      role: 'system',
      parts: [{ "text": process.env.GCP_VERTEX_INSTRUCTION }]
    },
  });

  const prompt = `${process.env.GCP_VERTEX_PROMPT_SWT} Passage:'${topic}'. Answer:'${text}'`;
  console.log('prompt: ', prompt);

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: process.env.GCP_VERTEX_INSTRUCTION_SWT }] },
  };
  const resp = await generativeModel.generateContent(request);
  const contentResponse = resp.response.candidates[0].content.parts[0].text;
  const result = JSON.parse(contentResponse.replaceAll('```', '').replaceAll('json', '').replaceAll('essayScore:', 'score:'));

  console.log('result: ', result);
  return result;
}

export const scoreSST = async function (audioUri, text) {
  if (!audioUri || !text) return '';

  const generativeModel = vertexAI.getGenerativeModel({
    model: process.env.GCP_VERTEX_MODEL_SST,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
      responseSchema: SSTResponseSchema
    },
    systemInstruction: {
      role: 'system',
      parts: [{ "text": process.env.GCP_VERTEX_INSTRUCTION }]
    },
  });

  const prompt = `${process.env.GCP_VERTEX_PROMPT_SST} Answer: '${text}'`;
  console.log('prompt: ', prompt);

  const filePart = {fileData: {fileUri: audioUri, mimeType: "audio/mpeg"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, filePart] }],
    systemInstruction: { role: 'system', parts: [{ text: process.env.GCP_VERTEX_INSTRUCTION_SST }] },
  };
  const resp = await generativeModel.generateContent(request);
  console.log('resp: ', resp);
  const contentResponse = resp.response.candidates[0].content.parts[0].text;
  const result = JSON.parse(contentResponse.replaceAll('```', '').replaceAll('json', '').replaceAll('essayScore:', 'score:'));

  console.log('result: ', result);
  return result;
}

//   const contentResponse = `{
//   "feedback": {
//     "Content": "The essay presents a somewhat unclear stance on the issue. While it initially seems to support advertisements in schools, the later part introduces reservations and caveats.  The arguments supporting advertisements are simplistic and lack depth. The counterarguments are also underdeveloped and not fully explored.",
//     "Development_Structure_and_Coherence": "The essay lacks a clear structure.  The ideas are presented in a somewhat disorganized manner, jumping between arguments without smooth transitions. The essay lacks a strong concluding statement to summarize the main points.",
//     "General_Linguistic_Range": "The range of grammatical structures is limited.  The essay relies heavily on simple sentence structures, which affects the overall fluency and sophistication.",
//     "Grammar": "The essay contains several grammatical errors, including incorrect word order, tense inconsistency, and subject-verb agreement issues. There are also issues with articles and prepositions.",
//     "Spelling": "There are several spelling errors throughout the essay, demonstrating a need for better proofreading. This affects the overall readability of the essay.",
//     "Vocabulary_Range": "The vocabulary is limited and repetitive.  More sophisticated and varied vocabulary is needed to effectively express complex ideas."
//   },
//   "score": {
//     "Content": 1,
//     "Development_Structure_and_Coherence": 1,
//     "General_Linguistic_Range": 1,
//     "Grammar": 1,
//     "Spelling": 1,
//     "Vocabulary_Range": 1
//   }
// }`
//   const result = JSON.parse(contentResponse);