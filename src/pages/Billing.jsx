import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import {
  FiInfo,
  FiClock,
  FiCalendar,
  FiTarget,
  FiSun,
  FiDatabase,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import {
  getCreditBalance,
  getCreditTransactions,
  getSubscriptionStatus,
  createSubscription,
  updateAutoRenewal,
  createBillingPortalSession,
} from "../lib/billingApi";

const Billing = () => {
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditsUsedThisMonth, setCreditsUsedThisMonth] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUpdatingAutoRenewal, setIsUpdatingAutoRenewal] = useState(false);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);

  const subscriptionPlans = useMemo(() => [
    {
      key: "free",
      name: "Free",
      price: 0,
      priceDisplay: "Free",
      credits: 20,
      creditsDisplay: "20 credits",
      interval: null,
      description: "Perfect for trying out Merlin",
      features: [
        "20 credits per month",
        "Basic meeting insights",
        "ICP analysis",
        "Community support",
      ],
      isPopular: false,
      isCurrent: subscriptionStatus?.plan === "free",
    },
    {
      key: "growth",
      name: "Growth",
      price: 69,
      priceDisplay: "£69",
      credits: 350,
      creditsDisplay: "350 credits",
      interval: "month",
      description: "Perfect for growing teams",
      features: [
        "350 credits per month",
        "All Free features",
        "Advanced insights",
        "Email support",
        "Early renewal available",
      ],
      isPopular: true,
      isCurrent: subscriptionStatus?.plan === "growth",
    },
    {
      key: "pro",
      name: "Pro",
      price: 99,
      priceDisplay: "£99",
      credits: 600,
      creditsDisplay: "600 credits",
      interval: "month",
      description: "For power users and teams",
      features: [
        "600 credits per month",
        "All Growth features",
        "Priority support",
        "Advanced analytics",
        "Early renewal available",
      ],
      isPopular: false,
      isCurrent: subscriptionStatus?.plan === "pro",
    },
  ], [subscriptionStatus?.plan]);

  const creditUsage = [
    {
      icon: FiCalendar,
      iconColor: "text-accent",
      iconBg: "bg-accent-light",
      name: "Meeting Insight (Verified)",
      description: "Full research on external non-recurring meeting attendees",
      credits: "2 credits",
    },
    {
      icon: FiSun,
      iconColor: "text-accent",
      iconBg: "bg-yellow-100",
      name: "Custom Insight",
      description: "Per custom question answered (multiple per meeting)",
      credits: "1 credit",
    },
    {
      icon: FiTarget,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      name: "ICP Focus Meeting",
      description: "Per Low Fit Meeting identified",
      credits: "3 credits",
    },
    {
      icon: FiDatabase,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      name: "Data Enrichment",
      description: "Per contact enriched (up to 5 new fields)",
      credits: "3 credits",
    },
  ];

  // Fetch credit balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        const data = await getCreditBalance();
        setCreditBalance(data.credits_balance);
        setCreditsUsedThisMonth(data.credits_used_this_month);
      } catch (error) {
        console.error("Error fetching credit balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, []);

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoadingSubscription(true);
        const data = await getSubscriptionStatus();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        // Default to free plan if error
        setSubscriptionStatus(prev => ({ 
          ...prev, 
          plan: "free", 
          status: "active", 
          credits_remaining: creditBalance, 
          auto_renewal_enabled: true 
        }));
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        const data = await getCreditTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleSubscribe = async (planKey) => {
    if (planKey === "free") {
      // Can't subscribe to free plan
      return;
    }

    try {
      setIsSubscribing(true);
      
      // Get current URL for success/cancel redirects
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/billing?success=true`;
      const cancelUrl = `${baseUrl}/billing?canceled=true`;

      const result = await createSubscription(planKey, successUrl, cancelUrl);

      if (result.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Failed to create subscription. Please try again.");
      setIsSubscribing(false);
    }
  };

  const getPlanButtonText = (plan) => {
    if (plan.isCurrent) {
      return "Current Plan";
    }
    if (subscriptionStatus?.plan === "free" && plan.key !== "free") {
      return "Upgrade";
    }
    if (subscriptionStatus?.plan === "growth" && plan.key === "pro") {
      return "Upgrade";
    }
    if (subscriptionStatus?.plan === "pro" && plan.key === "growth") {
      return "Downgrade";
    }
    return "Select Plan";
  };

  const getPlanButtonDisabled = (plan) => {
    return plan.isCurrent || isSubscribing || plan.key === "free";
  };

  const handleToggleEarlyRenewal = async () => {
    if (subscriptionStatus?.plan === "free") {
      return; // No subscription to manage
    }

    const newValue = !subscriptionStatus?.auto_renewal_enabled;
    console.log("Toggling early renewal to:", newValue);
    
    try {
      setIsUpdatingAutoRenewal(true);
      const result = await updateAutoRenewal(newValue);
      console.log("Update result:", result);
      
      setSubscriptionStatus(prev => ({
        ...prev,
        auto_renewal_enabled: newValue
      }));
    } catch (error) {
      console.error("Error updating early renewal:", error);
      alert(`Failed to update early renewal preference: ${error.message || "Please try again."}`);
    } finally {
      setIsUpdatingAutoRenewal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (subscriptionStatus?.plan === "free") {
      return; // No subscription to cancel
    }

    try {
      setIsOpeningBillingPortal(true);
      const portalUrl = await createBillingPortalSession();
      // Redirect to Stripe billing portal
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Failed to open billing portal. Please try again.");
      setIsOpeningBillingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600">
            Manage your subscription plan and view usage history
          </p>
        </div>

        {/* Current Plan & Balance Section */}
        <div className="bg-accent-light border border-accent rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Current Plan
              </p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-gray-900 capitalize">
                  {isLoadingSubscription ? "Loading..." : subscriptionStatus?.plan || "Free"}
                </span>
                {subscriptionStatus?.status === "active" && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              {subscriptionStatus?.next_billing_date && (
                <p className="text-sm text-gray-600">
                  Next billing: {new Date(subscriptionStatus.next_billing_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Credit Balance */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Credit Balance
              </p>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-7 h-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-2xl font-bold text-gray-900">
                  {isLoadingBalance ? "Loading..." : `${creditBalance.toLocaleString()} Credits`}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {creditsUsedThisMonth} credits used this month
              </p>
            </div>
          </div>

          {/* Early Renewal Toggle & Cancel Subscription */}
          {subscriptionStatus?.plan !== "free" && (
            <div className="border-t border-accent pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Early Renewal
                  </p>
                  <p className="text-xs text-gray-600">
                    {subscriptionStatus?.auto_renewal_enabled 
                      ? "If you run out of credits, your subscription will automatically renew early to ensure you never miss important insights"
                      : "Early renewal is disabled. You'll need to manually renew when credits run out"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleEarlyRenewal();
                  }}
                  disabled={isUpdatingAutoRenewal || isLoadingSubscription}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    subscriptionStatus?.auto_renewal_enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={subscriptionStatus?.auto_renewal_enabled}
                  aria-label="Toggle early renewal"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscriptionStatus?.auto_renewal_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Cancel Subscription Button */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isOpeningBillingPortal || isLoadingSubscription}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOpeningBillingPortal ? "Opening..." : "Cancel Subscription"}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Manage your subscription, payment methods, and billing history on Stripe
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Plans Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Choose Your Plan
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.key}
                className={`relative border-2 rounded-xl p-6 ${
                  plan.isPopular
                    ? "border-primary bg-accent-light"
                    : plan.isCurrent
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {plan.isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <FiCheck className="w-3 h-3" />
                      Current
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.priceDisplay}
                    </span>
                    {plan.interval && (
                      <span className="text-sm text-gray-600">/{plan.interval}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {plan.creditsDisplay}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={getPlanButtonDisabled(plan)}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    plan.isCurrent
                      ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                      : plan.isPopular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {isSubscribing && !plan.isCurrent ? (
                    "Processing..."
                  ) : (
                    <>
                      {getPlanButtonText(plan)}
                      {!plan.isCurrent && plan.key !== "free" && (
                        <FiArrowRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Early Renewal Info */}
          <div className="mt-6 bg-accent-light border border-accent rounded-lg p-4 flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-900">
              <p className="font-medium mb-1">Early Renewal Available</p>
              <p>
                On Growth and Pro plans, if you run out of credits, your subscription will automatically renew early. 
                This ensures you never miss important meeting insights or data enrichment opportunities. 
                Credits are reset to your plan's monthly allowance when renewal occurs.
              </p>
            </div>
          </div>
        </div>

        {/* How Credits Work Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            How Credits Work
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Each feature consumes credits based on usage. Credits never expire.
          </p>

          <div className="space-y-4">
            {creditUsage.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 ${item.iconBg} rounded-lg flex items-center justify-center`}
                  >
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary bg-accent-light px-3 py-1 rounded-full">
                  {item.credits}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FiClock className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Credits
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {transaction.date}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {transaction.description}
                    </td>
                    <td
                      className={`py-4 px-4 text-sm text-right font-medium ${
                        transaction.credits > 0
                          ? "text-green-600"
                          : "text-gray-700"
                      }`}
                    >
                      {transaction.credits > 0 ? "+" : ""}
                      {transaction.credits.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-right text-gray-700">
                      {transaction.balance.toLocaleString()}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
