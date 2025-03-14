document.addEventListener('DOMContentLoaded', function() {
    // Get all checkboxes and other elements
    const checkboxes = document.querySelectorAll('.routine-checkbox');
    const progressBar = document.getElementById('progress-bar');
    const celebrationContainer = document.getElementById('celebration-container');
    const celebrationModal = document.querySelector('.celebration-modal');
    const resetButton = document.getElementById('reset-button');
    const closeButton = document.querySelector('.close-celebration');
    const checkoutButton = document.getElementById('checkout-button');
    
    // Check if we're on the night routine page
    const isNightRoutine = !document.body.classList.contains('morning-theme');
    
    // Initialize Stripe with the publishable key
    const stripePublishableKey = document.querySelector('meta[name="stripe-key"]')?.content;
    
    // Enhanced debug logging for Stripe key
    console.log("Stripe initialization:");
    console.log("- Meta tag found:", !!document.querySelector('meta[name="stripe-key"]'));
    console.log("- Has key:", !!stripePublishableKey);
    console.log("- Key prefix:", stripePublishableKey?.substring(0, 7));
    console.log("- Key type:", stripePublishableKey?.startsWith('pk_live') ? 'live' : 'test');
    
    // Only initialize Stripe if we have a valid key
    let stripe;
    if (stripePublishableKey?.startsWith('pk_')) {
        try {
            stripe = Stripe(stripePublishableKey);
            console.log("✅ Stripe initialized successfully");
        } catch (error) {
            console.error("❌ Failed to initialize Stripe:", error);
            alert("Payment system initialization failed. Please refresh the page or contact support.");
        }
    } else {
        console.error("❌ Invalid or missing Stripe publishable key");
        console.error("Key received:", stripePublishableKey?.substring(0, 7) + "...");
    }
    
    // Add event listener to checkout button
    if (checkoutButton) {
        checkoutButton.addEventListener('click', async function() {
            try {
                // Validate Stripe initialization first
                if (!stripe) {
                    throw new Error("Stripe is not properly initialized. Please refresh the page or contact support.");
                }
                
                // Show loading state
                checkoutButton.disabled = true;
                checkoutButton.textContent = 'Processing...';
                
                // Get user's email if we have a field for it
                const emailInput = document.getElementById('customer-email');
                const email = emailInput ? emailInput.value : null;
                
                console.log("Creating checkout session...");
                const response = await fetch('/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server error:', errorData);
                    throw new Error(errorData.details || errorData.error || 'Payment session creation failed');
                }

                const session = await response.json();
                console.log("Checkout session created:", session.id?.substring(0, 10) + "...");
                
                // Redirect to Stripe Checkout
                console.log("Redirecting to Stripe checkout...");
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }
            } catch (error) {
                console.error('Payment error:', error);
                
                // Provide a user-friendly error message
                if (error.message.includes("publishable key")) {
                    alert('Stripe configuration error. Please contact support.');
                } else if (error.message.includes("session")) {
                    alert('Unable to start checkout process. Please try again later.');
                } else {
                    alert('Payment processing error: ' + error.message);
                }
                
                // Reset button state
                checkoutButton.disabled = false;
                checkoutButton.innerHTML = '<i class="fas fa-crown"></i> Upgrade for $0.99';
            }
        });
    }
    
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
    
    // Reset button event listener for night routine
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
    
    // Close button event listener for morning routine
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (celebrationModal) {
                celebrationModal.classList.remove('show');
            }
        });
    }
    
    function handleReset() {
        console.log('Reset handler called');
        resetChecklist();
        
        // Hide appropriate celebration
        if (isNightRoutine && celebrationContainer) {
            celebrationContainer.classList.remove('show');
        } else if (celebrationModal) {
            celebrationModal.classList.remove('show');
        }
    }
    
    // Update progress initially
    updateProgress();
    
    // Function to update progress bar and check for completion
    function updateProgress() {
        const totalItems = checkboxes.length;
        const checkedItems = document.querySelectorAll('.routine-checkbox:checked').length;
        
        // Update progress bar
        const progressPercentage = (checkedItems / totalItems) * 100;
        if (progressBar) {
            progressBar.style.width = progressPercentage + '%';
        }
        
        // Check if all items are checked
        if (checkedItems === totalItems && totalItems > 0) {
            // Create confetti effect
            createConfetti();
            
            // Show the appropriate celebration with a delay
            setTimeout(() => {
                if (isNightRoutine && celebrationContainer) {
                    celebrationContainer.classList.add('show');
                } else if (celebrationModal) {
                    celebrationModal.classList.add('show');
                }
            }, isNightRoutine ? 3000 : 1000); // Longer delay for night routine
        }
    }
    
    // Function to save state to localStorage
    function saveState() {
        const state = {};
        checkboxes.forEach(checkbox => {
            state[checkbox.id] = checkbox.checked;
        });
        const routineType = isNightRoutine ? 'nightTimeRoutine' : 'morningRoutine';
        localStorage.setItem(routineType, JSON.stringify(state));
    }
    
    // Function to load saved state from localStorage
    function loadSavedState() {
        const routineType = isNightRoutine ? 'nightTimeRoutine' : 'morningRoutine';
        const savedState = localStorage.getItem(routineType);
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
        
        // Clear localStorage for the current routine
        const routineType = isNightRoutine ? 'nightTimeRoutine' : 'morningRoutine';
        localStorage.removeItem(routineType);
    }
    
    // Add confetti effect to celebration
    function createConfetti() {
        // Only create confetti if we're on the night routine
        if (!isNightRoutine) return;
        
        console.log('Creating confetti');
        
        // Remove any existing confetti
        const existingConfetti = document.querySelector('.confetti-container');
        if (existingConfetti) {
            existingConfetti.remove();
        }
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#1E90FF', '#FF8C00', '#9C27B0', '#FF5722'];
        const shapes = ['square', 'circle', 'triangle', 'rect'];
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random color
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            // Random position
            confetti.style.left = Math.random() * 100 + 'vw';
            
            // Random animation timing
            confetti.style.animationDuration = (Math.random() * 5 + 3) + 's';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            
            // Random size
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
        
        // Remove confetti after animation finishes
        setTimeout(() => {
            confettiContainer.remove();
        }, 15000);
    }
    
    // Add keyboard support for accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (isNightRoutine && celebrationContainer && celebrationContainer.classList.contains('show')) {
                celebrationContainer.classList.remove('show');
            } else if (celebrationModal && celebrationModal.classList.contains('show')) {
                celebrationModal.classList.remove('show');
            }
        }
    });
}); 