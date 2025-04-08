// Client-side JavaScript to handle content sections and menu behavior
document.addEventListener('DOMContentLoaded', function() {
  const content = document.querySelector('.summary-content');
  const explanation = document.querySelector('.explanation-content');
  
  if (content && explanation) {
    // Original content HTML
    const html = content.innerHTML;
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all headings
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    let summaryContent = '';
    let explanationContent = '';
    let currentSection = '';
    
    headings.forEach(heading => {
      const headingText = heading.textContent.trim().toLowerCase();
      
      if (headingText.includes('要約') || headingText.includes('summary')) {
        currentSection = 'summary';
        // Skip this heading
      } else if (headingText.includes('解説') || headingText.includes('explanation')) {
        currentSection = 'explanation';
        // Skip this heading
      }
      
      // Start collecting content for this section
      let nextElement = heading.nextElementSibling;
      while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName)) {
        if (currentSection === 'summary') {
          summaryContent += nextElement.outerHTML;
        } else if (currentSection === 'explanation') {
          explanationContent += nextElement.outerHTML;
        }
        nextElement = nextElement.nextElementSibling;
        if (!nextElement) break;
      }
    });
    
    // If no sections were found, use the first few paragraphs as summary
    if (!summaryContent) {
      const paragraphs = tempDiv.querySelectorAll('p');
      for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
        summaryContent += paragraphs[i].outerHTML;
      }
    }
    
    // Update the content areas
    content.innerHTML = summaryContent || html;
    explanation.innerHTML = explanationContent || '';
  }
  
  // Add smooth scrolling functionality for menu items
  const summaryLink = document.getElementById('summary-link');
  const explanationLink = document.getElementById('explanation-link');
  
  // Get sections by ID instead of searching by text content
  const summarySection = document.getElementById('summary-section');
  const explanationSection = document.getElementById('explanation-section');
  
  // Set active item style with improved visual feedback
  function setActiveItem(activeItem) {
    // Reset all items
    document.querySelectorAll('.item').forEach(item => {
      item.classList.remove('active-item');
      
      // Reset any additional active styles if needed
      const arrow = item.querySelector('.arrow-right, .arrow-right2');
      if (arrow) {
        // No need to reset transform as it's handled by CSS transitions
      }
    });
    
    // Set active item
    if (activeItem) {
      activeItem.classList.add('active-item');
      
      // Add animation to indicate the item was clicked
      activeItem.style.animation = 'pulse 0.5s';
      setTimeout(() => {
        activeItem.style.animation = '';
      }, 500);
    }
  }
  
  // Scroll to summary section
  if (summaryLink && summarySection) {
    summaryLink.addEventListener('click', function(e) {
      e.preventDefault();
      summarySection.scrollIntoView({ behavior: 'smooth' });
      setActiveItem(summaryLink);
    });
  }
  
  // Scroll to explanation section
  if (explanationLink && explanationSection) {
    explanationLink.addEventListener('click', function(e) {
      e.preventDefault();
      explanationSection.scrollIntoView({ behavior: 'smooth' });
      setActiveItem(explanationLink);
    });
  }
  
  // Improved scroll handling with throttling to improve performance
  let ticking = false;
  function handleScroll() {
    if (!summarySection || !explanationSection) return;
    
    if (!ticking) {
      window.requestAnimationFrame(function() {
        // Get positions relative to viewport
        const summaryRect = summarySection.getBoundingClientRect();
        const explanationRect = explanationSection.getBoundingClientRect();
        
        // Check which section is more visible in the viewport
        const viewportHeight = window.innerHeight;
        const summaryVisibleHeight = Math.min(summaryRect.bottom, viewportHeight) - Math.max(summaryRect.top, 0);
        const explanationVisibleHeight = Math.min(explanationRect.bottom, viewportHeight) - Math.max(explanationRect.top, 0);
        
        // More sophisticated check for which section is currently in view
        if (explanationVisibleHeight > summaryVisibleHeight && explanationRect.top <= 150) {
          // Explanation section is more visible
          setActiveItem(explanationLink);
        } else {
          // Summary section is more visible or we're at the top
          setActiveItem(summaryLink);
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  }
  
  // Add scroll event listener with passive flag for better performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial call to set correct state
  handleScroll();
  
  // Set default active item on page load
  if (summaryLink) {
    setActiveItem(summaryLink);
  }
});
