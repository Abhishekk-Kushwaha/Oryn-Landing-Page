export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handleRazorpayCheckout = async (
  userId: string, 
  planId: string,
  onSuccess?: (paymentId: string, orderId: string, signature: string) => void,
  userEmail?: string
) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert("Failed to load Razorpay SDK");
    return;
  }

  // Create an order on the backend to enforce server-side pricing
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  console.log("API URL:", import.meta.env.VITE_API_URL);
  console.log("Final Request URL:", `${API_BASE_URL}/api/create-razorpay-order`);
  
  let orderData;
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-razorpay-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        planId,
        purchase_source: "landing_page"
      })
    });
    orderData = await response.json();
    
    if (!response.ok || !orderData.id) {
        throw new Error(orderData.error || "Failed to create order");
    }
  } catch (err: any) {
    console.error("Error creating backend order:", err);
    alert(`Could not initialize checkout: ${err.message}`);
    return;
  }

  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  console.log("Checkout Key:", key);
  console.log("Order ID:", orderData.id);

  const options = {
    key: key,
    amount: orderData.amount, // Server-enforced amount
    currency: "INR",
    name: "Oryn",
    description: `Subscription for ${planId === 'monthly' ? 'Monthly' : '6 Months'} plan`,
    image: "/logo.png",
    order_id: orderData.id, // The backend-generated secure order ID
    handler: function (response: any) {
      console.log("Payment success", response);
      if (onSuccess) {
        onSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      }
    },
    prefill: {
      email: userEmail || "",
    },
    notes: {
      userId: userId,
      purchase_source: "landing_page",
      planId: planId
    },
    theme: {
      color: "#f97316", // orange-500
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on("payment.failed", function (response: any) {
    console.error("Payment failed", response.error);
    alert(`Payment failed: ${response.error.description}`);
  });
  rzp.open();
};
