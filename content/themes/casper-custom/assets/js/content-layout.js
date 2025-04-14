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
  const expertProfiles = document.querySelectorAll('.expert-profile');
  
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
  
  // Enhanced function to fully integrate audio cards with custom UI
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
        if (!audioCard) {
          container.style.display = 'none';
          return;
        }
        
        // Get Ghost audio elements
        const audioPlayerEl = audioCard.querySelector('audio');
        const ghostPlayButton = audioCard.querySelector('.kg-audio-play-icon');
        
        if (!audioPlayerEl) {
          container.style.display = 'none';
          return;
        }
        
        // Get custom UI elements
        const customPlayBtn = container.querySelector('.play-button');
        const customTimestamp = container.querySelector('.audio-timestamp');
        const customProgressBar = container.querySelector('.progress-bar');
        const customVolumeIcon = container.querySelector('.volume-icon');
        const customMoreOptionsIcon = container.querySelector('.more-options');
        
        // Setup playback control
        if (customPlayBtn) {
          customPlayBtn.addEventListener('click', function() {
            if (audioPlayerEl.paused) {
              audioPlayerEl.play();
            } else {
              audioPlayerEl.pause();
            }
          });
          
          // Update play button state when audio state changes
          audioPlayerEl.addEventListener('play', function() {
            const pausePath = customPlayBtn.src.replace('play.svg', 'pause.svg');
            customPlayBtn.src = pausePath;
            customPlayBtn.setAttribute('alt', 'Pause');
          });
          
          audioPlayerEl.addEventListener('pause', function() {
            const playPath = customPlayBtn.src.replace('pause.svg', 'play.svg');
            customPlayBtn.src = playPath;
            customPlayBtn.setAttribute('alt', 'Play');
          });
        }
        
        // Set up volume control
        if (customVolumeIcon) {
          let isMuted = false;
          customVolumeIcon.addEventListener('click', function() {
            if (isMuted) {
              audioPlayerEl.volume = 1.0; // Restore volume
              customVolumeIcon.src = customVolumeIcon.src.replace('volume-mute.svg', 'volume-high.svg');
              isMuted = false;
            } else {
              audioPlayerEl.volume = 0; // Mute
              customVolumeIcon.src = customVolumeIcon.src.replace('volume-high.svg', 'volume-mute.svg');
              isMuted = true;
            }
          });
        }
        
        // More options button
        if (customMoreOptionsIcon) {
          customMoreOptionsIcon.addEventListener('click', function() {
            // Create a simple dropdown menu
            const dropdown = document.createElement('div');
            dropdown.classList.add('audio-options-dropdown');
            dropdown.style.position = 'absolute';
            dropdown.style.right = '0';
            dropdown.style.backgroundColor = '#fff';
            dropdown.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            dropdown.style.borderRadius = '4px';
            dropdown.style.padding = '8px 0';
            dropdown.style.zIndex = '1000';
            
            const options = [
              { text: '0.75x Speed', action: () => { audioPlayerEl.playbackRate = 0.75; } },
              { text: '1.0x Speed', action: () => { audioPlayerEl.playbackRate = 1.0; } },
              { text: '1.25x Speed', action: () => { audioPlayerEl.playbackRate = 1.25; } },
              { text: '1.5x Speed', action: () => { audioPlayerEl.playbackRate = 1.5; } },
              { text: '2.0x Speed', action: () => { audioPlayerEl.playbackRate = 2.0; } },
            ];
            
            options.forEach(option => {
              const item = document.createElement('div');
              item.textContent = option.text;
              item.style.padding = '8px 16px';
              item.style.cursor = 'pointer';
              item.style.fontSize = '14px';
              
              item.addEventListener('click', function() {
                option.action();
                dropdown.remove();
              });
              
              item.addEventListener('mouseenter', function() {
                item.style.backgroundColor = '#f0f0f0';
              });
              
              item.addEventListener('mouseleave', function() {
                item.style.backgroundColor = '';
              });
              
              dropdown.appendChild(item);
            });
            
            // Position and add the dropdown
            const controls = customMoreOptionsIcon.closest('.audio-controls');
            if (controls) {
              controls.style.position = 'relative';
              controls.appendChild(dropdown);
              
              // Close when clicking outside
              function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== customMoreOptionsIcon) {
                  dropdown.remove();
                  document.removeEventListener('click', closeDropdown);
                }
              }
              
              setTimeout(() => {
                document.addEventListener('click', closeDropdown);
              }, 0);
            }
          });
        }
        
        // Update timestamp and progress bar
        if (customTimestamp || customProgressBar) {
          audioPlayerEl.addEventListener('timeupdate', function() {
            const currentTime = formatTime(audioPlayerEl.currentTime);
            const duration = formatTime(audioPlayerEl.duration || 0);
            
            if (customTimestamp) {
              customTimestamp.textContent = `${currentTime} / ${duration}`;
            }
            
            if (customProgressBar) {
              const percent = ((audioPlayerEl.currentTime / audioPlayerEl.duration) || 0) * 100;
              customProgressBar.style.background = `linear-gradient(to right, #1d72c2 ${percent}%, #e0e0e0 ${percent}%)`;
              
              // Make progress bar interactive - allow seeking
              if (!customProgressBar.getAttribute('listener-added')) {
                customProgressBar.style.cursor = 'pointer';
                customProgressBar.addEventListener('click', function(e) {
                  const rect = customProgressBar.getBoundingClientRect();
                  const clickPosition = (e.clientX - rect.left) / rect.width;
                  audioPlayerEl.currentTime = clickPosition * audioPlayerEl.duration;
                });
                customProgressBar.setAttribute('listener-added', 'true');
              }
            }
          });
          
          // Ensure duration is available as soon as possible
          audioPlayerEl.addEventListener('loadedmetadata', function() {
            if (customTimestamp) {
              customTimestamp.textContent = `0:00 / ${formatTime(audioPlayerEl.duration)}`;
            }
          });
        }
        
        // Hide the original audio card but keep its functionality
        container.appendChild(audioCard);
        audioCard.style.display = 'none';
        audioPlayerEl.style.display = 'none';
        
        // Show the custom container
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.width = '100%';
        
        // Style the timestamp
        if (customTimestamp) {
          customTimestamp.style.flex = '0 0 auto';
          customTimestamp.style.margin = '0 10px';
          customTimestamp.style.fontSize = '12px';
          customTimestamp.style.color = '#666';
        }
        
        // Style the progress bar
        if (customProgressBar) {
          customProgressBar.style.flex = '1';
          customProgressBar.style.height = '4px';
          customProgressBar.style.background = '#e0e0e0';
          customProgressBar.style.borderRadius = '2px';
          customProgressBar.style.margin = '0 10px';
        }
      });
    } catch (error) {
      console.error('Error integrating audio UI:', error);
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
