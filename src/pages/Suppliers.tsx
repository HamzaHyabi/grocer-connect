import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const Suppliers = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch suppliers with their profiles
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['all-suppliers'],
    queryFn: async () => {
      // Fetch all supplier profiles
      const { data: supplierData, error } = await supabase
        .from('supplier_profiles')
        .select('*')
        .order('rating_average', { ascending: false });
      if (error) throw error;

      // Fetch all related user profiles
      const userIds = supplierData.map((s) => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, city, avatar_url')
        .in('user_id', userIds);

      // Join the data
      return supplierData.map((supplier) => ({
        ...supplier,
        profile: profilesData?.find((p) => p.user_id === supplier.user_id) || null,
      }));
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_fr');
      if (error) throw error;
      return data;
    },
  });

  // Get unique cities
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    suppliers.forEach((s: any) => {
      if (s.profile?.city) {
        citySet.add(s.profile.city);
      }
    });
    return Array.from(citySet).sort();
  }, [suppliers]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier: any) => {
      const matchesSearch =
        !searchQuery ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity =
        selectedCity === 'all' || supplier.profile?.city === selectedCity;

      const matchesCategory =
        selectedCategory === 'all' || supplier.category === selectedCategory;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [suppliers, searchQuery, selectedCity, selectedCategory]);

  const translations = {
    fr: {
      title: 'Fournisseurs',
      subtitle: 'Trouvez les meilleurs fournisseurs pour votre commerce',
      searchPlaceholder: 'Rechercher un fournisseur...',
      allCities: 'Toutes les villes',
      allCategories: 'Toutes les catégories',
      noSuppliers: 'Aucun fournisseur trouvé',
      verified: 'Vérifié',
      reviews: 'avis',
      viewProfile: 'Voir le profil',
      products: 'produits',
    },
    ar: {
      title: 'الموردون',
      subtitle: 'اعثر على أفضل الموردين لتجارتك',
      searchPlaceholder: 'ابحث عن مورد...',
      allCities: 'جميع المدن',
      allCategories: 'جميع الفئات',
      noSuppliers: 'لم يتم العثور على موردين',
      verified: 'موثق',
      reviews: 'تقييمات',
      viewProfile: 'عرض الملف',
      products: 'منتجات',
    },
  };

  const txt = translations[language];

  return (
    <MainLayout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{txt.title}</h1>
            <p className="mt-2 text-muted-foreground">{txt.subtitle}</p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={txt.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={txt.allCities} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{txt.allCities}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={txt.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{txt.allCategories}</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {language === 'ar' ? cat.name_ar : cat.name_fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="mb-2 h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="text-lg text-muted-foreground">{txt.noSuppliers}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map((supplier: any) => (
                <Card key={supplier.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {supplier.profile?.avatar_url ? (
                          <img
                            src={supplier.profile.avatar_url}
                            alt={supplier.company_name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {supplier.company_name}
                          </h3>
                          {supplier.is_verified && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        {supplier.profile?.city && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {supplier.profile.city}
                          </div>
                        )}
                      </div>
                    </div>

                    {supplier.company_description && (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {supplier.company_description}
                      </p>
                    )}

                    <div className="mb-4 flex items-center gap-4">
                      {supplier.rating_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="font-medium">
                            {supplier.rating_average?.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({supplier.rating_count} {txt.reviews})
                          </span>
                        </div>
                      )}
                      {supplier.category && (
                        <Badge variant="secondary">{supplier.category}</Badge>
                      )}
                    </div>

                    <Button asChild className="w-full">
                      <Link to={`/supplier/${supplier.user_id}`}>
                        {txt.viewProfile}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Suppliers;
