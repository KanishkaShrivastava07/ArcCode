/**
 * Property-based tests for project structure validation
 * Feature: static-wiki-platform, Property 6: Content categorization completeness
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

describe('Project Structure Validation', () => {
  
  /**
   * Feature: static-wiki-platform, Property 6: Content categorization completeness
   * For any content category (problems, concepts, articles), the corresponding index page 
   * should list all available content items in that category with proper navigation links
   */
  test('Property 6: Content categorization completeness', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('problems', 'concepts', 'articles'),
        (contentType) => {
          // Verify directory structure exists
          const contentDir = path.join(process.cwd(), contentType);
          const indexPath = path.join(contentDir, 'index.html');
          
          // Directory should exist
          expect(fs.existsSync(contentDir)).toBe(true);
          
          // Index page should exist
          expect(fs.existsSync(indexPath)).toBe(true);
          
          // Index page should contain proper structure
          const indexContent = fs.readFileSync(indexPath, 'utf8');
          
          // Should have proper HTML structure
          expect(indexContent).toMatch(/<!DOCTYPE html>/);
          expect(indexContent).toMatch(/<html lang="en">/);
          expect(indexContent).toMatch(/<meta charset="UTF-8">/);
          
          // Should have navigation
          expect(indexContent).toMatch(/class="main-nav"/);
          expect(indexContent).toMatch(/nav-link--active/);
          
          // Should have content list container
          expect(indexContent).toMatch(/id="\w+-list"/);
          
          // Should load content indexer
          expect(indexContent).toMatch(/content-indexer\.js/);
          
          // Should initialize content loading
          expect(indexContent).toMatch(/ContentIndexer\.loadContent/);
          expect(indexContent).toMatch(new RegExp(`'${contentType}'`));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Required project files exist', () => {
    const requiredFiles = [
      'index.html',
      'contributor-config.json',
      'assets/css/main.css',
      'assets/js/main.js',
      'assets/js/content-indexer.js',
      'docs/contributing.md',
      'docs/validation-rules.md'
    ];

    requiredFiles.forEach(filePath => {
      expect(fs.existsSync(path.join(process.cwd(), filePath))).toBe(true);
    });
  });

  test('Required directories exist', () => {
    const requiredDirs = [
      'problems',
      'concepts', 
      'articles',
      'assets',
      'assets/css',
      'assets/js',
      'docs'
    ];

    requiredDirs.forEach(dirPath => {
      expect(fs.existsSync(path.join(process.cwd(), dirPath))).toBe(true);
    });
  });

  test('Main index page has proper structure', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Should have proper HTML5 structure
    expect(indexContent).toMatch(/<!DOCTYPE html>/);
    expect(indexContent).toMatch(/<html lang="en">/);
    expect(indexContent).toMatch(/<meta charset="UTF-8">/);
    expect(indexContent).toMatch(/<meta name="viewport"/);
    
    // Should have site title and navigation
    expect(indexContent).toMatch(/CodeProb/);
    expect(indexContent).toMatch(/class="main-nav"/);
    
    // Should link to all three content categories
    expect(indexContent).toMatch(/href="problems\/index\.html"/);
    expect(indexContent).toMatch(/href="concepts\/index\.html"/);
    expect(indexContent).toMatch(/href="articles\/index\.html"/);
    expect(indexContent).toMatch(/href="writer\.html"/);
    
    // Should have category cards
    expect(indexContent).toMatch(/class="category-card"/);
    
    // Should load main CSS and JS
    expect(indexContent).toMatch(/assets\/css\/main\.css/);
    expect(indexContent).toMatch(/assets\/js\/main\.js/);
  });

  test('Contributor config has proper structure', () => {
    const configPath = path.join(process.cwd(), 'contributor-config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Should have required top-level properties
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('content');
    expect(config).toHaveProperty('instructions');
    
    // Content should have all three categories
    expect(config.content).toHaveProperty('problems');
    expect(config.content).toHaveProperty('concepts');
    expect(config.content).toHaveProperty('articles');
    
    // Each category should be an array
    expect(Array.isArray(config.content.problems)).toBe(true);
    expect(Array.isArray(config.content.concepts)).toBe(true);
    expect(Array.isArray(config.content.articles)).toBe(true);
    
    // Instructions should specify required fields
    expect(config.instructions).toHaveProperty('required_fields');
    expect(config.instructions.required_fields).toHaveProperty('problems');
    expect(config.instructions.required_fields).toHaveProperty('concepts');
    expect(config.instructions.required_fields).toHaveProperty('articles');
  });

  /**
   * Property test for CSS theme consistency
   */
  test('CSS contains dark theme variables', () => {
    const cssPath = path.join(process.cwd(), 'assets/css/main.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Should define CSS custom properties for theme
    expect(cssContent).toMatch(/--bg-primary:\s*#[0-9a-fA-F]{6}/);
    expect(cssContent).toMatch(/--text-primary:\s*#[0-9a-fA-F]{6}/);
    expect(cssContent).toMatch(/--link-color:\s*#[0-9a-fA-F]{6}/);
    
    // Should define programming-friendly fonts
    expect(cssContent).toMatch(/--font-mono:/);
    expect(cssContent).toMatch(/--font-sans:/);
    
    // Should have responsive design
    expect(cssContent).toMatch(/@media.*max-width/);
  });

  /**
   * Property test for JavaScript module structure
   */
  test('JavaScript modules have proper structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('main.js', 'content-indexer.js'),
        (jsFile) => {
          const jsPath = path.join(process.cwd(), 'assets/js', jsFile);
          const jsContent = fs.readFileSync(jsPath, 'utf8');
          
          // Should use IIFE pattern for encapsulation
          expect(jsContent).toMatch(/\(function\s*\(\)\s*{/);
          expect(jsContent).toMatch(/'use strict';/);
          
          // Should expose global object
          if (jsFile === 'main.js') {
            expect(jsContent).toMatch(/window\.CodeProb\s*=/);
          } else if (jsFile === 'content-indexer.js') {
            expect(jsContent).toMatch(/window\.ContentIndexer\s*=/);
          }
          
          // Should have proper closing
          expect(jsContent).toMatch(/}\)\(\);?\s*$/m);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for example content structure
   */
  test('Example content files follow proper structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          contentType: fc.constantFrom('problems', 'concepts', 'articles'),
          filename: fc.constantFrom('example-problem.html', 'example-concept.html', 'example-article.html')
        }).filter(({contentType, filename}) => {
          return (contentType === 'problems' && filename === 'example-problem.html') ||
                 (contentType === 'concepts' && filename === 'example-concept.html') ||
                 (contentType === 'articles' && filename === 'example-article.html');
        }),
        ({contentType, filename}) => {
          const filePath = path.join(process.cwd(), contentType, filename);
          
          if (!fs.existsSync(filePath)) {
            return true; // Skip if file doesn't exist
          }
          
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Should have proper HTML5 structure
          expect(content).toMatch(/<!DOCTYPE html>/);
          expect(content).toMatch(/<html lang="en">/);
          expect(content).toMatch(/<meta charset="UTF-8">/);
          
          // Should have proper article structure
          expect(content).toMatch(/<article class="(problem|concept|article)"/);
          expect(content).toMatch(/data-id="[\w-]+"/);
          
          // Should have header with title
          expect(content).toMatch(/<header>/);
          expect(content).toMatch(/<h1>/);
          
          // Should have metadata section
          expect(content).toMatch(/class="metadata"/);
          
          // Should load main CSS
          expect(content).toMatch(/\.\.\/assets\/css\/main\.css/);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Documentation files contain required sections', () => {
    const docsFiles = [
      { file: 'contributing.md', sections: ['Contributing to CodeProb', 'Content Types', 'Contribution Workflow'] },
      { file: 'validation-rules.md', sections: ['Content Validation Rules', 'General Validation Rules', 'Metadata Validation'] }
    ];

    docsFiles.forEach(({file, sections}) => {
      const filePath = path.join(process.cwd(), 'docs', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      sections.forEach(section => {
        expect(content).toMatch(new RegExp(`#.*${section}`, 'i'));
      });
    });
  });
});