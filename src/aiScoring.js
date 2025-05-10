
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({ project: process.env.GCP_PROJECT_ID, location: process.env.GCP_API_LOCATION });
const EssayResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_ESSAY);
const SWTResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_SWT);
const SSTResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_SST);
const SPKResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_SPK);
const ASQResponseSchema = JSON.parse(process.env.GCP_VERTEX_RES_SCHEMA_ASQ);

export const scoreEssay = async function (topic, text) {
  if (!topic || !text) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_LITE, EssayResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);
  
  const prompt = `Topic:'${topic}' Answer:'${text}'`;
  console.log('prompt: ', prompt);

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_ESSAY} ${process.env.GCP_VERTEX_SCORERUBRIC_ESSAY}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreSWT = async function (topic, text) {
  if (!topic || !text) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_LITE, SWTResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `Passage:'${topic}'. Answer:'${text}'`;
  console.log('prompt: ', prompt);

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_SWT} ${process.env.GCP_VERTEX_SCORERUBRIC_SWT}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreSST = async function (audioTranscript, text) {
  if (!audioTranscript || !text) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, SSTResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `Audio Transcript: '${audioTranscript}'. PTE Summary Spoken Text Answer: '${text}'`;
  console.log('prompt: ', prompt);

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_SST} ${process.env.GCP_VERTEX_SCORERUBRIC_SST}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreRA = async function (audioTranscript, andioFile) {
  if (!audioTranscript || !andioFile) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, SPKResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `Transcript: '${audioTranscript}'`;
  // console.log('prompt: ', prompt);

  const filePart = {inline_data: {data: andioFile.buffer.toString('base64'), mimeType: "audio/wav"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, filePart] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_RA} ${process.env.GCP_VERTEX_SCORERUBRIC_RA}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreRS = async function (audioTranscript, andioFile) {
  if (!audioTranscript || !andioFile) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, SPKResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `Transcript: '${audioTranscript}'`;
  // console.log('prompt: ', prompt);

  const filePart = {inline_data: {data: andioFile.buffer.toString('base64'), mimeType: "audio/wav"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, filePart] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_RS} ${process.env.GCP_VERTEX_SCORERUBRIC_RS}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreDI = async function (imageUri, andioFile) {
  if (!imageUri || !andioFile) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, SPKResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `${process.env.GCP_VERTEX_PROMPT_DI}`;
  console.log('prompt: ', prompt, imageUri);

  const audioFilePart = {inline_data: {data: andioFile.buffer.toString('base64'), mimeType: "audio/wav"}};
  const imagefilePart = {fileData: {fileUri: imageUri, mimeType: "image/jpeg"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, audioFilePart, imagefilePart] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_DI} ${process.env.GCP_VERTEX_SCORERUBRIC_DI}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreRL = async function (audioTranscript, andioFile) {
  if (!audioTranscript || !andioFile) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, SPKResponseSchema, process.env.GCP_VERTEX_INSTRUCTION);

  const prompt = `Transcript: ${audioTranscript}`;
  // console.log('prompt: ', prompt);

  const audioFilePart = {inline_data: {data: andioFile.buffer.toString('base64'), mimeType: "audio/wav"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, audioFilePart] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_RL} ${process.env.GCP_VERTEX_SCORERUBRIC_RL}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

export const scoreASQ = async function (audioTranscript, andioFile) {
  if (!audioTranscript || !andioFile) return {};

  const generativeModel = generateModel(process.env.GCP_VERTEX_MODEL_GEMINI_FLASH, ASQResponseSchema, process.env.GCP_VERTEX_INSTRUCTION, process.env.GCP_VERTEX_TEMPERATURE_ASQ);

  const prompt = `Question: ${audioTranscript}`;
  console.log('prompt: ', prompt);

  const audioFilePart = {inline_data: {data: andioFile.buffer.toString('base64'), mimeType: "audio/wav"}};
  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }, audioFilePart] }],
    systemInstruction: { role: 'system', parts: [{ text: `${process.env.GCP_VERTEX_INSTRUCTION_ASQ} ${process.env.GCP_VERTEX_SCORERUBRIC_ASQ}` }] },
  };
  return extractResult(await generativeModel.generateContent(request));
}

function generateModel(modelId, responseSchema, systemInstruction, temperature) {
  return vertexAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: temperature || 1
    },
    systemInstruction: {
      role: 'system',
      parts: [{ "text": systemInstruction }]
    },
  });
}

function extractResult(response){
  if (!response) return {};
  // console.log('response: ', JSON.stringify(response));
  const contentResponse = response.response.candidates[0].content.parts[0].text;
  const result = JSON.parse(contentResponse);

  console.log('result: ', result);
  return result;
}
