require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_LIVE_SECRET_KEY 
    : process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();

// Use JSON parsing ONLY for non-webhook routes
app.use((req, res, next) => {
    if (req.path === '/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Add middleware to inject Stripe keys into HTML files
app.use((req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function for HTML responses
  res.send = function(body) {
    // Only process HTML responses
    if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
      // Replace the placeholder keys with actual keys
      body = body.replace(
        'content="pk_test_your_test_publishable_key"', 
        `content="${process.env.STRIPE_PUBLISHABLE_KEY}"`
      );
      body = body.replace(
        'content="pk_live_your_live_publishable_key"', 
        `content="${process.env.STRIPE_LIVE_PUBLISHABLE_KEY || ''}"`
      );
    }
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    pool: true, // Use pooled connections
    maxConnections: 1, // Limit concurrent connections
    rateDelta: 20000, // Minimum time between emails
    rateLimit: 5, // Max emails per rateDelta
    headers: {
        'X-Priority': '3', // Normal priority
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
    }
});

// Function to generate a random token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Function to save token
async function saveToken(email, token) {
    try {
        const tokensFile = await fs.readFile('tokens.json', 'utf8');
        const tokens = JSON.parse(tokensFile);
        tokens.tokens.push({
            email,
            token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        });
        await fs.writeFile('tokens.json', JSON.stringify(tokens, null, 2));
    } catch (error) {
        console.error('Error saving token:', error);
        // If file doesn't exist, create it
        if (error.code === 'ENOENT') {
            const tokens = {
                tokens: [{
                    email,
                    token,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                }]
            };
            await fs.writeFile('tokens.json', JSON.stringify(tokens, null, 2));
        }
    }
}

// Middleware to validate token
async function validateToken(req, res, next) {
    const token = req.query.token;
    if (!token) {
        return res.redirect('/?error=no_token');
    }

    try {
        const tokensFile = await fs.readFile('tokens.json', 'utf8');
        const tokens = JSON.parse(tokensFile);
        const tokenData = tokens.tokens.find(t => t.token === token);

        if (!tokenData) {
            return res.redirect('/?error=invalid_token');
        }

        if (new Date(tokenData.expiresAt) < new Date()) {
            return res.redirect('/?error=expired_token');
        }

        next();
    } catch (error) {
        console.error('Error validating token:', error);
        res.redirect('/?error=server_error');
    }
}

// Function to send access email
async function sendAccessEmail(email, token) {
    console.log('Starting email send process to:', email);
    const appUrl = process.env.APP_URL || 'https://daily-routine.up.railway.app';
    const morningRoutineUrl = `${appUrl}/morning?token=${token}`;

    const mailOptions = {
        from: {
            name: 'Recky Services',
            address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Welcome to Your Morning Routine - Access Link Inside',
        text: `Welcome to Recky Services! Your Morning Routine access link is ready: ${morningRoutineUrl}\n\nImportant:\n- Bookmark this link for easy access\n- Valid for one year\n- Don't share with others\n\nIf you have questions, simply reply to this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to Recky Services</h1>
                    <p style="color: #666; font-size: 16px;">Thank you for joining our community.</p>
                </div>

                <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #ff5e62; margin-top: 0;">Your Morning Routine Access</h2>
                    
                    <p style="color: #2c3e50; font-size: 16px; line-height: 1.6;">Thank you for your purchase. Your morning routine access link is ready:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${morningRoutineUrl}" 
                           style="background-color: #ff9966; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 25px; display: inline-block;
                                  font-size: 16px; font-weight: bold;">
                            Access Your Morning Routine
                        </a>
                    </div>

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
                        <h3 style="color: #ff5e62; margin-top: 0;">Important Information:</h3>
                        <ul style="color: #2c3e50; font-size: 15px; line-height: 1.6;">
                            <li>Please bookmark your access link</li>
                            <li>Your link is valid for one full year</li>
                            <li>For security, please keep this link private</li>
                        </ul>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">
                            Need help? Simply reply to this email.
                        </p>
                        <p style="color: #666; font-size: 14px;">
                            Best regards,<br>
                            The Recky Services Team
                        </p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                    <p>You received this email because you purchased access to Recky Services Morning Routine.</p>
                    <p>© ${new Date().getFullYear()} Recky Services</p>
                </div>
            </div>
        `,
        headers: {
            'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
            'Precedence': 'bulk'
        }
    };

    try {
        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}

app.post('/create-checkout-session', async (req, res) => {
    try {
        console.log("Creating checkout session...");
        console.log("Environment:", process.env.NODE_ENV);
        console.log("Using key type:", process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST');
        console.log("Key starts with:", (process.env.NODE_ENV === 'production' 
            ? process.env.STRIPE_LIVE_SECRET_KEY 
            : process.env.STRIPE_SECRET_KEY)?.substring(0, 7) + "...");
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Premium Routine Access',
                        description: 'Access to both Morning and Night Routines',
                    },
                    unit_amount: 99,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        console.error('Error type:', error.type);
        console.error('Error code:', error.code);
        console.error('Error param:', error.param);
        
        // Return detailed error to the client for debugging
        res.status(500).json({ 
            error: 'Failed to create checkout session', 
            details: error.message,
            type: error.type,
            code: error.code,
            param: error.param
        });
    }
});

// Webhook handling
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const token = generateToken();
        
        try {
            // Save token
            await saveToken(session.customer_details.email, token);
            
            // Send email with access link
            await sendAccessEmail(session.customer_details.email, token);
            
            console.log(`Token generated and email sent to ${session.customer_details.email}`);
        } catch (error) {
            console.error('Error processing successful payment:', error);
        }
    }

    res.json({received: true});
});

// Protected morning routine route
app.get('/morning', validateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'morning.html'));
});

// Success page route
app.get('/success', async (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

// Test email endpoint (REMOVE IN PRODUCTION)
app.get('/test-email', async (req, res) => {
    try {
        const testToken = generateToken();
        await sendAccessEmail(process.env.EMAIL_USER, testToken);
        res.json({ 
            success: true, 
            message: 'Test email sent! Check your inbox: ' + process.env.EMAIL_USER,
            token: testToken
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Add a test endpoint to verify Stripe connection
app.get('/test-stripe', async (req, res) => {
    try {
        console.log("Testing Stripe connection...");
        console.log("Environment:", process.env.NODE_ENV);
        
        // Which key is being used
        const keyType = process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST';
        console.log("Using key type:", keyType);
        
        // Check if we have the key
        const key = process.env.NODE_ENV === 'production' 
            ? process.env.STRIPE_LIVE_SECRET_KEY 
            : process.env.STRIPE_SECRET_KEY;
            
        console.log("Key exists:", !!key);
        console.log("Key starts with:", key?.substring(0, 7) + "...");
        
        // Try to list products (simple API call)
        const products = await stripe.products.list({ limit: 1 });
        
        res.json({ 
            success: true, 
            message: 'Stripe connection successful',
            keyType: keyType,
            hasProducts: products.data.length > 0,
            firstProduct: products.data[0] ? products.data[0].name : null
        });
    } catch (error) {
        console.error('Error testing Stripe connection:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            type: error.type,
            code: error.code
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 