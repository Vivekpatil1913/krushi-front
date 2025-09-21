import React, { useState } from "react";
import {
FaArrowLeft,
FaArrowRight,
FaShoppingCart,
FaUser,
FaCreditCard,
FaCheckCircle,
FaMoneyBillWave,
FaGooglePay,
FaLock,
FaUpload,
FaQrcode,
FaCopy,
FaExclamationTriangle,
} from "react-icons/fa";
import "./CheckoutFlow.css";
import TruckAnimation from "./TruckAnimation";
import QRCode from "./Assets/QRCode.png";

// const backendRootURL = "http://localhost:5000";
const backendRootURL = process.env.API_URL || 'http://localhost:5000';

const CheckoutFlow = ({
product,
quantity = 1,
onClose,
onOrderComplete,
cartItems = null,
}) => {
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
firstName: "",
lastName: "",
email: "",
phone: "",
address: "",
city: "",
state: "",
zipCode: "",
country: "India",
paymentMethod: "online",
specialInstructions: "",
});


const [paymentData, setPaymentData] = useState({
    transactionId: "",
    transactionScreenshot: null,
    screenshotPreview: null,
});

const [errors, setErrors] = useState({});
const [isProcessing, setIsProcessing] = useState(false);

const upiDetails = {
    upiId: "11200894434@okbizaxis",
    merchantName: "Krishivishwa Biotech",
    bankName: "Bank of Maharashtra",
    branch: "Akole",
    qrCodeUrl: QRCode,
    accountHolder: "Krishivishwa Biotech",
};

const orderItems = cartItems || [{ ...product, quantity }];
const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
const shippingFee = subtotal > 500 ? 0 : 50;
const tax = Math.round(subtotal * 0.18);
const total = subtotal + shippingFee + tax;

const steps = [
    { number: 1, title: "Review Order", icon: <FaShoppingCart /> },
    { number: 2, title: "Shipping Info", icon: <FaUser /> },
    { number: 3, title: "Payment", icon: <FaCreditCard /> },
    { number: 4, title: "Confirmation", icon: <FaCheckCircle /> },
];

const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
};

const handlePaymentDataChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
};

const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                transactionScreenshot: "Please upload a valid image file (JPG, PNG, GIF)",
            }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                transactionScreenshot: "File size must be less than 5MB",
            }));
            return;
        }
        setPaymentData((prev) => ({
            ...prev,
            transactionScreenshot: file,
            screenshotPreview: URL.createObjectURL(file),
        }));
        setErrors((prev) => ({ ...prev, transactionScreenshot: "" }));
    }
};

const copyUPIId = () => {
    navigator.clipboard.writeText(upiDetails.upiId);
    alert("UPI ID copied to clipboard!");
};

const validateStep = (step) => {
    const newErrors = {};
    if (step === 2) {
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    }
    if (step === 3 && formData.paymentMethod === "online") {
        // Make screenshot mandatory
        if (!paymentData.transactionScreenshot) {
            newErrors.transactionScreenshot = "Payment screenshot is required";
        }
        // Make transaction ID mandatory
        if (!paymentData.transactionId.trim()) {
            newErrors.transactionId = "Transaction ID is required";
        } else if (paymentData.transactionId.length < 8) {
            newErrors.transactionId = "Transaction ID must be at least 8 characters";
        }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const nextStep = () => {
    if (validateStep(currentStep)) {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
};

const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
};

const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
        let response, result;

        if (formData.paymentMethod === "online" && paymentData.transactionScreenshot) {
            const orderFormData = new FormData();
            const orderData = {
                items: orderItems,
                customerInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                },
                pricing: {
                    subtotal,
                    shippingFee,
                    tax,
                    total,
                },
                orderId: `ORD-${Date.now()}`,
                orderDate: new Date().toISOString(),
                paymentMethod: formData.paymentMethod,
                status: "pending",
                specialInstructions: formData.specialInstructions || "",
                paymentData: {
                    transactionId: paymentData.transactionId || null,
                    hasScreenshot: true,
                },
            };
            orderFormData.append("orderData", JSON.stringify(orderData));
            orderFormData.append("transactionScreenshot", paymentData.transactionScreenshot);
            response = await fetch(`${backendRootURL}/api/orders`, {
                method: "POST",
                body: orderFormData,
            });
        } else {
            const orderData = {
                items: orderItems,
                customerInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                },
                pricing: {
                    subtotal,
                    shippingFee,
                    tax,
                    total: total + (formData.paymentMethod === "cod" ? 20 : 0),
                },
                orderId: `ORD-${Date.now()}`,
                orderDate: new Date().toISOString(),
                paymentMethod: formData.paymentMethod,
                status: "pending",
                specialInstructions: formData.specialInstructions || "",
                paymentData:
                    formData.paymentMethod === "online"
                        ? {
                            transactionId: paymentData.transactionId || null,
                            hasScreenshot: false,
                        }
                        : null,
            };
            response = await fetch(`${backendRootURL}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });
        }

        result = await response.json();

        setTimeout(() => {
            setIsProcessing(false);
            if (response.ok) {
                if (onOrderComplete) onOrderComplete(result.order || {});
                onClose();
            } else {
                alert(result.message || "Could not place order. Please try again.");
            }
        }, 10000);
    } catch (error) {
        alert("Network error when placing order: " + error.message);
    } finally {
        setIsProcessing(false);
    }
};

const allowContinue =
    currentStep !== 3 ||
    formData.paymentMethod !== "online" ||
    (!!paymentData.transactionScreenshot && !!paymentData.transactionId.trim());

const renderStepContent = () => {
    switch (currentStep) {
        case 1:
            return (
                <div className="checkout-step">
                    <h3>Review Your Order</h3>
                    <div className="order-items">
                        {orderItems.map((item, index) => (
                            <div key={index} className="order-item">
                                <img
                                    src={
                                        item.image ? `${backendRootURL}${item.image}` : "/placeholder.svg"
                                    }
                                    alt={item.name || item.title}
                                    className="order-item-image"
                                />
                                <div className="order-item-details">
                                    <h4>{item.name || item.title}</h4>
                                    <p className="order-item-category">{item.category}</p>
                                    <div className="order-item-pricing">
                                        <span className="quantity">Qty: {item.quantity}</span>
                                        <span className="price">₹{item.price.toLocaleString()}</span>
                                        <span className="total">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax (GST 18%)</span>
                            <span>₹{tax.toLocaleString()}</span>
                        </div>
                        <div className="summary-row total-row">
                            <span>Total</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            );
        case 2:
            return (
                <div className="checkout-step">
                    <h3>Shipping Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={errors.firstName ? "error" : ""}
                                placeholder="First Name *"
                            />
                            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={errors.lastName ? "error" : ""}
                                placeholder="Last Name *"
                            />
                            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                        </div>
                        <div className="form-group full-width">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? "error" : ""}
                                placeholder="Email Address *"
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>
                        <div className="form-group full-width">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={errors.phone ? "error" : ""}
                                placeholder="Phone Number *"
                            />
                            {errors.phone && <span className="error-text">{errors.phone}</span>}
                        </div>
                        <div className="form-group full-width">
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={errors.address ? "error" : ""}
                                placeholder="Street Address *"
                            />
                            {errors.address && <span className="error-text">{errors.address}</span>}
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className={errors.city ? "error" : ""}
                                placeholder="City *"
                            />
                            {errors.city && <span className="error-text">{errors.city}</span>}
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className={errors.state ? "error" : ""}
                                placeholder="State *"
                            />
                            {errors.state && <span className="error-text">{errors.state}</span>}
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                className={errors.zipCode ? "error" : ""}
                                placeholder="PIN Code *"
                            />
                            {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                        </div>
                        <div className="form-group">
                            <select name="country" value={formData.country} onChange={handleInputChange}>
                                <option value="India">India</option>
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <textarea
                                name="specialInstructions"
                                value={formData.specialInstructions}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Any special delivery instructions(optional)..."
                            ></textarea>
                        </div>
                    </div>
                </div>
            );
        case 3:
            return (
                <div className="checkout-step">
                    <h3>Payment Method</h3>
                    <div className="payment-methods">
                        <label
                            className={`payment-method ${formData.paymentMethod === "online" ? "selected" : ""
                                }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="online"
                                checked={formData.paymentMethod === "online"}
                                onChange={handleInputChange}
                            />
                            <div className="payment-method-content">
                                <div className="payment-method-header">
                                    <FaGooglePay className="payment-icon" />
                                    <div>
                                        <h4>Online Payment</h4>
                                        <p>UPI, Bank Transfer, Card, Net Banking, Wallets</p>
                                    </div>
                                </div>
                                <div className="payment-badges">
                                    <span className="badge secure">
                                        <FaLock /> Secure
                                    </span>
                                    <span className="badge instant">Instant</span>
                                </div>
                            </div>
                        </label>
                        <label
                            className={`payment-method ${formData.paymentMethod === "cod" ? "selected" : ""
                                }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={formData.paymentMethod === "cod"}
                                onChange={handleInputChange}
                            />
                            <div className="payment-method-content">
                                <div className="payment-method-header">
                                    <FaMoneyBillWave className="payment-icon" />
                                    <div>
                                        <h4>Cash on Delivery</h4>
                                        <p>Pay when you receive the product</p>
                                    </div>
                                </div>
                                <div className="payment-badges">
                                    <span className="badge cod">₹20 handling fee</span>
                                </div>
                            </div>
                        </label>
                    </div>
                    {formData.paymentMethod === "online" && (
                        <div className="online-payment-details">
                            <div className="payment-instructions">
                                <h4>
                                    <FaQrcode /> Complete Your Payment
                                </h4>
                                <p>
                                    Scan the QR or pay to UPI ID below. Bank details are available for direct transfer. Upload your payment proof and transaction ID to continue.
                                </p>
                                <div className="qr-code-section">
                                    <div className="qr-code-container">
                                        <img
                                            src={upiDetails.qrCodeUrl}
                                            alt="UPI QR Code"
                                            className="qr-code-image"
                                            onError={(e) => {
                                                e.target.src = "/placeholder.svg";
                                            }}
                                        />
                                    </div>
                                    <div className="qr-code-info">
                                        <h5>Pay Details</h5>
                                        <div className="upi-details">
                                            <div className="amount-info">
                                                <span>
                                                    <strong>Amount:</strong> ₹{total.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="upi-id">
                                                <span>
                                                    <strong>UPI ID:</strong> {upiDetails.upiId}
                                                </span>
                                                <button onClick={copyUPIId} className="copy-btn">
                                                    <FaCopy /> Copy
                                                </button>
                                            </div>
                                            <div className="account-info">
                                                <span>
                                                    <strong>Account Holder:</strong> {upiDetails.accountHolder}
                                                </span>
                                            </div>
                                            <div className="bank-info">
                                                <span>
                                                    <strong>Bank:</strong> {upiDetails.bankName}
                                                </span>
                                            </div>
                                            <div className="branch-info">
                                                <span>
                                                    <strong>Branch:</strong> {upiDetails.branch}
                                                </span>
                                            </div>
                                            <div className="merchant-info">
                                                <span>
                                                    <strong>Merchant:</strong> {upiDetails.merchantName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="payment-verification">
                                    <h5>
                                        <FaExclamationTriangle /> Payment Verification Required
                                    </h5>
                                    <p>
                                        After payment, <strong>upload a screenshot</strong> of the transaction and provide the <strong>transaction ID</strong>. Both are required to proceed.
                                    </p>
                                    <div className="verification-options">
                                        <div className="verification-option screenshot-upload">
                                            <h6>Payment Screenshot <span className="required">*</span></h6>
                                            <div className="file-upload-container">
                                                <input
                                                    type="file"
                                                    id="screenshot-upload"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="file-input"
                                                    style={{ display: "none" }}
                                                />
                                                <label htmlFor="screenshot-upload" className="file-upload-btn">
                                                    <FaUpload /> Upload Screenshot
                                                </label>
                                                {paymentData.screenshotPreview ? (
                                                    <div className="screenshot-preview">
                                                        <img
                                                            src={paymentData.screenshotPreview}
                                                            alt="Transaction Screenshot"
                                                            className="preview-image"
                                                        />
                                                        <p>Screenshot uploaded!</p>
                                                    </div>
                                                ) : (
                                                    <div className="upload-instructions">
                                                        <p>Upload proof of payment (JPG, PNG)</p>
                                                        <p>Max size: 5MB</p>
                                                    </div>
                                                )}
                                                {errors.transactionScreenshot && (
                                                    <div className="error-text">{errors.transactionScreenshot}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="verification-option transaction-id">
                                            <h6>Transaction ID <span className="required">*</span></h6>
                                            <input
                                                type="text"
                                                name="transactionId"
                                                value={paymentData.transactionId}
                                                onChange={handlePaymentDataChange}
                                                className={errors.transactionId ? "error" : ""}
                                                placeholder="Enter UTR/Reference Number"
                                            />
                                            {errors.transactionId && (
                                                <span className="error-text">{errors.transactionId}</span>
                                            )}
                                            <div className="transaction-id-tip">
                                                <p><strong>Required:</strong> Found in your bank statement</p>
                                                <p>Helps us verify payment faster</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="payment-security">
                        <div className="security-features">
                            <div className="security-item">
                                <FaLock /> 256-bit SSL Encryption
                            </div>
                            <div className="security-item">
                                <FaCheckCircle /> PCI DSS Compliant
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 4:
            return (
                <div className="checkout-step">
                    <h3>Order Confirmation</h3>
                    <div className="confirmation-content">
                        <div className="confirmation-header">
                            <FaCheckCircle className="success-icon" />
                            <h4>Review Your Order Details</h4>
                            <p>Please verify all information before placing your order</p>
                        </div>
                        <div className="confirmation-sections">
                            <div className="confirmation-section">
                                <h5>Shipping Address</h5>
                                <div className="address-display">
                                    <p>
                                        <strong>
                                            {formData.firstName} {formData.lastName}
                                        </strong>
                                    </p>
                                    <p>{formData.address}</p>
                                    <p>
                                        {formData.city}, {formData.state} {formData.zipCode}
                                    </p>
                                    <p>{formData.country}</p>
                                    <p>Phone: {formData.phone}</p>
                                    <p>Email: {formData.email}</p>
                                </div>
                            </div>
                            <div className="confirmation-section">
                                <h5>Payment Method</h5>
                                <div className="payment-display">
                                    {formData.paymentMethod === "online" ? (
                                        <div className="payment-info">
                                            <div>
                                                <FaGooglePay /> Online Payment
                                            </div>
                                            <div>
                                                <strong>UPI ID:</strong> {upiDetails.upiId}
                                            </div>
                                            {paymentData.transactionId && (
                                                <div className="transaction-info">
                                                    Transaction ID: {paymentData.transactionId}
                                                </div>
                                            )}
                                            {paymentData.transactionScreenshot && (
                                                <div className="transaction-info">
                                                    ✓ Transaction screenshot uploaded
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="payment-info">
                                            <FaMoneyBillWave /> Cash on Delivery
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="confirmation-section">
                                <h5>Order Summary</h5>
                                <div className="final-summary">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Shipping</span>
                                        <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Tax (GST)</span>
                                        <span>₹{tax.toLocaleString()}</span>
                                    </div>
                                    {formData.paymentMethod === "cod" && (
                                        <div className="summary-row">
                                            <span>COD Handling</span>
                                            <span>₹20</span>
                                        </div>
                                    )}
                                    <div className="summary-row total-row">
                                        <span>Total Amount</span>
                                        <span>₹{(total + (formData.paymentMethod === "cod" ? 20 : 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

return (
    <div className="checkout-flow-component">
        <div className="checkout-flow-overlay">
            <div className="checkout-flow-container">
                <div className="checkout-header">
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                    <h2>Secure Checkout</h2>
                    <div className="checkout-steps">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className={`step ${currentStep >= step.number ? "active" : ""} ${currentStep === step.number ? "current" : ""
                                    }`}
                            >
                                <div className="step-icon">
                                    {currentStep > step.number ? <FaCheckCircle /> : step.icon}
                                </div>
                                <span className="step-title">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="checkout-content">{renderStepContent()}</div>
                <div className="checkout-footer">
                    <div className="checkout-actions">
                        {currentStep > 1 && (
                            <button className="btn-secondary" onClick={prevStep}>
                                <FaArrowLeft /> Back
                            </button>
                        )}
                        {currentStep < 4 ? (
                            <button
                                className="btn-primary"
                                onClick={nextStep}
                                disabled={!allowContinue}
                            >
                                Continue <FaArrowRight />
                            </button>
                        ) : (
                            <TruckAnimation
                                onClick={handlePlaceOrder}
                                disabled={isProcessing}
                                isProcessing={isProcessing}
                            />
                        )}
                    </div>
                    <div className="checkout-security">
                        <FaLock />
                        <span>Your information is secure and encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default CheckoutFlow;