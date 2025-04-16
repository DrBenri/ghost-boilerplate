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
  const audioContainerElements = document.querySelectorAll('.audio-container');
  const audioCards = document.querySelectorAll('.kg-card.kg-audio-card');
  const summarySidebar = document.querySelector('.summary-sidebar');
  const explanationSidebar = document.querySelector('.explanation-sidebar');
  
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
        audioEl.crossOrigin = "anonymous"; // Add crossOrigin for better compatibility
        
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
          customTimestamp.textContent = 'Loading...';
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
              // Show loading state
              if (customProgressBar) {
                customProgressBar.classList.add('loading');
              }
              
              audioEl.play().then(() => {
                // Success - UI updated via 'play' event handler
              }).catch(error => {
                console.error('Error playing audio:', error);
                
                // Remove loading state on error
                if (customProgressBar) {
                  customProgressBar.classList.remove('loading');
                }
                
                // Show a small alert for better user feedback
                alert('Unable to play audio. Please check your connection or try again later.');
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
            
            // Update progress-bar::after pseudo-element position
            // First ensure we have the custom property in the element's style
            customProgressBar.style.setProperty('--progress-width', `${percent}%`);
            
            // Add a class to indicate playing state for CSS animations
            if (!audioEl.paused) {
              customProgressBar.classList.add('playing');
            } else {
              customProgressBar.classList.remove('playing');
            }
          }
        });
        
        // Update playing state on play/pause
        audioEl.addEventListener('play', function() {
          if (customProgressBar) {
            customProgressBar.classList.add('playing');
          }
        });
        
        audioEl.addEventListener('pause', function() {
          if (customProgressBar) {
            customProgressBar.classList.remove('playing');
          }
        });
        
        audioEl.addEventListener('ended', function() {
          if (customProgressBar) {
            customProgressBar.classList.remove('playing');
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
          
          // Store original volume before muting
          let previousVolume = 1.0;
          
          // Get the icon paths from the current source
          const imgPath = customVolumeIcon.src.substring(0, customVolumeIcon.src.lastIndexOf('/') + 1);
          const volumeHighImageSrc = imgPath + 'volume-high.svg';
          const volumeMuteImageSrc = imgPath + 'volume-mute.svg';
          
          // Preload both volume icons to avoid missing image issues
          const volumeMuteImage = new Image();
          volumeMuteImage.src = volumeMuteImageSrc;
          
          customVolumeIcon.addEventListener('click', function() {
            if (isMuted) {
              // Restore previous volume or default to full volume
              audioEl.volume = previousVolume > 0 ? previousVolume : 1.0;
              customVolumeIcon.src = volumeHighImageSrc;
              customVolumeIcon.setAttribute('alt', 'Mute');
              customVolumeIcon.setAttribute('title', 'Mute');
              isMuted = false;
            } else {
              // Store current volume before muting
              previousVolume = audioEl.volume;
              
              // Mute the audio
              audioEl.volume = 0;
              customVolumeIcon.src = volumeMuteImageSrc;
              customVolumeIcon.setAttribute('alt', 'Unmute');
              customVolumeIcon.setAttribute('title', 'Unmute');
              isMuted = true;
            }
          });
          
          // Sync initial state with audio element
          audioEl.addEventListener('loadedmetadata', function() {
            if (audioEl.muted || audioEl.volume === 0) {
              isMuted = true;
              customVolumeIcon.src = volumeMuteImageSrc;
              customVolumeIcon.setAttribute('alt', 'Unmute');
              customVolumeIcon.setAttribute('title', 'Unmute');
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
