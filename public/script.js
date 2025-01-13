// Fetch menu items from the backend and populate the menu dropdown
async function fetchMenuItems() {
  try {
    const response = await fetch('http://localhost:3000/api/menu');
    const menuItems = await response.json();

    const menuItemSelect = document.getElementById('menu-item');
    menuItems.forEach(item => {
      const option = document.createElement('option');
      option.value = item.name;  // Assuming 'name' is the column in your database
      option.textContent = item.name;
      menuItemSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
  }
}

// Fetch recent orders from the backend
async function fetchOrders() {
  try {
    const response = await fetch('http://localhost:3000/api/orders');
    const orders = await response.json();

    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = ''; // Clear existing orders

    orders.forEach(order => {
      const li = document.createElement('li');
      li.textContent = `${order.customer_name} ordered ${order.quantity} of ${order.menu_item}`;
      ordersList.appendChild(li);
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();  // Prevent the form from submitting the traditional way

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (response.ok) {
      alert('Login successful!');
      document.getElementById('login-section').style.display = 'none'; // Hide login section
      document.getElementById('auth').style.display = 'none'; // Hide login button
      document.getElementById('logout-btn').style.display = 'inline'; // Show logout button

      document.getElementById('menu').style.display = 'block'; // Show menu
      document.getElementById('order').style.display = 'block'; // Show order section
      document.getElementById('orders').style.display = 'block'; // Show orders section

      fetchOrders(); // Fetch orders after login
    } else {
      alert('Error logging in: ' + result.error);
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
    });

    const result = await response.json();
    if (response.ok) {
      alert('Logout successful!');
      document.getElementById('login-section').style.display = 'block'; // Show login section
      document.getElementById('auth').style.display = 'block'; // Show login button
      document.getElementById('logout-btn').style.display = 'none'; // Hide logout button
      document.getElementById('user-info').textContent = ''; // Clear user info

      document.getElementById('menu').style.display = 'none'; // Hide menu
      document.getElementById('order').style.display = 'none'; // Hide order section
      document.getElementById('orders').style.display = 'none'; // Hide orders section

      fetchOrders(); // Refresh the orders list (might be empty if not logged in)
    } else {
      alert('Error logging out: ' + result.error);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
});

// Handle form submission for placing an order
document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();  // Prevent the form from submitting the traditional way

  const customerName = document.getElementById('customer-name').value;
  const menuItem = document.getElementById('menu-item').value;
  const quantity = document.getElementById('quantity').value;

  try {
    const response = await fetch('http://localhost:3000/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerName, menuItem, quantity }),
    });

    const result = await response.json();
    if (response.ok) {
      alert('Order placed successfully!');
      fetchOrders(); // Refresh the orders list
    } else {
      alert('Error placing order: ' + result.error);
    }
  } catch (error) {
    console.error('Error placing order:', error);
  }
});

// Fetch menu items and recent orders when the page loads
fetchMenuItems();

// Check if the user is logged in and adjust UI
async function checkLoginStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/check-login');
    if (response.ok) {
      const user = await response.json();
      document.getElementById('login-section').style.display = 'none'; // Hide login section
      document.getElementById('auth').style.display = 'none'; // Hide login button
      document.getElementById('logout-btn').style.display = 'inline'; // Show logout button
      document.getElementById('user-info').textContent = `Logged in as: ${user.first_name}`;

      document.getElementById('menu').style.display = 'block'; // Show menu
      document.getElementById('order').style.display = 'block'; // Show order section
      document.getElementById('orders').style.display = 'block'; // Show orders section

      fetchOrders(); // Fetch orders if logged in
    } else {
      document.getElementById('login-section').style.display = 'block'; // Show login section
      document.getElementById('auth').style.display = 'block'; // Show login button
      document.getElementById('logout-btn').style.display = 'none'; // Hide logout button

      document.getElementById('menu').style.display = 'none'; // Hide menu
      document.getElementById('order').style.display = 'none'; // Hide order section
      document.getElementById('orders').style.display = 'none'; // Hide orders section
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

// Call checkLoginStatus on page load
checkLoginStatus();
