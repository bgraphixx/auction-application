"use client";

import { useMemo, useState } from "react";

type Asset = {
  id: number;
  title: string;
  category: "IT assets" | "Vehicles" | "Furniture";
  price: number;
  bids: number;
  time: string;
  condition: string;
  state: "Eligible · Live" | "Review · Vehicle";
  watched: boolean;
};

const initialAssets: Asset[] = [
  { id: 1, title: "Dell Latitude 7420", category: "IT assets", price: 485000, bids: 18, time: "03:42:18", condition: "Good", state: "Eligible · Live", watched: true },
  { id: 2, title: "Toyota Hilux 2018", category: "Vehicles", price: 7850000, bids: 31, time: "1d 06h", condition: "Used", state: "Review · Vehicle", watched: false },
  { id: 3, title: "Ergonomic chair lot", category: "Furniture", price: 210000, bids: 9, time: "2d 14h", condition: "Fair", state: "Eligible · Live", watched: false },
  { id: 4, title: "HP EliteDisplay E243", category: "IT assets", price: 95000, bids: 6, time: "4d 02h", condition: "Good", state: "Eligible · Live", watched: false },
  { id: 5, title: "Executive desk set", category: "Furniture", price: 175000, bids: 11, time: "5d 12h", condition: "Fair", state: "Eligible · Live", watched: true },
  { id: 6, title: "Lenovo ThinkPad T14", category: "IT assets", price: 340000, bids: 14, time: "6d 01h", condition: "Good", state: "Eligible · Live", watched: false },
];

const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;

function AssetArt({ category }: { category: Asset["category"] }) {
  return <div className={`asset-art ${category.toLowerCase().replace(" ", "-")}`} aria-hidden="true">
    <span className="art-shadow" />
    {category === "IT assets" && <><span className="laptop-screen" /><span className="laptop-base" /></>}
    {category === "Vehicles" && <><span className="truck-body" /><span className="truck-window" /><span className="wheel one" /><span className="wheel two" /></>}
    {category === "Furniture" && <><span className="chair-back" /><span className="chair-seat" /><span className="chair-leg one" /><span className="chair-leg two" /></>}
  </div>;
}

export default function Home() {
  const [assets, setAssets] = useState(initialAssets);
  const [section, setSection] = useState<"auctions" | "watchlist" | "myBids" | "payments" | "pickups">("auctions");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [bidOpen, setBidOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  const visibleAssets = useMemo(() => assets.filter((asset) => {
    const sectionMatch = section !== "watchlist" || asset.watched;
    const categoryMatch = category === "All" || asset.category === category;
    const queryMatch = asset.title.toLowerCase().includes(query.toLowerCase());
    return sectionMatch && categoryMatch && queryMatch;
  }), [assets, section, category, query]);

  const active = selected ?? assets[0];
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  const toggleWatch = (id: number) => {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, watched: !asset.watched } : asset));
    notify("Watchlist updated");
  };
  const makeBid = () => {
    setBidOpen(false);
    setConfirmed(true);
    setAssets((current) => current.map((asset) => asset.id === active.id ? { ...asset, price: asset.price + 15000, bids: asset.bids + 1 } : asset));
  };

  const nav = [
    ["auctions", "Auctions"], ["watchlist", "Watchlist"], ["myBids", "My bids"], ["payments", "Payments"], ["pickups", "Pickups"],
  ] as const;

  return <main>
    <header className="topbar">
      <button className="brand" onClick={() => { setSelected(null); setSection("auctions"); }} aria-label="Fewchore auctions home">
        <img src="/assets/ffcl_logo_full.png" alt="Fewchore" />
      </button>
      <div className="profile"><span>Employee</span><b>EI</b></div>
    </header>

    <aside className="sidebar">
      <p className="sidebar-label">WORKSPACE</p>
      <nav>
        {nav.map(([key, label]) => <button key={key} className={section === key ? "nav-item active" : "nav-item"} onClick={() => { setSection(key); setSelected(null); }}><i />{label}</button>)}
      </nav>
      <div className="eligibility">
        <strong>Eligible<br />to bid</strong>
        <span>Grade M3 · Lagos · Active</span>
        <p>All eligibility checks passed</p>
      </div>
    </aside>

    <section className="content">
      {!selected ? <>
        <div className="eyebrow">{section === "watchlist" ? "SAVED ASSETS" : "LIVE AUCTIONS"}</div>
        <div className="title-row">
          <div><h1>{section === "watchlist" ? "Your watchlist" : section === "myBids" ? "Your bid activity" : section === "payments" ? "Payments" : section === "pickups" ? "Pickup status" : "Company assets"}</h1><p className="subtitle">{section === "auctions" ? "Browse approved assets and place eligible bids." : "Keep track of the actions that need your attention."}</p></div>
          <div className="tool-row"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></label><button className="outline-button">Filters · 2</button><button className="outline-button hide-mobile">Ending soon</button></div>
        </div>
        {(section === "auctions" || section === "watchlist") && <div className="chips">
          {["All", "Eligible", "IT assets", "Vehicles", "Furniture"].map((item) => <button key={item} className={category === item || (item === "Eligible" && category === "All") ? "chip selected" : "chip"} onClick={() => setCategory(item === "Eligible" ? "All" : item)}>{item}{item === "All" ? " · 24" : item === "Eligible" ? " · 18" : ""}</button>)}
        </div>}
        {section === "payments" || section === "pickups" || section === "myBids" ? <StatusPanel section={section} onOpen={() => setSelected(assets[0])} /> : <>
          <div className="asset-grid">
            {visibleAssets.map((asset) => <article className="asset-card" key={asset.id} onClick={() => setSelected(asset)}>
              <AssetArt category={asset.category} />
              <div className="asset-info"><div className="asset-meta"><span className={asset.state.startsWith("Eligible") ? "live" : "review"}>{asset.state}</span><time>{asset.time}</time></div><h2>{asset.title}</h2><div className="bid-line"><span>Highest bid<strong>{money(asset.price)}</strong></span><small>{asset.bids} bids</small></div></div>
              <button className={asset.watched ? "watch-card watched" : "watch-card"} onClick={(event) => { event.stopPropagation(); toggleWatch(asset.id); }} aria-label="Toggle watchlist">{asset.watched ? "★" : "☆"}</button>
            </article>)}
          </div>
          {visibleAssets.length === 0 && <div className="empty"><span>☆</span><h2>No assets found</h2><p>Try changing your search or filters.</p></div>}
          <button className="watched-summary" onClick={() => setSection("watchlist")}><strong>{assets.filter((asset) => asset.watched).length} watched assets</strong><span>2 ending today →</span></button>
        </>}
      </> : <AuctionDetail asset={active} onBack={() => setSelected(null)} onWatch={() => toggleWatch(active.id)} onBid={() => setBidOpen(true)} />}
    </section>

    {bidOpen && <BidModal asset={active} onClose={() => setBidOpen(false)} onConfirm={makeBid} />}
    {confirmed && <Confirmation asset={active} onClose={() => setConfirmed(false)} />}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </main>;
}

function StatusPanel({ section, onOpen }: { section: string; onOpen: () => void }) {
  const items = section === "payments" ? ["No payments are due", "You will receive instructions after a winner is approved."] : section === "pickups" ? ["No pickups are scheduled", "Facilities will send you a time slot after payment verification."] : ["Dell Latitude 7420", "You are currently the highest bidder. Auction ends in 03:42:18."];
  return <div className="status-panel"><div className="status-icon">{section === "myBids" ? "⌁" : "✓"}</div><div><h2>{items[0]}</h2><p>{items[1]}</p>{section === "myBids" && <button className="primary-button small" onClick={onOpen}>View auction</button>}</div></div>;
}

function AuctionDetail({ asset, onBack, onWatch, onBid }: { asset: Asset; onBack: () => void; onWatch: () => void; onBid: () => void }) {
  const nextBid = asset.price + 15000;
  return <div className="detail-page">
    <button className="back-button" onClick={onBack}>← All auctions</button>
    <div className="detail-top"><div><p className="eyebrow">LIVE AUCTION · {asset.category === "IT assets" ? "IT ASSET · WIPE PROOF VERIFIED" : asset.category.toUpperCase()}</p><h1>{asset.title}{asset.category === "IT assets" ? " Laptop" : ""}</h1><p className="subtitle">{asset.bids} anonymous bids · Pickup: Victoria Island</p></div><div className="detail-actions"><button className="outline-button" onClick={onWatch}>{asset.watched ? "Watching" : "Watch"}</button><button className="primary-button" onClick={onBid}>Place bid</button></div></div>
    <div className="detail-layout"><div><div className="showcase"><AssetArt category={asset.category} /><div className="condition"><p>CONDITION</p><h2>{asset.condition}</h2><span>4-point check passed</span><div><b>{asset.category === "IT assets" ? "Laptop" : asset.category}</b>{asset.category === "IT assets" && <b>Sensitive</b>}</div></div></div><div className="rules"><article><h3>Payment rules</h3><p>Bank transfer only after winner approval.</p><p>Upload proof within 48 hours.</p><p>Finance verifies before pickup can be scheduled.</p></article><article><h3>Pickup rules</h3><p>Pickup from Victoria Island branch.</p><p>Facilities schedules after payment.</p><p>Employee ID required at handover.</p></article></div></div><aside className="bid-side"><div className="bid-box"><div className="bid-box-top"><p>CURRENT HIGHEST BID</p><span>Highest bid pending approval</span></div><h2>{money(asset.price)}</h2><div className="bid-stats"><div><span>Anonymous bids</span><strong>{asset.bids}</strong></div><div><span>Time left</span><strong>{asset.time}</strong></div></div><button className="primary-button full" onClick={onBid}>Bid {money(nextBid)}</button></div><div className="timeline"><h3>Anonymous bid timeline <span>Anonymous</span></h3>{[100, 80, 60].map((width, index) => <div className="time-row" key={width}><span>{["10:42", "10:21", "09:58"][index]}</span><i style={{ width: `${width}%` }} /><b>{money(asset.price - index * 15000)}</b></div>)}</div>{asset.category === "IT assets" && <div className="controls"><h3>Sensitive asset controls</h3><p>● IT wipe confirmation completed</p><p>● Certificate uploaded to audit trail</p></div>}</aside></div>
  </div>;
}

function BidModal({ asset, onClose, onConfirm }: { asset: Asset; onClose: () => void; onConfirm: () => void }) {
  const amount = asset.price + 15000;
  return <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" onClick={onClose}>×</button><div className="modal-mark">₦</div><p className="eyebrow">CONFIRM YOUR BID</p><h2>Place a bid on<br />{asset.title}</h2><div className="confirm-amount"><span>Your bid</span><strong>{money(amount)}</strong><small>Minimum increment: ₦15,000</small></div><div className="notice"><b>What happens next</b><p>Your bid is anonymous. If it is the highest when the auction ends, it will be reviewed for approval before payment instructions are sent.</p></div><button className="primary-button full" onClick={onConfirm}>Confirm bid {money(amount)}</button><button className="text-button" onClick={onClose}>Cancel</button></div></div>;
}

function Confirmation({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal confirmation"><button className="modal-close" onClick={onClose}>×</button><div className="success-mark">✓</div><p className="eyebrow">BID RECEIVED</p><h2>Your bid is now the highest</h2><p className="confirmation-copy">Your bid for {asset.title} is anonymous and has been recorded. We’ll notify you if you are outbid.</p><button className="primary-button full" onClick={onClose}>Back to auction</button></div></div>;
}
