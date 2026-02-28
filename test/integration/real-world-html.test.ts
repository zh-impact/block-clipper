/**
 * Integration tests for HTML to Markdown converter with real-world HTML
 */

import { describe, it, expect } from 'vitest';
import { convertHTMLtoMarkdown, convertHTMLtoMarkdownSafe } from '../../utils/converter';

describe('HTML to Markdown Converter - Real World HTML', () => {
  describe('Blog post HTML', () => {
    it('should convert a typical blog post structure', () => {
      const html = `
        <article>
          <h1>Getting Started with TypeScript</h1>
          <p class="meta">By John Doe • January 15, 2024</p>
          <p>TypeScript is a powerful superset of JavaScript that adds static typing.</p>
          <h2>Why TypeScript?</h2>
          <p>There are several benefits to using TypeScript:</p>
          <ul>
            <li><strong>Type Safety:</strong> Catch errors at compile time</li>
            <li><strong>Better IDE Support:</strong> Autocomplete and refactoring</li>
            <li><strong>Improved Code Quality:</strong> Self-documenting code</li>
          </ul>
          <h2>Installation</h2>
          <p>Install TypeScript using npm:</p>
          <pre><code class="language-bash">npm install -g typescript
tsc --init</code></pre>
          <h2>Basic Types</h2>
          <p>Here are some basic type examples:</p>
          <pre><code class="language-typescript">const name: string = "John";
const age: number = 30;
const isActive: boolean = true;</code></pre>
          <p>For more information, visit <a href="https://www.typescriptlang.org">TypeScript website</a>.</p>
        </article>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      // Verify structure
      expect(markdown).toContain('# Getting Started with TypeScript');
      expect(markdown).toContain('## Why TypeScript?');
      expect(markdown).toContain('## Installation');
      expect(markdown).toContain('## Basic Types');
      expect(markdown).toContain('```bash');
      expect(markdown).toContain('```typescript');
      expect(markdown).toContain('[TypeScript website](https://www.typescriptlang.org)');
      expect(markdown).toContain('**Type Safety:**');
    });
  });

  describe('Documentation page HTML', () => {
    it('should convert API documentation structure', () => {
      const html = `
        <div class="documentation">
          <h1>API Reference</h1>
          <p>This page describes the public API for our service.</p>
          <h2>Authentication</h2>
          <p>All API requests require authentication using a Bearer token:</p>
          <pre><code class="language-http">GET /api/v1/users
Authorization: Bearer YOUR_TOKEN</code></pre>
          <h3>Endpoints</h3>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GET</td>
                <td>/api/v1/users</td>
                <td>List all users</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>/api/v1/users</td>
                <td>Create a new user</td>
              </tr>
            </tbody>
          </table>
          <p>See the <a href="#examples">examples section</a> for more details.</p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# API Reference');
      expect(markdown).toContain('## Authentication');
      expect(markdown).toContain('### Endpoints');
      expect(markdown).toContain('```http');
      expect(markdown).toContain('GET');
      expect(markdown).toContain('[examples section](#examples)');
    });
  });

  describe('News article HTML', () => {
    it('should convert news article with quotes and links', () => {
      const html = `
        <article>
          <h1>Breaking: Major Tech Announcement</h1>
          <p class="dateline">SAN FRANCISCO — Today, a major technology company announced its latest innovation.</p>
          <blockquote>
            <p>"This will revolutionize the industry," said CEO Jane Smith during the keynote presentation.</p>
          </blockquote>
          <p>The new technology promises to <em>significantly improve</em> user experience across all platforms.</p>
          <h2>Key Features</h2>
          <ol>
            <li>Faster performance with 50% speed improvement</li>
            <li>Enhanced security measures</li>
            <li>Cross-platform compatibility</li>
          </ol>
          <p>Read more at <a href="https://example.com/news">Example News</a>.</p>
        </article>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# Breaking: Major Tech Announcement');
      expect(markdown).toContain('> "This will revolutionize the industry,"');
      expect(markdown).toContain('_significantly improve_');
      expect(markdown).toContain('1.');
      expect(markdown).toContain('Faster performance');
      expect(markdown).toContain('2.');
      expect(markdown).toContain('Enhanced security');
      expect(markdown).toContain('[Example News](https://example.com/news)');
    });
  });

  describe('Tutorial with code blocks', () => {
    it('should convert tutorial with multiple code examples', () => {
      const html = `
        <div class="tutorial">
          <h1>Building a React Component</h1>
          <p>In this tutorial, we'll build a simple React component.</p>
          <h2>Step 1: Create the Component</h2>
          <p>Start by creating a new file:</p>
          <pre><code class="language-javascript">import React from 'react';

function Welcome(props) {
  return &lt;h1&gt;Hello, {props.name}&lt;/h1&gt;;
}

export default Welcome;</code></pre>
          <h2>Step 2: Use the Component</h2>
          <p>Now import and use it in your app:</p>
          <pre><code class="language-javascript">import Welcome from './Welcome';

function App() {
  return (
    &lt;div&gt;
      &lt;Welcome name="Alice" /&gt;
      &lt;Welcome name="Bob" /&gt;
    &lt;/div&gt;
  );
}</code></pre>
          <p>Note the use of <code>props.name</code> to pass data to the component.</p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# Building a React Component');
      expect(markdown).toContain('## Step 1: Create the Component');
      expect(markdown).toContain('## Step 2: Use the Component');
      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('function Welcome(props)');
      expect(markdown).toContain('`props.name`');
    });
  });

  describe('Stack Overflow style content', () => {
    it('should convert Q&A style content', () => {
      const html = `
        <div class="question">
          <h1>How do I check if a variable is undefined in JavaScript?</h1>
          <p>I want to check if a variable has been declared but not assigned a value.</p>
          <div class="answers">
            <h2>Answer 1</h2>
            <p>You can use the <code>typeof</code> operator:</p>
            <pre><code class="language-javascript">if (typeof myVar === 'undefined') {
  // Variable is undefined
}</code></pre>
            <p>This is the safest way because it won't throw an error if the variable doesn't exist.</p>
            <h2>Answer 2</h2>
            <p>Alternatively, you can use strict equality:</p>
            <pre><code class="language-javascript">if (myVar === undefined) {
  // Variable is undefined
}</code></pre>
            <p>See <a href="https://developer.mozilla.org">MDN</a> for more details.</p>
          </div>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# How do I check if a variable is undefined in JavaScript?');
      expect(markdown).toContain('## Answer 1');
      expect(markdown).toContain('## Answer 2');
      expect(markdown).toContain("```javascript");
      expect(markdown).toContain('`typeof`');
      expect(markdown).toContain('[MDN](https://developer.mozilla.org)');
    });
  });

  describe('Product page HTML', () => {
    it('should convert e-commerce product description', () => {
      const html = `
        <div class="product">
          <h1>Premium Wireless Headphones</h1>
          <p class="price">$199.99</p>
          <p>Experience crystal-clear audio with our premium wireless headphones.</p>
          <h2>Features</h2>
          <ul>
            <li>40-hour battery life</li>
            <li>Active noise cancellation</li>
            <li>Premium comfort design</li>
            <li>Bluetooth 5.0 connectivity</li>
          </ul>
          <h2>Specifications</h2>
          <table>
            <tbody>
              <tr><td>Driver Size</td><td>40mm</td></tr>
              <tr><td>Frequency Response</td><td>20Hz - 20kHz</td></tr>
              <tr><td>Weight</td><td>250g</td></tr>
            </tbody>
          </table>
          <p><strong>Limited time offer:</strong> Free shipping on orders over $100!</p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# Premium Wireless Headphones');
      expect(markdown).toContain('$199.99');
      expect(markdown).toContain('## Features');
      expect(markdown).toContain('## Specifications');
      expect(markdown).toContain('-');
      expect(markdown).toContain('40-hour battery life');
      expect(markdown).toContain('**Limited time offer:**');
    });
  });

  describe('Wikipedia style content', () => {
    it('should convert encyclopedia-style article', () => {
      const html = `
        <div class="article">
          <h1>JavaScript</h1>
          <p><b>JavaScript</b> (/ˈdʒɑːvəskrɪpt/), often abbreviated as <b>JS</b>, is a programming language that is one of the core technologies of the World Wide Web.</p>
          <h2>History</h2>
          <p>JavaScript was created in <a href="/wiki/Netscape">Netscape</a> in 1995 by <a href="/wiki/Brendan_Eich">Brendan Eich</a>.</p>
          <h2>Usage</h2>
          <p>JavaScript is primarily used for:</p>
          <ul>
            <li>Web browsers (client-side)</li>
            <li>Web servers (Node.js)</li>
            <li>Mobile applications</li>
            <li>Desktop applications</li>
          </ul>
          <blockquote>
            <p>"JavaScript is the world's most popular programming language."</p>
          </blockquote>
          <p>See also: <a href="/wiki/TypeScript">TypeScript</a>, <a href="/wiki/HTML">HTML</a>, <a href="/wiki/CSS">CSS</a></p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# JavaScript');
      expect(markdown).toContain('**JavaScript**');
      expect(markdown).toContain('## History');
      expect(markdown).toContain('## Usage');
      expect(markdown).toContain('[Netscape](/wiki/Netscape)');
      expect(markdown).toContain('> "JavaScript is the world');
      expect(markdown).toContain('[TypeScript](/wiki/TypeScript)');
    });
  });

  describe('GitHub README style', () => {
    it('should convert README-style documentation', () => {
      const html = `
        <div class="markdown-body">
          <h1>Awesome Project</h1>
          <p>A brief description of what this project does and who it's for</p>
          <h2>Installation</h2>
          <pre><code class="language-bash">git clone https://github.com/user/repo.git
cd repo
npm install
npm start</code></pre>
          <h2>Usage</h2>
          <pre><code class="language-javascript">const AwesomeProject = require('awesome-project');

const instance = new AwesomeProject();
instance.doSomething();</code></pre>
          <h2>Contributing</h2>
          <p>Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.</p>
          <h2>License</h2>
          <p><a href="https://opensource.org/licenses/MIT">MIT</a></p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('# Awesome Project');
      expect(markdown).toContain('## Installation');
      expect(markdown).toContain('## Usage');
      expect(markdown).toContain('## Contributing');
      expect(markdown).toContain('## License');
      expect(markdown).toContain('```bash');
      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('[MIT](https://opensource.org/licenses/MIT)');
    });
  });

  describe('Security considerations', () => {
    it('should sanitize scripts from HTML', () => {
      const html = `
        <div>
          <h1>Safe Content</h1>
          <p>This is safe content.</p>
          <script>alert('XSS attack!');</script>
          <script>document.location='http://evil.com';</script>
        </div>
      `;

      const markdown = convertHTMLtoMarkdownSafe(html);

      expect(markdown).toContain('# Safe Content');
      expect(markdown).not.toContain('alert');
      expect(markdown).not.toContain('XSS');
      expect(markdown).not.toContain('evil.com');
    });

    it('should remove style tags', () => {
      const html = `
        <div>
          <h1>Content</h1>
          <style>body { display: none; }</style>
          <p>Some content here.</p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdownSafe(html);

      expect(markdown).toContain('# Content');
      expect(markdown).toContain('Some content here.');
      expect(markdown).not.toContain('display: none');
      expect(markdown).not.toContain('<style>');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed HTML gracefully', () => {
      const html = `
        <div>
          <h1>Unclosed tags
          <p>This paragraph is closed</p>
          <span>Nested content
          </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toBeTruthy();
      expect(markdown).toContain('Unclosed tags');
    });

    it('should handle deeply nested structures', () => {
      const html = `
        <div>
          <div>
            <div>
              <div>
                <p>Deeply nested content</p>
              </div>
            </div>
          </div>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('Deeply nested content');
    });

    it('should handle special characters', () => {
      const html = `
        <div>
          <h1>Special Characters: < > & " '</h1>
          <p>Copyright © 2024 • Price: $100 • Euro: €50</p>
          <p>Emojis: 😀 🎉 🚀 ❤️</p>
          <p>Math: E = mc² • H₂O • ∑ ∫ ∂</p>
        </div>
      `;

      const markdown = convertHTMLtoMarkdown(html);

      expect(markdown).toContain('Special Characters:');
      expect(markdown).toContain('© 2024');
      expect(markdown).toContain('$100');
      expect(markdown).toContain('😀');
      expect(markdown).toContain('E = mc²');
    });
  });
});
