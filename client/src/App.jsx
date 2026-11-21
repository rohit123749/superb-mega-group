import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate
} from "react-router-dom";

import "./App.css";

import Auth from "./components/Auth";
import Profile from "./components/Profile";
import Checkout from "./components/Checkout";
import MyOrders from "./components/MyOrders";
import AdminDashboard from "./components/AdminDashboard";

import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import {
  collection,
  onSnapshot
} from "firebase/firestore";

function CartPage({
  cart,
  totalItems,
  totalPrice,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
}) {
  const navigate = useNavigate();

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <p>YOUR SHOPPING BAG</p>
        <h1>My Shopping Cart 🛒</h1>
        <span>{totalItems} Items in your cart</span>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <h2>Your Cart is Empty!</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/" className="continue-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-products">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Category: {item.category}</p>
                  <strong>₹{item.price}</strong>

                  <div className="cart-quantity">
                    <button onClick={() => decreaseQuantity(item.id)}>
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>
                  </div>

                  <p className="subtotal">
                    Subtotal: ₹{item.price * item.quantity}
                  </p>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div>
              <span>Total Items</span>
              <strong>{totalItems}</strong>
            </div>

            <div>
              <span>Subtotal</span>
              <strong>₹{totalPrice}</strong>
            </div>

            <div>
              <span>Delivery</span>
              <strong>Free</strong>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total Amount</span>
              <strong>₹{totalPrice}</strong>
            </div>

            <button
              className="checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>

            <Link to="/" className="back-shopping">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function AppContent() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [cart, setCart] = useState([]);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productList = snapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id
        }));

        setProducts(productList);
        setProductsLoading(false);
        setProductsError("");
      },
      (error) => {
        console.error("Products loading error:", error);
        setProductsError(error.message);
        setProductsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfile(false);
      setShowAuth(false);
      setSidebarOpen(false);
      navigate("/");
      alert("Logout Successful!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleProfileClose = () => {
    setShowProfile(false);
    navigate("/", { replace: true });
  };

  const openAuth = () => {
    setSidebarOpen(false);
    setShowAuth(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    )
  ];

  let filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (sort === "low") {
    filteredProducts.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }

  if (sort === "high") {
    filteredProducts.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  const addToCart = (product) => {
    setCart((previous) => {
      const existingProduct = previous.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const increaseQuantity = (id) => {
    setCart((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  const handleOrderPlaced = () => {
    setCart([]);
  };

  if (authLoading) {
    return <div className="app">Loading...</div>;
  }

  if (showProfile && user) {
    return (
      <div className="app">
        <Profile
          user={user}
          onClose={handleProfileClose}
        />
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <div className="app auth-screen">
        <button
          className="auth-back-btn"
          onClick={() => {
            setShowAuth(false);
            navigate("/", { replace: true });
          }}
        >
          ← Back to Home
        </button>

        <Auth />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="top-bar">
        Welcome to SUPERB MEGA GROUP | Premium Shopping Experience
      </div>

      <header className="navbar">
        <div className="navbar-left">
          <Link to="/" className="logo">
            SUPERB <span>MEGA GROUP</span>
          </Link>

          <nav className="main-nav">
            <Link to="/" onClick={closeSidebar}>
              Home
            </Link>

            <a href="/#products">
              Products
            </a>

            <a href="/#about">
              About Us
            </a>

            <a href="/#contact">
              Contact
            </a>
          </nav>
        </div>

        <div className="nav-actions">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
        />
      )}

      <aside className={`account-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-heading">
          <div>
            <span className="sidebar-eyebrow">
              SUPERB MEGA GROUP
            </span>
            <h2>My Account</h2>
          </div>

          <button
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.displayName || user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user.displayName || "Welcome"}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="sidebar-guest">
            <p>Welcome to SUPERB MEGA GROUP</p>
            <button onClick={openAuth}>
              Login / Register
            </button>
          </div>
        )}

        <nav className="sidebar-links">
          <button
            onClick={() => {
              closeSidebar();
              navigate("/cart");
            }}
          >
            <span>🛒</span>
            <span className="sidebar-link-label">
              Cart
              <span className="sidebar-count">{totalItems}</span>
            </span>
          </button>

          {user && (
            <>
              <button
                onClick={() => {
                  closeSidebar();
                  navigate("/my-orders");
                }}
              >
                <span>📦</span>
                My Orders
              </button>

              {user.uid === import.meta.env.VITE_ADMIN_UID && (
                <button
                  onClick={() => {
                    closeSidebar();
                    navigate("/admin-dashboard");
                  }}
                >
                  <span>🛠️</span>
                  Admin Dashboard
                </button>
              )}

              <button
                onClick={() => {
                  closeSidebar();
                  setShowProfile(true);
                }}
              >
                <span>👤</span>
                My Profile
              </button>

              <button
                className="sidebar-logout"
                onClick={handleLogout}
              >
                <span>↪</span>
                Logout
              </button>
            </>
          )}
        </nav>
      </aside>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <section className="hero" id="home">
                <div className="hero-content">
                  <p className="tagline">WELCOME TO OUR STORE</p>

                  <h1>
                    Discover Your
                    <br />
                    <span>Perfect Choice</span>
                  </h1>

                  <p>
                    Explore premium quality products with an amazing
                    shopping experience at SUPERB MEGA GROUP.
                  </p>

                  <a href="#products" className="shop-btn">
                    Explore Products
                  </a>
                </div>
              </section>

              <section className="features">
                <div>🚚 Free Delivery</div>
                <div>⭐ Premium Quality</div>
                <div>🔒 Secure Shopping</div>
                <div>💬 Customer Support</div>
              </section>

              <section className="products-section" id="products">
                <div className="section-heading">
                  <p>OUR COLLECTION</p>
                  <h2>Featured Products</h2>
                </div>

                <div className="filters">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>

                    {categories.map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="default">Sort By</option>
                    <option value="low">Price: Low to High</option>
                    <option value="high">Price: High to Low</option>
                  </select>
                </div>

                <div className="product-grid">
                  {productsLoading ? (
                    <p>Loading products...</p>
                  ) : productsError ? (
                    <p className="no-products">
                      Unable to load products: {productsError}
                    </p>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div className="product-card" key={product.id}>
                        <img
                          src={product.image}
                          alt={product.name}
                          title="Click to view image"
                          role="button"
                          tabIndex={0}
                          style={{ cursor: "zoom-in" }}
                          onClick={() => setPreviewProduct(product)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setPreviewProduct(product);
                            }
                          }}
                        />

                        <div className="product-info">
                          <span className="category">
                            {product.category}
                          </span>

                          <h3>{product.name}</h3>

                          <div className="product-bottom">
                            <strong>₹{product.price}</strong>

                            <button onClick={() => addToCart(product)}>
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-products">
                      No products found.
                    </p>
                  )}
                </div>
              </section>

              <section className="about-section" id="about">
                <h2>About SUPERB MEGA GROUP</h2>

                <p>
                  We aim to provide quality products and a smooth,
                  reliable shopping experience for every customer.
                </p>
              </section>

              <footer id="contact">
                <h2>SUPERB MEGA GROUP</h2>
                <p>Quality Products. Better Experience.</p>
                <p>© 2026 SUPERB MEGA GROUP. All Rights Reserved.</p>
              </footer>
            </>
          }
        />

        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              totalItems={totalItems}
              totalPrice={totalPrice}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeFromCart={removeFromCart}
            />
          }
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              totalPrice={totalPrice}
              onOrderPlaced={handleOrderPlaced}
            />
          }
        />

        <Route
          path="/my-orders"
          element={<MyOrders />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />
      </Routes>

      {previewProduct && (
        <div
          className="product-preview-overlay"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="product-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="preview-close"
              onClick={() => setPreviewProduct(null)}
              aria-label="Close image preview"
            >
              ×
            </button>

            <img
              src={previewProduct.image}
              alt={previewProduct.name}
            />

            <h3>{previewProduct.name}</h3>
            <p>₹{previewProduct.price}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;