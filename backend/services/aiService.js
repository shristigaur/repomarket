const { GoogleGenerativeAI } = require('@google/generative-ai');

const reportKeys = [
  'codeHealthScore',
  'estimatedValuation',
  'launchReadiness',
  'techStackDetails',
  'projectCompleteness',
  'dependencyAudit',
  'riskAndSecurity'
];

function fallbackReport() {
  return {
    codeHealthScore: 70,
    estimatedValuation: '$500 - $1,500',
    launchReadiness: 'Requires environment setup and dependency audit',
    techStackDetails: { frameworks: ['JavaScript', 'Node.js'], database: ['MongoDB'], runtime: 'Node.js' },
    projectCompleteness: { completedFeatures: ['Core codebase structure'], hasTests: false, hasDeploymentConfig: false, documentationRating: 'Medium' },
    dependencyAudit: { totalDependencies: 0, deprecatedOrOutdated: [], paidApiIntegrations: [] },
    riskAndSecurity: { licenseType: 'Not specified', hasEnvExample: false, riskFlags: ['AI service rate-limited; displaying estimated breakdown'] }
  };
}

function parseJsonResponse(rawText) {
  const cleanedJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsedData = JSON.parse(cleanedJsonText);
    const fallback = fallbackReport();
    const codeQualityScore = parsedData.codeQualityScore || 70;
    const codeHealthScore = parsedData.codeHealthScore || codeQualityScore;
    const techStack = parsedData.techStack?.length ? parsedData.techStack : ['JavaScript'];

    return {
      ...fallback,
      ...parsedData,
      codeHealthScore: codeHealthScore,
      estimatedValuation: parsedData.estimatedValuation || '$1,500',
      techStackDetails: {
        ...fallback.techStackDetails,
        ...parsedData.techStackDetails,
        frameworks: parsedData.techStackDetails?.frameworks?.length ? parsedData.techStackDetails.frameworks : techStack
      },
      projectCompleteness: { ...fallback.projectCompleteness, ...parsedData.projectCompleteness },
      dependencyAudit: { ...fallback.dependencyAudit, ...parsedData.dependencyAudit },
      riskAndSecurity: { ...fallback.riskAndSecurity, ...parsedData.riskAndSecurity }
    };
  } catch (error) {
    console.error('Gemini JSON parse failed:', error);
    return fallbackReport();
  }
}

function validateReport(report) {
  const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
  const isBoolean = (value) => typeof value === 'boolean';
  const isRating = (value) => ['High', 'Medium', 'Low'].includes(value);

  if (
    !report ||
    typeof report !== 'object' ||
    Array.isArray(report) ||
    typeof report.codeHealthScore !== 'number' ||
    !Number.isInteger(report.codeHealthScore) ||
    report.codeHealthScore < 1 ||
    report.codeHealthScore > 100 ||
    typeof report.estimatedValuation !== 'string' ||
    typeof report.launchReadiness !== 'string' ||
    !report.techStackDetails ||
    !isStringArray(report.techStackDetails.frameworks) ||
    !isStringArray(report.techStackDetails.database) ||
    typeof report.techStackDetails.runtime !== 'string' ||
    !report.projectCompleteness ||
    !isStringArray(report.projectCompleteness.completedFeatures) ||
    !isBoolean(report.projectCompleteness.hasTests) ||
    !isBoolean(report.projectCompleteness.hasDeploymentConfig) ||
    !isRating(report.projectCompleteness.documentationRating) ||
    !report.dependencyAudit ||
    typeof report.dependencyAudit.totalDependencies !== 'number' ||
    !Number.isInteger(report.dependencyAudit.totalDependencies) ||
    report.dependencyAudit.totalDependencies < 0 ||
    !isStringArray(report.dependencyAudit.deprecatedOrOutdated) ||
    !isStringArray(report.dependencyAudit.paidApiIntegrations) ||
    !report.riskAndSecurity ||
    typeof report.riskAndSecurity.licenseType !== 'string' ||
    !isBoolean(report.riskAndSecurity.hasEnvExample) ||
    !isStringArray(report.riskAndSecurity.riskFlags)
  ) {
    throw new Error('Gemini returned a response that does not match the required report schema.');
  }

  return Object.fromEntries(reportKeys.map((key) => [key, report[key]]));
}

async function analyzeRepoCode({ readmeText, packageJson, fileTree = [], commits = [] }) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your_')) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are preparing a Buyer Trust & Code Audit Report for a GitHub repository. Analyze all supplied evidence: README.md, package.json, file tree structure, and recent commit metadata.

Return ONLY one strict, valid JSON object. Do not use Markdown code blocks, fences, explanations, comments, or extra keys. The response must be directly parseable by JSON.parse(). Use evidence from the repository and do not invent features, dependencies, tests, deployment configuration, licenses, or paid APIs. codeHealthScore must be an integer from 1 to 100 based on modularity, test coverage, and documentation. totalDependencies must count dependencies and devDependencies in package.json.

Required JSON schema:
{
  "codeHealthScore": 75,
  "estimatedValuation": "$200 - $450",
  "launchReadiness": "Ready to deploy in 2 hours",
  "techStackDetails": { "frameworks": ["Express"], "database": ["MongoDB"], "runtime": "Node.js 20" },
  "projectCompleteness": { "completedFeatures": ["REST API"], "hasTests": true, "hasDeploymentConfig": false, "documentationRating": "Medium" },
  "dependencyAudit": { "totalDependencies": 8, "deprecatedOrOutdated": [], "paidApiIntegrations": [] },
  "riskAndSecurity": { "licenseType": "MIT", "hasEnvExample": true, "riskFlags": [] }
}

README.md:
${readmeText || '(README.md was not found)'}

package.json:
${packageJson || '(package.json was not found)'}

File tree structure:
${JSON.stringify(fileTree)}

Recent commit metadata:
${JSON.stringify(commits)}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048
      }
    });

    // Resolve both SDK promises before parsing; this prevents reading a partial response object.
    const response = await result.response;
    const responseText = await response.text();
    return validateReport(parseJsonResponse(responseText));
  } catch (error) {
    console.error('Gemini analysis failed; using fallback report:', error.message);
    return fallbackReport();
  }
}

module.exports = { analyzeRepoCode };
