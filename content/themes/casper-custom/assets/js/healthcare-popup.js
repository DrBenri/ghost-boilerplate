/**
 * Healthcare Profession Confirmation Popup
 * Manages the medical professional verification popup
 */

const HealthcarePopup = {
    /**
     * Initialize the popup
     */
    init: function() {
        // Check if user has already confirmed in this session
        if (!sessionStorage.getItem('isHealthcareProfessional')) {
            // Show popup only if not confirmed yet
            const popup = document.getElementById('confirmPopup');
            if (popup) {
                popup.style.display = 'flex';
                
                // Add class to prevent body scrolling
                document.body.classList.add('popup-open');
            }
        }
        
        // Handle responsive display
        this.handleResponsiveDisplay();
        
        // Add resize listener
        window.addEventListener('resize', this.handleResponsiveDisplay);
    },
    
    /**
     * Switch between mobile and desktop views based on screen size
     */
    handleResponsiveDisplay: function() {
        const desktopContainer = document.getElementById('popup-desktop-container');
        const mobileContainer = document.getElementById('popup-responsive-container');
        
        if (window.innerWidth <= 768) {
            if (desktopContainer) desktopContainer.style.display = 'none';
            if (mobileContainer) mobileContainer.style.display = 'block';
        } else {
            if (desktopContainer) desktopContainer.style.display = 'block';
            if (mobileContainer) mobileContainer.style.display = 'none';
        }
    },
    
    /**
     * Handle "Yes" button click
     * User confirms they are a healthcare professional
     */
    confirmYes: function() {
        // Save confirmation to session storage
        sessionStorage.setItem('isHealthcareProfessional', 'true');
        
        // Hide popup
        const popup = document.getElementById('confirmPopup');
        if (popup) {
            popup.style.display = 'none';
        }
        
        // Remove body scroll lock
        document.body.classList.remove('popup-open');
        
        // You can add analytics tracking here if needed
    },
    
    /**
     * Handle "No" button click
     * User confirms they are NOT a healthcare professional
     */
    confirmNo: function() {
        // Redirect to a different site or show a message
        alert('このサイトは医療従事者専用です。');
        window.location.href = 'https://www.google.com'; // Redirect to Google or another page
    }
};

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    HealthcarePopup.init();
});
