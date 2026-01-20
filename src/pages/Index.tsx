import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Truck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t, language } = useLanguage();

  const features = [
    { icon: Shield, title: t('home.features.trust'), desc: t('home.features.trustDesc') },
    { icon: TrendingUp, title: t('home.features.prices'), desc: t('home.features.pricesDesc') },
    { icon: Truck, title: t('home.features.delivery'), desc: t('home.features.deliveryDesc') },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('home.hero.title')}
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/auth?mode=signup">
                  {t('home.hero.cta.vendor')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/auth?mode=signup">{t('home.hero.cta.supplier')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">{t('home.features.title')}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            {language === 'fr' ? 'Prêt à développer votre activité ?' : 'هل أنت مستعد لتنمية عملك؟'}
          </h2>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth?mode=signup">
              {language === 'fr' ? 'Commencer maintenant' : 'ابدأ الآن'}
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
