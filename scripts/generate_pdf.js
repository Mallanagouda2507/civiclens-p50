/**
 * CivicLens P50 - Final Report PDF Generator
 * 
 * Converts docs/CivicLens_P50_Final_Report.md into a publication-ready HTML
 * with academic styling and uses headless Google Chrome to print to PDF.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdown(md) {
  const lines = md.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer = [];
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;
  let listType = 'ul';

  const formatInline = (text) => {
    return text
      // Bold + Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // LaTeX inline math
      .replace(/\\\((.*?)\\\)/g, '<em>$1</em>')
      .replace(/\$([^\$]+)\$/g, '<em>$1</em>')
      // Markdown links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html += `<pre><code class="language-${codeBlockLang}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>\n`;
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        if (inList) { html += `</${listType}>\n`; inList = false; }
        if (inTable) { html += '</tbody></table>\n'; inTable = false; }
        codeBlockLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        if (inList) { html += `</${listType}>\n`; inList = false; }
        html += '<table class="academic-table">\n<thead>\n<tr>';
        const headers = line.split('|').slice(1, -1).map(h => h.trim());
        headers.forEach(h => {
          html += `<th>${formatInline(h)}</th>`;
        });
        html += '</tr>\n</thead>\n<tbody>\n';
        inTable = true;
        tableHeaderParsed = false;
        continue;
      } else if (!tableHeaderParsed && line.includes('---')) {
        tableHeaderParsed = true;
        continue;
      } else {
        html += '<tr>';
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        cells.forEach(c => {
          html += `<td>${formatInline(c)}</td>`;
        });
        html += '</tr>\n';
        continue;
      }
    } else if (inTable) {
      html += '</tbody></table>\n';
      inTable = false;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += '<hr class="section-divider" />\n';
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<h1 class="doc-title">${formatInline(line.slice(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<h2>${formatInline(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<h3>${formatInline(line.slice(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith('#### ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<h4>${formatInline(line.slice(5))}</h4>\n`;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<blockquote>${formatInline(line.slice(2))}</blockquote>\n`;
      continue;
    }

    // Lists (Ordered or Unordered)
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      const currentListType = olMatch ? 'ol' : 'ul';
      const itemText = olMatch ? olMatch[1] : ulMatch[1];

      if (!inList || listType !== currentListType) {
        if (inList) html += `</${listType}>\n`;
        listType = currentListType;
        html += `<${listType}>\n`;
        inList = true;
      }
      html += `  <li>${formatInline(itemText)}</li>\n`;
      continue;
    } else if (inList && line === '') {
      html += `</${listType}>\n`;
      inList = false;
      continue;
    }

    // Empty lines
    if (line === '') {
      continue;
    }

    // Paragraph
    html += `<p>${formatInline(line)}</p>\n`;
  }

  if (inTable) html += '</tbody></table>\n';
  if (inList) html += `</${listType}>\n`;

  return html;
}

function buildHtmlDocument(contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CivicLens P50 Final Academic Report</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 20mm 16mm;
    @bottom-center {
      content: "CivicLens – Municipal Complaint Portal (Question 50) | Page " counter(page);
      font-size: 8.5pt;
      color: #64748b;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .doc-title {
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 3px solid #0284c7;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #0369a1;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 24px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11.5pt;
    font-weight: 600;
    color: #0f172a;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 8px 0;
    text-align: justify;
  }

  strong {
    color: #0f172a;
  }

  ul, ol {
    margin: 0 0 10px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  blockquote {
    margin: 10px 0;
    padding: 8px 14px;
    background: #f8fafc;
    border-left: 4px solid #0284c7;
    color: #334155;
    font-style: italic;
  }

  .academic-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  .academic-table th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #0f172a;
  }

  .academic-table td {
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }

  .academic-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 10px 12px;
    border-radius: 4px;
    font-family: "Cascadia Code", Consolas, "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.4;
    overflow-x: auto;
    margin: 10px 0 14px 0;
    page-break-inside: avoid;
  }

  code {
    font-family: "Cascadia Code", Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  .section-divider {
    border: 0;
    height: 1px;
    background: #cbd5e1;
    margin: 20px 0;
  }

  .report-header-badge {
    background: #e0f2fe;
    color: #0369a1;
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 8pt;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="report-header-badge">Official Academic Deliverable – Question 50 (P50)</div>
${contentHtml}
</body>
</html>`;
}

async function renderPdfWithSelenium(htmlPath, pdfPath) {
  const backendDir = path.resolve(__dirname, '../backend');
  const { Builder } = require(path.join(backendDir, 'node_modules/selenium-webdriver'));
  const chrome = require(path.join(backendDir, 'node_modules/selenium-webdriver/chrome'));

  console.log('Launching headless Chrome via Selenium WebDriver...');
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    console.log(`Navigating to: ${fileUrl}`);
    await driver.get(fileUrl);

    console.log('Printing page to PDF via Selenium printPage API...');
    const pdfBase64 = await driver.printPage({
      pageRanges: [],
      orientation: 'portrait',
      background: true
    });

    const buffer = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(pdfPath, buffer);
    console.log(`SUCCESS: PDF report written to ${pdfPath} (${buffer.length} bytes)`);
  } finally {
    await driver.quit();
  }
}

async function run() {
  const mdPath = path.resolve(__dirname, '../docs/CivicLens_P50_Final_Report.md');
  const htmlPath = path.resolve(__dirname, '../docs/CivicLens_P50_Final_Report.html');
  const pdfPath = path.resolve(__dirname, '../docs/CivicLens_P50_Final_Report.pdf');

  console.log(`Reading report markdown from: ${mdPath}`);
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  console.log('Parsing markdown to publication HTML...');
  const parsedHtml = parseMarkdown(mdContent);
  const fullHtml = buildHtmlDocument(parsedHtml);

  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log(`Generated styled HTML: ${htmlPath} (${fullHtml.length} bytes)`);

  await renderPdfWithSelenium(htmlPath, pdfPath);
}

run().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
