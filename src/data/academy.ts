// ═══════════════════════════════════════════════════════════
// Hero Academy — Bangladesh Stock Market Education Content
// ═══════════════════════════════════════════════════════════

export interface AcademyLesson {
  id: string;
  title: string;
  duration: number; // minutes
  content: string;
}

export interface AcademyCourse {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  isRequired: boolean;
  order: number;
  lessons: AcademyLesson[];
}

export const ACADEMY_COURSES: AcademyCourse[] = [
  // ── COURSE 1: Stock Market Basics ──
  {
    id: 'basics',
    title: 'Stock Market Basics',
    description: 'Learn the fundamentals of how the stock market works, what stocks are, and how trading happens on the DSE.',
    icon: '📚',
    isRequired: true,
    order: 1,
    lessons: [
      {
        id: 'basics-1',
        title: 'What is a Stock?',
        duration: 5,
        content: `## What is a Stock?

A **stock** (or share) represents a small piece of ownership in a company. When you buy a stock of a company listed on the Dhaka Stock Exchange (DSE), you become a partial owner of that company.

### Why Do Companies Issue Stocks?

Companies need money to grow — to build factories, hire people, or develop new products. Instead of borrowing from banks, they can sell small pieces of the company to the public. This is called **going public** or an **IPO (Initial Public Offering)**.

### Example: A Bangladeshi Company

Imagine **BRAC Bank** wants to raise ৳500 crore to expand. They divide the company into 1 crore shares and sell each at ৳500. When you buy 100 shares, you own a tiny fraction of BRAC Bank.

### What Do You Get as a Shareholder?

- **Dividends**: Some companies share profits with shareholders (e.g., ৳5 per share per year)
- **Capital Gains**: If the stock price rises from ৳500 to ৳600, your 100 shares gained ৳10,000
- **Voting Rights**: As an owner, you can vote on company decisions at the AGM

### Key Terms

| Term | Meaning |
|------|---------|
| **Share** | One unit of ownership |
| **Shareholder** | A person who owns shares |
| **Dividend** | Company's profit paid to shareholders |
| **Capital Gain** | Profit from selling at a higher price |
| **Market Cap** | Total value of all shares combined |

### Try It Yourself

Go to the **Market** page and look at any stock. Notice the price — that's what one share costs right now. In the next lesson, you'll learn how prices move.`,
      },
      {
        id: 'basics-2',
        title: 'How Stock Prices Move',
        duration: 6,
        content: `## How Stock Prices Move

Stock prices change every second during market hours. But why?

### Supply and Demand

It's simple economics:
- **More buyers than sellers** → Price goes **up** 📈
- **More sellers than buyers** → Price goes **down** 📉

If 1,000 people want to buy BEXIMCO shares but only 200 are selling, the price rises because demand exceeds supply.

### What Influences Demand?

1. **Company Performance**: Good earnings report → more buyers → price rises
2. **Industry News**: Government announces new pharma policy → pharma stocks move
3. **Economic Factors**: Interest rate changes, inflation, GDP growth
4. **Market Sentiment**: Fear or greed can drive prices up or down quickly
5. **Global Events**: Oil prices, trade wars, pandemic effects

### Reading Price Changes on DSE

On the HeroStock Market page, you see:
- **LTP (Last Traded Price)**: The most recent price someone paid
- **Change**: How much the price moved from yesterday's close
- **Change %**: The percentage change (e.g., +2.5% means it went up 2.5%)
- **Volume**: How many shares were traded today

### Colors in the Market

- 🟢 **Green** = Price went UP from yesterday
- 🔴 **Red** = Price went DOWN from yesterday
- ⚪ **Gray** = Price unchanged

### Example

Yesterday SQUARE PHARMA closed at ৳280. Today:
- If it's trading at ৳287 → Change: +৳7 (+2.5%) 🟢
- If it's trading at ৳273 → Change: -৳7 (-2.5%) 🔴

### Practice

Open the **Market** page and sort by "Change %" to see today's biggest movers. Notice how different sectors move differently.`,
      },
      {
        id: 'basics-3',
        title: 'Understanding Buy and Sell Orders',
        duration: 7,
        content: `## Understanding Buy and Sell Orders

When you want to trade stocks, you place an **order**. There are two main types:

### Market Order

A **market order** buys or sells immediately at the current market price.

- ✅ **Advantage**: Executes instantly
- ⚠️ **Risk**: You might pay slightly more/less than expected (slippage)

**Example**: BEXIMCO is trading at ৳130. You place a market buy order for 100 shares. You'll get them at approximately ৳130 (maybe ৳130.10 or ৳129.90).

### Limit Order

A **limit order** lets you set the exact price you want.

- **Buy Limit**: "I want to buy BEXIMCO, but only if the price drops to ৳125"
- **Sell Limit**: "I want to sell BEXIMCO, but only if the price reaches ৳140"

- ✅ **Advantage**: You control the price
- ⚠️ **Risk**: The order might never fill if the price doesn't reach your limit

### Order Lifecycle

Every order goes through these stages:

1. **Submitted** → Your order enters the system
2. **Queued** → Waiting for a matching price
3. **Filled** → Trade executed! You own the shares (or sold them)
4. **Rejected** → Order couldn't be processed (not enough money, invalid quantity)
5. **Expired** → Limit order didn't fill by end of day
6. **Cancelled** → You cancelled before it filled

### Which Should You Use?

| Situation | Use |
|-----------|-----|
| Want shares NOW | Market Order |
| Want a specific price | Limit Order |
| Stock is volatile | Limit Order (safer) |
| Stock is stable, small quantity | Market Order (faster) |

### Try It

Go to **Demo Trading** and try placing both types of orders. Notice how market orders fill instantly while limit orders wait for the right price.`,
      },
      {
        id: 'basics-4',
        title: 'Reading Your Portfolio',
        duration: 6,
        content: `## Reading Your Portfolio

After buying stocks, you need to understand your portfolio — what you own and how it's performing.

### Key Portfolio Metrics

**1. Holdings**
Your list of stocks with quantities. If you bought 100 BEXIMCO and 50 SQUARE PHARMA, those are your holdings.

**2. Average Cost (Avg Buy Price)**
The average price you paid. If you bought:
- 50 shares at ৳130
- 50 shares at ৳140
Your average cost = (50×130 + 50×140) / 100 = **৳135**

**3. Market Value**
Current value = Quantity × Current Market Price
If BEXIMCO is now ৳145: Market Value = 100 × ৳145 = **৳14,500**

**4. Unrealized P&L (Profit/Loss)**
Profit you HAVEN'T locked in yet (you still hold the shares):
= Market Value - Total Cost
= ৳14,500 - ৳13,500 = **+৳1,000** 🟢

**5. Realized P&L**
Profit you HAVE locked in by selling:
If you sold 50 shares at ৳150 (bought at ৳135):
= 50 × (৳150 - ৳135) = **+৳750** 🟢

### Understanding Charges

When you trade, you pay fees:
- **Brokerage Commission**: ~0.3% of trade value
- **CDBL Fee**: 0.015% (Central Depository Bangladesh)
- **BSEC Fee**: 0.015% (regulatory fee)
- **AIT**: 0.05% (Advance Income Tax)

These reduce your net profit. Always check **Net P&L** (after charges), not just gross.

### Try It

Go to **Demo Portfolio** to see your holdings. Click any position to see the detailed breakdown including charges.`,
      },
      {
        id: 'basics-5',
        title: 'End of Day: What Happens After Market Closes',
        duration: 5,
        content: `## End of Day (EOD): What Happens After Market Closes

The DSE market closes at 2:30 PM. But the work isn't over — several important things happen after close.

### What is EOD Processing?

At the end of each trading day, the system:

1. **Closes open orders**: Unfilled limit orders expire
2. **Books trades**: All executed trades are finalized
3. **Updates holdings**: Your portfolio reflects the day's trades
4. **Calculates charges**: Brokerage, CDBL, BSEC fees are applied
5. **Updates cash balance**: Debits for buys, credits for sells
6. **Generates statements**: A daily summary of all activity

### T+2 Settlement (Real World)

In the real DSE, settlement follows **T+2** — meaning shares are delivered 2 business days after the trade. In our demo, settlement is instant so you can learn faster.

### Your Daily Statement

After EOD, you get a statement showing:
- **Opening Cash**: What you started the day with
- **Trades**: All buys and sells
- **Charges**: All fees applied
- **Closing Cash**: What you ended with
- **Portfolio Value**: Total value of holdings + cash

### Why This Matters

Many beginners only look at stock prices. But understanding the **full lifecycle** — from order to settlement to statement — is what separates informed investors from gamblers.

### Try It

Place some demo trades, then go to **EOD Replay** and click "Run EOD". Watch the step-by-step breakdown of what happened to your portfolio.`,
      },
    ],
  },

  // ── COURSE 2: Understanding DSE ──
  {
    id: 'dse',
    title: 'Understanding DSE & CSE',
    description: 'Deep dive into the Dhaka Stock Exchange — indices, trading hours, settlement, and how the market operates.',
    icon: '🏛️',
    isRequired: true,
    order: 2,
    lessons: [
      {
        id: 'dse-1',
        title: 'Introduction to DSE',
        duration: 6,
        content: `## Introduction to the Dhaka Stock Exchange (DSE)

The **Dhaka Stock Exchange (DSE)** is the primary stock exchange in Bangladesh, founded in 1954. It's where publicly listed companies' shares are bought and sold.

### Key Facts

| Fact | Detail |
|------|--------|
| Founded | 1954 |
| Location | Motijheel, Dhaka |
| Regulator | BSEC (Bangladesh Securities & Exchange Commission) |
| Listed Companies | 600+ |
| Trading Hours | Sun-Thu, 10:00 AM - 2:30 PM |
| Currency | BDT (Bangladeshi Taka) |

### How is DSE Different?

- **Weekend**: Friday-Saturday (unlike the Western Sat-Sun)
- **Currency**: All trades in Bangladeshi Taka (৳)
- **Circuit Breaker**: Trading halts if a stock moves more than 10% in a day
- **Lot Size**: Minimum 1 share for most stocks

### Who Regulates It?

**BSEC** (Bangladesh Securities & Exchange Commission) ensures:
- Fair trading practices
- Company disclosure requirements
- Investor protection
- Broker licensing

### Market Participants

1. **Retail Investors**: Individual people like you
2. **Institutional Investors**: Banks, mutual funds, insurance companies
3. **Foreign Investors**: International funds investing in Bangladesh
4. **Brokers**: Licensed intermediaries who execute trades
5. **CDBL**: Central Depository that holds shares electronically`,
      },
      {
        id: 'dse-2',
        title: 'DSE Indices: DSEX, DSES, DS30',
        duration: 5,
        content: `## DSE Indices: DSEX, DSES, DS30

An **index** is a number that tracks the overall market performance. Think of it as a "health score" for the stock market.

### DSEX (DSE Broad Index)

- **What**: The main index of DSE — tracks ALL listed stocks
- **Launched**: 2013 (replaced the old DSI and DGEN)
- **Method**: Free-float market cap weighted
- **Why it matters**: When people say "the market went up", they usually mean DSEX went up

### DSES (DSE Shariah Index)

- **What**: Tracks only **Shariah-compliant** stocks
- **For**: Investors who want to follow Islamic finance principles
- **Criteria**: Companies must not deal with interest-based banking, alcohol, gambling, etc.

### DS30 (DSE 30 Index)

- **What**: Tracks the **top 30 companies** by market cap and liquidity
- **Like**: Bangladesh's version of the Dow Jones 30
- **Why it matters**: Shows how the biggest, most-traded companies are doing

### How to Read Index Values

If DSEX is at **6,500** and was **6,450** yesterday:
- Change = +50 points
- Change % = +0.77%
- This means the overall market went UP by 0.77%

### Market Sentiment from Indices

| DSEX Movement | Market Feeling |
|---------------|----------------|
| Up > 1% | Bullish (optimistic) |
| Up 0-1% | Mildly positive |
| Flat (±0.1%) | Neutral |
| Down 0-1% | Mildly negative |
| Down > 1% | Bearish (pessimistic) |

### Check It Now

Go to the **Dashboard** and see today's DSEX, DSES, and DS30 values at the top.`,
      },
      {
        id: 'dse-3',
        title: 'Trading Hours & Market Sessions',
        duration: 4,
        content: `## Trading Hours & Market Sessions

The DSE follows a structured daily schedule.

### Daily Schedule

| Time | Session |
|------|---------|
| 9:30 AM | Pre-Opening Session begins |
| 10:00 AM | Continuous Trading starts |
| 2:00 PM | Closing call auction begins |
| 2:30 PM | Market closes |

### Pre-Opening Session (9:30 - 10:00 AM)

- Orders are entered but NOT matched
- The system calculates the **opening price** based on supply/demand
- At 10:00 AM, all orders are matched simultaneously

### Continuous Trading (10:00 AM - 2:00 PM)

- Orders are matched in real-time
- Prices change second by second
- This is when most trading happens

### Trading Days

- **Open**: Sunday to Thursday
- **Closed**: Friday, Saturday, and public holidays
- **Special closures**: Announced by BSEC for events like elections

### Circuit Breakers

To prevent extreme volatility:
- **Stock-level**: A stock halts if it moves ±10% from previous close
- **Market-level**: Trading halts if DSEX drops significantly

### What This Means for You

- Place limit orders during pre-open if you want a specific opening price
- Most action happens between 10:00 AM - 12:00 PM
- Check your portfolio after 2:30 PM when final prices settle`,
      },
      {
        id: 'dse-4',
        title: 'Settlement & The T+2 Cycle',
        duration: 5,
        content: `## Settlement & The T+2 Cycle

When you buy or sell a stock, the trade doesn't settle instantly. Bangladesh follows the **T+2 settlement** cycle.

### What is T+2?

**T+2** means the trade settles **2 business days** after the trade date.

- **T** = Trade day (when you click "Buy")
- **T+1** = First business day after trade
- **T+2** = Settlement day — shares and money are exchanged

### Example

You buy 100 SQUARE PHARMA on **Sunday**:
- **Sunday (T)**: Trade is executed. Shares are reserved but not yet in your BO account
- **Monday (T+1)**: Settlement processing
- **Tuesday (T+2)**: Shares appear in your BO account. Cash is debited from your bank

### BO Account (Beneficiary Owner Account)

Your shares are held electronically in a **BO Account** managed by **CDBL** (Central Depository Bangladesh Limited). Think of it as a digital locker for your shares.

### What is CDBL?

**Central Depository Bangladesh Limited** is the organization that:
- Holds all shares electronically (no paper certificates)
- Manages BO accounts
- Processes share transfers during settlement
- Charges a small fee per transaction (CDBL fee)

### Why Does This Matter?

1. You can't sell shares you just bought until T+2 (in real trading)
2. Cash isn't immediately available after selling
3. Understanding settlement helps you plan your trades

### In Demo Mode

Our demo platform settles instantly so you can practice without waiting. But remember — real trading has the T+2 delay!`,
      },
    ],
  },

  // ── COURSE 3: Technical Analysis ──
  {
    id: 'technical',
    title: 'Technical Analysis',
    description: 'Learn to read charts, identify patterns, and use indicators like RSI and MACD for informed trading decisions.',
    icon: '📊',
    isRequired: false,
    order: 3,
    lessons: [
      {
        id: 'tech-1',
        title: 'Reading Candlestick Charts',
        duration: 7,
        content: `## Reading Candlestick Charts

Candlestick charts are the most popular way to visualize stock price movements.

### Anatomy of a Candlestick

Each candle shows 4 prices for a time period (1 day, 1 hour, etc.):

- **Open**: Price at the start of the period
- **Close**: Price at the end
- **High**: Highest price during the period
- **Low**: Lowest price during the period

### Green vs Red Candles

- 🟢 **Green (Bullish)**: Close > Open — price went UP
- 🔴 **Red (Bearish)**: Close < Open — price went DOWN

### Parts of a Candle

- **Body**: The thick part between Open and Close
- **Upper Wick/Shadow**: Line above the body (shows the High)
- **Lower Wick/Shadow**: Line below the body (shows the Low)

### What Candle Shapes Tell You

| Shape | Name | Meaning |
|-------|------|---------|
| Long green body | Strong Bullish | Strong buying pressure |
| Long red body | Strong Bearish | Strong selling pressure |
| Small body, long wicks | Doji | Indecision, possible reversal |
| Small body, long lower wick | Hammer | Possible upward reversal |
| Small body, long upper wick | Shooting Star | Possible downward reversal |

### Reading a Chart

Look at a stock's chart on the **Stock Detail** page:
- A series of green candles = **uptrend**
- A series of red candles = **downtrend**
- Alternating green/red = **sideways/range-bound**

### Practice

Go to any stock detail page and switch between the 1W, 1M, 3M timeframes to see how the candle patterns change.`,
      },
      {
        id: 'tech-2',
        title: 'Support, Resistance & Trends',
        duration: 6,
        content: `## Support, Resistance & Trends

These are the foundation of technical analysis.

### Support

A **support level** is a price where a stock tends to stop falling and bounce back up. Think of it as a "floor."

**Why?** At that price, enough buyers step in to prevent further decline.

**Example**: BRAC Bank keeps bouncing off ৳40 — that's a support level.

### Resistance

A **resistance level** is a price where a stock tends to stop rising and pull back. Think of it as a "ceiling."

**Why?** At that price, enough sellers step in to prevent further rise.

**Example**: GP shares keep failing to break above ৳450 — that's resistance.

### Trends

- **Uptrend**: Series of higher highs and higher lows 📈
- **Downtrend**: Series of lower highs and lower lows 📉
- **Sideways**: Price bounces between support and resistance

### How to Use This

1. **Buy near support**: Higher chance of bounce
2. **Sell near resistance**: Higher chance of pullback
3. **Breakout**: When price breaks through resistance, it often runs further up
4. **Breakdown**: When price falls below support, it often drops further

### The Golden Rule

**"Support becomes resistance, resistance becomes support."**

When a stock breaks below a support level, that old support now acts as resistance. And vice versa.

### Drawing Trend Lines

Connect at least 2-3 price points to draw:
- **Uptrend line**: Connect the lows
- **Downtrend line**: Connect the highs

The more times a line is tested, the stronger it is.`,
      },
      {
        id: 'tech-3',
        title: 'Moving Averages',
        duration: 6,
        content: `## Moving Averages

A **moving average (MA)** smooths out price data to show the trend direction.

### Simple Moving Average (SMA)

Average of the last N closing prices.

**20-day SMA** = Sum of last 20 closing prices ÷ 20

### Common Moving Averages

| MA Period | Use |
|-----------|-----|
| 20-day | Short-term trend |
| 50-day | Medium-term trend |
| 200-day | Long-term trend |

### How to Read Them

- **Price above MA** → Bullish (uptrend)
- **Price below MA** → Bearish (downtrend)
- **Price crossing above MA** → Potential buy signal
- **Price crossing below MA** → Potential sell signal

### Golden Cross & Death Cross

- **Golden Cross** 🟢: 50-day MA crosses ABOVE 200-day MA → Strong bullish signal
- **Death Cross** 🔴: 50-day MA crosses BELOW 200-day MA → Strong bearish signal

### Using MAs on DSE Stocks

For Bangladesh stocks:
- Use **20-day MA** for short-term trading (days to weeks)
- Use **50-day MA** for medium-term positions (weeks to months)
- Use **200-day MA** to identify major trend direction

### Important Notes

- Moving averages are **lagging indicators** — they follow price, not predict it
- They work best in trending markets, not sideways markets
- Use them WITH other indicators, not alone`,
      },
      {
        id: 'tech-4',
        title: 'RSI and MACD Indicators',
        duration: 7,
        content: `## RSI and MACD Indicators

These help you identify if a stock is overbought, oversold, or about to change direction.

### RSI (Relative Strength Index)

RSI measures momentum on a scale of 0-100.

| RSI Level | Meaning | Action |
|-----------|---------|--------|
| Above 70 | **Overbought** | Consider selling — price may drop |
| 30-70 | Neutral | No extreme signal |
| Below 30 | **Oversold** | Consider buying — price may bounce |

**How it works**: RSI compares the average gains vs losses over 14 periods. If gains dominate, RSI rises toward 100.

### MACD (Moving Average Convergence Divergence)

MACD shows the relationship between two moving averages (typically 12-day and 26-day).

**Components**:
- **MACD Line**: 12-day EMA minus 26-day EMA
- **Signal Line**: 9-day EMA of the MACD line
- **Histogram**: Difference between MACD and Signal

### MACD Signals

| Signal | What Happens | Meaning |
|--------|-------------|---------|
| MACD crosses ABOVE signal | Bullish crossover | Consider buying |
| MACD crosses BELOW signal | Bearish crossover | Consider selling |
| Histogram growing | Momentum increasing | Trend strengthening |
| Histogram shrinking | Momentum decreasing | Trend weakening |

### Combining RSI + MACD

The strongest signals come when both agree:
- **Strong Buy**: RSI below 30 AND MACD bullish crossover
- **Strong Sell**: RSI above 70 AND MACD bearish crossover

### For DSE Traders

Bangladesh stocks can stay overbought/oversold longer than developed markets due to lower liquidity. Use RSI 80/20 instead of 70/30 for more reliable signals.`,
      },
    ],
  },

  // ── COURSE 4: Fundamental Analysis ──
  {
    id: 'fundamental',
    title: 'Fundamental Analysis',
    description: 'How to analyze company financials — EPS, P/E ratio, NAV, dividend yield — to find value on the DSE.',
    icon: '🔍',
    isRequired: false,
    order: 4,
    lessons: [
      {
        id: 'fund-1',
        title: 'Understanding EPS & P/E Ratio',
        duration: 6,
        content: `## Understanding EPS & P/E Ratio

These are the two most important numbers for evaluating a stock.

### EPS (Earnings Per Share)

**EPS = Net Profit ÷ Total Shares Outstanding**

It tells you how much profit the company earns for each share.

**Example**: SQUARE PHARMA earns ৳500 crore profit and has 10 crore shares.
- EPS = 500/10 = **৳50 per share**

### Higher EPS = Better?

Generally yes, but compare within the same sector:
- Pharma EPS of ৳50 vs ৳30 → First is more profitable
- Don't compare pharma EPS to bank EPS — different industries

### P/E Ratio (Price to Earnings)

**P/E = Share Price ÷ EPS**

It tells you how many years of earnings you're paying for.

**Example**: SQUARE PHARMA trades at ৳300, EPS = ৳50
- P/E = 300/50 = **6x**
- This means you're paying 6 years of earnings for the stock

### What's a Good P/E?

| P/E Range | Interpretation |
|-----------|----------------|
| Below 10 | Cheap — but check why |
| 10-20 | Fair value for most DSE stocks |
| 20-30 | Growth stock premium |
| Above 30 | Expensive — needs high growth to justify |

### DSE Average P/E

The DSE market average P/E is typically **15-18x**. Stocks below this may be undervalued; above may be overvalued.

### Watch Out

- **Negative EPS** = Company is losing money (no P/E ratio)
- **Very high P/E** = Market expects huge growth (risky if growth doesn't come)
- **P/E dropping** = Could mean stock is getting cheaper OR earnings are falling`,
      },
      {
        id: 'fund-2',
        title: 'NAV, Book Value & Dividend Yield',
        duration: 6,
        content: `## NAV, Book Value & Dividend Yield

### NAV (Net Asset Value) Per Share

**NAV = (Total Assets - Total Liabilities) ÷ Total Shares**

This tells you the "book value" of each share — what each share is worth if the company sold everything and paid all debts.

**Example**: A company has:
- Assets: ৳1,000 crore
- Liabilities: ৳600 crore
- Shares: 10 crore
- NAV = (1000-600)/10 = **৳40 per share**

### Price-to-Book (P/B) Ratio

**P/B = Market Price ÷ NAV**

| P/B | Meaning |
|-----|---------|
| Below 1 | Trading below book value — potentially undervalued |
| 1-2 | Fair value |
| Above 3 | Premium — market expects high growth |

### Dividend Yield

**Dividend Yield = (Annual Dividend ÷ Share Price) × 100**

**Example**: A stock priced at ৳100 pays ৳8 dividend per year
- Yield = (8/100) × 100 = **8%**

### Good Dividend Stocks on DSE

For income-focused investors, look for:
- Consistent dividend history (5+ years)
- Yield above 5% (better than bank FD rates)
- Dividend payout ratio below 80% (sustainable)

### Putting It All Together

The best value stocks on DSE typically have:
- P/E below 15
- P/B below 2
- Dividend yield above 4%
- Consistent EPS growth

### Check These on HeroStock

Go to any **Stock Detail** page to see the fundamentals section with EPS, P/E, NAV, and dividend history.`,
      },
      {
        id: 'fund-3',
        title: 'Reading Financial Statements',
        duration: 7,
        content: `## Reading Financial Statements

Every listed company must publish financial statements quarterly and annually. Here's how to read them.

### The Three Key Statements

**1. Income Statement (Profit & Loss)**
Shows revenue and expenses over a period.

Key lines to check:
- **Revenue/Sales**: Is it growing year over year?
- **Operating Profit**: Revenue minus operating costs
- **Net Profit**: The bottom line — after ALL expenses and taxes
- **EPS**: Net profit per share

**2. Balance Sheet**
Shows what the company owns and owes at a point in time.

Key lines:
- **Total Assets**: Everything the company owns
- **Total Liabilities**: Everything it owes
- **Shareholders' Equity**: Assets minus Liabilities (this is NAV)
- **Debt-to-Equity Ratio**: Total Debt ÷ Equity (lower is safer)

**3. Cash Flow Statement**
Shows actual cash moving in and out.

Key sections:
- **Operating Cash Flow**: Cash from core business (should be positive)
- **Investing Cash Flow**: Spending on growth (usually negative)
- **Financing Cash Flow**: Borrowing, dividends, share issues

### Red Flags to Watch

- Revenue growing but profit declining → Costs out of control
- Positive earnings but negative operating cash flow → Earnings quality issue
- Debt-to-equity above 2 → Too much debt
- Declining margins over 3+ years → Competitive pressure

### Where to Find This

On HeroStock, go to any stock's detail page and look for the **Financials** section with annual and quarterly data.`,
      },
    ],
  },

  // ── COURSE 5: Risk Management ──
  {
    id: 'risk',
    title: 'Risk Management',
    description: 'Position sizing, stop-loss strategies, portfolio diversification — protect your capital in volatile markets.',
    icon: '🛡️',
    isRequired: true,
    order: 5,
    lessons: [
      {
        id: 'risk-1',
        title: 'Position Sizing: How Much to Invest',
        duration: 5,
        content: `## Position Sizing: How Much to Invest

The #1 mistake beginners make is putting too much money in one stock. **Position sizing** prevents this.

### The 5% Rule

Never put more than **5% of your total portfolio** in a single stock.

**Example**: You have ৳1,00,000 to invest.
- Maximum per stock = ৳5,000
- This means you should hold at least 20 stocks (diversified)

### The 2% Risk Rule

Never risk more than **2% of your portfolio** on a single trade.

**Example**: Portfolio = ৳1,00,000
- Maximum risk per trade = ৳2,000
- If your stop-loss is 10% below buy price, your position size should be: ৳2,000 ÷ 10% = ৳20,000

### Calculating Position Size

**Position Size = (Portfolio × Risk %) ÷ Stop Loss %**

Example:
- Portfolio: ৳1,00,000
- Risk per trade: 2% = ৳2,000
- Stop loss: 8% below entry
- Position size = ৳2,000 ÷ 0.08 = **৳25,000**
- If stock is ৳50/share → Buy 500 shares

### Why This Matters

Even the best traders are wrong 40-50% of the time. Position sizing ensures that no single loss can destroy your portfolio.

With 2% risk per trade:
- 5 consecutive losses = 10% drawdown (recoverable)
- 10 consecutive losses = 20% drawdown (still survivable)

Without position sizing:
- 1 bad trade with 50% of portfolio = potential 25% loss`,
      },
      {
        id: 'risk-2',
        title: 'Stop-Loss Strategies',
        duration: 5,
        content: `## Stop-Loss Strategies

A **stop-loss** is a predetermined price at which you exit a losing trade to limit your loss.

### Types of Stop-Losses

**1. Fixed Percentage Stop**
Exit if the stock drops X% from your buy price.
- Conservative: 5-8%
- Moderate: 8-12%
- Aggressive: 12-15%

**2. Support-Based Stop**
Place your stop just below a key support level.
- More logical than a fixed percentage
- Based on chart analysis

**3. Trailing Stop**
Moves UP with the stock price but never down.
- If you buy at ৳100 with a 10% trailing stop:
  - Stock rises to ৳120 → Stop moves to ৳108
  - Stock rises to ৳150 → Stop moves to ৳135
  - Stock falls to ৳135 → You're sold out with profit!

### When to Use Each

| Strategy | Best For |
|----------|----------|
| Fixed % | Beginners, simple rules |
| Support-based | Experienced traders |
| Trailing stop | Trending markets |

### Common Mistakes

1. **No stop-loss**: "It'll come back" — the #1 wealth destroyer
2. **Too tight**: Getting stopped out on normal volatility
3. **Moving it down**: Defeats the purpose entirely
4. **Mental stops**: Not reliable — your emotions will override

### For DSE Stocks

DSE stocks can be volatile. Recommended:
- **Large caps** (DSEX top 30): 8-10% stop
- **Mid caps**: 10-12% stop
- **Small caps**: 12-15% stop (higher volatility)`,
      },
      {
        id: 'risk-3',
        title: 'Portfolio Diversification',
        duration: 5,
        content: `## Portfolio Diversification

**"Don't put all your eggs in one basket."**

Diversification means spreading your investments across different stocks, sectors, and asset types to reduce risk.

### Why Diversify?

If you put 100% in one pharma stock and the pharma sector crashes:
- ❌ Your entire portfolio crashes

If you spread across pharma, banking, textiles, energy, and tech:
- ✅ One sector crash only affects a portion

### How to Diversify on DSE

**By Sector** — Hold stocks from at least 4-5 sectors:
- Banking & Finance (e.g., BRAC Bank, City Bank)
- Pharmaceuticals (e.g., Square Pharma, Beximco Pharma)
- Textiles & Garments (e.g., Malek Spinning)
- Energy & Power (e.g., Summit Power)
- IT & Telecom (e.g., GP)
- Cement & Construction
- Food & Agriculture

**By Market Cap**:
- 60% Large caps (stable, blue chips)
- 30% Mid caps (growth potential)
- 10% Small caps (higher risk/reward)

### The Right Number of Stocks

| Stocks | Diversification |
|--------|----------------|
| 1-3 | Concentrated (high risk) |
| 5-10 | Moderate diversification |
| 10-20 | Well diversified |
| 20+ | Over-diversified (hard to track) |

**Sweet spot for DSE**: **8-15 stocks** across 4-5 sectors.

### Check Your Diversification

In your **Demo Portfolio**, look at the sector allocation pie chart. If one sector dominates more than 40%, you're too concentrated.`,
      },
      {
        id: 'risk-4',
        title: 'Managing Trading Psychology',
        duration: 5,
        content: `## Managing Trading Psychology

Your biggest enemy in the stock market isn't bad stocks — it's your own emotions.

### The Two Deadly Emotions

**1. Fear** 😰
- Selling at a loss too early because you panic
- Not buying because "what if it drops more?"
- Missing opportunities because of past losses

**2. Greed** 🤑
- Not selling when your target is reached ("it'll go higher!")
- Overtrading — placing too many orders
- Buying more of a losing stock ("averaging down" without analysis)

### Common Psychological Traps

**FOMO (Fear of Missing Out)**
A stock is up 20% today. You buy at the top because "everyone is making money." It crashes next day.

**Anchoring**
"I bought at ৳150, so I won't sell below ৳150." The stock drops to ৳80 and you still hold — because you're anchored to your buy price.

**Confirmation Bias**
You only read news that supports your position and ignore warning signs.

**Revenge Trading**
After a loss, you trade aggressively to "win it back." This usually leads to bigger losses.

### How to Stay Disciplined

1. **Have a plan BEFORE you trade**: Entry price, target, stop-loss
2. **Write it down**: Trading journal — what you did and why
3. **Follow your rules**: No exceptions, especially when emotional
4. **Take breaks**: After a big loss, step away for a day
5. **Review weekly**: What went right? What went wrong?

### The HeroStock Advantage

Our **Coaching Layer** automatically detects when you're overtrading, concentrating too much in one stock, or chasing losses. Pay attention to those alerts — they're designed to protect you.`,
      },
    ],
  },
];

// ── Progress management via localStorage ──

const PROGRESS_KEY = 'herostock_academy_progress';

export interface AcademyProgress {
  completedLessons: string[];
  lastAccessed: string;
  startedAt: string;
}

export function getAcademyProgress(): AcademyProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const fresh: AcademyProgress = { completedLessons: [], lastAccessed: new Date().toISOString(), startedAt: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(fresh));
  return fresh;
}

export function completeAcademyLesson(lessonId: string): AcademyProgress {
  const progress = getAcademyProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }
  progress.lastAccessed = new Date().toISOString();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function resetAcademyProgress(): AcademyProgress {
  const fresh: AcademyProgress = { completedLessons: [], lastAccessed: new Date().toISOString(), startedAt: new Date().toISOString() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(fresh));
  return fresh;
}

export function getAcademyStats(progress: AcademyProgress) {
  const totalLessons = ACADEMY_COURSES.reduce((s, c) => s + c.lessons.length, 0);
  const requiredLessons = ACADEMY_COURSES.filter(c => c.isRequired).reduce((s, c) => s + c.lessons.length, 0);
  const completedRequired = ACADEMY_COURSES
    .filter(c => c.isRequired)
    .reduce((s, c) => s + c.lessons.filter(l => progress.completedLessons.includes(l.id)).length, 0);

  return {
    totalLessons,
    completedLessons: progress.completedLessons.length,
    requiredLessons,
    completedRequired,
    progressPercent: totalLessons > 0 ? Math.round((progress.completedLessons.length / totalLessons) * 100) : 0,
    isQualified: completedRequired >= requiredLessons,
  };
}
