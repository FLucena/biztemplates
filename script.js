let productDetails = [];

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

const productsContainer = document.querySelector('#productos .row');
const contactForm = document.getElementById('contactForm');

function renderProducts() {
    if (!productsContainer) {
        return;
    }
    
    productsContainer.innerHTML = productDetails.map(product => `
        <div class="col-md-4">
            <div class="card h-100">
                <h3 class="card-title">${product.name}</h3>
                <div class="card-img-container">
                    <img src="./assets/images/${product.image}" alt="${product.name}" class="card-img-top">
                </div>
                <div class="card-body">
                    <p class="card-text">${product.description}</p>
                    <p class="product-full-description" style="display: none">${product.fullDescription}</p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-link show-details" aria-label="Ver más detalles">
                        <i data-lucide="plus" class="icon"></i>
                    </button>
                    <button class="btn btn-primary" data-product-id="${product.id}">
                        <div class="icon-container">
                            <i data-lucide="shopping-cart" class="icon"></i>
                        </div>
                        <span class="price">$${product.price}</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
    
    if (productsContainer) {
        document.querySelectorAll('.show-details').forEach((button, index) => {
            button.addEventListener('click', () => toggleProductDetails(index));
        });
        
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

    updateCartCount();
}

function getProductImage(product) {
    return product.image || 'template-default.png';
}

function toggleProductDetails(index) {
    const card = document.querySelectorAll('.card')[index];
    const cardBody = card.querySelector('.card-body');
    const description = card.querySelector('.card-text');
    const fullDescription = card.querySelector('.product-full-description');
    const button = card.querySelector('.show-details');

    if (fullDescription.style.display === 'none') {
        cardBody.classList.add('expanded');
        description.style.opacity = '0';
        
        setTimeout(() => {
            description.style.display = 'none';
            fullDescription.style.display = 'block';
            fullDescription.style.opacity = '0';
            
            fullDescription.offsetHeight;
            fullDescription.style.opacity = '1';
        }, 300);

        button.innerHTML = `
            <i data-lucide="minus" class="icon"></i>
        `;
    } else {
        cardBody.classList.remove('expanded');
        fullDescription.style.opacity = '0';
        
        setTimeout(() => {
            fullDescription.style.display = 'none';
            description.style.display = 'block';
            description.style.opacity = '0';
            
            description.offsetHeight;
            description.style.opacity = '1';
        }, 300);

        button.innerHTML = `
            <i data-lucide="plus" class="icon"></i>
        `;
    }
    
    lucide.createIcons();
}

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
        showNotification('¡Item agregado al carrito!');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    document.getElementById('cartPopup').classList.add('show');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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

function toggleCartPopup() {
    const popup = document.getElementById('cartPopup');
    if (!popup) return;
    
    const isVisible = popup.classList.contains('show');
    if (isVisible) {
        popup.classList.remove('show');
    } else {
        popup.classList.add('show');
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsContainer) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i data-lucide="shopping-cart" class="icon-lg"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.textContent = '0.00';
        return;
    }
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="./assets/images/${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})" 
                            ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i data-lucide="minus" class="icon-sm"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})"
                            ${item.quantity >= 10 ? 'disabled' : ''}>
                        <i data-lucide="plus" class="icon-sm"></i>
                    </button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i data-lucide="trash-2" class="icon-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    cartTotal.textContent = totalPrice.toFixed(2);
    lucide.createIcons();
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

function clearCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return;
    
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartCount();
        renderCartItems();
        showNotification('Carrito vaciado exitosamente');
    }
}

function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return;
    
    window.location.href = 'carrito.html';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    if (contactForm) {
        contactForm.addEventListener('submit', validateForm);
    }
    
    const cartButton = document.querySelector('.cart-button');
    const cartPopup = document.getElementById('cartPopup');
    const closeCartPopup = document.getElementById('closeCartPopup');

    if (cartButton && cartPopup) {
        cartButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cartPopup.classList.add('show');
            renderCartItems();
        });
    }
    
    if (closeCartPopup) {
        closeCartPopup.addEventListener('click', () => {
            cartPopup.classList.remove('show');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (cartPopup && cartPopup.classList.contains('show')) {
            const isClickInsideCart = cartPopup.contains(e.target);
            const isClickOnCartButton = cartButton && cartButton.contains(e.target);
            
            if (!isClickInsideCart && !isClickOnCartButton) {
                cartPopup.classList.remove('show');
            }
        }
    });

    handleScroll();
    initFeatureCarousel();
});

function handleScroll() {
    const header = document.getElementById("main-header");
    if (!header) return;
    
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

window.addEventListener('scroll', handleScroll);

document.addEventListener('DOMContentLoaded', handleScroll);

document.addEventListener('DOMContentLoaded', function() {
    const cartButton = document.getElementById('cartButton');
    const cartPopup = document.getElementById('cartPopup');
    const closeCartPopup = document.getElementById('closeCartPopup');

    cartButton.addEventListener('click', function() {
        cartPopup.classList.add('active');
    });

    closeCartPopup.addEventListener('click', function() {
        cartPopup.classList.remove('active');
    });

    document.addEventListener('click', function(event) {
        if (!cartPopup.contains(event.target) && !cartButton.contains(event.target)) {
            cartPopup.classList.remove('active');
        }
    });

    cartPopup.addEventListener('click', function(event) {
        event.stopPropagation();
    });
}); 

function initFeatureCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevButton = document.querySelector('.carousel-arrow.prev');
    const nextButton = document.querySelector('.carousel-arrow.next');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    let currentIndex = 0;
    const slidesPerView = 1;
    
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Ir a característica ${index + 1}`);
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.carousel-dot');
    updateDots();
    
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    function goToSlide(index) {
        currentIndex = index;
        const slideWidth = slides[0].offsetWidth;
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        updateDots();
    }
    
    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        goToSlide(currentIndex);
    });
    
    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    window.addEventListener('resize', () => {
        goToSlide(currentIndex);
    });
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    }, 5000);
} 

function updateQuantity(index, newQuantity) {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (index >= 0 && index < cart.length) {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
} 

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i data-lucide="shopping-cart" class="icon-lg"></i>
                <p>Tu carrito está vacío</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    let totalPrice = 0;
    cartContainer.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${cartItems.map((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    totalPrice += itemTotal;
                    return `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="./assets/images/${item.image}" alt="${item.name}" class="cart-thumbnail">
                                    <span>${item.name}</span>
                                </div>
                            </td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})" 
                                            ${item.quantity <= 1 ? 'disabled' : ''}>
                                        <i data-lucide="minus" class="icon-sm"></i>
                                    </button>
                                    <span>${item.quantity}</span>
                                    <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})"
                                            ${item.quantity >= 10 ? 'disabled' : ''}>
                                        <i data-lucide="plus" class="icon-sm"></i>
                                    </button>
                                </div>
                            </td>
                            <td>$${itemTotal.toFixed(2)}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="deleteItem(${index})">
                                    <i data-lucide="trash-2" class="icon-sm"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                    <td><strong>$${totalPrice.toFixed(2)}</strong></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>`;
    
    lucide.createIcons();
}

function updateQuantity(index, newQuantity) {
    if (newQuantity < 1 || newQuantity > 10) {
        return;
    }
    
    cartItems[index].quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cartItems));
    renderCart();
}

let cartItems = JSON.parse(localStorage.getItem('cart')) || []; 

function renderCartPage() {
    const cartContainer = document.getElementById('wallet_container');
    if (!cartContainer) return;
    
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cartItems.length > 0) {
        cartItems.sort((a, b) => a.name.localeCompare(b.name));
        let totalPrice = 0;
        cartContainer.innerHTML = '<table class="table table-striped"><thead><tr><th>Producto</th><th>Portada</th><th>Cantidad</th><th>Precio</th><th>Acciones</th></tr></thead><tbody>' + 
            cartItems.map((item, index) => {
                if (item.name && item.price !== undefined && item.quantity !== undefined) {
                    const itemTotal = item.price * item.quantity;
                    totalPrice += itemTotal;
                    return `<tr>
                        <td>${item.name}</td>
                        <td><img src="./assets/images/${item.image}" alt="${item.name}" class="cart-thumbnail"></td>
                        <td>
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="updateCartPageQuantity(${index}, ${item.quantity - 1})" 
                                        ${item.quantity <= 1 ? 'disabled' : ''}>
                                    <i data-lucide="minus" class="icon-sm"></i>
                                </button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateCartPageQuantity(${index}, ${item.quantity + 1})"
                                        ${item.quantity >= 10 ? 'disabled' : ''}>
                                    <i data-lucide="plus" class="icon-sm"></i>
                                </button>
                            </div>
                        </td>
                        <td>$${itemTotal.toFixed(2)}</td>
                        <td>
                            <button class="btn-icon-only" aria-label="Remove item" onclick="deleteCartPageItem(${index})">
                                <i data-lucide="trash-2" class="icon"></i>
                            </button>
                        </td>
                    </tr>`;
                }
                return '';
            }).join('') + 
            `</tbody></table>
            <div class="text-end mb-4">
                <strong class="d-block mb-2">Total: $${totalPrice.toFixed(2)}</strong>
                <p class="text-muted small">
                    * Precios en Pesos Argentinos (ARS)<br>
                    * Precio final con impuestos incluidos
                </p>
            </div>
            <div class="mt-4">
                <h3>Datos de Contacto</h3>
                <form id="user-details-form" class="row g-3">
                    <div class="col-md-6">
                        <label for="email" class="form-label">Correo Electrónico:</label>
                        <input type="email" class="form-control" id="email" required>
                    </div>
                    <div class="col-md-6">
                        <label for="name" class="form-label">Nombre:</label>
                        <input type="text" class="form-control" id="name" required>
                    </div>
                    <div class="col-md-6">
                        <label for="surname" class="form-label">Apellido:</label>
                        <input type="text" class="form-control" id="surname" required>
                    </div>
                    <div class="col-md-6">
                        <label for="address" class="form-label">Dirección Completa:</label>
                        <input type="text" class="form-control" id="address" required>
                    </div>
                </form>
            </div>`;
    } else {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i data-lucide="shopping-cart" class="icon-lg"></i>
                <p>El carrito está vacío.</p>
                <button class="btn btn-primary mt-3" onclick="window.location.href='index.html'">
                    <i data-lucide="arrow-left" class="icon-sm"></i>
                    Volver a la Tienda
                </button>
            </div>`;
    }
    lucide.createIcons();
}

function updateCartPageQuantity(index, newQuantity) {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (index >= 0 && index < cart.length) {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage();
        updateCartCount();
        showNotification('Cantidad actualizada', 'success');
    }
}

function deleteCartPageItem(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage();
        updateCartCount();
        showNotification('Producto eliminado del carrito', 'warning');
    }
}

function initPayment() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cartItems.length === 0) {
        showNotification('El carrito está vacío. Agregue productos antes de continuar.', 'warning');
        return;
    }

    const email = document.getElementById('email')?.value.trim();
    const name = document.getElementById('name')?.value.trim();
    const surname = document.getElementById('surname')?.value.trim();
    const address = document.getElementById('address')?.value.trim();

    const emptyFields = [];
    if (!email) emptyFields.push('Email');
    if (!name) emptyFields.push('Nombre');
    if (!surname) emptyFields.push('Apellido');
    if (!address) emptyFields.push('Dirección');

    if (emptyFields.length > 0) {
        showNotification(`Complete los siguientes campos: ${emptyFields.join(', ')}`, 'warning');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, ingrese un correo electrónico válido', 'warning');
        return;
    }

    const orderData = {
        customerEmail: email,
        customerName: name,
        customerSurname: surname,
        customerAddress: address,
        items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        totalOrder: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderDate: new Date().toISOString(),
        orderNumber: `ORD-${Date.now()}`
    };

    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbxbDk9aSe0AcMl_qcykWtCVt2xaOW5qvxJoBUmMqt10vq4BmWkGa_RMlf2YYebGfjAf/exec";
    
    fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        showNotification('Orden registrada. En breve le llegará un correo con los detalles.');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error al registrar la orden. Por favor, intente nuevamente.');
    });
}

if (window.location.pathname.includes('carrito.html')) {
    renderCartPage();
    lucide.createIcons();
} 