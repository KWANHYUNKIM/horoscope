const { OpenAIEmbeddings } = require('@langchain/openai');

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-ada-002'
});

async function createEmbedding(text) {
  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error('임베딩 생성 중 오류 발생:', error);
    throw error;
  }
}

module.exports = {
  createEmbedding
}; 