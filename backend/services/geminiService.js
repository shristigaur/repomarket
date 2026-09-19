const { GoogleGenerativeAI } = require('@google/generative-ai');

const reportSchema = {
  summary: '2-sentence plain English summary of what the app does',
  codeQualityScore: 'number between 1 and 100',
  estimatedValuation: 'number range string, for example $150 - $300',
  keyFeatures: ['feature1', 'feature2'],
  techStack: ['React', 'Node', 'MongoDB'],
  potentialIssues: ['missing tests', 'unmaintained dependencies']
};

function parseModelJson(text) {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleanedText);
}

function validateReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('Gemini returned an invalid report object.');
  }

  if (
    typeof report.summary !== 'string' ||
    typeof report.codeQualityScore !== 'number' ||
    report.codeQualityScore < 1 ||
    report.codeQualityScore > 100 ||
    typeof report.estimatedValuation !== 'string' ||
    !Array.isArray(report.keyFeatures) ||
    !Array.isArray(report.techStack) ||
    !Array.isArray(report.potentialIssues) ||
    [...report.keyFeatures, ...report.techStack, ...report.potentialIssues].some(
      (item) => typeof item !== 'string'
    )
  ) {
    throw new Error('Gemini returned a report that does not match the required schema.');
  }

  return {
    summary: report.summary,
    codeQualityScore: report.codeQualityScore,
    estimatedValuation: report.estimatedValuation,
    keyFeatures: report.keyFeatures,
    techStack: report.techStack,
    potentialIssues: report.potentialIssues
  };
}

async function generateContentWithRetry(model, prompt) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
    } catch (error) {
      const retryable = error.message && /\[(429|500|503)\b/.test(error.message);
      if (!retryable || attempt === 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

async function generateRepositoryReport({ readme, packageJson }) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your_')) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' });
  const prompt = `Analyze this GitHub repository using the README.md and package.json below.

Return ONLY a valid JSON object matching this exact schema. Do not include Markdown fences, commentary, or extra keys:
${JSON.stringify(reportSchema, null, 2)}

README.md:
${readme || '(README.md was not found)'}

package.json:
${packageJson || '(package.json was not found)'}`;

  const result = await generateContentWithRetry(model, prompt);
  return validateReport(parseModelJson(result.response.text()));
}

module.exports = { generateRepositoryReport };