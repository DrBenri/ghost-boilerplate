// Client-side JavaScript to handle content sections and menu behavior
document.addEventListener('DOMContentLoaded', function() {
  // DOM element references
  const content = document.querySelector('.summary-content');
  const explanation = document.querySelector('.explanation-content');
  const menu = document.querySelector('.menu');
  const column = document.querySelector('.column');
  const summaryLink = document.getElementById('summary-link');
  const explanationLink = document.getElementById('explanation-link');
  const summarySection = document.getElementById('summary-section');
  const explanationSection = document.getElementById('explanation-section');
  const frame20Elements = document.querySelectorAll('.frame-20');
  const audioCards = document.querySelectorAll('.kg-card.kg-audio-card');
  
  // Initial menu position - only calculate once
  const menuInitialPosition = menu && menu.offsetTop;
  let menuFixedStyles = {};
  
  // Throttle helper function for performance-sensitive events
  function throttle(callback, delay = 100) {
    let isThrottled = false;
    return function(...args) {
      if (!isThrottled) {
        callback.apply(this, args);
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, delay);
      }
    };
  }
  
  // Debounce helper function for resize events
  function debounce(callback, delay = 250) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
  }
  
  // Calculate and cache menu fixed positioning values
  function calculateMenuFixedStyles() {
    if (!menu || !column) return;
    
    menuFixedStyles = {
      left: `${column.getBoundingClientRect().left}px`,
      width: `${column.offsetWidth}px`
    };
  }
  
  // Handle fixed menu positioning on scroll
  function handleMenuPosition() {
    if (!menu || !column || menuInitialPosition === undefined) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // Use initial position plus some offset for better user experience
    const threshold = menuInitialPosition + (menu.offsetHeight / 2);

    if (scrollTop > threshold) {
      menu.classList.add('menu-fixed');
      // Apply cached fixed position styles
      Object.assign(menu.style, {
        position: 'fixed',
        top: '0',
        left: menuFixedStyles.left,
        width: menuFixedStyles.width,
        zIndex: '1000'
      });
    } else {
      menu.classList.remove('menu-fixed');
      // Reset styles using CSS class instead of individual properties
      Object.assign(menu.style, {
        position: '',
        top: '',
        left: '',
        width: '',
        zIndex: ''
      });
    }
  }
  
  // Parse content into summary and explanation sections
  function parseContentSections() {
    if (!content || !explanation) return;
    
    try {
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
      
      if (headings.length === 0) {
        // No headings found, use all content as summary
        summaryContent = html;
      } else {
        // Process content by headings
        headings.forEach(heading => {
          const headingText = heading.textContent.trim().toLowerCase();
          
          // Determine section based on heading text
          if (headingText.includes('要約') || headingText.includes('summary')) {
            currentSection = 'summary';
          } else if (headingText.includes('解説') || headingText.includes('explanation')) {
            currentSection = 'explanation';
          }
          
          // Skip if no section determined yet
          if (!currentSection) return;
          
          // Include the heading itself in the appropriate section
          if (currentSection === 'summary') {
            summaryContent += heading.outerHTML;
          } else if (currentSection === 'explanation') {
            explanationContent += heading.outerHTML;
          }
          
          // Collect content until next heading
          let nextElement = heading.nextElementSibling;
          while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName)) {
            if (currentSection === 'summary') {
              summaryContent += nextElement.outerHTML;
            } else if (currentSection === 'explanation') {
              explanationContent += nextElement.outerHTML;
            }
            
            const currentElement = nextElement;
            nextElement = nextElement.nextElementSibling;
            
            // Handle case where we've reached the end of content
            if (!nextElement) break;
          }
        });
        
        // If no summary section was found, use the first few paragraphs
        if (!summaryContent) {
          const paragraphs = tempDiv.querySelectorAll('p');
          for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
            summaryContent += paragraphs[i].outerHTML;
          }
        }
      }
      
      // Update the content areas
      content.innerHTML = summaryContent || html;
      explanation.innerHTML = explanationContent || '';
    } catch (error) {
      console.error('Error parsing content sections:', error);
    }
  }
  
  // Set active menu item
  function setActiveItem(activeItem) {
    if (!activeItem) return;
    
    // Reset all items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active-item');
    });
    
    // Set active item
    activeItem.classList.add('active-item');
  }
  
  // Handle scroll to determine active section
  const handleScroll = throttle(function() {
    if (!summarySection || !explanationSection) return;
    
    // Get positions relative to viewport
    const summaryRect = summarySection.getBoundingClientRect();
    const explanationRect = explanationSection.getBoundingClientRect();
    
    // Check which section is more visible in the viewport
    const viewportHeight = window.innerHeight;
    const summaryVisibleHeight = Math.min(summaryRect.bottom, viewportHeight) - Math.max(summaryRect.top, 0);
    const explanationVisibleHeight = Math.min(explanationRect.bottom, viewportHeight) - Math.max(explanationRect.top, 0);
    
    // Determine active section
    if (explanationVisibleHeight > summaryVisibleHeight && explanationRect.top <= 150) {
      setActiveItem(explanationLink);
    } else {
      setActiveItem(summaryLink);
    }
  }, 100);
  
  // Function to move audio elements to corresponding frame-20 elements
  function moveAudioToFrames() {
    if (!frame20Elements.length || !audioCards.length) return;
    
    try {
      // Store original locations to potentially restore them later if needed
      const originalLocations = Array.from(audioCards).map(card => {
        return {
          element: card,
          parent: card.parentNode,
          nextSibling: card.nextSibling
        };
      });
      
      frame20Elements.forEach((frame, index) => {
        const audioCard = audioCards[index]; // Match audio card by index
        if (audioCard) {
          frame.innerHTML = ''; // Clear existing content in the frame
          // Move the actual element instead of cloning to preserve event listeners
          frame.appendChild(audioCard);
          frame.style.display = 'block'; // Ensure the frame is visible
          
          // Ensure player controls are properly initialized
          const audioPlayer = frame.querySelector('audio');
          if (audioPlayer) {
            // Force audio player to refresh
            const currentTime = audioPlayer.currentTime;
            audioPlayer.load();
            audioPlayer.currentTime = currentTime;
            
            // Make sure play buttons work by ensuring click events propagate
            const playButtons = frame.querySelectorAll('.kg-audio-play-icon, .kg-audio-pause-icon');
            playButtons.forEach(button => {
              // Ensure pointer events are enabled
              button.style.pointerEvents = 'auto';
            });
          }
        } else {
          frame.style.display = 'none'; // Hide the frame if no audio card is available
        }
      });
    } catch (error) {
      console.error('Error moving audio elements:', error);
      // Attempt to restore original state in case of error
      try {
        Array.from(audioCards).forEach(card => {
          if (card.parentNode) {
            card.style.display = '';
          }
        });
      } catch (restoreError) {
        console.error('Error restoring audio elements:', restoreError);
      }
    }
  }
  
  // Handle window resize events
  const handleResize = debounce(function() {
    calculateMenuFixedStyles();
    handleMenuPosition();
  }, 250);
  
  // Set up click handlers for navigation
  function setupNavigation() {
    if (summaryLink && summarySection) {
      summaryLink.addEventListener('click', function(e) {
        e.preventDefault();
        summarySection.scrollIntoView({ behavior: 'smooth' });
        setActiveItem(summaryLink);
      });
    }
    
    if (explanationLink && explanationSection) {
      explanationLink.addEventListener('click', function(e) {
        e.preventDefault();
        explanationSection.scrollIntoView({ behavior: 'smooth' });
        setActiveItem(explanationLink);
      });
    }
  }
  
  // Initialize everything
  function init() {
    // Calculate initial menu styles
    calculateMenuFixedStyles();
    
    // Parse content into sections
    parseContentSections();
    
    // Set up event listeners
    window.addEventListener('scroll', throttle(handleMenuPosition, 100), { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Set up navigation
    setupNavigation();
    
    // Move audio elements to frames
    moveAudioToFrames();
    
    // Initial calls to set correct state
    handleMenuPosition();
    handleScroll();
    
    // Set default active item
    if (summaryLink) {
      setActiveItem(summaryLink);
    }
  }
  
  // Start everything
  init();
});
