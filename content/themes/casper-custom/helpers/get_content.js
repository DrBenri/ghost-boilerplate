/**
 * Get specific sections of the post content
 * This helper allows extracting sections based on their heading
 */
const cheerio = require('cheerio');

module.exports = function(sectionName, options) {
  const content = this.html;
  const $ = cheerio.load(content);
  
  // Initialize variables to track the target section
  let sectionContent = '';
  let inTargetSection = false;
  let headingFound = false;
  
  // Function to check if a heading contains the target text
  const isTargetHeading = (elem) => {
    const headingText = $(elem).text().trim().toLowerCase();
    const targetText = sectionName.toLowerCase();
    
    if (sectionName === 'summary') {
      return headingText.includes('要約') || headingText.includes('summary');
    } else if (sectionName === 'explanation') {
      return headingText.includes('解説') || headingText.includes('explanation');
    }
    
    return false;
  };
  
  // Iterate through the content
  $('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, figure').each((i, elem) => {
    const tagName = $(elem).prop('tagName').toLowerCase();
    
    // Check if this is a heading
    if (tagName.match(/^h[1-6]$/)) {
      // If we're already in a target section and find another heading, stop collecting
      if (inTargetSection) {
        inTargetSection = false;
        return false; // Break the loop
      }
      
      // If this heading matches our target, start collecting content
      if (isTargetHeading(elem)) {
        inTargetSection = true;
        headingFound = true;
        return; // Skip the heading itself
      }
    }
    
    // If we're in the target section, collect this element
    if (inTargetSection) {
      sectionContent += $.html(elem);
    }
  });
  
  // If no specific section was found and this is the summary section,
  // return the first few paragraphs as a fallback
  if (!headingFound && sectionName === 'summary') {
    sectionContent = '';
    $('p').slice(0, 3).each((i, elem) => {
      sectionContent += $.html(elem);
    });
  }
  
  return {
    html: sectionContent
  };
};
