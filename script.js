// Remove the productDetails array and replace with async fetch
let productDetails = [];

// Function to fetch products from JSON file
async function fetchProducts() {
    try {
        const response = await fetch('./products.json');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        productDetails = data.products;
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error al cargar los productos');
    }
}

// DOM Elements
const productsContainer = document.querySelector('#productos .row');
const contactForm = document.getElementById('contactForm');

// Function to generate product cards dynamically
function renderProducts() {
    if (!productsContainer) {
        // We're not on the products page, skip rendering
        return;
    }
    
    productsContainer.innerHTML = productDetails.map(product => `
        <div class="col-md-4">
            <div class="card h-100 d-flex flex-column">
                <h3 class="card-title flex-shrink-0">${product.name}</h3>
                <img src="./assets/images/${getProductImage(product)}" alt="${product.name}" class="card-img-top fixed-image">
                <div class="card-body flex-grow-1 d-flex flex-column">
                    <p class="card-text flex-grow-1">${product.description}</p>
                    <p class="product-full-description" style="display: none">${product.fullDescription}</p>
                </div>
                <button class="btn btn-info mb-2 show-details">Ver Detalles</button>
                <button class="btn btn-primary mt-auto flex-shrink-0" data-product-id="${product.id}">
                    Comprar Ahora ($${product.price})
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners only if we're on the products page
    if (productsContainer) {
        document.querySelectorAll('.show-details').forEach((button, index) => {
            button.addEventListener('click', () => toggleProductDetails(index));
        });
        
        // Add buy buttons event listeners
        document.querySelectorAll('[data-product-id]').forEach(button => {
            button.addEventListener('click', () => {
                const productId = parseInt(button.dataset.productId);
                const product = productDetails.find(p => p.id === productId);
                if (product) {
                    addToCart(product);
                }
            });
        });
    }

    // Update cart count when page loads
    updateCartCount();
}

// Helper function to get the correct image path
function getProductImage(product) {
    return product.image || 'template-default.png';
}

// Function to toggle product details
function toggleProductDetails(index) {
    const card = document.querySelectorAll('.card')[index];
    const description = card.querySelector('.card-text');
    const fullDescription = card.querySelector('.product-full-description');
    const button = card.querySelector('.show-details');

    if (fullDescription.style.display === 'none') {
        description.style.display = 'none';
        fullDescription.style.display = 'block';
        button.textContent = 'Ver Menos';
    } else {
        description.style.display = 'block';
        fullDescription.style.display = 'none';
        button.textContent = 'Ver Detalles';
    }
}

// Cart functionality
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        if (existingProduct.quantity < 10) {
            existingProduct.quantity += 1;
            showNotification('Cantidad actualizada en el carrito');
        } else {
            showNotification('Máximo 10 unidades por producto');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
        showNotification('Producto agregado al carrito');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    document.getElementById('cartPopup').classList.add('show');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Form validation
function validateForm(event) {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const formComplete = Array.from(formData.values()).every(value => value.trim() !== '');
    
    if (formComplete) {
        console.log('Formulario completo:', Object.fromEntries(formData));
        contactForm.submit();
    } else {
        console.log('Por favor complete todos los campos');
    }
}

// Add these functions to handle the cart popup
function toggleCartPopup() {
    const popup = document.getElementById('cartPopup');
    popup.classList.toggle('show');
    if (popup.classList.contains('show')) {
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center my-4">El carrito está vacío</p>';
        cartTotalElement.textContent = '0.00';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cartItems.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div>$${item.price} x ${item.quantity}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="btn btn-sm btn-outline-primary" onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-primary" onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotalElement.textContent = total.toFixed(2);
}

function updateCartItemQuantity(productId, newQuantity) {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
}

function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    updateCartCount();
    renderCartItems();
}

// Add these functions for cart management
function clearCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return; // Do nothing if cart is empty
    
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartCount();
        renderCartItems();
        showNotification('Carrito vaciado exitosamente');
    }
}

// Add this new function to handle checkout
function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return; // Do nothing if cart is empty
    
    window.location.href = 'carrito.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts(); // Replace renderProducts() with fetchProducts()
    if (contactForm) {
        contactForm.addEventListener('submit', validateForm);
    }
    
    // Add cart popup event listeners
    document.getElementById('cartButton')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCartPopup();
    });
    
    document.getElementById('closeCartPopup')?.addEventListener('click', () => {
        document.getElementById('cartPopup')?.classList.remove('show');
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('cartPopup');
        const cartButton = document.getElementById('cartButton');
        if (!popup || !cartButton) return;
        
        const isClickInsideCart = popup.contains(e.target);
        const isClickOnCartButton = cartButton.contains(e.target);
        const isQuantityButton = e.target.closest('.cart-item-quantity button');
        
        if (!isClickInsideCart && !isClickOnCartButton && !isQuantityButton && popup.classList.contains('show')) {
            popup.classList.remove('show');
        }
    });

    // Initialize scroll handler
    handleScroll();
});

// Update the header scroll effect
function handleScroll() {
    const header = document.getElementById("main-header");
    if (!header) return;
    
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Call once on page load to set initial state
document.addEventListener('DOMContentLoaded', handleScroll); 