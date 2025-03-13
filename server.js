require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// Serve the static files
app.get('/', (req, res) => {
  console.log('User Agent:', req.headers['user-agent']);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    // First, create a new product each time to avoid using cached products
    const product = await stripe.products.create({
      name: 'Night Routine Premium',
      description: 'Premium features for your night routine app',
    });

    // Then create a price for this product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 199, // $1.99 in cents
      currency: 'usd',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/index.html`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Payment session creation failed. Please check your Stripe configuration.',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Visit http://localhost:${port} to view the app`);
}); 