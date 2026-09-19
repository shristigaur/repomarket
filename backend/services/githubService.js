const axios = require('axios');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});

if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  githubApi.defaults.headers.common.Authorization = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
}

function parseRepositoryUrl(repoUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(repoUrl);
  } catch {
    throw new Error('A valid GitHub repository URL is required.');
  }

  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'github.com') {
    throw new Error('A valid GitHub repository URL is required.');
  }

  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) {
    throw new Error('A valid GitHub repository URL is required.');
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, '')
  };
}

function decodeGitHubFile(file) {
  if (!file || !file.content) {
    return null;
  }

  return Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

async function fetchFile(owner, repo, path) {
  try {
    const response = await githubApi.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`
    );
    return decodeGitHubFile(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }

    throw error;
  }
}

async function fetchRepositoryTree(owner, repo, branch) {
  try {
    const response = await githubApi.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`
    );
    return (response.data.tree || [])
      .filter((item) => item.type === 'blob')
      .map((item) => item.path)
      .slice(0, 500);
  } catch (error) {
    if (error.response && error.response.status === 404) return [];
    throw error;
  }
}

async function fetchCommitMetadata(owner, repo) {
  try {
    const response = await githubApi.get(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`
    );

    return response.data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit?.message?.split('\n')[0] || '',
      author: commit.commit?.author?.name || commit.author?.login || 'Unknown',
      date: commit.commit?.author?.date || null
    }));
  } catch (error) {
    if (error.response && [404, 409].includes(error.response.status)) return [];
    throw error;
  }
}

async function getRepoDetails(repoUrl) {
  const { owner, repo } = parseRepositoryUrl(repoUrl);
  const repositoryPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const repoResponse = await githubApi.get(repositoryPath);
  const [packageJson, readmeText, fileTree, commits] = await Promise.all([
    fetchFile(owner, repo, 'package.json'),
    fetchFile(owner, repo, 'README.md'),
    fetchRepositoryTree(owner, repo, repoResponse.data.default_branch),
    fetchCommitMetadata(owner, repo)
  ]);

  return {
    repoInfo: repoResponse.data,
    packageJson,
    readmeText,
    fileTree,
    commits
  };
}

module.exports = { getRepoDetails };