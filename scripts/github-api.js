/**
 * ============================================================================
 * GITHUB-API.JS - GitHub Repository Fetching & Display
 * ============================================================================
 * 
 * This module handles:
 * - Fetching public repositories from GitHub API
 * - Caching results in localStorage (1 hour TTL)
 * - Sorting repos by stars and update date
 * - Rendering repository cards to the DOM
 * 
 * GITHUB API NOTES:
 * - Unauthenticated requests: 60/hour limit
 * - Using localStorage cache to minimize API calls
 * - Graceful error handling with user feedback
 * 
 * CUSTOMIZATION:
 * - Change GITHUB_USERNAME to fetch different user's repos
 * - Adjust CACHE_DURATION_MS for different cache lifetimes
 * - Modify renderRepoCard() to change card appearance
 * 
 * ============================================================================
 */

// Configuration
const GITHUB_USERNAME = 'AndyFerns';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
const CACHE_KEY = 'github_repos_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_VISIBLE_REPOS = 9; // Show only 9 repos, rest redirects to GitHub

/**
 * Language color mapping for repository cards
 * Colors are approximate GitHub language colors
 */
const LANGUAGE_COLORS = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C': '#555555',
    'C++': '#f34b7d',
    'C#': '#239120',
    'Rust': '#dea584',
    'Go': '#00ADD8',
    'Kotlin': '#A97BFF',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Shell': '#89e051',
    'Jupyter Notebook': '#DA5B0B',
    'default': '#a9b18f'
};

/**
 * Get cached repositories from localStorage
 * @returns {Object|null} Cached data with repos and timestamp, or null if invalid/expired
 */
function getCachedRepos() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { repos, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION_MS) {
            console.log('[GitHub API] Using cached repositories');
            return repos;
        }

        console.log('[GitHub API] Cache expired, will fetch fresh data');
        return null;
    } catch (error) {
        console.warn('[GitHub API] Error reading cache:', error);
        return null;
    }
}

/**
 * Save repositories to localStorage cache
 * @param {Array} repos - Array of repository objects
 */
function setCachedRepos(repos) {
    try {
        const cacheData = {
            repos: repos,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('[GitHub API] Cached', repos.length, 'repositories');
    } catch (error) {
        console.warn('[GitHub API] Error writing cache:', error);
    }
}

/**
 * Fetch all public repositories from GitHub API
 * Uses pagination to fetch all repos (API returns max 100 per page)
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchGitHubRepos() {
    // Check cache first
    const cachedRepos = getCachedRepos();
    if (cachedRepos) {
        return cachedRepos;
    }

    console.log('[GitHub API] Fetching repositories from GitHub...');

    try {
        let allRepos = [];
        let page = 1;
        let hasMore = true;

        // Paginate through all repos
        while (hasMore) {
            const response = await fetch(
                `${GITHUB_API_URL}?per_page=100&page=${page}&type=public`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                // Handle rate limiting
                if (response.status === 403) {
                    const resetTime = response.headers.get('X-RateLimit-Reset');
                    const resetDate = new Date(resetTime * 1000);
                    throw new Error(`API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const repos = await response.json();

            if (repos.length === 0) {
                hasMore = false;
            } else {
                allRepos = allRepos.concat(repos);
                page++;

                // Safety check to prevent infinite loops
                if (page > 10) {
                    hasMore = false;
                }
            }
        }

        console.log('[GitHub API] Fetched', allRepos.length, 'repositories');

        // Cache the results
        setCachedRepos(allRepos);

        return allRepos;

    } catch (error) {
        console.error('[GitHub API] Error fetching repos:', error);
        throw error;
    }
}

/**
 * Sort repositories by stars (descending) then by update date (most recent first)
 * @param {Array} repos - Array of repository objects
 * @returns {Array} Sorted array of repositories
 */
function sortRepos(repos) {
    return repos.sort((a, b) => {
        // First sort by stars (descending)
        if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count;
        }
        // Then by update date (most recent first)
        return new Date(b.updated_at) - new Date(a.updated_at);
    });
}

/**
 * Create HTML for a single repository card
 * @param {Object} repo - Repository object from GitHub API
 * @returns {string} HTML string for the repo card
 */
function renderRepoCard(repo) {
    const languageColor = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default;
    const description = repo.description || 'No description provided';
    const truncatedDesc = description.length > 100
        ? description.substring(0, 100) + '...'
        : description;

    return `
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-card hover-lift">
            <div class="repo-card-header">
                <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
                </svg>
                <span class="repo-name">${repo.name}</span>
            </div>
            <p class="repo-description">${truncatedDesc}</p>
            <div class="repo-meta">
                ${repo.language ? `
                    <span class="repo-meta-item">
                        <span class="repo-language-dot" style="background-color: ${languageColor}"></span>
                        ${repo.language}
                    </span>
                ` : ''}
                ${repo.stargazers_count > 0 ? `
                    <span class="repo-meta-item">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                ` : ''}
                ${repo.forks_count > 0 ? `
                    <span class="repo-meta-item">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
                        </svg>
                        ${repo.forks_count}
                    </span>
                ` : ''}
            </div>
        </a>
    `;
}

/**
 * Render loading skeleton cards
 * @param {number} count - Number of skeleton cards to show
 * @returns {string} HTML string for skeleton cards
 */
function renderLoadingSkeletons(count = 6) {
    return Array(count).fill(`
        <div class="repo-card">
            <div class="skeleton" style="height: 20px; width: 60%; margin-bottom: 12px;"></div>
            <div class="skeleton" style="height: 14px; width: 100%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 14px; width: 80%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 14px; width: 40%;"></div>
        </div>
    `).join('');
}

/**
 * Render error message
 * @param {string} message - Error message to display
 * @returns {string} HTML string for error message
 */
function renderError(message) {
    return `
        <div class="error-message" style="grid-column: 1 / -1;">
            <p>⚠️ ${message}</p>
            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-muted);">
                Please check back later or visit 
                <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">
                    my GitHub profile
                </a> directly.
            </p>
        </div>
    `;
}

/**
 * Initialize the GitHub repositories section
 * Fetches repos and renders them to the container
 */
async function initGitHubRepos() {
    const container = document.getElementById('repos-grid');
    if (!container) {
        console.warn('[GitHub API] Repos container not found');
        return;
    }

    // Show loading state
    container.innerHTML = renderLoadingSkeletons(6);

    try {
        // Fetch repositories
        const repos = await fetchGitHubRepos();

        // Sort by stars then update date
        const sortedRepos = sortRepos(repos);

        // Limit to MAX_VISIBLE_REPOS - rest are accessible via GitHub link
        const visibleRepos = sortedRepos.slice(0, MAX_VISIBLE_REPOS);

        // Render limited repos
        container.innerHTML = visibleRepos.map(renderRepoCard).join('');

        // Add stagger animation
        container.classList.add('stagger-children');
        setTimeout(() => {
            container.classList.add('visible');
        }, 100);

    } catch (error) {
        container.innerHTML = renderError(error.message);
    }
}

/**
 * Force refresh repositories (bypass cache)
 * Can be called manually for debugging
 */
function refreshGitHubRepos() {
    localStorage.removeItem(CACHE_KEY);
    initGitHubRepos();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initGitHubRepos, refreshGitHubRepos };
}
