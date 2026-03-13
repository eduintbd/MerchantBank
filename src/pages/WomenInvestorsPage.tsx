import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp, Users, Briefcase, Pill, Building2, Phone, ShoppingBag } from 'lucide-react';

const successStories = [
  {
    name: 'Fatima Akter',
    title: 'Software Engineer turned Investor',
    story: 'Starting with just BDT 50,000, Fatima built a diversified portfolio worth BDT 15 lakh over 3 years. She focused on pharmaceutical and banking stocks, applying systematic research before every trade.',
    sector: 'Pharmaceuticals & Banking',
  },
  {
    name: 'Nusrat Jahan',
    title: 'University Professor & Trader',
    story: 'Nusrat began investing during the pandemic and turned her knowledge of economics into real market gains. Her disciplined approach to value investing has inspired dozens of her students to start investing.',
    sector: 'Telecom & FMCG',
  },
  {
    name: 'Rashida Begum',
    title: 'Retired Teacher & Long-term Investor',
    story: 'After retirement, Rashida dedicated time to learning stock trading through the DSE learning modules. She now manages her own portfolio and mentors other women in her community to achieve financial independence.',
    sector: 'Banking & Insurance',
  },
];

const recommendedSectors = [
  {
    name: 'Pharmaceuticals',
    description: 'Bangladesh pharma sector shows consistent growth with strong export potential and stable earnings.',
    icon: <Pill size={22} />,
    color: 'bg-success/10 text-success',
  },
  {
    name: 'Banking',
    description: 'Well-regulated banking sector with growing digital banking adoption and reliable dividends.',
    icon: <Building2 size={22} />,
    color: 'bg-info/10 text-info',
  },
  {
    name: 'Telecom',
    description: 'High mobile penetration and expanding digital services drive steady revenue growth.',
    icon: <Phone size={22} />,
    color: 'bg-primary/10 text-primary',
  },
  {
    name: 'FMCG',
    description: 'Essential consumer goods companies benefit from growing middle class and stable demand.',
    icon: <ShoppingBag size={22} />,
    color: 'bg-warning/10 text-warning',
  },
];

export function WomenInvestorsPage() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12">
      {/* Hero Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Heart size={24} className="text-primary" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Empowering Women Investors</h1>
        </div>
        <p className="text-muted text-sm sm:text-base mt-1 max-w-2xl">
          Breaking barriers in Bangladesh's capital market. Women are building wealth, securing futures, and redefining financial independence through smart investing.
        </p>
      </div>

      {/* Stats Section */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Women in DSE</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
        <StatCard
          title="Women Investors"
          value="15%"
          subtitle="of total DSE investors"
          icon={<Users size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Annual Growth"
          value="25%"
          subtitle="Year-over-year increase"
          icon={<TrendingUp size={20} />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Top Sectors"
          value="Pharma"
          subtitle="Banking, Telecom"
          icon={<Briefcase size={20} />}
          iconColor="bg-info/10 text-info"
        />
      </div>

      {/* Success Stories */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Success Stories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
        {successStories.map((story) => (
          <Card key={story.name}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-base font-bold shrink-0">
                {story.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">{story.name}</h3>
                <p className="text-xs text-muted truncate">{story.title}</p>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-3">{story.story}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-info/10 text-info border border-info/20">
              <Briefcase size={10} />
              {story.sector}
            </span>
          </Card>
        ))}
      </div>

      {/* Recommended Sectors */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Recommended Sectors</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
        {recommendedSectors.map((sector) => (
          <Card key={sector.name} hover>
            <div className={`w-11 h-11 rounded-xl ${sector.color} flex items-center justify-center mb-3`}>
              {sector.icon}
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">{sector.name}</h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">{sector.description}</p>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="text-center py-8 sm:py-10">
        <h2 className="text-lg sm:text-xl font-bold mb-2">Start Your Investment Journey Today</h2>
        <p className="text-sm text-muted mb-5 max-w-md mx-auto">
          Join thousands of women who are building their financial future through the Dhaka Stock Exchange.
        </p>
        <Link to="/auth">
          <Button size="lg" icon={<TrendingUp size={18} />}>
            Open an Account
          </Button>
        </Link>
      </Card>      </div>

    </div>
  );
}