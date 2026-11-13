import React, { useState } from 'react';
import {
  Bug,
  CheckCircle2,
  Lock,
  Package,
  Radio,
  Shield,
  ShoppingBag,
  Trash2,
  Truck,
  Zap,
} from 'lucide-react';
import type { EmergencyMessage, StoreItem, StoreOrder } from '../types';

interface CartLine {
  item: StoreItem;
  mode: 'buy' | 'rent';
  qty: number;
}

interface Props {
  items: StoreItem[];
  orders: StoreOrder[];
  emergencyMessages: EmergencyMessage[];
  survivalMode: boolean;
  onToggleSurvivalMode: () => void;
  initialCategory?: string;
  onOrderCreated: (order: StoreOrder) => void;
  onEmergencyPosted: (msg: EmergencyMessage) => void;
}

export const StoreAndSurvivalWorkspace: React.FC<Props> = ({
  items,
  orders,
  emergencyMessages,
  survivalMode,
  onToggleSurvivalMode,
  initialCategory,
  onOrderCreated,
  onEmergencyPosted,
}) => {
  const [category, setCategory] = useState<string>(initialCategory || 'All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Checkout state (includes DoorDash Job-Site Delivery!)
  const [customerName, setCustomerName] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<StoreOrder['deliveryMethod']>('doordash_jobsite');
  const [jobSiteNotes, setJobSiteNotes] = useState<string>('');
  const [orderConfirmation, setOrderConfirmation] = useState<StoreOrder | null>(null);

  // Survival / Off-Grid Encrypted Emergency Comms
  const [channel, setChannel] = useState<EmergencyMessage['channel']>('Regional Flood Mesh');
  const [senderAlias, setSenderAlias] = useState<string>('');
  const [emergencyText, setEmergencyText] = useState<string>('');
  const [sendingEmergency, setSendingEmergency] = useState<boolean>(false);

  const filteredItems = items.filter((i) => category === 'All' || i.category === category);

  const addToCart = (item: StoreItem, mode: 'buy' | 'rent') => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id && l.mode === mode);
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { item, mode, qty: 1 }];
    });
    setShowCartDrawer(true);
  };

  const cartSubtotal = cart.reduce((acc, l) => {
    const unit =
      l.mode === 'rent' && l.item.rentable && l.item.dailyRentalPrice
        ? l.item.dailyRentalPrice
        : l.item.wholesalePrice;
    return acc + unit * l.qty;
  }, 0);
  const dispatchFee = deliveryMethod === 'doordash_jobsite' && cart.length > 0 ? 18 : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length || !customerName.trim() || !shippingAddress.trim()) return;
    const res = await fetch('/api/store/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        shippingAddress,
        deliveryMethod,
        jobSiteNotes,
        items: cart.map((c) => ({ itemId: c.item.id, mode: c.mode, qty: c.qty })),
      }),
    });
    if (res.ok) {
      const order = (await res.json()) as StoreOrder;
      onOrderCreated(order);
      setOrderConfirmation(order);
      setCart([]);
      setShowCartDrawer(false);
    }
  };

  const handleSendEncryptedComms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAlias.trim() || !emergencyText.trim()) return;
    setSendingEmergency(true);
    try {
      // Client-side Web Crypto AES-GCM encryption signature
      let cipherTag = '';
      if (window.crypto?.subtle) {
        const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder().encode(emergencyText);
        const buf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
        const bytes = Array.from(new Uint8Array(buf)).slice(0, 10);
        cipherTag = `AES-GCM:${bytes.map((b) => b.toString(16).padStart(2, '0')).join('')}`;
      }
      const res = await fetch('/api/emergency-comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAlias,
          channel,
          plaintextPreview: emergencyText,
          encryptedPayload: cipherTag,
        }),
      });
      if (res.ok) {
        onEmergencyPosted((await res.json()) as EmergencyMessage);
        setEmergencyText('');
      }
    } finally {
      setSendingEmergency(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Storefront Header & Cart Action */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Wholesale Dropshipping · DoorDash Job-Site Courier · Restoration Equipment Rental
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Wholesale Supply Store, Pest Control & Job-Site Courier
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart & Courier Dispatch ({cart.reduce((a, b) => a + b.qty, 0)})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg w-fit">
          {['All', 'Pest Control', 'Leak Detection', 'Remediation & Air', 'Soil & Moisture', 'Emergency Power'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {orderConfirmation && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Order {orderConfirmation.id} Confirmed · ${orderConfirmation.totalUsd.toLocaleString()}
              </div>
              <div>
                {orderConfirmation.status} → {orderConfirmation.shippingAddress}
              </div>
            </div>
            <button type="button" onClick={() => setOrderConfirmation(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* 3-Column Product Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
          >
            <div>
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
                    <Bug className="w-10 h-10 text-amber-600 mb-2" />
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{item.sku}</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1">
                      Wholesale {item.category}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.category}</span>
                  <span className="font-mono tabular-nums">{item.contractorEndorsements} Pro Endorsements</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{item.name}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.specs}</p>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3">
              <div className="flex items-baseline justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                <div>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${item.wholesalePrice}
                  </span>
                  <span className="text-xs text-slate-400 line-through ml-2 tabular-nums">${item.retailPrice}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {item.inStock} in stock
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addToCart(item, 'buy')}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  Buy Wholesale
                </button>
                {item.rentable && item.dailyRentalPrice && (
                  <button
                    type="button"
                    onClick={() => addToCart(item, 'rent')}
                    className="py-2 px-3 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap tabular-nums"
                  >
                    Rent ${item.dailyRentalPrice}/d
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Off-Grid / Survival Mode & Encrypted Emergency Mesh Comms */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              AES-GCM Client Encryption · Low-Power Contrast Mode · Off-Grid Generator Readiness
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-600" />
              Off-Grid Survival Mode & Emergency Neighborhood Comms
            </h2>
          </div>

          <button
            type="button"
            onClick={onToggleSurvivalMode}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              survivalMode
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {survivalMode ? 'Exit Off-Grid Survival Mode' : 'Activate Off-Grid Survival Mode'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            {emergencyMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {msg.senderAlias} · {msg.channel}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    <Lock className="w-3 h-3" />
                    {msg.encryptedPayload.slice(0, 22)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{msg.plaintextPreview}</p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendEncryptedComms} className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Broadcast Encrypted Emergency Update
            </div>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as EmergencyMessage['channel'])}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Regional Flood Mesh">Regional Flood Mesh</option>
              <option value="Off-Grid Power & Generators">Off-Grid Power & Generators</option>
              <option value="Structural SOS">Structural SOS</option>
              <option value="Tenant Habitability">Tenant Habitability</option>
            </select>
            <input
              type="text"
              required
              value={senderAlias}
              onChange={(e) => setSenderAlias(e.target.value)}
              placeholder="Callsign / Neighborhood Block"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <textarea
              rows={3}
              required
              value={emergencyText}
              onChange={(e) => setEmergencyText(e.target.value)}
              placeholder="Share road closures, sump/generator fuel availability, or urgent shelter/water alerts..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={sendingEmergency}
              className="w-full py-2 px-4 text-xs font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-amber-500"
            >
              {sendingEmergency ? 'Encrypting & Dispatching...' : 'Encrypt & Send Mesh Alert'}
            </button>
          </form>
        </div>
      </section>

      {/* Cart & DoorDash Job-Site Courier Slide-Over Drawer */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  Supply Cart & Courier Checkout
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCartDrawer(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Close
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">
                  Your cart is empty. Select wholesale supplies or local rental tools to dispatch to your job site.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cart.map((line, i) => {
                    const unit =
                      line.mode === 'rent' && line.item.dailyRentalPrice
                        ? line.item.dailyRentalPrice
                        : line.item.wholesalePrice;
                    return (
                      <div key={`${line.item.id}-${line.mode}-${i}`} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{line.item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {line.mode === 'rent' ? 'Daily Rental' : 'Wholesale'} · ${unit} × {line.qty}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {cart.length > 0 && (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Delivery & Dispatch Option
                    </label>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === 'doordash_jobsite'}
                          onChange={() => setDeliveryMethod('doordash_jobsite')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-amber-600" />
                            DoorDash Same-Day Job-Site Delivery (+$18)
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Courier picks up materials/tools & delivers directly to your job site in 45–90 min.
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === 'wholesale_shipping'}
                          onChange={() => setDeliveryMethod('wholesale_shipping')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Standard Wholesale Dropship ($0)
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">2–3 business day freight/parcel.</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={deliveryMethod === 'restorer_pickup'}
                          onChange={() => setDeliveryMethod('restorer_pickup')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Local Restorer Counter Pickup ($0)
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Recipient / Site Foreman Name"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Job-Site or Home Street Address"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={jobSiteNotes}
                    onChange={(e) => setJobSiteNotes(e.target.value)}
                    placeholder="Gate code, loading bay, or drop instructions for DoorDash courier"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </form>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Items Subtotal</span>
                  <span className="font-mono tabular-nums">${cartSubtotal.toLocaleString()}</span>
                </div>
                {dispatchFee > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>DoorDash Job-Site Courier</span>
                    <span className="font-mono tabular-nums">${dispatchFee}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">${(cartSubtotal + dispatchFee).toLocaleString()}</span>
                </div>
                <button
                  type="submit"
                  form="checkout-form"
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                >
                  Place Order & Dispatch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Supply & Courier Orders</h3>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {orders.map((o) => (
              <div key={o.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-mono font-semibold">{o.id}</span> · {o.status} → {o.shippingAddress}
                </span>
                <span className="font-mono font-bold tabular-nums">${o.totalUsd.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
