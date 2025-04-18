// Client-side JavaScript to handle content sections and menu behavior
document.addEventListener('DOMContentLoaded', function() {
  // DOM element references
  const content = document.querySelector('.summary-content');
  const explanation = document.querySelector('.explanation-content');
  const column = document.querySelector('.column');
  const summaryLink = document.getElementById('summary-link');
  const explanationLink = document.getElementById('explanation-link');
  const summarySection = document.getElementById('summary-section');
  const explanationSection = document.getElementById('explanation-section');
  const summarySidebar = document.querySelector('.summary-sidebar');
  const explanationSidebar = document.querySelector('.explanation-sidebar');

  // Audio elements
  const audioElements = document.querySelectorAll('audio');
  
  // Initial menu position - only calculate once
  let menuFixedStyles = {};

  // Column placeholder for fixed positioning
  const rect = column.getBoundingClientRect();
  const offsetFromTop = rect.top;
  
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
  
  // Handle responsive layout for audio sidebars
  function handleResponsiveAudioLayout() {
    const isMobile = window.innerWidth <= 992;
    
    // Handle summary sidebar (audio 1)
    if (summarySidebar && content) {
      if (isMobile) {
        // Move summary sidebar to top of summary content
        if (content.firstChild) {
          content.insertBefore(summarySidebar, content.firstChild);
        } else {
          content.appendChild(summarySidebar);
        }
        
        // Apply mobile styling
        summarySidebar.style.width = '100%';
        summarySidebar.style.marginBottom = '20px';
        summarySidebar.style.paddingLeft = '0';
      } else {
        // Return to original position in desktop view
        const firstContentRow = document.querySelector('.content-row:first-of-type');
        if (firstContentRow && summarySidebar.parentNode !== firstContentRow) {
          firstContentRow.appendChild(summarySidebar);
          
          // Reset styles
          summarySidebar.style.width = '';
          summarySidebar.style.marginBottom = '';
          summarySidebar.style.paddingLeft = '';
        }
      }
    }
    
    // Handle explanation sidebar (audio 2)
    if (explanationSidebar && explanation) {
      if (isMobile) {
        // Move explanation sidebar to top of explanation content
        if (explanation.firstChild) {
          explanation.insertBefore(explanationSidebar, explanation.firstChild);
        } else {
          explanation.appendChild(explanationSidebar);
        }
        
        // Apply mobile styling
        explanationSidebar.style.width = '100%';
        explanationSidebar.style.marginBottom = '20px';
        explanationSidebar.style.paddingLeft = '0';
      } else {
        // Return to original position in desktop view
        const secondContentRow = document.querySelector('.content-row:nth-of-type(2)');
        if (secondContentRow && explanationSidebar.parentNode !== secondContentRow) {
          secondContentRow.appendChild(explanationSidebar);
          
          // Reset styles
          explanationSidebar.style.width = '';
          explanationSidebar.style.marginBottom = '';
          explanationSidebar.style.paddingLeft = '';
        }
      }
    }
    
    // Adjust expert profiles for better mobile display
    const expertProfiles = document.querySelectorAll('.expert-profile');
    expertProfiles.forEach(profile => {
      if (isMobile) {
        profile.style.display = 'flex';
        profile.style.flexDirection = 'column';
        
        const avatar = profile.querySelector('.expert-avatar');
        if (avatar) {
          avatar.style.marginBottom = '16px';
          avatar.style.width = '100%';
        }
      } else {
        profile.style.display = '';
        profile.style.flexDirection = '';
        
        const avatar = profile.querySelector('.expert-avatar');
        if (avatar) {
          avatar.style.marginBottom = '';
          avatar.style.width = '';
        }
      }
    });
  }

  // Calculate and cache column fixed positioning values
  function calculateColumnFixedStyles() {
    if (!column) return;
    
    // Get column position precisely
    const columnRect = column.getBoundingClientRect();
    
    // More accurate position calculation
    menuFixedStyles = {
      left: `${columnRect.left}px`, // Left position without scroll offset
      width: `${column.offsetWidth}px`,
      initialTop: `${column.offsetTop}px`
    };
  }

  function createColumnPlaceholder() {
    // Create a placeholder element with the same dimensions as the column
    const placeholder = document.createElement('div');
    placeholder.className = 'column-placeholder';
    placeholder.style.width = `${column.offsetWidth}px`;
    placeholder.style.height = `${column.offsetHeight}px`;
    placeholder.style.flex = '0 0 auto';
    placeholder.style.display = 'none'; // Initially hidden
    
    // Insert the placeholder before the column
    column.parentNode.insertBefore(placeholder, column);
    
    return placeholder;
  }

  // Capture original column styles once on page load
  const captureOriginalColumnStyles = () => {
    const styles = {};
    if (column) {
      const computedStyle = window.getComputedStyle(column);
      styles.position = computedStyle.position;
      styles.top = computedStyle.top;
      styles.left = computedStyle.left;
      styles.width = computedStyle.width;
      styles.zIndex = computedStyle.zIndex;
      styles.margin = computedStyle.margin;
      styles.height = column.offsetHeight + 'px';
    }
    return styles;
  };

  // Device detection for responsive handling
  function isDesktopView() {
    return window.innerWidth > 1024;
  }
  
  function isTabletView() {
    return window.innerWidth <= 1024 && window.innerWidth > 768;
  }

  function handleColumnPosition() {
    if (!column) return;

    // Only apply fixed column in desktop view
    if (!isDesktopView()) {
      // Remove fixed positioning if screen size changes
      if (column.classList.contains('column-fixed')) {
        column.classList.remove('column-fixed');
        column.style.cssText = ''; // Clear all inline styles
        
        // Hide placeholder if it exists
        const placeholder = document.querySelector('.column-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
      }
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Get or create placeholder
    let placeholder = document.querySelector('.column-placeholder');
    if (!placeholder) {
      placeholder = createColumnPlaceholder();
    }
    
    // CASE 1: At the very top of the page - ALWAYS reset to original state
    if (scrollTop < offsetFromTop) {
      // Reset the column to its original state immediately without animation
      column.style.cssText = ''; // Clear all inline styles completely
      column.classList.remove('column-fixed');
      
      // Hide placeholder
      placeholder.style.display = 'none';
      return;
    }
    
    // Get fresh column position data
    const columnRect = column.getBoundingClientRect();
    const columnTopPosition = columnRect.top;
    
    // CASE 2: Column is about to reach the top of viewport - make it fixed
    if (columnTopPosition <= 10 && !column.classList.contains('column-fixed')) {
      // Calculate position before fixing
      calculateColumnFixedStyles();
      
      // Size placeholder correctly and show it
      placeholder.style.width = `${column.offsetWidth}px`;
      placeholder.style.height = `${column.offsetHeight}px`;
      placeholder.style.marginRight = getComputedStyle(column).marginRight;
      placeholder.style.display = 'block';
      
      // Make column fixed
      column.classList.add('column-fixed');
      Object.assign(column.style, {
        position: 'fixed',
        top: '10px',
        left: menuFixedStyles.left,
        width: menuFixedStyles.width,
        zIndex: '100'
      });
    } 
    // CASE 3: Column is fixed but we've scrolled back up past the trigger point
    else if (columnTopPosition > 20 && column.classList.contains('column-fixed')) {
      // Reset to original state
      column.classList.remove('column-fixed');
      column.style.cssText = ''; // Clear ALL inline styles
      
      // Hide placeholder
      placeholder.style.display = 'none';
    }
    // CASE 4: Just update left position if already fixed (window resize, etc)
    else if (column.classList.contains('column-fixed')) {
      calculateColumnFixedStyles();
      column.style.left = menuFixedStyles.left;
      column.style.width = menuFixedStyles.width;
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
      
      // Hide all audio cards in the content before processing
      tempDiv.querySelectorAll('.kg-card.kg-audio-card').forEach(card => {
        card.style.display = 'none';
      });
      
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
      
      // After setting content, ensure all audio cards in both sections are hidden
      document.querySelectorAll('.summary-content .kg-card.kg-audio-card, .explanation-content .kg-card.kg-audio-card').forEach(card => {
        card.style.display = 'none';
      });
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
  
  // Enhanced function to fully integrate audio cards with custom UI
  function moveAudioToFrames() {
    // First check if we have any audio elements to work with
    if (!audioElements.length) return;

    try {
      // Get containers if available
      const summaryContainer = document.querySelector('.summary-sidebar .audio-container');
      const explanationContainer = document.querySelector('.explanation-sidebar .audio-container');
      
      // If no specific containers found, use generic approach
      if (!summaryContainer && !explanationContainer) {
        console.log('No specific audio containers found, using generic approach');
        const audioContainerElements = document.querySelectorAll('.audio-container');
        
        if (!audioContainerElements.length) {
          // Process each audio element directly if no containers
          audioElements.forEach((audioEl) => {
            audioEl.style.display = 'block';
            audioEl.style.width = '100%';
            audioEl.controls = true;
          });
          return;
        }
        
        // Simply move the audio elements to the containers (generic approach)
        audioElements.forEach((audioEl, index) => {
          if (index >= audioContainerElements.length) return;
          const container = audioContainerElements[index];
          if (audioEl.parentNode) {
            audioEl.parentNode.removeChild(audioEl);
          }
          audioEl.controls = true;
          audioEl.style.width = '100%';
          audioEl.style.display = 'block';
          container.appendChild(audioEl);
          container.style.display = 'flex';
          container.style.width = '100%';
        });
        
        return;
      }
      
      // Handle the case with two audio elements (common case)
      if (audioElements.length >= 1 && summaryContainer) {
        // Set up first audio element for summary section
        const summaryAudio = audioElements[0];
        if (summaryAudio.parentNode) {
          summaryAudio.parentNode.removeChild(summaryAudio);
        }
        summaryAudio.controls = true;
        summaryAudio.style.width = '100%';
        summaryAudio.style.display = 'block';
        summaryContainer.appendChild(summaryAudio);
        summaryContainer.style.display = 'flex';
        summaryContainer.style.width = '100%';
      }
      
      if (audioElements.length >= 2 && explanationContainer) {
        // Set up second audio element for explanation section
        const explanationAudio = audioElements[1];
        if (explanationAudio.parentNode) {
          explanationAudio.parentNode.removeChild(explanationAudio);
        }
        explanationAudio.controls = true;
        explanationAudio.style.width = '100%';
        explanationAudio.style.display = 'block';
        explanationContainer.appendChild(explanationAudio);
        explanationContainer.style.display = 'flex';
        explanationContainer.style.width = '100%';
      }
      
      // Handle additional audio elements if there are more than 2
      if (audioElements.length > 2) {
        // For any additional audio elements, just make them visible
        for (let i = 2; i < audioElements.length; i++) {
          const extraAudio = audioElements[i];
          extraAudio.style.display = 'block';
          extraAudio.style.width = '100%';
          extraAudio.controls = true;
        }
      }
      
      // Clean up any remaining audio cards or elements in content sections
      cleanupAudioFromContent();
    } catch (error) {
      console.error('Error moving audio elements to frames:', error);
      // Make sure all audio elements are visible in case of error
      audioElements.forEach(audio => {
        audio.style.display = 'block';
        audio.controls = true;
      });
    }
  }
  
  // Helper function to clean up audio elements from content
  function cleanupAudioFromContent() {
    // Select all content sections to clean
    const contentSections = [
      document.querySelector('.summary-content'),
      document.querySelector('.explanation-content')
    ];
    
    contentSections.forEach(section => {
      if (!section) return;
      
      // Remove Ghost audio cards from content
      const audioCards = section.querySelectorAll('.kg-card.kg-audio-card');
      audioCards.forEach(card => {
        card.remove(); // Completely remove the card
      });
      
      // Remove any remaining audio elements
      const remainingAudio = section.querySelectorAll('audio');
      remainingAudio.forEach(audio => {
        audio.remove(); // Remove any remaining audio elements
      });
      
      // Remove any figure elements that might have contained audio
      const audioFigures = section.querySelectorAll('figure.kg-audio-card');
      audioFigures.forEach(figure => {
        figure.remove();
      });
    });
  }
  
  // Helper function to format time in MM:SS format
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  // Enhanced window resize handler
  const handleResize = debounce(function() {
    // Recalculate styles only in desktop view
    if (isDesktopView()) {
      calculateColumnFixedStyles();
      
      // Update placeholder size if it exists
      const placeholder = document.querySelector('.column-placeholder');
      if (placeholder && placeholder.style.display !== 'none') {
        placeholder.style.width = `${column.offsetWidth}px`;
        placeholder.style.height = `${column.offsetHeight}px`;
      }
      
      handleColumnPosition();
    } else {
      // Ensure fixed positioning is removed on non-desktop
      if (column && column.classList.contains('column-fixed')) {
        column.classList.remove('column-fixed');
        column.style.cssText = '';
        
        const placeholder = document.querySelector('.column-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
      }
    }
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

  // Handle tablet layout adjustments
  function handleTabletLayout() {
    if (!isTabletView()) return;
    
    // Handle summary sidebar
    const firstContentRow = document.querySelector('.content-row:first-of-type');
    const summarySidebar = document.querySelector('.summary-sidebar');
    const contentColumn = document.querySelector('.column2');
    const summarySection = document.getElementById('summary-section');
    
    if (summarySidebar && contentColumn && summarySection) {
      // Move the entire summary sidebar into the column2, at the beginning of summary section
      summarySection.insertBefore(summarySidebar, summarySection.firstChild);
      
      // Apply tablet-specific styling
      summarySidebar.style.marginBottom = '20px';
      summarySidebar.style.width = '100%';
      summarySidebar.style.paddingLeft = '0';
    }
    
    // Handle explanation sidebar
    const explanationSidebar = document.querySelector('.explanation-sidebar');
    const explanationSection = document.getElementById('explanation-section');
    
    if (explanationSidebar && explanationSection) {
      // Move explanation sidebar inside the explanation section
      explanationSection.insertBefore(explanationSidebar, explanationSection.firstChild);
      
      // Style for in-section placement
      explanationSidebar.style.marginTop = '0';
      explanationSidebar.style.marginBottom = '20px';
      explanationSidebar.style.width = '100%';
      explanationSidebar.style.paddingLeft = '0';
    }
    
    // Adjust audio container and avatar widths
    const expertProfiles = document.querySelectorAll('.expert-profile');
    expertProfiles.forEach(profile => {
      const avatar = profile.querySelector('.expert-avatar');
      const audioContainer = profile.querySelector('.audio-container');
      
      if (avatar && audioContainer) {
        profile.style.display = 'flex';
        profile.style.flexDirection = 'row';
        avatar.style.width = '50%';
        avatar.style.marginBottom = '0';
        audioContainer.style.width = '50%';
        audioContainer.style.flexGrow = '1';
      }
    });
  }

  // Handle resize events for responsive layout
  const handleResponsiveLayout = debounce(function() {
    if (isTabletView()) {
      handleTabletLayout();
    } else {
      // Reset to desktop layout if needed
      resetToDesktopLayout();
    }
  }, 250);

  // Reset layout to desktop version
  function resetToDesktopLayout() {
    if (window.innerWidth <= 768) return; // Don't reset for mobile
    
    // Reset summary sidebar
    const summarySidebar = document.querySelector('.summary-sidebar');
    const firstContentRow = document.querySelector('.content-row:first-of-type');
    
    if (summarySidebar && firstContentRow) {
      // Move sidebar back to original position at the end of first row
      firstContentRow.appendChild(summarySidebar);
      
      // Reset styles
      summarySidebar.style.marginBottom = '';
      summarySidebar.style.width = '';
      summarySidebar.style.paddingLeft = '';
    }
    
    // Reset explanation sidebar
    const explanationSidebar = document.querySelector('.explanation-sidebar');
    const secondContentRow = document.querySelector('.content-row:nth-of-type(2)');
    
    if (explanationSidebar && secondContentRow) {
      // Move explanation sidebar back to second row
      secondContentRow.appendChild(explanationSidebar);
      
      // Reset styles
      explanationSidebar.style.marginTop = '';
      explanationSidebar.style.width = '';
      explanationSidebar.style.paddingLeft = '';
    }
    
    // Reset expert profile styles
    document.querySelectorAll('.expert-profile').forEach(profile => {
      profile.style.flexDirection = '';
      
      const avatar = profile.querySelector('.expert-avatar');
      const audioContainer = profile.querySelector('.audio-container');
      
      if (avatar && audioContainer) {
        avatar.style.width = '';
        avatar.style.marginBottom = '';
        audioContainer.style.width = '';
        audioContainer.style.flexGrow = '';
      }
    });
  }

  // Initialize everything
  function init() {
    // Calculate initial column styles
    calculateColumnFixedStyles();
    
    // Parse content into sections
    parseContentSections();
    
    // Set up event listeners
    window.addEventListener('scroll', throttle(handleColumnPosition, 100), { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Move audio elements to frames
    moveAudioToFrames();
    
    // Initial calls to set correct state
    handleColumnPosition();
    handleScroll();
    
    // Handle responsive layout for audio sidebars
    handleResponsiveAudioLayout();
    window.addEventListener('resize', debounce(handleResponsiveAudioLayout, 250), { passive: true });
    
    // Set default active item
    if (summaryLink) {
      setActiveItem(summaryLink);
    }

    // Check if tablet and apply layout
    handleResponsiveLayout();
    
    // Add resize listener for responsive layout
    window.addEventListener('resize', handleResponsiveLayout, { passive: true });
  }
  
  // Start everything
  init();
});
