
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) {
        setError("Please Login First!");
        setLoading(false);
        return;
      }

      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(ordersQuery);

        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setOrders(ordersList);
      } catch (err) {
        console.error("Fetch Orders Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <h2 className="orders-message">Loading Orders...</h2>;
  }

  if (error) {
    return <h2 className="orders-message">{error}</h2>;
  }

  return (
    <section className="my-orders-page">
      <h1>My Orders</h1>
      <p>View all your previous orders</p>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <h2>No Orders Found</h2>
          <p>Your orders will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <h3>Order #{order.id.slice(0, 8)}</h3>
                <span className="order-status">
                  {order.orderStatus || "Pending"}
                </span>
              </div>

              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p>
                <strong>Address:</strong>{" "}
                {order.address}, {order.city} - {order.pincode}
              </p>

              <div className="order-products">
                {order.products?.map((product, index) => (
                  <div className="order-product" key={index}>
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                    <div>
                      <h4>{product.name}</h4>
                      <p>Quantity: {product.quantity}</p>
                      <p>Price: ₹{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span>
                  Total Items: {order.totalItems}
                </span>
                <strong>
                  Total: ₹{order.totalAmount}
                </strong>
              </div>

              <p>
                <strong>Payment:</strong>{" "}
                {order.paymentMethod}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyOrders;
