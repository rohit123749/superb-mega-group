
import { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// 10 SUPERB MEGA GROUP franchise products
const superbProducts = [
  { name: "SUPERB Premium Tea Powder", category: "Tea Powder", price: 250 },
  { name: "SUPERB Special Masala Tea", category: "Tea Powder", price: 280 },
  { name: "SUPERB Elaichi Tea Powder", category: "Tea Powder", price: 270 },
  { name: "SUPERB Ginger Tea Powder", category: "Tea Powder", price: 260 },
  { name: "SUPERB Premium Green Tea", category: "Green Tea", price: 220 },
  { name: "SUPERB Classic Coffee Powder", category: "Coffee Powder", price: 300 },
  { name: "SUPERB Strong Filter Coffee", category: "Coffee Powder", price: 350 },
  { name: "SUPERB Instant Coffee", category: "Coffee Powder", price: 320 },
  { name: "SUPERB Chocolate Coffee Mix", category: "Coffee Mix", price: 290 },
  { name: "SUPERB Cold Coffee Premix", category: "Coffee Mix", price: 310 }
];

// XML text safe ठेवण्यासाठी
const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[char]));

// Branded packaging-style concept image
const makePackageImage = (productName, category) => {
  const safeName = escapeXml(productName.replace("SUPERB ", ""));
  const safeCategory = escapeXml(category.toUpperCase());

  const nameParts = safeName.split(" ");

  const firstLine = nameParts.slice(0, 2).join(" ");
  const secondLine = nameParts.slice(2).join(" ");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#dcebd0"/>
        <stop offset="100%" stop-color="#8caf67"/>
      </linearGradient>

      <linearGradient id="pack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffce9"/>
        <stop offset="100%" stop-color="#f1e7c6"/>
      </linearGradient>

      <linearGradient id="green" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a542b"/>
        <stop offset="100%" stop-color="#218447"/>
      </linearGradient>
    </defs>

    <rect width="600" height="600" fill="url(#bg)"/>

    <circle cx="75" cy="95" r="95" fill="#ffffff" opacity=".13"/>
    <circle cx="530" cy="500" r="130" fill="#ffffff" opacity=".16"/>

    <ellipse cx="300" cy="535" rx="175" ry="22" fill="#244522" opacity=".22"/>

    <path d="M155 75 L445 75 L465 115 L450 490 Q300 520 150 490 L135 115 Z"
      fill="#153c20" opacity=".25"/>

    <path d="M145 65 L455 65 L470 105 L450 485 Q300 510 150 485 L130 105 Z"
      fill="url(#pack)" stroke="#174c29" stroke-width="7"/>

    <path d="M130 105 L470 105 L455 205 L145 205 Z" fill="url(#green)"/>
    <path d="M130 105 L470 105 L455 125 L145 125 Z" fill="#0b3c20"/>

    <g fill="#8fbd51" opacity=".9">
      <path d="M170 145 Q120 85 155 55 Q205 92 170 145"/>
      <path d="M430 145 Q480 85 445 55 Q395 92 430 145"/>
    </g>

    <text x="300" y="157" text-anchor="middle"
      font-family="Arial" font-size="25" font-weight="bold" fill="#fff">
      SUPERB MEGA GROUP
    </text>

    <text x="300" y="245" text-anchor="middle"
      font-family="Georgia" font-size="25" fill="#52752c">
      Premium Quality
    </text>

    <text x="300" y="300" text-anchor="middle"
      font-family="Georgia" font-size="35" font-weight="bold" fill="#174c29">
      ${firstLine}
    </text>

    <text x="300" y="345" text-anchor="middle"
      font-family="Georgia" font-size="27" font-weight="bold" fill="#174c29">
      ${secondLine}
    </text>

    <text x="300" y="385" text-anchor="middle"
      font-family="Arial" font-size="15" fill="#55734a">
      ${safeCategory}
    </text>

    <g fill="#4d8735">
      <path d="M220 440 Q160 390 190 360 Q245 390 220 440"/>
      <path d="M380 440 Q440 390 410 360 Q355 390 380 440"/>
    </g>

    <path d="M180 460 Q300 420 420 460" fill="none"
      stroke="#7a9b43" stroke-width="3"/>

    <rect x="235" y="465" width="130" height="28" rx="14" fill="#174c29"/>

    <text x="300" y="484" text-anchor="middle"
      font-family="Arial" font-size="15" font-weight="bold" fill="#fff">
      SUPERB QUALITY
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tea Powder");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const fetchData = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setError("Please Login First!");
        return;
      }

      const adminRef = doc(db, "admins", user.uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists() || adminSnap.data().role !== "admin") {
        setError("Access Denied! Admin Only.");
        return;
      }

      setIsAdmin(true);

      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );

      const orderSnapshot = await getDocs(ordersQuery);

      setOrders(
        orderSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      );

      const productSnapshot = await getDocs(collection(db, "products"));

      setProducts(
        productSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      );
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetProductForm = () => {
    setName("");
    setCategory("Tea Powder");
    setPrice("");
    setImage("");
    setImageFile(null);
    setImagePreview("");
    setEditingProductId(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file!");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB!");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    if (!name.trim() || !price || Number(price) <= 0) {
      alert("Please fill all product details correctly!");
      return;
    }

    if (!imageFile && !image.trim()) {
      alert("Please select a product image!");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = image;

      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )}`;

        const imageReference = storageRef(storage, `products/${fileName}`);

        await uploadBytes(imageReference, imageFile);
        imageUrl = await getDownloadURL(imageReference);
      }

      const productData = {
        name: name.trim(),
        category,
        price: Number(price),
        image: imageUrl
      };

      if (editingProductId) {
        await updateDoc(doc(db, "products", editingProductId), productData);

        setProducts((previous) =>
          previous.map((product) =>
            product.id === editingProductId
              ? { ...product, ...productData }
              : product
          )
        );

        alert("Product Updated Successfully!");
      } else {
        const productRef = await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp()
        });

        setProducts((previous) => [
          ...previous,
          { id: productRef.id, ...productData }
        ]);

        alert("Product Added Successfully!");
      }

      resetProductForm();
    } catch (err) {
      console.error("Save Product Error:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add missing products and update matching SUPERB products
  const addSuperbProducts = async () => {
    const confirmAdd = window.confirm(
      "SUPERB MEGA GROUP che 10 Tea ani Coffee products add/update karayche aahet ka?"
    );

    if (!confirmAdd) return;

    try {
      setSaving(true);

      const productSnapshot = await getDocs(collection(db, "products"));

      const existingProducts = productSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      let addedCount = 0;
      let updatedCount = 0;

      for (const product of superbProducts) {
        const productImage = makePackageImage(
          product.name,
          product.category
        );

        const existing = existingProducts.find(
          (item) =>
            (item.name || "").trim().toLowerCase() ===
            product.name.toLowerCase()
        );

        const productData = {
          ...product,
          image: productImage
        };

        if (existing) {
          await updateDoc(doc(db, "products", existing.id), productData);
          updatedCount++;
        } else {
          await addDoc(collection(db, "products"), {
            ...productData,
            createdAt: serverTimestamp()
          });
          addedCount++;
        }
      }

      const updatedSnapshot = await getDocs(collection(db, "products"));

      setProducts(
        updatedSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      );

      alert(
        `SUPERB Products Ready!\nAdded: ${addedCount}\nUpdated: ${updatedCount}`
      );
    } catch (err) {
      console.error("Bulk Product Error:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setName(product.name || "");
    setCategory(product.category || "Tea Powder");
    setPrice(String(product.price || ""));
    setImage(product.image || "");
    setImageFile(null);
    setImagePreview(product.image || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", productId));

      setProducts((previous) =>
        previous.filter((product) => product.id !== productId)
      );

      if (editingProductId === productId) {
        resetProductForm();
      }

      alert("Product Deleted Successfully!");
    } catch (err) {
      console.error("Delete Product Error:", err);
      alert(err.message);
    }
  };

  const changeStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        orderStatus: newStatus
      });

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      alert("Order Status Updated!");
    } catch (err) {
      console.error("Status Update Error:", err);
      alert(err.message);
    }
  };

  const totalRevenue = orders.reduce(
    (total, order) => total + Number(order.totalAmount || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => (order.orderStatus || "Pending") === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "Delivered"
  ).length;

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div style={styles.loading}>
        <h2>{error || "Access Denied!"}</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.headerSmall}>SUPERB MEGA GROUP</p>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
          <p style={styles.headerText}>
            Manage your store, products and customer orders
          </p>
        </div>

        <div style={styles.adminBadge}>ADMIN PANEL</div>
      </header>

      <main style={styles.container}>
        <h2 style={styles.sectionTitle}>Dashboard Overview</h2>

        <div style={styles.statsGrid}>
          {[
            ["📦", "Total Orders", orders.length],
            ["🛍️", "Total Products", products.length],
            ["⏳", "Pending Orders", pendingOrders],
            ["🚚", "Delivered Orders", deliveredOrders]
          ].map(([icon, label, value]) => (
            <div style={styles.statCard} key={label}>
              <div style={styles.statIcon}>{icon}</div>
              <p style={styles.statLabel}>{label}</p>
              <h2 style={styles.statNumber}>{value}</h2>
            </div>
          ))}

          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <p style={styles.statLabel}>Order Value</p>
            <h2 style={styles.revenue}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>STORE INVENTORY</p>
              <h2 style={styles.sectionTitle}>
                {editingProductId ? "Edit Product" : "Add New Product"}
              </h2>
            </div>

            <span style={styles.sectionIcon}>
              {editingProductId ? "✏️" : "＋"}
            </span>
          </div>

          <div style={styles.bulkInfo}>
            <h3 style={styles.bulkInfoTitle}>
              SUPERB MEGA GROUP Product Collection
            </h3>

            <p style={styles.bulkInfoP}>
              5 Tea products + 5 Coffee products with matching branded
              packaging-style images.
            </p>

            <button
              type="button"
              onClick={addSuperbProducts}
              disabled={saving}
              style={{
                ...styles.bulkButton,
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? "Please Wait..." : "＋ Add / Update 10 SUPERB Products"}
            </button>

            <small style={styles.bulkInfoSmall}>
              Demo prices and concept packaging images. Existing products
              with other names will not be deleted.
            </small>
          </div>

          {editingProductId && (
            <p style={styles.editNotice}>Editing Product: {name}</p>
          )}

          <form onSubmit={saveProduct} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Product Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Tea Powder">Tea Powder</option>
                <option value="Green Tea">Green Tea</option>
                <option value="Coffee Powder">Coffee Powder</option>
                <option value="Coffee Mix">Coffee Mix</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Price (₹)</label>
              <input
                style={styles.input}
                type="number"
                placeholder="Enter price"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Product Image</label>
              <input
                style={styles.input}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editingProductId}
              />

              <small style={styles.helpText}>
                JPG, PNG or WEBP image (Maximum 5 MB)
              </small>
            </div>

            {imagePreview && (
              <div style={styles.previewBox}>
                <p style={styles.label}>Image Preview</p>

                <img
                  src={imagePreview}
                  alt="Product Preview"
                  style={styles.previewImage}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.addButton,
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving
                ? "Uploading & Saving..."
                : editingProductId
                  ? "✏️ Update Product"
                  : "＋ Add Product"}
            </button>

            {editingProductId && (
              <button
                type="button"
                onClick={resetProductForm}
                style={styles.cancelButton}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>YOUR STORE</p>

              <h2 style={styles.sectionTitle}>
                Manage Products
                <span style={styles.count}>{products.length}</span>
              </h2>
            </div>
          </div>

          {products.length === 0 ? (
            <p style={styles.empty}>No Products Added Yet.</p>
          ) : (
            <div style={styles.productGrid}>
              {products.map((product) => (
                <div style={styles.productCard} key={product.id}>
                  <div style={styles.productImageBox}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={styles.productImage}
                    />
                  </div>

                  <div style={styles.productDetails}>
                    <span style={styles.categoryTag}>
                      {product.category}
                    </span>

                    <h3 style={styles.productName}>{product.name}</h3>

                    <h2 style={styles.productPrice}>₹{product.price}</h2>

                    <button
                      onClick={() => editProduct(product)}
                      style={styles.editButton}
                    >
                      ✏️ Edit Product
                    </button>

                    <button
                      onClick={() => removeProduct(product.id)}
                      style={styles.deleteButton}
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>CUSTOMER MANAGEMENT</p>

              <h2 style={styles.sectionTitle}>
                All Customer Orders
                <span style={styles.count}>{orders.length}</span>
              </h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <p style={styles.empty}>No Orders Found.</p>
          ) : (
            <div style={styles.orderGrid}>
              {orders.map((order) => (
                <div style={styles.orderCard} key={order.id}>
                  <div style={styles.orderTop}>
                    <div>
                      <p style={styles.orderLabel}>ORDER ID</p>
                      <h3 style={styles.orderId}>
                        #{order.id.slice(0, 8)}
                      </h3>
                    </div>

                    <span style={styles.orderStatus}>
                      {order.orderStatus || "Pending"}
                    </span>
                  </div>

                  <div style={styles.customerInfo}>
                    <p>
                      <strong>Customer:</strong> {order.customerName}
                    </p>

                    <p>
                      <strong>Phone:</strong> {order.phone}
                    </p>

                    <p>
                      <strong>Address:</strong>{" "}
                      {order.address}, {order.city} - {order.pincode}
                    </p>
                  </div>

                  <div style={styles.orderProducts}>
                    <h4 style={styles.orderSubheading}>Ordered Products</h4>

                    {order.products?.map((product, index) => (
                      <div style={styles.orderProductRow} key={index}>
                        <span>
                          {product.name} × {product.quantity}
                        </span>

                        <strong>₹{product.price}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={styles.orderBottom}>
                    <div>
                      <p style={styles.orderLabel}>TOTAL AMOUNT</p>

                      <h2 style={styles.orderTotal}>
                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </h2>
                    </div>

                    <div>
                      <p style={styles.orderLabel}>PAYMENT</p>
                      <strong>{order.paymentMethod || "Not specified"}</strong>
                    </div>
                  </div>

                  <label style={styles.label}>Update Order Status</label>

                  <select
                    style={styles.statusSelect}
                    value={order.orderStatus || "Pending"}
                    onChange={(e) =>
                      changeStatus(order.id, e.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          © 2026 SUPERB MEGA GROUP | Admin Control Panel
        </footer>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f2",
    color: "#173b2c",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "35px"
  },

  loading: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#17452f",
    padding: "20px",
    textAlign: "center"
  },

  header: {
    background: "linear-gradient(120deg, #08291c, #155c3b)",
    color: "white",
    padding: "35px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    borderBottom: "4px solid #d4af37"
  },

  headerSmall: {
    color: "#e2c66e",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "3px",
    margin: "0 0 8px"
  },

  headerTitle: {
    fontSize: "clamp(27px, 4vw, 38px)",
    margin: 0
  },

  headerText: {
    color: "#d6e7dc",
    margin: "10px 0 0",
    fontSize: "14px"
  },

  adminBadge: {
    border: "1px solid #d4af37",
    color: "#f3d978",
    padding: "12px 20px",
    borderRadius: "30px",
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "1px"
  },

  container: {
    width: "90%",
    maxWidth: "1250px",
    margin: "30px auto"
  },

  sectionTitle: {
    color: "#123d2c",
    fontSize: "23px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    margin: "22px 0 35px"
  },

  statCard: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(15,50,30,0.06)",
    borderBottom: "3px solid #d4af37"
  },

  statIcon: {
    fontSize: "27px"
  },

  statLabel: {
    color: "#77877c",
    fontSize: "13px",
    margin: "12px 0 5px"
  },

  statNumber: {
    fontSize: "30px",
    margin: 0,
    color: "#155c3b"
  },

  revenue: {
    fontSize: "24px",
    margin: 0,
    color: "#155c3b",
    overflowWrap: "anywhere"
  },

  section: {
    background: "white",
    borderRadius: "17px",
    padding: "25px",
    marginBottom: "28px",
    boxShadow: "0 4px 18px rgba(15,50,30,0.06)"
  },

  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "23px"
  },

  eyebrow: {
    color: "#b18c28",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "2px",
    margin: "0 0 7px"
  },

  sectionIcon: {
    fontSize: "30px",
    color: "#b18c28"
  },

  count: {
    background: "#e8f3eb",
    color: "#155c3b",
    fontSize: "14px",
    padding: "5px 11px",
    borderRadius: "20px"
  },

  bulkInfo: {
    background: "#f1f7ed",
    border: "1px solid #d8e8cf",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "22px"
  },

  bulkInfoTitle: {
    margin: "0 0 8px",
    color: "#17452f"
  },

  bulkInfoP: {
    color: "#53665a",
    fontSize: "13px",
    margin: "0 0 10px"
  },

  bulkInfoSmall: {
    display: "block",
    color: "#77877c",
    fontSize: "11px",
    lineHeight: "1.5"
  },

  bulkButton: {
    display: "block",
    background: "#d4af37",
    color: "#123d2c",
    border: "none",
    borderRadius: "9px",
    padding: "14px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    margin: "14px 0"
  },

  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px"
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  label: {
    color: "#355744",
    fontSize: "13px",
    fontWeight: "bold",
    display: "block",
    marginBottom: "8px"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #dce7df",
    borderRadius: "9px",
    background: "#fbfdfb",
    fontSize: "14px",
    outlineColor: "#b18c28"
  },

  helpText: {
    color: "#77877c",
    fontSize: "11px"
  },

  previewBox: {
    background: "#f5f8f5",
    border: "1px solid #e2eae4",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center"
  },

  previewImage: {
    width: "100%",
    maxWidth: "180px",
    height: "140px",
    objectFit: "contain",
    borderRadius: "8px"
  },

  addButton: {
    background: "linear-gradient(120deg, #123d2c, #23734d)",
    color: "white",
    border: "none",
    borderRadius: "9px",
    padding: "14px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    alignSelf: "end"
  },

  editNotice: {
    background: "#fff8df",
    color: "#80631c",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "18px",
    fontWeight: "bold"
  },

  editButton: {
    width: "100%",
    padding: "11px",
    background: "#e8f3eb",
    border: "1px solid #b9d9c4",
    color: "#155c3b",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "9px"
  },

  cancelButton: {
    background: "#f0f1f0",
    color: "#444",
    border: "1px solid #ddd",
    borderRadius: "9px",
    padding: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    alignSelf: "end"
  },

  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px"
  },

  productCard: {
    border: "1px solid #e5ece7",
    borderRadius: "13px",
    overflow: "hidden",
    background: "#fff"
  },

  productImageBox: {
    height: "190px",
    background: "#edf4e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    boxSizing: "border-box"
  },

  productImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain"
  },

  productDetails: {
    padding: "16px"
  },

  categoryTag: {
    display: "inline-block",
    background: "#e8f3eb",
    color: "#155c3b",
    borderRadius: "20px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "bold"
  },

  productName: {
    color: "#173b2c",
    fontSize: "17px",
    margin: "12px 0 5px"
  },

  productPrice: {
    color: "#b18c28",
    margin: "0 0 15px"
  },

  deleteButton: {
    width: "100%",
    padding: "11px",
    background: "#fff0f0",
    border: "1px solid #f1caca",
    color: "#b83232",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  orderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "20px"
  },

  orderCard: {
    border: "1px solid #e2eae4",
    borderRadius: "13px",
    padding: "19px",
    background: "#fff"
  },

  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #e9eee9",
    paddingBottom: "13px",
    marginBottom: "14px"
  },

  orderLabel: {
    color: "#8a998e",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1px",
    margin: "0 0 5px"
  },

  orderId: {
    color: "#17452f",
    fontSize: "18px",
    margin: 0
  },

  orderStatus: {
    background: "#fff6dd",
    color: "#8a6813",
    padding: "7px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold"
  },

  customerInfo: {
    color: "#53665a",
    fontSize: "13px",
    lineHeight: "1.7",
    overflowWrap: "anywhere"
  },

  orderProducts: {
    background: "#f5f8f5",
    borderRadius: "9px",
    padding: "13px",
    margin: "14px 0"
  },

  orderSubheading: {
    color: "#17452f",
    fontSize: "13px",
    margin: "0 0 10px"
  },

  orderProductRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: "#53665a",
    fontSize: "12px",
    padding: "6px 0",
    borderBottom: "1px solid #e5ece7"
  },

  orderBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px"
  },

  orderTotal: {
    color: "#b18c28",
    margin: 0,
    fontSize: "23px"
  },

  statusSelect: {
    width: "100%",
    padding: "12px",
    border: "1px solid #dce7df",
    borderRadius: "8px",
    background: "#f8fbf8",
    color: "#17452f",
    fontWeight: "bold",
    cursor: "pointer"
  },

  empty: {
    background: "#f5f8f5",
    padding: "25px",
    textAlign: "center",
    borderRadius: "10px",
    color: "#77877c"
  },

  footer: {
    textAlign: "center",
    color: "#829187",
    fontSize: "12px",
    padding: "15px"
  }
};

export default AdminDashboard;
