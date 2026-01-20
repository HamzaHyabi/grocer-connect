import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.marketplace': 'Marketplace',
    'nav.suppliers': 'Fournisseurs',
    'nav.orders': 'Commandes',
    'nav.dashboard': 'Tableau de bord',
    'nav.products': 'Produits',
    'nav.profile': 'Profil',
    'nav.favorites': 'Favoris',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',

    // Auth
    'auth.login': 'Connexion',
    'auth.signup': 'Inscription',
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.noAccount': "Vous n'avez pas de compte ?",
    'auth.hasAccount': 'Vous avez déjà un compte ?',
    'auth.loginHere': 'Connectez-vous ici',
    'auth.signupHere': 'Inscrivez-vous ici',
    'auth.chooseRole': 'Choisissez votre rôle',
    'auth.supplier': 'Fournisseur',
    'auth.vendor': 'Vendeur',
    'auth.supplierDesc': 'Je vends des produits aux épiceries',
    'auth.vendorDesc': 'Je suis propriétaire d\'une épicerie',
    'auth.fullName': 'Nom complet',
    'auth.companyName': 'Nom de l\'entreprise',
    'auth.storeName': 'Nom du magasin',
    'auth.city': 'Ville',
    'auth.phone': 'Téléphone',
    'auth.category': 'Catégorie principale',
    'auth.continue': 'Continuer',
    'auth.back': 'Retour',
    'auth.createAccount': 'Créer un compte',
    'auth.welcomeBack': 'Bon retour !',
    'auth.loginSubtitle': 'Connectez-vous à votre compte SouqConnect',
    'auth.signupSubtitle': 'Rejoignez la marketplace B2B du Maroc',
    'auth.passwordMismatch': 'Les mots de passe ne correspondent pas',
    'auth.weakPassword': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth.invalidEmail': 'Adresse e-mail invalide',
    'auth.required': 'Ce champ est requis',

    // Common
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.all': 'Tous',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.loading': 'Chargement...',
    'common.noResults': 'Aucun résultat',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Opération réussie',
    'common.currency': 'MAD',
    'common.perUnit': '/ unité',
    'common.minOrder': 'Min.',
    'common.inStock': 'En stock',
    'common.outOfStock': 'Rupture de stock',
    'common.available': 'Disponible',
    'common.unavailable': 'Indisponible',

    // Home
    'home.hero.title': 'La marketplace B2B pour les épiceries du Maroc',
    'home.hero.subtitle': 'Connectez-vous avec les meilleurs fournisseurs et développez votre activité',
    'home.hero.cta.vendor': 'Je suis vendeur',
    'home.hero.cta.supplier': 'Je suis fournisseur',
    'home.features.title': 'Pourquoi SouqConnect ?',
    'home.features.trust': 'Fournisseurs vérifiés',
    'home.features.trustDesc': 'Tous les fournisseurs sont vérifiés pour garantir la qualité',
    'home.features.prices': 'Meilleurs prix',
    'home.features.pricesDesc': 'Prix compétitifs directement des fournisseurs',
    'home.features.delivery': 'Livraison rapide',
    'home.features.deliveryDesc': 'Recevez vos commandes rapidement',
    'home.categories': 'Catégories populaires',
    'home.topSuppliers': 'Fournisseurs les mieux notés',

    // Products
    'products.addProduct': 'Ajouter un produit',
    'products.editProduct': 'Modifier le produit',
    'products.productName': 'Nom du produit',
    'products.description': 'Description',
    'products.price': 'Prix (MAD)',
    'products.moq': 'Quantité minimum de commande',
    'products.stock': 'Stock disponible',
    'products.image': 'Image du produit',
    'products.uploadImage': 'Télécharger une image',

    // Orders
    'orders.myOrders': 'Mes commandes',
    'orders.pending': 'En attente',
    'orders.accepted': 'Acceptée',
    'orders.rejected': 'Refusée',
    'orders.completed': 'Terminée',
    'orders.total': 'Total',
    'orders.items': 'Articles',
    'orders.placeOrder': 'Passer la commande',
    'orders.addToCart': 'Ajouter au panier',
    'orders.viewCart': 'Voir le panier',
    'orders.emptyCart': 'Votre panier est vide',
    'orders.quantity': 'Quantité',

    // Reviews
    'reviews.title': 'Avis clients',
    'reviews.leaveReview': 'Laisser un avis',
    'reviews.rating': 'Note',
    'reviews.comment': 'Commentaire',
    'reviews.submit': 'Soumettre',

    // Cities
    'city.casablanca': 'Casablanca',
    'city.rabat': 'Rabat',
    'city.marrakech': 'Marrakech',
    'city.fes': 'Fès',
    'city.tangier': 'Tanger',
    'city.agadir': 'Agadir',
    'city.meknes': 'Meknès',
    'city.oujda': 'Oujda',
    'city.kenitra': 'Kénitra',
    'city.tetouan': 'Tétouan',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.marketplace': 'السوق',
    'nav.suppliers': 'الموردون',
    'nav.orders': 'الطلبات',
    'nav.dashboard': 'لوحة التحكم',
    'nav.products': 'المنتجات',
    'nav.profile': 'الملف الشخصي',
    'nav.favorites': 'المفضلة',
    'nav.logout': 'تسجيل الخروج',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',

    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.loginHere': 'سجل دخولك هنا',
    'auth.signupHere': 'أنشئ حسابك هنا',
    'auth.chooseRole': 'اختر دورك',
    'auth.supplier': 'مورد',
    'auth.vendor': 'بائع',
    'auth.supplierDesc': 'أبيع المنتجات للمتاجر',
    'auth.vendorDesc': 'أملك متجر بقالة',
    'auth.fullName': 'الاسم الكامل',
    'auth.companyName': 'اسم الشركة',
    'auth.storeName': 'اسم المتجر',
    'auth.city': 'المدينة',
    'auth.phone': 'الهاتف',
    'auth.category': 'الفئة الرئيسية',
    'auth.continue': 'متابعة',
    'auth.back': 'رجوع',
    'auth.createAccount': 'إنشاء حساب',
    'auth.welcomeBack': 'مرحباً بعودتك!',
    'auth.loginSubtitle': 'سجل دخولك إلى حساب SouqConnect',
    'auth.signupSubtitle': 'انضم إلى سوق B2B في المغرب',
    'auth.passwordMismatch': 'كلمات المرور غير متطابقة',
    'auth.weakPassword': 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
    'auth.invalidEmail': 'البريد الإلكتروني غير صالح',
    'auth.required': 'هذا الحقل مطلوب',

    // Common
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.all': 'الكل',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.loading': 'جاري التحميل...',
    'common.noResults': 'لا توجد نتائج',
    'common.error': 'حدث خطأ',
    'common.success': 'تمت العملية بنجاح',
    'common.currency': 'درهم',
    'common.perUnit': '/ وحدة',
    'common.minOrder': 'الحد الأدنى',
    'common.inStock': 'متوفر',
    'common.outOfStock': 'غير متوفر',
    'common.available': 'متاح',
    'common.unavailable': 'غير متاح',

    // Home
    'home.hero.title': 'سوق B2B لمحلات البقالة في المغرب',
    'home.hero.subtitle': 'تواصل مع أفضل الموردين وطور عملك',
    'home.hero.cta.vendor': 'أنا بائع',
    'home.hero.cta.supplier': 'أنا مورد',
    'home.features.title': 'لماذا SouqConnect؟',
    'home.features.trust': 'موردون موثوقون',
    'home.features.trustDesc': 'جميع الموردين موثقون لضمان الجودة',
    'home.features.prices': 'أفضل الأسعار',
    'home.features.pricesDesc': 'أسعار تنافسية مباشرة من الموردين',
    'home.features.delivery': 'توصيل سريع',
    'home.features.deliveryDesc': 'استلم طلباتك بسرعة',
    'home.categories': 'الفئات الشائعة',
    'home.topSuppliers': 'أفضل الموردين تقييماً',

    // Products
    'products.addProduct': 'إضافة منتج',
    'products.editProduct': 'تعديل المنتج',
    'products.productName': 'اسم المنتج',
    'products.description': 'الوصف',
    'products.price': 'السعر (درهم)',
    'products.moq': 'الحد الأدنى للطلب',
    'products.stock': 'المخزون المتاح',
    'products.image': 'صورة المنتج',
    'products.uploadImage': 'رفع صورة',

    // Orders
    'orders.myOrders': 'طلباتي',
    'orders.pending': 'قيد الانتظار',
    'orders.accepted': 'مقبولة',
    'orders.rejected': 'مرفوضة',
    'orders.completed': 'مكتملة',
    'orders.total': 'المجموع',
    'orders.items': 'المنتجات',
    'orders.placeOrder': 'تأكيد الطلب',
    'orders.addToCart': 'أضف إلى السلة',
    'orders.viewCart': 'عرض السلة',
    'orders.emptyCart': 'سلتك فارغة',
    'orders.quantity': 'الكمية',

    // Reviews
    'reviews.title': 'تقييمات العملاء',
    'reviews.leaveReview': 'اترك تقييماً',
    'reviews.rating': 'التقييم',
    'reviews.comment': 'التعليق',
    'reviews.submit': 'إرسال',

    // Cities
    'city.casablanca': 'الدار البيضاء',
    'city.rabat': 'الرباط',
    'city.marrakech': 'مراكش',
    'city.fes': 'فاس',
    'city.tangier': 'طنجة',
    'city.agadir': 'أكادير',
    'city.meknes': 'مكناس',
    'city.oujda': 'وجدة',
    'city.kenitra': 'القنيطرة',
    'city.tetouan': 'تطوان',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
