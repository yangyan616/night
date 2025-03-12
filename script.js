document.addEventListener('DOMContentLoaded', function() {
    // Get all checkboxes and other elements
    const checkboxes = document.querySelectorAll('.routine-checkbox');
    const progressBar = document.getElementById('progress-bar');
    const celebrationContainer = document.getElementById('celebration-container');
    const resetButton = document.getElementById('reset-button');
    
    console.log('Reset button element:', resetButton); // Debug log to check if button is found
    
    // Load saved state from localStorage
    loadSavedState();
    
    // Add event listeners to checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateProgress();
            saveState();
        });
    });
    
    // Reset button event listener - using both approaches to ensure it works
    if (resetButton) {
        resetButton.addEventListener('click', handleReset);
        
        // Alternative direct approach
        document.getElementById('reset-button').onclick = function() {
            console.log('Reset button clicked (direct)');
            handleReset();
        };
    } else {
        console.error('Reset button not found in the DOM');
    }
    
    function handleReset() {
        console.log('Reset handler called');
        resetChecklist();
        celebrationContainer.classList.remove('show');
    }
    
    // Update progress initially
    updateProgress();
    
    // Function to update progress bar and check for completion
    function updateProgress() {
        const totalItems = checkboxes.length;
        const checkedItems = document.querySelectorAll('.routine-checkbox:checked').length;
        
        // Update progress bar
        const progressPercentage = (checkedItems / totalItems) * 100;
        progressBar.style.width = progressPercentage + '%';
        
        // Check if all items are checked
        if (checkedItems === totalItems && totalItems > 0) {
            // Create confetti immediately when all items are checked
            createConfetti();
            
            // Then show the celebration container after a longer delay (3 seconds instead of 0.5)
            // This gives more time to enjoy the confetti before the modal appears
            setTimeout(() => {
                celebrationContainer.classList.add('show');
            }, 3000);  // Changed from 500ms to 3000ms (3 seconds)
        }
    }
    
    // Function to save state to localStorage
    function saveState() {
        const state = {};
        checkboxes.forEach(checkbox => {
            state[checkbox.id] = checkbox.checked;
        });
        localStorage.setItem('nightTimeRoutine', JSON.stringify(state));
    }
    
    // Function to load saved state from localStorage
    function loadSavedState() {
        const savedState = localStorage.getItem('nightTimeRoutine');
        if (savedState) {
            const state = JSON.parse(savedState);
            checkboxes.forEach(checkbox => {
                if (state[checkbox.id]) {
                    checkbox.checked = state[checkbox.id];
                }
            });
        }
    }
    
    // Function to reset the checklist
    function resetChecklist() {
        console.log('Resetting checklist');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateProgress();
        saveState();
        
        // Force clear localStorage as a backup approach
        localStorage.removeItem('nightTimeRoutine');
    }
    
    // Add confetti effect to celebration
    function createConfetti() {
        console.log('Creating confetti');
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#1E90FF', '#FF8C00', '#9C27B0', '#FF5722'];
        const shapes = ['square', 'circle', 'triangle', 'rect'];
        
        for (let i = 0; i < 150; i++) {  // Increased number of confetti pieces
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random color
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            // Random position
            confetti.style.left = Math.random() * 100 + 'vw';
            
            // Random animation timing
            confetti.style.animationDuration = (Math.random() * 5 + 3) + 's';  // Increased duration
            confetti.style.animationDelay = Math.random() * 3 + 's';  // Increased delay
            
            // Random size (slightly varied)
            const size = Math.random() * 6 + 7; // Between 7px and 13px
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Random shape
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
            } else if (shape === 'triangle') {
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.backgroundColor = 'transparent';
                confetti.style.borderLeft = (size/2) + 'px solid transparent';
                confetti.style.borderRight = (size/2) + 'px solid transparent';
                confetti.style.borderBottom = size + 'px solid ' + color;
            } else if (shape === 'rect') {
                confetti.style.width = size * 1.5 + 'px';
                confetti.style.height = size * 0.5 + 'px';
            }
            
            confettiContainer.appendChild(confetti);
        }
        
        // Create a second wave of confetti after a delay for a longer effect
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.animationDuration = (Math.random() * 5 + 3) + 's';
                confetti.style.animationDelay = '0s';
                confettiContainer.appendChild(confetti);
            }
        }, 1500);
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 15000);  // Increased to 15 seconds for a longer celebration
    }
    
    // Add keyboard support for accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && celebrationContainer.classList.contains('show')) {
            celebrationContainer.classList.remove('show');
        }
    });
}); 