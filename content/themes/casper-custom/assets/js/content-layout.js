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
  const audioContainerElements = document.querySelectorAll('.audio-container');
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
  
  // Enhanced function to adapt expert profiles with audio cards
  function moveAudioToFrames() {
    if (!audioContainerElements.length || !audioCards.length) return;
    
    try {
      // Store original locations to potentially restore them later if needed
      const originalLocations = Array.from(audioCards).map(card => {
        return {
          element: card,
          parent: card.parentNode,
          nextSibling: card.nextSibling
        };
      });
      
      audioContainerElements.forEach((container, index) => {
        const audioCard = audioCards[index]; // Match audio card by index
        if (audioCard) {
          // Get the parent expert profile if available
          const expertProfile = container.closest('.expert-profile');
          
          // Extract information from audio card for enhancing expert profile
          if (expertProfile) {
            const audioTitle = audioCard.querySelector('.kg-audio-title')?.textContent;
            const audioPlayerEl = audioCard.querySelector('audio');
            
            // If we have an audio title and no expert name is set, use it
            const expertNameEl = expertProfile.querySelector('.expert-name');
            if (audioTitle && expertNameEl && expertNameEl.textContent.trim() === '') {
              expertNameEl.textContent = audioTitle;
            }
            
            // Setup event listeners for our custom play button if it exists
            const customPlayBtn = expertProfile.querySelector('.play-button');
            if (customPlayBtn && audioPlayerEl) {
              customPlayBtn.addEventListener('click', function() {
                if (audioPlayerEl.paused) {
                  audioPlayerEl.play();
                } else {
                  audioPlayerEl.pause();
                }
              });
              
              // Update play button state when audio state changes
              audioPlayerEl.addEventListener('play', function() {
                customPlayBtn.src = customPlayBtn.src.replace('play.svg', 'pause.svg');
              });
              
              audioPlayerEl.addEventListener('pause', function() {
                customPlayBtn.src = customPlayBtn.src.replace('pause.svg', 'play.svg');
              });
              
              // Update timestamp display if available
              if (expertProfile.querySelector('.audio-timestamp')) {
                audioPlayerEl.addEventListener('timeupdate', function() {
                  const currentTime = formatTime(audioPlayerEl.currentTime);
                  const duration = formatTime(audioPlayerEl.duration);
                  expertProfile.querySelector('.audio-timestamp').textContent = 
                    `${currentTime} / ${duration}`;
                  
                  // Update progress bar if it exists
                  const progressBar = expertProfile.querySelector('.progress-bar');
                  if (progressBar) {
                    const percent = (audioPlayerEl.currentTime / audioPlayerEl.duration) * 100;
                    progressBar.style.background = `linear-gradient(to right, #1d72c2 ${percent}%, #e0e0e0 ${percent}%)`;
                  }
                });
              }
            }
          }
          
          // Clear container and move the audio card
          container.innerHTML = '';
          container.appendChild(audioCard);
          container.style.display = 'block';
          
          // Apply custom styling to make audio card fit our design
          const audioPlayer = audioCard.querySelector('.kg-audio-player');
          if (audioPlayer) {
            // Hide the default Ghost audio card avatar/thumbnail
            const thumbnail = audioCard.querySelector('.kg-audio-thumbnail');
            if (thumbnail) {
              thumbnail.style.display = 'none';
            }
            
            // Style the audio player to match our UI
            audioPlayer.style.backgroundColor = 'transparent';
            audioPlayer.style.padding = '0';
            audioPlayer.style.border = 'none';
            audioPlayer.style.boxShadow = 'none';
            
            // Hide title if we're displaying it in our expert profile
            const title = audioCard.querySelector('.kg-audio-title');
            if (title) {
              title.style.display = 'none';
            }
            
            // Style the play button and duration elements
            const playButton = audioCard.querySelector('.kg-audio-play-icon');
            if (playButton) {
              // If we have a custom play button, hide the Ghost one
              if (expertProfile && expertProfile.querySelector('.play-button')) {
                playButton.parentElement.style.display = 'none';
              } else {
                playButton.parentElement.style.width = '36px';
                playButton.parentElement.style.height = '36px';
                playButton.parentElement.style.backgroundColor = '#f0f0f0';
              }
            }
            
            // Hide default duration element if we're using our custom one
            const duration = audioCard.querySelector('.kg-audio-duration');
            if (duration && expertProfile && expertProfile.querySelector('.audio-timestamp')) {
              duration.style.display = 'none';
            }
            
            // Style the progress bar
            const progressContainer = audioCard.querySelector('.kg-audio-seek-slider');
            if (progressContainer && expertProfile && expertProfile.querySelector('.progress-bar')) {
              progressContainer.style.display = 'none';
            }
          }
          
          // Ensure player controls are properly initialized
          const audioPlayerEl = container.querySelector('audio');
          if (audioPlayerEl) {
            const currentTime = audioPlayerEl.currentTime;
            audioPlayerEl.load();
            audioPlayerEl.currentTime = currentTime;
            
            // Hide audio element controls if we're using our custom UI
            if (expertProfile) {
              audioPlayerEl.controls = false;
              audioPlayerEl.style.display = 'none';
            }
          }
        } else {
          container.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error adapting expert profiles with audio:', error);
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
  
  // Helper function to format time in MM:SS format
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
