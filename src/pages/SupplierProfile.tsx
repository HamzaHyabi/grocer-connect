import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Phone, Mail, Package, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const SupplierProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier profile
  const { data: supplier, isLoading: supplierLoading } = useQuery({
    queryKey: ['supplier-profile', userId],
    queryFn: async () => {
      // Fetch supplier profile
      const { data: supplierData, error: supplierError } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (supplierError) throw supplierError;

      // Fetch user profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, city, phone, email, show_phone, show_email, avatar_url')
        .eq('user_id', userId)
        .single();

      return {
        ...supplierData,
        profile: profileData,
      };
    },
    enabled: !!userId,
  });

  // Fetch supplier products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['supplier-products', userId],
    queryFn: async () => {
      const { data: supplierProfile } = await supabase
        .from('supplier_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!supplierProfile) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_fr, name_ar)
        `)
        .eq('supplier_id', supplierProfile.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Check if favorited
  const { data: isFavorited = false } = useQuery({
    queryKey: ['is-favorited', userId, user?.id],
    queryFn: async () => {
      if (!user || !supplier) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('vendor_id', user.id)
        .eq('supplier_id', supplier.id)
        .single();
      return !!data;
    },
    enabled: !!user && !!supplier && role === 'vendor',
  });

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !supplier) return;
      
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('vendor_id', user.id)
          .eq('supplier_id', supplier.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ vendor_id: user.id, supplier_id: supplier.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorited', userId, user?.id] });
      toast({
        title: isFavorited 
          ? (language === 'fr' ? 'Retiré des favoris' : 'تمت الإزالة من المفضلة')
          : (language === 'fr' ? 'Ajouté aux favoris' : 'تمت الإضافة إلى المفضلة'),
      });
    },
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['supplier-reviews', supplier?.id],
    queryFn: async () => {
      if (!supplier) return [];
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;

      // Fetch vendor profiles for reviews
      const vendorIds = reviewsData.map((r) => r.vendor_id);
      const { data: vendorProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', vendorIds);

      return reviewsData.map((review) => ({
        ...review,
        vendor: vendorProfiles?.find((p) => p.user_id === review.vendor_id) || null,
      }));
    },
    enabled: !!supplier,
  });

  const translations = {
    fr: {
      back: 'Retour',
      verified: 'Fournisseur vérifié',
      products: 'Produits',
      reviews: 'Avis',
      about: 'À propos',
      noProducts: 'Aucun produit disponible',
      noReviews: 'Aucun avis pour le moment',
      addToFavorites: 'Ajouter aux favoris',
      removeFromFavorites: 'Retirer des favoris',
      moq: 'Min.',
      viewProduct: 'Voir',
      contact: 'Contact',
    },
    ar: {
      back: 'رجوع',
      verified: 'مورد موثق',
      products: 'المنتجات',
      reviews: 'التقييمات',
      about: 'حول',
      noProducts: 'لا توجد منتجات متاحة',
      noReviews: 'لا توجد تقييمات حتى الآن',
      addToFavorites: 'إضافة إلى المفضلة',
      removeFromFavorites: 'إزالة من المفضلة',
      moq: 'الحد الأدنى',
      viewProduct: 'عرض',
      contact: 'التواصل',
    },
  };

  const txt = translations[language];

  if (supplierLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!supplier) {
    return (
      <MainLayout>
        <div className="container py-8">
          <p className="text-center text-muted-foreground">
            {language === 'fr' ? 'Fournisseur non trouvé' : 'لم يتم العثور على المورد'}
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {txt.back}
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                      {supplier.profile?.avatar_url ? (
                        <img
                          src={supplier.profile.avatar_url}
                          alt={supplier.company_name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {supplier.company_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold">{supplier.company_name}</h1>
                      {supplier.is_verified && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    {supplier.is_verified && (
                      <Badge className="mt-2">{txt.verified}</Badge>
                    )}
                  </div>

                  {supplier.rating_count > 0 && (
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-lg font-medium">
                        {supplier.rating_average?.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({supplier.rating_count} {txt.reviews})
                      </span>
                    </div>
                  )}

                  {supplier.profile?.city && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {supplier.profile.city}
                    </div>
                  )}

                  {supplier.category && (
                    <div className="mb-6 text-center">
                      <Badge variant="secondary">{supplier.category}</Badge>
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <h3 className="mb-3 font-medium">{txt.contact}</h3>
                    {supplier.profile?.show_email && supplier.profile?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {supplier.profile.email}
                      </div>
                    )}
                    {supplier.profile?.show_phone && supplier.profile?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {supplier.profile.phone}
                      </div>
                    )}
                  </div>

                  {/* Favorite button */}
                  {user && role === 'vendor' && (
                    <Button
                      variant={isFavorited ? 'default' : 'outline'}
                      className="mt-6 w-full"
                      onClick={() => toggleFavorite.mutate()}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                      {isFavorited ? txt.removeFromFavorites : txt.addToFavorites}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="products">
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="products" className="gap-2">
                    <Package className="h-4 w-4" />
                    {txt.products} ({products.length})
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-2">
                    <Star className="h-4 w-4" />
                    {txt.reviews} ({reviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="about">{txt.about}</TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                  {productsLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">{txt.noProducts}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {products.map((product: any) => (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="flex">
                            <div className="h-32 w-32 flex-shrink-0 bg-muted">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={language === 'ar' ? product.name_ar : product.name_fr}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <CardContent className="flex flex-1 flex-col justify-between p-4">
                              <div>
                                <h3 className="line-clamp-1 font-medium">
                                  {language === 'ar' ? product.name_ar || product.name_fr : product.name_fr}
                                </h3>
                                {product.category && (
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'ar' ? product.category.name_ar : product.category.name_fr}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="font-bold text-primary">
                                  {product.price.toFixed(2)} {t('common.currency')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {txt.moq} {product.min_order_quantity}
                                </span>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews">
                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">{txt.noReviews}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium">
                                {review.vendor?.full_name || 'Anonymous'}
                              </span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-accent text-accent'
                                        : 'text-muted-foreground/30'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString(
                                language === 'ar' ? 'ar-MA' : 'fr-FR'
                              )}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="about">
                  <Card>
                    <CardContent className="p-6">
                      {supplier.company_description ? (
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {supplier.company_description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          {language === 'fr'
                            ? 'Aucune description disponible.'
                            : 'لا يوجد وصف متاح.'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SupplierProfile;
