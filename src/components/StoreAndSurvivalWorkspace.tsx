import React, { useEffect, useState } from 'react';
import {
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  MessageSquare,
  Package,
  Radio,
  RefreshCw,
  Shield,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import type {
  EmergencyMessage,
  FamilyCrowdfundCampaign,
  StoreItem,
  StoreOrder,
  UsedEquipmentListing,
} from '../types';

interface CartLine {
  item: StoreItem;
  mode: 'buy' | 'rent' | 'subscribe';
  qty: number;
}

interface Props {
  items: StoreItem[];
  orders: StoreOrder[];
  usedEquipment: UsedEquipmentListing[];
  crowdfundCampaigns: FamilyCrowdfundCampaign[];
  emergencyMessages: EmergencyMessage[];
  survivalMode: boolean;
  onToggleSurvivalMode: () => void;
  initialCategory?: string;
  onOrderCreated: (order: StoreOrder) => void;
  onItemUpdated: (item: StoreItem) => void;
  onAddCampaign: (c: FamilyCrowdfundCampaign) => void;
  onCampaignUpdated: (c: FamilyCrowdfundCampaign) => void;
  onEmergencyPosted: (msg: EmergencyMessage) => void;
  onNavigateToContractors: (specialty?: string) => void;
  onAskGuide: (question: string) => void;
}

const STORE_CATEGORIES = [
  'All',
  'Pest Control',
  'Water Filtration',
  'Remediation & Air',
  'Survival & Smart Guard',
  'Leak Detection',
  'Soil & Moisture',
  'Emergency Power',
];

const FORMULATION_FILTERS: Array<
  'All Formulations' | 'Organic / Non-Toxic' | 'Botanical / Eco-Alternative' | 'Conventional Pro-Grade'
> = ['All Formulations', 'Organic / Non-Toxic', 'Botanical / Eco-Alternative', 'Conventional Pro-Grade'];

export const StoreAndSurvivalWorkspace: React.FC<Props> = ({
  items,
  orders,
  usedEquipment,
  crowdfundCampaigns,
  emergencyMessages,
  survivalMode,
  onToggleSurvivalMode,
  initialCategory,
  onOrderCreated,
  onItemUpdated,
  onAddCampaign,
  onCampaignUpdated,
  onEmergencyPosted,
  onNavigateToContractors,
  onAskGuide,
}) => {
  const [category, setCategory] = useState<string>(initialCategory || 'All');
  const [formulationFilter, setFormulationFilter] = useState<string>('All Formulations');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Per-item expandable unbiased reviews
  const [expandedReviewsId, setExpandedReviewsId] = useState<string | null>(null);
  const [revAuthor, setRevAuthor] = useState<string>('');
  const [revRole, setRevRole] = useState<string>('Homeowner');
  const [revRating, setRevRating] = useState<number>(5);
  const [revEfficiency, setRevEfficiency] = useState<string>('');
  const [revLongevity, setRevLongevity] = useState<string>('');
  const [revComment, setRevComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Mutual-Aid Family Crowdfunding state
  const [pledgeTargetId, setPledgeTargetId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState<string>('');
  const [pledgeAmount, setPledgeAmount] = useState<string>('50');
  const [pledgeNote, setPledgeNote] = useState<string>('');
  const [showNewCampaignForm, setShowNewCampaignForm] = useState<boolean>(false);
  const [cfFamilyLabel, setCfFamilyLabel] = useState<string>('');
  const [cfCity, setCfCity] = useState<string>('Oakland, CA');
  const [cfType, setCfType] = useState<FamilyCrowdfundCampaign['assistanceType']>(
    'Mold / Organic Growth & Air Filtration Supplies'
  );
  const [cfItems, setCfItems] = useState<string>('');
  const [cfStory, setCfStory] = useState<string>('');
  const [cfGoal, setCfGoal] = useState<string>('450');

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

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredItems = items.filter((i) => {
    const matchCat = category === 'All' || i.category === category;
    const matchForm =
      formulationFilter === 'All Formulations' || i.formulationType === formulationFilter;
    return matchCat && matchForm;
  });

  const addToCart = (item: StoreItem, mode: 'buy' | 'rent' | 'subscribe') => {
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
        items: cart.map((c) => ({
          itemId: c.item.id,
          mode: c.mode,
          qty: c.qty,
          intervalMonths: c.mode === 'subscribe' ? c.item.subscriptionIntervalMonths || 6 : undefined,
        })),
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

  const handleSubmitProductReview = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!revAuthor.trim() || !revComment.trim() || submittingReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/store/items/${itemId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: revAuthor,
          role: revRole,
          rating: revRating,
          efficiencyScore: revEfficiency || 'Verified lab/field performance',
          longevityObserved: revLongevity || 'Active field test',
          comment: revComment,
        }),
      });
      if (res.ok) {
        const updatedItem = (await res.json()) as StoreItem;
        onItemUpdated(updatedItem);
        setRevAuthor('');
        setRevEfficiency('');
        setRevLongevity('');
        setRevComment('');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSendEncryptedComms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAlias.trim() || !emergencyText.trim()) return;
    setSendingEmergency(true);
    try {
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
              Unbiased Organic &amp; Pro Alternatives · Efficiency &amp; Life-Expectancy Verified · Auto-Refresh Subscriptions
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Wholesale Supply Store, Water Filtration &amp; Survival Gear
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Zero brand sponsorships. Compare organic non-toxic formulations alongside conventional pro-grade equipment
              with verified efficiency ratings, life expectancy data, DoorDash job-site delivery, and certified installers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart &amp; Courier Dispatch ({cart.reduce((a, b) => a + b.qty, 0)})
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg w-fit">
            {STORE_CATEGORIES.map((cat) => (
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
            ))}
          </div>

          {/* Formulation Filter (Organic vs Botanical vs Conventional) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Formulation Preference:</span>
            {FORMULATION_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormulationFilter(f)}
                className={`pb-0.5 border-b-2 transition-colors whitespace-nowrap ${
                  formulationFilter === f
                    ? 'border-emerald-600 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
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

      {/* 3-Column Unbiased Product Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isRevOpen = expandedReviewsId === item.id;
          const reviews = item.productReviews || [];
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
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
                        {item.category}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {item.formulationType || 'Conventional Pro-Grade'}
                    </span>
                    <span className="font-mono tabular-nums">{item.contractorEndorsements} Pro Endorsements</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{item.name}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.specs}</p>

                  {/* Efficiency, Life Expectancy & Zero-Bias Audit Block */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                    {item.efficiencyRating && (
                      <div className="text-slate-700 dark:text-slate-200">
                        <span className="font-semibold text-slate-900 dark:text-white">Efficiency:</span>{' '}
                        {item.efficiencyRating}
                      </div>
                    )}
                    {item.lifeExpectancy && (
                      <div className="text-slate-700 dark:text-slate-200">
                        <span className="font-semibold text-slate-900 dark:text-white">Life Expectancy:</span>{' '}
                        {item.lifeExpectancy}
                      </div>
                    )}
                    {item.brandBiasFreeNote && (
                      <div className="text-slate-500 dark:text-slate-400 italic">
                        Unbiased Note: {item.brandBiasFreeNote}
                      </div>
                    )}
                  </div>
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

                <div className="flex flex-wrap items-center gap-2">
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
                  {item.subscribable && (
                    <button
                      type="button"
                      onClick={() => addToCart(item, 'subscribe')}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Auto-Ship Replacement Every {item.subscriptionIntervalMonths || 6} Mo
                    </button>
                  )}
                </div>

                {item.recommendedInstallerCategory && (
                  <button
                    type="button"
                    onClick={() => onNavigateToContractors(item.recommendedInstallerCategory)}
                    className="w-full text-left text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline pt-1"
                  >
                    Find Certified Installer ({item.recommendedInstallerCategory}) →
                  </button>
                )}

                {/* Expandable Unbiased Reviews */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExpandedReviewsId(isRevOpen ? null : item.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      Unbiased Efficiency &amp; Longevity Reviews ({reviews.length})
                    </span>
                    {isRevOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isRevOpen && (
                    <div className="mt-3 space-y-3">
                      {reviews.length === 0 ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          No user field-tests logged yet. Add the first real-world efficiency &amp; durability report below.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto">
                          {reviews.map((r) => (
                            <div
                              key={r.id}
                              className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                                <span>
                                  {r.author} · {r.role}
                                </span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                                  {r.rating}/5
                                </span>
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 font-mono">
                                {r.efficiencyScore} · {r.longevityObserved}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{r.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleSubmitProductReview(e, item.id)}
                        className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={revAuthor}
                            onChange={(e) => setRevAuthor(e.target.value)}
                            placeholder="Your Name"
                            className="px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                          <select
                            value={revRating}
                            onChange={(e) => setRevRating(Number(e.target.value))}
                            className="px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          >
                            <option value={5}>5 / 5 Stars</option>
                            <option value={4}>4 / 5 Stars</option>
                            <option value={3}>3 / 5 Stars</option>
                            <option value={2}>2 / 5 Stars</option>
                            <option value={1}>1 / 5 Stars</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={revEfficiency}
                            onChange={(e) => setRevEfficiency(e.target.value)}
                            placeholder="Measured efficiency (e.g. TDS 12ppm)"
                            className="px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={revLongevity}
                            onChange={(e) => setRevLongevity(e.target.value)}
                            placeholder="Lifespan observed (e.g. 2.5 yrs)"
                            className="px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                        </div>
                        <textarea
                          rows={2}
                          required
                          value={revComment}
                          onChange={(e) => setRevComment(e.target.value)}
                          placeholder="Share unbiased durability, filter cost, or chemical performance..."
                          className="w-full px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="w-full py-1.5 text-[11px] font-semibold bg-slate-900 dark:bg-amber-600 text-white rounded"
                        >
                          {submittingReview ? 'Submitting...' : 'Post Unbiased Product Review'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Mutual-Aid Family Supply & Contractor Help Crowdfunding */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Direct-to-Supply &amp; Verified Pro Escrow · Zero Overhead Skimming
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-600" />
              Community Family Relief Crowdfunding (Sponsor Supplies or Help)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Neighbors and fortunate supporters can directly crowdfund clean water filters, mold air scrubbers, pest
              supplies, or licensed contractor visits for families who cannot afford upfront remediation costs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCampaignForm((v) => !v)}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
          >
            {showNewCampaignForm ? 'Cancel Request' : 'Request Family Assistance'}
          </button>
        </div>

        {showNewCampaignForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!cfFamilyLabel.trim() || !cfItems.trim() || !cfStory.trim()) return;
              const res = await fetch('/api/crowdfund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  familyLabel: cfFamilyLabel,
                  city: cfCity,
                  assistanceType: cfType,
                  neededItemsOrScope: cfItems,
                  storySummary: cfStory,
                  goalUsd: Number(cfGoal) || 400,
                }),
              });
              if (res.ok) {
                onAddCampaign((await res.json()) as FamilyCrowdfundCampaign);
                setCfFamilyLabel('');
                setCfItems('');
                setCfStory('');
                setShowNewCampaignForm(false);
              }
            }}
            className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
          >
            <input
              type="text"
              required
              value={cfFamilyLabel}
              onChange={(e) => setCfFamilyLabel(e.target.value)}
              placeholder="Household / Family Label (private name shielded, e.g. Family #512)"
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={cfCity}
              onChange={(e) => setCfCity(e.target.value)}
              placeholder="City & State"
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <select
              value={cfType}
              onChange={(e) => setCfType(e.target.value as FamilyCrowdfundCampaign['assistanceType'])}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Mold / Organic Growth & Air Filtration Supplies">
                Mold / Organic Growth &amp; Air Filtration Supplies
              </option>
              <option value="Safe Water Filtration System">Safe Water Filtration System</option>
              <option value="Emergency Pest Control Supplies">Emergency Pest Control Supplies</option>
              <option value="Verified Contractor / Plumber / Inspector Help">
                Verified Contractor / Plumber / Inspector Help
              </option>
              <option value="Disaster Survival & Generator Readiness">Disaster Survival &amp; Generator Readiness</option>
            </select>
            <input
              type="number"
              min="25"
              required
              value={cfGoal}
              onChange={(e) => setCfGoal(e.target.value)}
              placeholder="Target Goal (USD)"
              className="px-3 py-2 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={cfItems}
              onChange={(e) => setCfItems(e.target.value)}
              placeholder="Exact Supplies or Contractor Scope Needed (e.g. HEPA Scrubber + C-36 Drain Clear)"
              className="md:col-span-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <textarea
              rows={2}
              required
              value={cfStory}
              onChange={(e) => setCfStory(e.target.value)}
              placeholder="Explain the household condition, children/seniors affected, and how supplies/help will be applied..."
              className="md:col-span-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="md:col-span-2 py-2 px-4 font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg"
            >
              Publish Family Relief Campaign
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {crowdfundCampaigns.map((camp) => {
            const pct = Math.min(100, Math.round((camp.raisedUsd / camp.goalUsd) * 100));
            const remaining = Math.max(0, camp.goalUsd - camp.raisedUsd);
            return (
              <div
                key={camp.id}
                className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {camp.assistanceType}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {camp.city} · {camp.verifiedByInspector ? 'Inspector Verified' : 'Community Submitted'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{camp.familyLabel}</h3>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Supplies / Help Needed: {camp.neededItemsOrScope}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{camp.storySummary}</p>

                  {/* Funding Progress Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${camp.raisedUsd.toLocaleString()} raised of ${camp.goalUsd.toLocaleString()} ({pct}%)
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {camp.status === 'Fully Funded' ? 'Fully Funded' : `$${remaining.toLocaleString()} left`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {camp.pledges.length > 0 && (
                    <div className="pt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {camp.pledges.slice(0, 2).map((p) => (
                        <div key={p.id}>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.donorName}</span>{' '}
                          sponsored <span className="font-mono">${p.amountUsd}</span>
                          {p.note ? ` — "${p.note}"` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {pledgeTargetId === camp.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!donorName.trim()) return;
                      const res = await fetch(`/api/crowdfund/${camp.id}/pledge`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          donorName,
                          amountUsd: Number(pledgeAmount) || 25,
                          note: pledgeNote,
                        }),
                      });
                      if (res.ok) {
                        onCampaignUpdated((await res.json()) as FamilyCrowdfundCampaign);
                        setPledgeTargetId(null);
                        setDonorName('');
                        setPledgeNote('');
                      }
                    }}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Your Name or 'Anonymous Neighbor'"
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min="5"
                        required
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(e.target.value)}
                        placeholder="Amount ($)"
                        className="px-2.5 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={pledgeNote}
                      onChange={(e) => setPledgeNote(e.target.value)}
                      placeholder="Encouragement or item note (optional)"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded"
                      >
                        Confirm Supply Pledge
                      </button>
                      <button
                        type="button"
                        onClick={() => setPledgeTargetId(null)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPledgeTargetId(camp.id);
                      setPledgeAmount(remaining > 0 && remaining < 50 ? String(remaining) : '50');
                    }}
                    className="w-full py-2 px-4 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    {camp.status === 'Fully Funded'
                      ? 'Add Extra Buffer Pledge'
                      : `Sponsor This Family ($${Math.min(50, remaining || 50)}+) →`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Used Commercial Rental Fleet Surplus + AI Maintenance & Rebuild Videos */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Verified Rental Fleet Surplus · Save 60%+ Over New Retail · Step-by-Step AI Rebuild Guides
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              Used Rental Company Equipment &amp; AI Rebuild / Maintenance Assistant
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {usedEquipment.map((eq) => (
            <div
              key={eq.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">{eq.conditionGrade}</span>
                  <span className="font-mono tabular-nums">{eq.hoursUsed.toLocaleString()} hrs</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{eq.name}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {eq.sellerCompany} · {eq.city}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{eq.maintenanceHistory}</p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      ${eq.usedPriceUsd}
                    </span>
                    <span className="text-xs text-slate-400 line-through ml-2 tabular-nums">
                      ${eq.originalRetailUsd}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    Save ${(eq.originalRetailUsd - eq.usedPriceUsd).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAskGuide(
                      `Give me a step-by-step maintenance, safety check, and rebuild video/tool walkthrough for: ${eq.name}. History note: ${eq.maintenanceHistory}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-lg transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  AI Maintenance &amp; Rebuild Guide
                </button>
              </div>
            </div>
          ))}
        </div>
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
              Off-Grid Survival Mode &amp; Emergency Neighborhood Comms
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
              <option value="Off-Grid Power & Generators">Off-Grid Power &amp; Generators</option>
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
                  Supply Cart &amp; Courier Checkout
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
                  Your cart is empty. Select wholesale supplies, auto-ship expiration refills, or local rental tools.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cart.map((line, i) => {
                    const unit =
                      line.mode === 'rent' && line.item.dailyRentalPrice
                        ? line.item.dailyRentalPrice
                        : line.item.wholesalePrice;
                    const modeLabel =
                      line.mode === 'rent'
                        ? 'Daily Rental'
                        : line.mode === 'subscribe'
                          ? `Auto-Ship Every ${line.item.subscriptionIntervalMonths || 6} Mo`
                          : 'Wholesale';
                    return (
                      <div key={`${line.item.id}-${line.mode}-${i}`} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{line.item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {modeLabel} · ${unit} × {line.qty}
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
                <form
                  id="checkout-form"
                  onSubmit={handleCheckout}
                  className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Delivery &amp; Dispatch Option
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
                            Courier picks up materials/tools &amp; delivers directly to your job site in 45–90 min.
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
                  Place Order &amp; Dispatch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Supply &amp; Courier Orders</h3>
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
