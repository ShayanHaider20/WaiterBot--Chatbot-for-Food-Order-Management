//Env var cannot be set in vanilla HTML , JS
// import dotenv from "dotenv";
// dotenv.config(); // Load environment variables from .env file
// const API_KEY = process.env.GEMINI_API_KEY; // Access the API key from the environment variable;

const API_KEY = "AIzaSyAwT68SANskQi4ri6Qed-Jw2PZaFgt9e0k";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// DOM Elements
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const orderModal = document.getElementById("orderModal");
const orderSummary = document.getElementById("orderSummary");

// State
let currentOrder = {};

// Initialize
function init() {
  addMessage(
    "bot",
    "🧑‍🍳 Welcome to Kababjees! I'm your digital waiter. How may I serve you?"
  );
  setupMenuPanel();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  chatForm.addEventListener("submit", handleMessageSubmit);
  menuToggle.addEventListener("click", () =>
    menuPanel.classList.toggle("hidden")
  );

  orderModal
    .querySelector(".btn-dine-in")
    .addEventListener("click", () => handleOrderConfirm("Dine-In"));
  orderModal
    .querySelector(".btn-takeaway")
    .addEventListener("click", () => handleOrderConfirm("Takeaway"));
  orderModal
    .querySelector(".btn-cancel")
    .addEventListener("click", () => orderModal.classList.add("hidden"));
}

// Menu Setup
function setupMenuPanel() {
  const menuContent = menuPanel.querySelector(".menu-content");

  Object.entries(menu).forEach(([category, items]) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "menu-category";

    categoryDiv.innerHTML = `
      <h2>${category}</h2>
      ${Object.entries(items)
        .map(
          ([item, price]) => `
          <div class="menu-item">
            <span>${item}</span>
            <span>RS.${price}</span>
          </div>
        `
        )
        .join("")}
    `;

    menuContent.appendChild(categoryDiv);
  });
}

// Message Handling
async function handleMessageSubmit(e) {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  messageInput.value = "";
  addMessage("user", message);

  const input = message.toLowerCase();
  if (input === "menu") {
    menuPanel.classList.remove("hidden");
    return;
  }

  if (
    ["confirm", "bill", "total", "pay", "payment"].some((word) =>
      input.includes(word)
    ) &&
    Object.keys(currentOrder).length > 0
  ) {
    showOrderSummary();
    return;
  }

  const isOrder = await parseOrder(message);
  if (!isOrder) {
    const response = await generateResponse(message);
    addMessage("bot", response);
  }
}

function addMessage(type, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  messageDiv.innerHTML = `
    <div class="message-avatar">${type === "bot" ? "🧑‍🍳" : "👤"}</div>
    <div class="message-content">${content}</div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Order Processing
async function parseOrder(input) {
  const allItems = Object.values(menu).flatMap((category) =>
    Object.keys(category)
  );

  const prompt = `You are a waiter at Kababjees Restaurant. Analyze this customer message:
  "${input}"

  Extract items and quantities in format 'item:quantity'.
  - Use EXACT menu names (case-sensitive)
  - Default to quantity=1 if not specified
  - Ignore non-menu items

  Menu: ${allItems.join(", ")}
  Respond with comma-separated entries. Example: 'Cheese Naan:2, Dynamite Chicken:1'`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    const items = data.candidates[0].content.parts[0].text.trim();

    let orderUpdated = false;

    items.split(",").forEach((entry) => {
      let [item, qty] = entry.includes(":")
        ? entry.split(":").map((s) => s.trim())
        : [entry.trim(), "1"];

      if (allItems.includes(item)) {
        const price = Object.values(menu).find(
          (category) => item in category
        )?.[item];

        if (price) {
          if (item in currentOrder) {
            currentOrder[item].quantity += parseInt(qty) || 1;
          } else {
            currentOrder[item] = {
              price,
              quantity: parseInt(qty) || 1,
            };
          }
          orderUpdated = true;
          addMessage(
            "bot",
            `Added ${qty}x ${item}: RS.${price * (parseInt(qty) || 1)}`
          );
        }
      }
    });

    return orderUpdated;
  } catch (error) {
    console.error("Error parsing order:", error);
    return false;
  }
}

async function generateResponse(input) {
  const systemPrompt = `You are a Kababjees waiter. Answer only about services/policies.
  Never mention AI. Keep responses under 2 sentences. Menu questions: direct to menu.`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${systemPrompt}\nQuery: ${input}\nResponse:` }] },
        ],
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating response:", error);
    return "How may I assist with your dining experience?";
  }
}

// Order Summary
function showOrderSummary() {
  const total = Object.entries(currentOrder).reduce(
    (sum, [_, { price, quantity }]) => sum + price * quantity,
    0
  );

  orderSummary.innerHTML = Object.entries(currentOrder)
    .map(
      ([item, { price, quantity }]) => `
      <div class="order-item">
        <span>${item} x${quantity}</span>
        <span>RS.${price * quantity}</span>
      </div>
    `
    )
    .join("");

  orderModal.querySelector(".order-total").innerHTML = `
    <span>Total:</span>
    <span>RS.${total}</span>
  `;

  orderModal.classList.remove("hidden");
}

function handleOrderConfirm(orderType) {
  // Generate a unique order ID
  const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Calculate the total price before tax
  const subtotal = Object.entries(currentOrder).reduce(
    (sum, [_, { price, quantity }]) => sum + price * quantity,
    0
  );

  // Calculate the tax (assuming 13% tax rate)
  const taxRate = 0.13;
  const tax = subtotal * taxRate;

  // Calculate the total price (subtotal + tax)
  const total = subtotal + tax;

  // Format the timestamp
  const orderDate = new Date().toLocaleString();

  // Use jsPDF to create the PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set up PDF styling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);

  // Add restaurant header
  doc.text("Kababjees Restaurant", 105, 20, { align: "center" });

  // Add order details header
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Order Details", 105, 30, { align: "center" });

  // Add order ID and date
  doc.setFontSize(12);
  doc.text(`Order ID: ${orderId}`, 20, 40);
  doc.text(`Date: ${orderDate}`, 20, 47);
  doc.text(`Order Type: ${orderType}`, 20, 54);

  // Add a line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 60, 190, 60);

  // Add items table header
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("Item", 20, 70);
  doc.text("Qty", 120, 70);
  doc.text("Price", 160, 70, { align: "right" });

  // Add items to the PDF
  let yPos = 80;
  Object.entries(currentOrder).forEach(([item, { price, quantity }]) => {
    if (yPos > 250) {
      // Add new page if running out of space
      doc.addPage();
      yPos = 20;
    }

    doc.text(item, 20, yPos);
    doc.text(`x${quantity}`, 120, yPos);
    doc.text(`RS.${(price * quantity).toFixed(2)}`, 160, yPos, {
      align: "right",
    });
    yPos += 10;
  });

  // Add a line separator
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // Add subtotal, tax, and total
  doc.setFontSize(12);
  doc.text(`Subtotal: RS.${subtotal.toFixed(2)}`, 20, yPos);
  yPos += 10;
  doc.text(`Tax (13%): RS.${tax.toFixed(2)}`, 20, yPos);
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: RS.${total.toFixed(2)}`, 20, yPos);
  yPos += 20;

  // Add thank you message
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for dining with us!", 105, yPos, { align: "center" });

  // Save the PDF file
  doc.save(`Kababjees-Order-${orderId}.pdf`);

  // Reset the current order and hide the order modal
  currentOrder = {};
  orderModal.classList.add("hidden");
}

// Initialize the app
init();
