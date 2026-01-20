import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Building2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';
type SignupStep = 'role' | 'details';
type UserRole = 'supplier' | 'vendor';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [signupStep, setSignupStep] = useState<SignupStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');

  const { t, language } = useLanguage();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/marketplace');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: language === 'fr' ? 'Erreur de connexion' : 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/marketplace');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: t('auth.passwordMismatch'), variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: t('auth.weakPassword'), variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, selectedRole!, {
      fullName,
      city,
      phone,
      companyName: selectedRole === 'supplier' ? companyName : undefined,
      storeName: selectedRole === 'vendor' ? storeName : undefined,
      category: selectedRole === 'supplier' ? category : undefined,
    });

    if (error) {
      toast({
        title: language === 'fr' ? 'Erreur d\'inscription' : 'خطأ في التسجيل',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'fr' ? 'Compte créé avec succès!' : 'تم إنشاء الحساب بنجاح!',
      });
      navigate('/marketplace');
    }

    setLoading(false);
  };

  const cities = ['casablanca', 'rabat', 'marrakech', 'fes', 'tangier', 'agadir', 'meknes', 'oujda'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.login')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={() => { setMode('signup'); setSignupStep('role'); }} className="font-medium text-primary hover:underline">
                  {t('auth.signupHere')}
                </button>
              </p>
            </form>
          ) : signupStep === 'role' ? (
            <div className="space-y-4">
              <p className="text-center font-medium">{t('auth.chooseRole')}</p>
              <div className="grid gap-4">
                <button onClick={() => { setSelectedRole('supplier'); setSignupStep('details'); }} className="flex items-center gap-4 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('auth.supplier')}</p>
                    <p className="text-sm text-muted-foreground">{t('auth.supplierDesc')}</p>
                  </div>
                </button>
                <button onClick={() => { setSelectedRole('vendor'); setSignupStep('details'); }} className="flex items-center gap-4 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                    <Store className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('auth.vendor')}</p>
                    <p className="text-sm text-muted-foreground">{t('auth.vendorDesc')}</p>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <button type="button" onClick={() => setMode('login')} className="font-medium text-primary hover:underline">
                  {t('auth.loginHere')}
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSignupStep('role')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('auth.back')}
              </Button>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.fullName')}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{selectedRole === 'supplier' ? t('auth.companyName') : t('auth.storeName')}</Label>
                <Input value={selectedRole === 'supplier' ? companyName : storeName} onChange={(e) => selectedRole === 'supplier' ? setCompanyName(e.target.value) : setStoreName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.city')}</Label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  <option value="">{language === 'fr' ? 'Sélectionnez une ville' : 'اختر مدينة'}</option>
                  {cities.map((c) => (<option key={c} value={c}>{t(`city.${c}`)}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.password')}</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.confirmPassword')}</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.createAccount')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
