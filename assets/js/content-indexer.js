/**
 * CodeProb - Content Indexer Module
 * Handles automatic content discovery and index generation
 */

(function() {
    'use strict';

    const ContentIndexer = {
        // Get the correct config path based on current location
        getConfigPath: function() {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/problems/') || currentPath.includes('/concepts/') || currentPath.includes('/articles/')) {
                return '../contributor-config.json';
            }
            return './contributor-config.json';
        },
        
        // Cache for loaded configuration
        configCache: null,
        
        // Load and display content for a specific type
        loadContent: async function(contentType, containerId) {
            try {
                const config = await this.loadConfig();
                const contentItems = config.content[contentType] || [];
                
                // Validate that content files exist
                const validatedItems = await this.validateContentItems(contentItems, contentType);
                
                // Render content
                this.renderContentList(validatedItems, contentType, containerId);
                
                // Update filters
                this.updateFilters(validatedItems, contentType);
                
            } catch (error) {
                console.error('Error loading content:', error);
                this.renderError(containerId, 'Failed to load content. Please try again later.');
            }
        },

        // Load configuration from contributor-config.json
        loadConfig: async function() {
            if (this.configCache) {
                return this.configCache;
            }

            try {
                const configPath = this.getConfigPath();
                const response = await fetch(configPath);
                if (!response.ok) {
                    throw new Error(`Failed to load config: ${response.status}`);
                }
                
                this.configCache = await response.json();
                return this.configCache;
                
            } catch (error) {
                console.error('Error loading configuration:', error);
                throw error;
            }
        },

        // Validate that content files actually exist
        validateContentItems: async function(items, contentType) {
            const validatedItems = [];
            
            // Determine the correct path prefix based on current location
            const currentPath = window.location.pathname;
            let pathPrefix = './';
            if (currentPath.includes('/problems/') || currentPath.includes('/concepts/') || currentPath.includes('/articles/')) {
                pathPrefix = '../';
            }
            
            for (const item of items) {
                try {
                    // Check if the file exists by attempting to fetch its metadata
                    const filePath = `${pathPrefix}${contentType}/${item.filename}`;
                    const response = await fetch(filePath, { method: 'HEAD' });
                    
                    if (response.ok) {
                        validatedItems.push(item);
                    } else {
                        console.warn(`Content file not found: ${filePath}`);
                    }
                } catch (error) {
                    // For local file access, assume file exists if listed in config
                    validatedItems.push(item);
                }
            }
            
            return validatedItems;
        },

        // Render content list in the specified container
        renderContentList: function(items, contentType, containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container not found: ${containerId}`);
                return;
            }

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No ${contentType} available yet</h3>
                        <p>Be the first to contribute! Use the <a href="/writer.html">writer interface</a> to create content.</p>
                    </div>
                `;
                return;
            }

            // Sort items by date (newest first)
            const sortedItems = items.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

            // Generate HTML for each item
            const itemsHTML = sortedItems.map(item => {
                return window.CodeProb ? 
                    window.CodeProb.createContentItemHTML(item, contentType) :
                    this.createBasicContentItemHTML(item, contentType);
            }).join('');

            container.innerHTML = itemsHTML;
        },

        // Basic content item HTML (fallback if main.js not loaded)
        createBasicContentItemHTML: function(item, type) {
            // Determine the correct path based on current location
            const currentPath = window.location.pathname;
            let linkPath = `${type}/${item.filename}`;
            if (currentPath.includes('/problems/') || currentPath.includes('/concepts/') || currentPath.includes('/articles/')) {
                linkPath = `../${type}/${item.filename}`;
            }
            
            return `
                <div class="content-item">
                    <h3><a href="${linkPath}">${item.title}</a></h3>
                    <p>By ${item.author} • ${new Date(item.dateAdded).toLocaleDateString()}</p>
                </div>
            `;
        },

        // Update filter dropdowns with available options
        updateFilters: function(items, contentType) {
            const filterMappings = {
                'problems': {
                    'difficulty-filter': 'difficulty',
                    'topic-filter': 'topics'
                },
                'concepts': {
                    'category-filter': 'category',
                    'complexity-filter': 'complexity'
                },
                'articles': {
                    'tag-filter': 'tags',
                    'author-filter': 'author'
                }
            };

            const filters = filterMappings[contentType];
            if (!filters) return;

            Object.entries(filters).forEach(([filterId, property]) => {
                const filterSelect = document.getElementById(filterId);
                if (!filterSelect) return;

                const options = this.extractUniqueValues(items, property);
                this.populateFilterOptions(filterSelect, options);
            });
        },

        // Extract unique values for filter options
        extractUniqueValues: function(items, property) {
            const values = new Set();
            
            items.forEach(item => {
                const value = item[property];
                if (Array.isArray(value)) {
                    value.forEach(v => values.add(v));
                } else if (value) {
                    values.add(value);
                }
            });
            
            return Array.from(values).sort();
        },

        // Populate filter dropdown with options
        populateFilterOptions: function(selectElement, options) {
            // Keep the first option (usually "All")
            const firstOption = selectElement.children[0];
            selectElement.innerHTML = '';
            selectElement.appendChild(firstOption);

            // Add new options
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                selectElement.appendChild(optionElement);
            });
        },

        // Render error message
        renderError: function(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Content</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        },

        // Scan directory for content files (for future enhancement)
        scanDirectory: async function(directoryPath) {
            // This would require a build step or server-side functionality
            // For now, we rely on the contributor-config.json file
            console.log('Directory scanning not implemented in static version');
            return [];
        },

        // Extract metadata from HTML file (for future enhancement)
        extractMetadata: async function(filePath) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) return null;
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extract metadata from HTML
                const article = doc.querySelector('article');
                if (!article) return null;
                
                return {
                    title: doc.querySelector('h1')?.textContent || 'Untitled',
                    id: article.dataset.id,
                    type: article.className,
                    // Add more metadata extraction as needed
                };
                
            } catch (error) {
                console.error('Error extracting metadata:', error);
                return null;
            }
        },

        // Validate content structure against templates
        validateContentStructure: function(htmlContent, contentType) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const article = doc.querySelector('article');
            
            if (!article) {
                return { valid: false, errors: ['Missing article element'] };
            }
            
            const errors = [];
            const requiredSections = this.getRequiredSections(contentType);
            
            requiredSections.forEach(section => {
                if (!article.querySelector(section)) {
                    errors.push(`Missing required section: ${section}`);
                }
            });
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
        },

        // Get required sections for content type
        getRequiredSections: function(contentType) {
            const sectionMappings = {
                'problems': ['header', '.description', '.examples'],
                'concepts': ['header', '.overview', '.explanation'],
                'articles': ['header', '.content']
            };
            
            return sectionMappings[contentType] || [];
        }
    };

    // Make ContentIndexer available globally
    window.ContentIndexer = ContentIndexer;

})();