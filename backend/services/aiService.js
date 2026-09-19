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

function defaultReport() {
  return {
    codeHealthScore: 70,
    estimatedValuation: '$1,500',
    launchReadiness: 'Requires review before deployment',
    techStackDetails: { frameworks: ['JavaScript'], database: [], runtime: 'JavaScript' },
    projectCompleteness: { completedFeatures: [], hasTests: false, hasDeploymentConfig: false, documentationRating: 'Low' },
    dependencyAudit: { totalDependencies: 0, deprecatedOrOutdated: [], paidApiIntegrations: [] },
    riskAndSecurity: { licenseType: 'Unlicensed', hasEnvExample: false, riskFlags: ['Report parsing failed; verify repository details manually.'] }
  };
}

function parseJsonResponse(rawText) {
  const cleanedJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsedData = JSON.parse(cleanedJsonText);
    const fallback = defaultReport();
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
    return defaultReport();
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
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your_')) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' });
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
    generationConfig: { responseMimeType: 'application/json' }
  });

  return validateReport(parseJsonResponse(result.response.text()));
}

module.exports = { analyzeRepoCode };