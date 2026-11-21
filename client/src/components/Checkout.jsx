
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

function Checkout({ cart, totalPrice, onOrderPlaced }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please Login First!");
      return;
    }

    if (cart.length === 0) {
      alert("Your Cart is Empty!");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      alert("Enter a valid 10 digit mobile number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(form.pincode)) {
      alert("Enter a valid 6 digit PIN code.");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        userId: auth.currentUser.uid,
        customerName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        products: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalItems: cart.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        totalAmount: totalPrice,
        paymentMethod: "Cash on Delivery",
        orderStatus: "Pending",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);

      alert("Order Placed Successfully!");

      onOrderPlaced();
      navigate("/");
    } catch (error) {
      console.error("Order Error:", error);
      alert("Order Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <p>Complete your delivery details</p>

      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-form">
          <h2>Customer Details</h2>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="10 Digit Mobile Number"
            value={form.phone}
            onChange={handleChange}
            maxLength="10"
            required
          />

          <textarea
            name="address"
            placeholder="Full Delivery Address"
            value={form.address}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="pincode"
            placeholder="6 Digit PIN Code"
            value={form.pincode}
            onChange={handleChange}
            maxLength="6"
            required
          />

          <h2>Payment Method</h2>

          <div className="payment-option">
            Cash on Delivery (COD)
          </div>

          <h2>Order Summary</h2>

          {cart.map((item) => (
            <div className="checkout-item" key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>₹{item.price * item.quantity}</strong>
            </div>
          ))}

          <div className="checkout-total">
            <span>Total Amount</span>
            <strong>₹{totalPrice}</strong>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Checkout;
