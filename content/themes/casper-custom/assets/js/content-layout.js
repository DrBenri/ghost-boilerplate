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
  
  // Calculate and cache column fixed positioning values
  function calculateColumnFixedStyles() {
    if (!column) return;
    
    // Get column position precisely
    const columnRect = column.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    
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

  function handleColumnPosition() {
    if (!column || !menuInitialPosition) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Get or create the placeholder
    let placeholder = document.querySelector('.column-placeholder');
    if (!placeholder) {
      placeholder = createColumnPlaceholder();
    }
    
    // Always reset to original position at the top of page
    if (scrollTop === 0) {
      column.style.transition = 'none';
      column.classList.remove('column-fixed');
      Object.assign(column.style, {
        position: '',
        top: '',
        left: '',
        width: '',
        zIndex: ''
      });
      
      // Hide the placeholder
      placeholder.style.display = 'none';
      
      // Force a reflow
      void column.offsetWidth;
      
      // Restore transitions
      setTimeout(() => column.style.transition = '', 50);
      return;
    }
    
    window.requestAnimationFrame(() => {
      const threshold = menuInitialPosition - 20;
      
      if (scrollTop > threshold) {
        if (!column.classList.contains('column-fixed')) {
          // Calculate position before fixing
          calculateColumnFixedStyles();
          
          // Update placeholder size to match current column dimensions
          placeholder.style.width = `${column.offsetWidth}px`;
          placeholder.style.height = `${column.offsetHeight}px`;
          placeholder.style.marginRight = getComputedStyle(column).marginRight;
          
          // Show the placeholder to maintain layout
          placeholder.style.display = 'block';
          
          // Apply fixed positioning to column
          column.classList.add('column-fixed');
          Object.assign(column.style, {
            position: 'fixed',
            top: '20px', // Add some padding from top of viewport
            left: menuFixedStyles.left,
            width: menuFixedStyles.width,
            zIndex: '100'
          });
        } else {
          // Just update positions if already fixed
          column.style.left = menuFixedStyles.left;
        }
      } else {
        if (column.classList.contains('column-fixed')) {
          // Reset to original position
          column.classList.remove('column-fixed');
          Object.assign(column.style, {
            position: '',
            top: '',
            left: '',
            width: '',
            zIndex: ''
          });
          
          // Hide the placeholder
          placeholder.style.display = 'none';
        }
      }
    });
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
      // Extract audio sources from all Ghost audio cards
      const audioSources = Array.from(audioCards).map(card => {
        const audioEl = card.querySelector('audio');
        let sources = [];
        
        if (audioEl) {
          if (audioEl.src) {
            // Direct src attribute
            sources.push({
              url: audioEl.src,
              type: audioEl.getAttribute('type') || 'audio/mpeg'
            });
          } else {
            // Source elements
            const sourceElements = audioEl.querySelectorAll('source');
            sources = Array.from(sourceElements).map(source => ({
              url: source.src,
              type: source.type || 'audio/mpeg'
            }));
          }
          
          // Get title if available
          const titleEl = card.querySelector('.kg-audio-title');
          const title = titleEl ? titleEl.textContent.trim() : '';
          
          return { sources, title };
        }
        
        return { sources: [], title: '' };
      });
      
      // Create custom audio players with raw HTML5 audio elements
      audioContainerElements.forEach((container, index) => {
        // Skip if no audio source is available for this container
        if (!audioSources[index] || !audioSources[index].sources.length) {
          container.style.display = 'none';
          return;
        }
        
        const audioSource = audioSources[index];
        const customPlayBtn = container.querySelector('.play-button');
        const customTimestamp = container.querySelector('.audio-timestamp');
        const customProgressBar = container.querySelector('.progress-bar');
        const customVolumeIcon = container.querySelector('.volume-icon');
        const customMoreOptionsIcon = container.querySelector('.more-options');
        
        // Create new audio element
        const audioEl = document.createElement('audio');
        audioEl.style.display = 'none';
        audioEl.preload = 'metadata';
        
        // Add sources
        audioSource.sources.forEach(source => {
          const sourceEl = document.createElement('source');
          sourceEl.src = source.url;
          sourceEl.type = source.type;
          audioEl.appendChild(sourceEl);
        });
        
        // Add the audio element to the container
        container.appendChild(audioEl);
        
        // Initialize UI
        if (customTimestamp) {
          customTimestamp.textContent = '読み込み中...'; // "Loading..." in Japanese
          customTimestamp.style.color = '#999';
        }
        
        if (customProgressBar) {
          customProgressBar.classList.add('loading');
        }
        
        // Set up play button
        if (customPlayBtn) {
          // Image paths
          const imgPath = customPlayBtn.src.substring(0, customPlayBtn.src.lastIndexOf('/') + 1);
          const playImageSrc = imgPath + 'play.svg';
          const pauseImageSrc = imgPath + 'pause.svg';
          
          // Preload pause image
          const pauseImage = new Image();
          pauseImage.src = pauseImageSrc;
          
          // Play/pause toggle
          customPlayBtn.addEventListener('click', function() {
            if (audioEl.paused) {
              audioEl.play().catch(error => {
                console.error('Error playing audio:', error);
              });
            } else {
              audioEl.pause();
            }
          });
          
          // Update button state
          audioEl.addEventListener('play', function() {
            customPlayBtn.src = pauseImageSrc;
            customPlayBtn.setAttribute('alt', 'Pause');
          });
          
          audioEl.addEventListener('pause', function() {
            customPlayBtn.src = playImageSrc;
            customPlayBtn.setAttribute('alt', 'Play');
          });
          
          audioEl.addEventListener('ended', function() {
            customPlayBtn.src = playImageSrc;
            customPlayBtn.setAttribute('alt', 'Play');
          });
        }
        
        // Handle progress and timing
        audioEl.addEventListener('timeupdate', function() {
          const currentTime = formatTime(audioEl.currentTime);
          const duration = formatTime(audioEl.duration || 0);
          
          if (customTimestamp) {
            customTimestamp.textContent = `${currentTime} / ${duration}`;
            customTimestamp.style.color = '#666';
          }
          
          if (customProgressBar) {
            const percent = ((audioEl.currentTime / audioEl.duration) || 0) * 100;
            customProgressBar.style.background = `linear-gradient(to right, #1d72c2 ${percent}%, #e0e0e0 ${percent}%)`;
            customProgressBar.classList.remove('loading');
          }
        });
        
        // Handle loading states
        audioEl.addEventListener('loadedmetadata', function() {
          if (customTimestamp) {
            customTimestamp.textContent = `0:00 / ${formatTime(audioEl.duration)}`;
            customTimestamp.style.color = '#666';
          }
          
          if (customProgressBar) {
            customProgressBar.classList.remove('loading');
          }
        });
        
        audioEl.addEventListener('waiting', function() {
          if (customProgressBar) {
            customProgressBar.classList.add('loading');
          }
        });
        
        // Interactive progress bar
        if (customProgressBar) {
          customProgressBar.style.cursor = 'pointer';
          customProgressBar.addEventListener('click', function(e) {
            if (audioEl.duration) {
              const rect = customProgressBar.getBoundingClientRect();
              const clickPosition = (e.clientX - rect.left) / rect.width;
              audioEl.currentTime = clickPosition * audioEl.duration;
            }
          });
        }
        
        // Volume control
        if (customVolumeIcon) {
          let isMuted = false;
          customVolumeIcon.addEventListener('click', function() {
            if (isMuted) {
              audioEl.volume = 1.0;
              customVolumeIcon.src = customVolumeIcon.src.replace('volume-mute.svg', 'volume-high.svg');
              isMuted = false;
            } else {
              audioEl.volume = 0;
              customVolumeIcon.src = customVolumeIcon.src.replace('volume-high.svg', 'volume-mute.svg');
              isMuted = true;
            }
          });
        }
        
        // Playback speed options
        if (customMoreOptionsIcon) {
          customMoreOptionsIcon.addEventListener('click', function() {
            // Create dropdown
            const dropdown = document.createElement('div');
            dropdown.classList.add('audio-options-dropdown');
            dropdown.style.position = 'absolute';
            dropdown.style.right = '0';
            dropdown.style.top = '30px';
            dropdown.style.backgroundColor = '#fff';
            dropdown.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            dropdown.style.borderRadius = '4px';
            dropdown.style.padding = '8px 0';
            dropdown.style.zIndex = '1000';
            
            const speedOptions = [
              { text: '0.75x Speed', rate: 0.75 },
              { text: '1.0x Speed', rate: 1.0 },
              { text: '1.25x Speed', rate: 1.25 },
              { text: '1.5x Speed', rate: 1.5 },
              { text: '2.0x Speed', rate: 2.0 }
            ];
            
            speedOptions.forEach(option => {
              const item = document.createElement('div');
              item.textContent = option.text;
              item.style.padding = '8px 16px';
              item.style.cursor = 'pointer';
              item.style.fontSize = '14px';
              
              // Highlight current speed
              if (Math.abs(audioEl.playbackRate - option.rate) < 0.01) {
                item.style.fontWeight = 'bold';
                item.style.backgroundColor = '#f0f0f0';
              }
              
              item.addEventListener('click', function() {
                audioEl.playbackRate = option.rate;
                dropdown.remove();
              });
              
              item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
              });
              
              item.addEventListener('mouseleave', function() {
                if (Math.abs(audioEl.playbackRate - option.rate) < 0.01) {
                  this.style.backgroundColor = '#f0f0f0';
                } else {
                  this.style.backgroundColor = '';
                }
              });
              
              dropdown.appendChild(item);
            });
            
            // Add to DOM
            const controls = customMoreOptionsIcon.closest('.audio-controls');
            if (controls) {
              controls.style.position = 'relative';
              controls.appendChild(dropdown);
              
              // Handle clicking outside
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
        
        // Style container
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.width = '100%';
        container.style.position = 'relative';
        
        // Hide original Ghost audio card
        const originalCard = audioCards[index];
        if (originalCard && originalCard.parentNode) {
          originalCard.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error setting up custom audio players:', error);
      // Fallback to original audio cards if there's an error
      audioCards.forEach(card => {
        if (card && card.parentNode) {
          card.style.display = 'block';
        }
      });
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
    calculateColumnFixedStyles();
    
    // Update placeholder size if it exists
    const placeholder = document.querySelector('.column-placeholder');
    if (placeholder && placeholder.style.display !== 'none') {
      placeholder.style.width = `${column.offsetWidth}px`;
      placeholder.style.height = `${column.offsetHeight}px`;
    }
    
    handleColumnPosition();
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
    
    // Set default active item
    if (summaryLink) {
      setActiveItem(summaryLink);
    }
  }
  
  // Start everything
  init();
});
