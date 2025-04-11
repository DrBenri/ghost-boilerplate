/**
 * Healthcare Profession Confirmation Popup
 * Manages the medical professional verification popup
 */

const HealthcarePopup = {
    /**
     * Initialize the popup
     */
    init: function() {
        // Check if user has already confirmed
        if (!localStorage.getItem('healthcare_confirmed')) {
            document.getElementById('confirmPopup').style.display = 'flex';
        } else {
            document.getElementById('confirmPopup').style.display = 'none';
        }
    },
    
    /**
     * Handle "Yes" button click
     * User confirms they are a healthcare professional
     */
    confirmYes: function() {
        localStorage.setItem('healthcare_confirmed', 'true');
        document.getElementById('confirmPopup').style.display = 'none';
    },
    
    /**
     * Handle "No" button click
     * User confirms they are NOT a healthcare professional
     */
    confirmNo: function() {
        window.location.href = 'https://www.google.com'; // Redirect non-healthcare users
    }
};

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', HealthcarePopup.init);
