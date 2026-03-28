# HeroStock.AI x Monarch Holdings Ltd. x Quant Fintech Limited — Partnership Strategy & API Integration Requirements

**Date:** March 16, 2026
**From:** HeroStock.AI (EduInt BD)
**To:** Monarch Holdings Ltd. (DSE TREC Holder & Brokerage) & Quant Fintech Limited (Trading Platform & OMS Provider)
**Subject:** Tri-Party API Integration Partnership for DSE Trading, Market Data & Investor Education Platform

---

## PAGE 1: STRATEGIC OVERVIEW

### 1.1 Who We Are

**HeroStock.AI** is Bangladesh's emerging investor education and portfolio management platform targeting first-time retail investors on the Dhaka Stock Exchange (DSE). We are building a full-stack fintech experience that combines:

- **Investor Education** — Structured learning modules, quizzes, and certificates (BSEC compliance, fundamental analysis, technical analysis, Islamic finance/Halal investing)
- **AI-Powered Onboarding** — Intelligent agent that guides new investors through KYC, risk profiling, and account setup
- **Social Intelligence** — Automated social media aggregation (Twitter, Reddit, YouTube, Facebook, TikTok) scanning Bangladesh stock market sentiment every 30 minutes
- **Portfolio Tracking & Analysis** — Real-time portfolio valuation, sector allocation, P&L tracking
- **Demo Trading** — Paper trading environment for learners before going live
- **Marketing & Referral Engine** — Gamified referral system, campaign management, and community growth tools

### 1.2 Partner Roles

**Monarch Holdings Ltd.** (monarchholdingsbd.com) — DSE TREC holder providing regulated brokerage services: BO account management, trade execution, settlement, IPO processing, custody services, and BSEC compliance. Monarch is the licensed broker through which all trades are executed.

**Quant Fintech Limited** (quantfintech.ai) — Technology partner providing OMS (Order Management System), FIX protocol connectivity, and trading platform infrastructure (qTrader). Quant powers the technical layer that connects our platform to DSE/CSE via their certified OMS.

### 1.3 What We Need from Monarch + Quant

We are **not** building a brokerage or trading engine. We need Monarch as our **licensed execution partner** and Quant as our **technology bridge** — together providing the regulated, real-time infrastructure that powers our user-facing platform. Specifically:

| Capability | Priority | Description |
|---|---|---|
| Real-Time Market Data | P0 | Live prices, indices (DSEX/DSES/DS30), market depth |
| Historical Price Data | P0 | OHLCV candles (1min, 5min, 1hr, 1D) for charting |
| Fundamental Data | P1 | EPS, P/E, NAV, dividend history, financial statements |
| Order Execution API | P1 | Buy/sell order placement via Quant OMS on behalf of Monarch-verified users |
| Account/KYC Bridge | P2 | BO account creation via Monarch, KYC status sync |
| Portfolio Sync | P1 | Real-time holdings, cash balance, transaction history |
| IPO Subscription API | P2 | Apply for IPOs on behalf of users |
| News/Announcements Feed | P2 | Official DSE filings, corporate announcements |

### 1.4 Value Proposition for Monarch & Quant

**For Monarch Holdings Ltd.:**
- **New Client Acquisition** — HeroStock.AI brings educated, KYC-ready investors directly into Monarch BO accounts. Our learning funnel converts curious users into active traders.
- **Reduced Support Load** — Users arrive pre-educated on market basics, order types, and risk management through our certification program.
- **Increased Trading Volume** — Social intelligence, AI-powered stock analysis, and community features keep users engaged and trading daily.
- **Young Demographic** — Access to first-time investors (18-35) who are mobile-first and underserved by traditional brokers.

**For Quant Fintech Limited:**
- **Platform Showcase** — HeroStock.AI becomes a flagship consumer-facing product built on Quant's OMS infrastructure.
- **API Revenue** — Monthly API licensing fee or per-transaction charges for OMS access.
- **Market Expansion** — Proves Quant's technology can power B2C fintech apps, not just broker back-offices.
- **Revenue Share Model** — Commission sharing on trades executed through our platform, premium subscription tiers.

---

## PAGE 2: TECHNICAL API REQUIREMENTS

### 2.1 Real-Time Market Data API

**Endpoint Requirements:**

```
GET /api/v1/market/live-prices
  → Returns: symbol, ltp, high, low, open, close, change, change_pct, volume, value, trades
  → Refresh: WebSocket preferred, or REST polling at 5-second intervals
  → Coverage: All DSE-listed instruments (400+ stocks)

GET /api/v1/market/indices
  → Returns: DSEX, DSES, DS30 current values, change, change_pct
  → Refresh: Real-time or 10-second polling

GET /api/v1/market/depth/:symbol
  → Returns: Top 5 bid/ask levels with quantity
  → Use case: Order book visualization in trading page

WebSocket /ws/market
  → Subscribe to symbol-level price ticks
  → Subscribe to index updates
  → Subscribe to trade notifications
```

**Data Format:** JSON. We need consistent field naming across endpoints. Preferred schema:

```json
{
  "symbol": "GP",
  "ltp": 345.50,
  "high": 348.00,
  "low": 342.10,
  "open": 343.00,
  "close_prev": 344.20,
  "change": 1.30,
  "change_pct": 0.3776,
  "volume": 125430,
  "value_traded": 43250000,
  "trades": 1245,
  "timestamp": "2026-03-16T10:30:00+06:00"
}
```

### 2.2 Historical Data API

```
GET /api/v1/history/:symbol?interval=1D&from=2025-01-01&to=2026-03-16
  → Returns: Array of OHLCV candles
  → Intervals needed: 1min, 5min, 15min, 1hr, 1D, 1W, 1M
  → Use case: TradingView-style charts, backtesting, technical indicators

GET /api/v1/fundamentals/:symbol
  → Returns: EPS, P/E, P/B, NAV, market_cap, sector, 52w_high, 52w_low,
             dividend_yield, shares_outstanding, free_float
  → Refresh: Daily

GET /api/v1/financials/:symbol
  → Returns: Income statement, balance sheet, cash flow (quarterly + annual)
  → Use case: Fundamental analysis in learning modules
```

### 2.3 Trading / Order Execution API

```
POST /api/v1/orders
  → Body: { symbol, side: "buy"|"sell", quantity, price, order_type: "limit"|"market", user_token }
  → Returns: order_id, status, filled_qty, avg_price
  → Auth: OAuth2 or API key per user (issued after KYC)

GET /api/v1/orders/:order_id
  → Returns: Order status, fill history

DELETE /api/v1/orders/:order_id
  → Cancel pending order

GET /api/v1/portfolio
  → Returns: Holdings array with symbol, qty, avg_cost, current_value, unrealized_pnl
  → Also: cash_balance, total_value, margin_used

GET /api/v1/transactions
  → Returns: Trade history, deposits, withdrawals
  → Pagination: cursor-based or offset
```

### 2.4 Authentication & User Bridge

```
POST /api/v1/auth/register
  → Create trading account linked to HeroStock user
  → Body: { herostock_user_id, full_name, email, phone, nid_number }

POST /api/v1/auth/kyc-status
  → Sync KYC verification status back to HeroStock
  → Returns: { status: "pending"|"verified"|"rejected", bo_account_id }

POST /api/v1/auth/token
  → Exchange HeroStock session for Quant API token
  → OAuth2 authorization_code flow preferred
```

### 2.5 Integration Architecture

```
┌─────────────────────┐       ┌────────────────────┐       ┌──────────────────┐
│   HeroStock.AI      │       │  Quant Fintech Ltd │       │ Monarch Holdings │
│   (Frontend + BFF)  │◄─────►│  (OMS + Tech)      │◄─────►│ (Licensed Broker)│
│                     │ REST/ │                    │  FIX  │                  │
│ • React SPA         │  WS   │ • qTrader OMS      │Protocol│ • TREC Holder    │
│ • Supabase Backend  │       │ • Market Data Feed │       │ • BO Accounts    │
│ • Edge Functions    │       │ • Order Routing    │       │ • Settlement     │
│ • Social Scanner    │       │ • WebSocket Server │       │ • Custody (CDBL) │
│ • Learning LMS      │       │ • API Gateway      │       │ • IPO Processing │
│ • AI Onboarding     │       │                    │       │ • BSEC Compliance│
└─────────────────────┘       └────────────────────┘       └──────────────────┘
         │                              │                          │
         └──────────── Supabase DB ─────┘                          │
              (user profiles, learning                    DSE / CSE Exchange
               progress, social posts)
```

**Our Supabase Edge Functions** will act as a Backend-for-Frontend (BFF) layer — calling Quant's OMS APIs server-side, never exposing API keys to the browser. Orders flow: HeroStock → Quant OMS → Monarch → DSE.

---

## PAGE 3: COMMUNICATION PLAN & NEXT STEPS

### 3.1 What We Need from Quant — Immediate (Week 1-2)

| # | Deliverable | Details |
|---|---|---|
| 1 | **API Documentation** | Full Swagger/OpenAPI spec for all available endpoints |
| 2 | **Sandbox Environment** | Test API with mock data for development and demo trading |
| 3 | **API Keys** | Sandbox credentials (API key + secret) for HeroStock dev team |
| 4 | **WebSocket Spec** | Connection URL, subscription format, message schema |
| 5 | **Rate Limits** | Requests per second/minute per endpoint |
| 6 | **Data Dictionary** | Complete list of available fields, data types, update frequencies |

### 3.2 What We Provide to Quant — Immediate

| # | Deliverable | Details |
|---|---|---|
| 1 | **User Flow Diagrams** | How users onboard, learn, and start trading on our platform |
| 2 | **Webhook Endpoints** | URLs for Quant to push order fills, KYC updates, price alerts |
| 3 | **Branding Guidelines** | How Quant is presented to our users (co-branded or white-label) |
| 4 | **Test Users** | 5 test accounts for Quant to verify integration end-to-end |
| 5 | **Traffic Projections** | Expected API call volumes at launch and 3/6/12 month milestones |

### 3.3 Integration Milestones

| Phase | Timeline | Scope | Dependencies |
|---|---|---|---|
| **Phase 1: Data** | Week 1-3 | Replace our DSE scraper with Quant's real-time data API. Display live prices, indices, and charts powered by Quant. | API docs, sandbox keys |
| **Phase 2: Portfolio** | Week 3-5 | Portfolio sync — users see real holdings in HeroStock UI. Read-only initially. | Auth bridge, portfolio API |
| **Phase 3: Trading** | Week 5-8 | Order placement from HeroStock trading page. Buy/sell with limit orders. | Order API, KYC bridge, compliance review |
| **Phase 4: Advanced** | Week 8-12 | Market depth, IPO subscriptions, margin info, advanced order types, price alerts via WebSocket. | WebSocket, IPO API |

### 3.4 Commercial Discussion Points

- **Revenue Model:** Commission sharing on executed trades? Flat monthly API fee? Hybrid?
- **SLA Requirements:** 99.9% uptime for data APIs during market hours (Sun-Thu 10:00-14:30 BST)
- **Data Ownership:** HeroStock retains user data (profiles, learning, social). Quant retains trading data. Shared: portfolio/order data accessible to both.
- **Compliance:** BSEC regulatory requirements for API-based trading. Who holds the broker license? Is Quant providing a white-label broker service or acting as executing broker?
- **Exclusivity:** Is this partnership exclusive or can HeroStock integrate with other data/broker providers?

### 3.5 Key Contacts & Communication

| Role | HeroStock.AI | Quant Fintech Ltd. | Monarch Holdings Ltd. |
|---|---|---|---|
| **Project Lead** | [Your Name] | [TBD] | [TBD] |
| **Technical Lead** | [Dev Lead] | [TBD] | [TBD] |
| **Business/Commercial** | [BD Lead] | [TBD] | [TBD] |

**Communication Channels:**
- **Weekly Sync:** 30-min video call every Sunday (pre-market) to review integration progress
- **Slack/Teams Channel:** Shared channel for real-time technical questions
- **Email:** Formal communications, contracts, and milestone sign-offs
- **Issue Tracker:** Shared GitHub/Linear project for bug reports and feature requests

### 3.6 Immediate Action Items

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | Share this strategy note with Quant technical team | HeroStock | Today |
| 2 | Schedule kickoff call | Both | This week |
| 3 | Quant provides API documentation + sandbox access | Quant | Week 1 |
| 4 | HeroStock builds data adapter layer (Supabase Edge Function) | HeroStock | Week 2 |
| 5 | First live data flowing through Quant API on staging | Both | Week 3 |
| 6 | Sign partnership / API usage agreement | Both | Week 2 |

---

*This document is confidential and intended for discussion between HeroStock.AI (EduInt BD), Monarch Holdings Ltd., and Quant Fintech Limited only.*

**HeroStock.AI** — Empowering Bangladesh's Next Generation of Investors
**Monarch Holdings Ltd.** — monarchholdingsbd.com
**Quant Fintech Limited** — quantfintech.ai | quantbd.com
