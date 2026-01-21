import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

const Marketplace = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

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

  // Fetch products with supplier info
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_fr, name_ar),
          supplier:supplier_profiles!products_supplier_id_fkey(
            id, 
            user_id,
            company_name, 
            rating_average, 
            rating_count, 
            is_verified
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch supplier profiles with their user profiles for city info
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-with-profiles'],
    queryFn: async () => {
      const { data: supplierData, error } = await supabase
        .from('supplier_profiles')
        .select('*');
      if (error) throw error;

      const userIds = supplierData.map((s) => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, city')
        .in('user_id', userIds);

      return supplierData.map((supplier) => ({
        ...supplier,
        profile: profilesData?.find((p) => p.user_id === supplier.user_id) || null,
      }));
    },
  });

  // Get unique cities from suppliers
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    suppliers.forEach((s: any) => {
      if (s.profile?.city) {
        citySet.add(s.profile.city);
      }
    });
    return Array.from(citySet).sort();
  }, [suppliers]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesSearch =
        !searchQuery ||
        product.name_fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name_ar?.includes(searchQuery) ||
        product.description_fr?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category_id === selectedCategory;

      // City filtering would need supplier profile lookup
      const matchesCity = selectedCity === 'all'; // Simplified for now

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [products, searchQuery, selectedCategory, selectedCity]);

  const translations = {
    fr: {
      title: 'Marketplace',
      subtitle: 'Découvrez les produits des meilleurs fournisseurs',
      searchPlaceholder: 'Rechercher des produits...',
      allCategories: 'Toutes les catégories',
      allCities: 'Toutes les villes',
      noProducts: 'Aucun produit trouvé',
      moq: 'Min.',
      viewSupplier: 'Voir le fournisseur',
      verified: 'Vérifié',
      inStock: 'En stock',
    },
    ar: {
      title: 'السوق',
      subtitle: 'اكتشف منتجات أفضل الموردين',
      searchPlaceholder: 'ابحث عن المنتجات...',
      allCategories: 'جميع الفئات',
      allCities: 'جميع المدن',
      noProducts: 'لم يتم العثور على منتجات',
      moq: 'الحد الأدنى',
      viewSupplier: 'عرض المورد',
      verified: 'موثق',
      inStock: 'متوفر',
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={txt.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{txt.allCategories}</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'ar' ? cat.name_ar : cat.name_fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="text-lg text-muted-foreground">{txt.noProducts}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product: any) => (
                <Card key={product.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={language === 'ar' ? product.name_ar : product.name_fr}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.supplier?.is_verified && (
                      <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
                        {txt.verified}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-1 line-clamp-2 font-semibold text-foreground">
                      {language === 'ar' ? product.name_ar || product.name_fr : product.name_fr}
                    </h3>
                    {product.category && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        {language === 'ar' ? product.category.name_ar : product.category.name_fr}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {product.price.toFixed(2)} {t('common.currency')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {txt.moq} {product.min_order_quantity}
                      </span>
                    </div>
                    {product.supplier && (
                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                        <div className="flex-1 truncate text-sm text-muted-foreground">
                          {product.supplier.company_name}
                        </div>
                        {product.supplier.rating_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            <span className="text-xs font-medium">
                              {product.supplier.rating_average?.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t border-border p-4 pt-3">
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to={`/supplier/${product.supplier?.user_id}`}>
                        {txt.viewSupplier}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketplace;
