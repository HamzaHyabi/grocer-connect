import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SouqConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? 'La marketplace B2B qui connecte les épiceries marocaines avec les meilleurs fournisseurs.'
                : 'سوق B2B يربط متاجر البقالة المغربية بأفضل الموردين.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === 'fr' ? 'Liens rapides' : 'روابط سريعة'}
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.marketplace')}
              </Link>
              <Link to="/suppliers" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.suppliers')}
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.login')}
              </Link>
            </nav>
          </div>

          {/* For Suppliers */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === 'fr' ? 'Pour les fournisseurs' : 'للموردين'}
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/auth?mode=signup" className="text-sm text-muted-foreground hover:text-foreground">
                {language === 'fr' ? 'Devenir fournisseur' : 'كن مورداً'}
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.dashboard')}
              </Link>
            </nav>
          </div>

          {/* Cities */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === 'fr' ? 'Villes' : 'المدن'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {['casablanca', 'rabat', 'marrakech', 'fes', 'tangier'].map((city) => (
                <span key={city} className="text-sm text-muted-foreground">
                  {t(`city.${city}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} SouqConnect.{' '}
            {language === 'fr' ? 'Tous droits réservés.' : 'جميع الحقوق محفوظة.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
