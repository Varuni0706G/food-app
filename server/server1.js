const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

const DATA_FILE = "./data.json";
const OWNER_FILE = "./owner-data.json";
const FOOD_FILE = "./food-data.json";

// Utility function to read JSON data
const readData = (file) => {
  if (!fs.existsSync(file)) return { users: [], owners: [], foodItems: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

// Utility function to write JSON data
const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
};

// Ensure files exist
if (!fs.existsSync(DATA_FILE)) writeData(DATA_FILE, { users: [] });
if (!fs.existsSync(OWNER_FILE)) writeData(OWNER_FILE, { owners: [] });
if (!fs.existsSync(FOOD_FILE)) writeData(FOOD_FILE, { foodItems: [] });

/** ================= CLIENT SIDE APIS ================= **/

// Register API for clients
app.post("/api/register", (req, res) => {
  const { email, password, name, number, address } = req.body;
  const data = readData(DATA_FILE);

  if (data.users.some((user) => user.email === email)) {
    return res.status(400).json({ message: "User already registered" });
  }

  data.users.push({ email, password, name, number, address });
  writeData(DATA_FILE, data);

  res.json({ message: "Registration successful" });
});

// Login API for clients
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const data = readData(DATA_FILE);

  const user = data.users.find(
    (user) => user.email === email && user.password === password
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ message: "Login successful" });
});

/** ================= OWNER SIDE APIS ================= **/

// Owner Registration API
app.post("/api/owners/register", (req, res) => {
  const { name, email, password, category } = req.body;
  const data = readData(OWNER_FILE);

  if (data.owners.some((owner) => owner.email === email)) {
    return res.status(400).json({ message: "Owner already registered" });
  }

  data.owners.push({ name, email, password, category, items: [], orders: [] });
  writeData(OWNER_FILE, data);

  res.json({ message: "Owner registered successfully" });
});

// Owner Login API
app.post("/api/owners/login", (req, res) => {
  const { email, password, category } = req.body;
  const data = readData(OWNER_FILE);

  const owner = data.owners.find(
    (owner) =>
      owner.email === email &&
      owner.password === password &&
      owner.category === category
  );

  if (!owner) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login successful", category: owner.category, items: owner.items });
});

// API to add food items
app.post("/api/owners/add-item", (req, res) => {
  const { email, foodName, actualPrice, discountPrice, category } = req.body;

  if (!email || !foodName || !actualPrice || !discountPrice || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foodData = readData(FOOD_FILE);

  foodData.foodItems.push({ email, foodName, actualPrice, discountPrice, category });
  writeData(FOOD_FILE, foodData);

  res.json({ message: "Food item added successfully" });
});

// API to get food items for a specific owner
app.get("/api/owners/food-items/:email", (req, res) => {
  const { email } = req.params;
  const foodData = readData(FOOD_FILE);

  const ownerFoodItems = foodData.foodItems.filter(item => item.email === email);

  res.json(ownerFoodItems);
});

// API to get all food items categorized for the client home page
app.get("/api/food-items", (req, res) => {
  const foodData = readData(FOOD_FILE);
  const categorizedItems = { restaurant: [], supermarket: [], grocery: [] };

  if (foodData.foodItems) {
    foodData.foodItems.forEach((item) => {
      if (item.category === "restaurant") categorizedItems.restaurant.push(item);
      if (item.category === "supermarket") categorizedItems.supermarket.push(item);
      if (item.category === "grocery") categorizedItems.grocery.push(item);
    });
  }

  console.log("Food Items Sent to Frontend:", categorizedItems); // Debugging log
  res.json(categorizedItems);
});

/** ================= ORDER FUNCTIONALITY ================= **/

// API to place an order
app.post("/api/place-order", (req, res) => {
  const { cart, clientEmail } = req.body;
  const ownerData = readData(OWNER_FILE);

  cart.forEach((order) => {
    const owner = ownerData.owners.find((o) =>
      o.items.some((i) => i.foodName === order.foodName)
    );

    if (owner) {
      owner.orders.push({ foodName: order.foodName, clientEmail, price: order.price });
    }
  });

  writeData(OWNER_FILE, ownerData);
  res.json({ message: "Order placed successfully" });
});

// API for owners to view their orders
app.get("/api/owners/orders/:email", (req, res) => {
  const email = req.params.email;
  const ownerData = readData(OWNER_FILE);

  const owner = ownerData.owners.find((o) => o.email === email);
  res.json(owner ? owner.orders : []);
});



  



  



/** ================= SERVER LISTENING ================= **/
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 