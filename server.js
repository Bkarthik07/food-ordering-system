import express from 'express';
import mysql from 'mysql2';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Import express-session for session management
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

// Get current directory path (similar to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a connection pool

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, 'isrgrootx1.pem')),
    rejectUnauthorized: true // Ensure certificate is verified
  }
});




// Serve static files (index.html, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Use express-session to manage user sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProduction, // Enforce HTTPS in production
    sameSite: 'strict' // Prevent CSRF attacks
  }
}));



// Route to log in
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  pool.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length > 0) {
        // Successfully logged in, create a session
        req.session.user = results[0];
        res.json({ message: 'Login successful', user: results[0] });
      } else {
        res.status(401).json({ error: 'Invalid email or password' });
      }
    }
  );
});

// Route to log out
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Route to fetch orders for the logged-in user
app.get('/api/orders', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  pool.query(
    `SELECT u.first_name AS customer_name, oi.quantity, fi.name AS menu_item 
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN food_items fi ON oi.food_id = fi.food_id
    WHERE u.user_id = ? 
    ORDER BY o.order_date DESC`,
    [req.session.user.user_id],
    (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);  // Sending the list of recent orders
    }
  );
});

// Route to place an order
app.post('/api/order', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { menuItem, quantity } = req.body;

  // Find the food_id based on the menu item name
  pool.query(
    'SELECT food_id, price FROM food_items WHERE name = ?',
    [menuItem],
    (err, results) => {
      if (err) {
        console.error('Error fetching food item:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const foodId = results[0]?.food_id;
      const price = results[0]?.price;

      if (!foodId) {
        return res.status(400).json({ error: 'Food item not found' });
      }

      // Insert the order into the orders table
      pool.query(
        'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)',
        [req.session.user.user_id, price * quantity, '123 Main St, City, Country'], // Adjust the shipping address as needed
        (err, result) => {
          if (err) {
            console.error('Error inserting order:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          const orderId = result.insertId;

          // Insert the order items into the order_items table
          pool.query(
            'INSERT INTO order_items (order_id, food_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, foodId, quantity, price],
            (err) => {
              if (err) {
                console.error('Error inserting order items:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({ message: 'Order placed successfully' });
            }
          );
        }
      );
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
