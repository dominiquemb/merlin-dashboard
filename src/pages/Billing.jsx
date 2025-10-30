import React, { useState } from "react";
import Navbar from "../components/Navbar";
import {
  FiShoppingCart,
  FiZap,
  FiInfo,
  FiClock,
  FiCalendar,
  FiTarget,
  FiSun,
  FiDatabase,
} from "react-icons/fi";

const Billing = () => {
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const creditPackages = [
    {
      name: "Starter",
      credits: 500,
      price: 50,
      pricePerCredit: 0.1,
      isPopular: false,
      savings: null,
    },
    {
      name: "Professional",
      credits: 2000,
      price: 180,
      pricePerCredit: 0.09,
      isPopular: true,
      savings: "10%",
    },
    {
      name: "Business",
      credits: 5000,
      price: 400,
      pricePerCredit: 0.08,
      isPopular: false,
      savings: "20%",
    },
    {
      name: "Enterprise",
      credits: 10000,
      price: 700,
      pricePerCredit: 0.07,
      isPopular: false,
      savings: "30%",
    },
  ];

  const creditUsage = [
    {
      icon: FiCalendar,
      iconColor: "text-accent",
      iconBg: "bg-accent-light",
      name: "Meeting Insight",
      description: "Full research on meeting attendees",
      credits: "1 credit",
    },
    {
      icon: FiTarget,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      name: "ICP Analysis",
      description: "Per meeting analyzed for ICP fit",
      credits: "1 credit",
    },
    {
      icon: FiSun,
      iconColor: "text-accent",
      iconBg: "bg-yellow-100",
      name: "Custom Insight Question",
      description: "Per custom question answered",
      credits: "1 credit",
    },
    {
      icon: FiDatabase,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      name: "Data Enrichment Record",
      description: "Per contact enriched via CSV or API",
      credits: "1 credit",
    },
  ];

  const transactions = [
    {
      date: "Oct 18, 2025",
      description: "Data enrichment - 45 records",
      credits: -45,
      balance: 1250,
    },
    {
      date: "Oct 17, 2025",
      description: "Meeting insights - 8 meetings",
      credits: -8,
      balance: 1295,
    },
    {
      date: "Oct 17, 2025",
      description: "ICP analysis - 3 meetings",
      credits: -3,
      balance: 1303,
    },
    {
      date: "Oct 15, 2025",
      description: "Purchased Professional Package",
      credits: 2000,
      balance: 1306,
    },
    {
      date: "Oct 14, 2025",
      description: "Meeting insights - 12 meetings",
      credits: -12,
      balance: -694,
    },
  ];

  const handlePurchase = (packageName) => {
    console.log("Purchasing package:", packageName);
  };

  const handleRequestQuote = () => {
    console.log("Requesting custom quote for:", customAmount, "credits");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Credits & Billing
          </h1>
          <p className="text-gray-600">
            Manage your credits and view usage history
          </p>
        </div>

        {/* Current Balance Section */}
        <div className="bg-accent-light border border-accent rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Current Balance
              </p>
              <div className="flex items-center gap-2 mb-3">
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
                  1,250 Credits
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>234 credits used this month</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
              <FiShoppingCart className="w-4 h-4" />
              Buy Credits
            </button>
          </div>
        </div>

        {/* Auto Top-Up Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiZap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Auto Top-Up</h3>
                <p className="text-sm text-gray-600">
                  Never run out of credits
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoTopUpEnabled(!autoTopUpEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                autoTopUpEnabled ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoTopUpEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="bg-accent-light border border-accent rounded-lg p-4 flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-900">
              Auto Top-Up automatically purchases credits when your balance
              falls below a threshold you set. This ensures uninterrupted
              service and you'll never miss important meeting insights or data
              enrichment opportunities.
            </p>
          </div>
        </div>

        {/* Credit Packages Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Credit Packages
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative border-2 rounded-xl p-6 ${
                  pkg.isPopular
                    ? "border-primary bg-accent-light"
                    : "border-gray-200 bg-white"
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    ${pkg.price} / ${pkg.pricePerCredit.toFixed(2)} per credit
                  </p>
                  {pkg.savings && (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full mb-4">
                      Save {pkg.savings}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handlePurchase(pkg.name)}
                  className={`w-full mt-4 px-4 py-2.5 rounded-lg font-medium transition ${
                    pkg.isPopular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Purchase
                </button>
              </div>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Custom Amount</h3>
            <p className="text-sm text-gray-600 mb-4">
              Need a different amount? Contact us for enterprise pricing or
              custom packages.
            </p>
            <div className="flex gap-3">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter number of credits"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <button
                onClick={handleRequestQuote}
                disabled={!customAmount}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Quote
              </button>
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
                {transactions.map((transaction, index) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
