# Night Time Routine Checklist with Stripe Payment

A simple web application to track your night time routine with a premium upgrade option using Stripe payments.

## Features

- Interactive checklist for night time routine
- Progress tracking
- Celebration animation when all tasks are completed
- Premium upgrade option using Stripe payments

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Stripe account

### Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd night-routine-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your Stripe API keys:
   - Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
   - Get your publishable and secret keys
   - Update the `.env` file with your keys:
     ```
     STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
     STRIPE_SECRET_KEY=your_secret_key_here
     ```
   - Also update the publishable key in `script.js` (line 13)

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Testing Payments

For testing payments, you can use Stripe's test card numbers:

- Card number: 4242 4242 4242 4242
- Expiration date: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Project Structure

- `index.html` - Main application page
- `success.html` - Payment success page
- `styles.css` - Styling for the application
- `script.js` - Client-side JavaScript
- `server.js` - Node.js server for handling Stripe payments
- `.env` - Environment variables for API keys

## License

MIT 