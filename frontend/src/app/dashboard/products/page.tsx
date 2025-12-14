'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Table,
  TableSkeleton,
  DeleteConfirmDialog,
  Modal,
  CurrencyInput,
  SearchableSelect,
  SearchInput,
  RadioGroup,
  Card,
  StatCard,
  CardSkeleton,
  AnimatedNumber,
  AnimatedCurrency,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { productsApi } from '@/lib/api';
import { Product, ProductCategory } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
}

interface StockFormData {
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
}

const stockTypeOptions = [
  { value: 'ENTRY', label: 'Entrada', description: 'Adicionar ao estoque' },
  { value: 'EXIT', label: 'Saída', description: 'Remover do estoque' },
  { value: 'ADJUSTMENT', label: 'Ajuste', description: 'Correção de inventário' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      quantity: 0,
      minQuantity: 5,
      costPrice: 0,
      salePrice: 0,
    }
  });

  const stockForm = useForm<StockFormData>({
    defaultValues: {
      type: 'ENTRY',
      quantity: 1,
      reason: '',
    }
  });

  // Category options for SearchableSelect and filter
  const categoryOptions: SelectOption<string>[] = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );

  const categoryFilterOptions = useMemo(
    () => [{ value: '', label: 'Todas categorias' }, ...categoryOptions],
    [categoryOptions]
  );

  // Computed stats
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive);
    const lowStockProducts = activeProducts.filter((p) => p.quantity <= p.minQuantity);
    const totalStockValue = activeProducts.reduce(
      (acc, p) => acc + p.quantity * Number(p.salePrice),
      0
    );
    const totalCostValue = activeProducts.reduce(
      (acc, p) => acc + p.quantity * Number(p.costPrice),
      0
    );
    const avgMargin = activeProducts.length > 0
      ? activeProducts.reduce((acc, p) => {
          const margin = Number(p.costPrice) > 0
            ? ((Number(p.salePrice) - Number(p.costPrice)) / Number(p.costPrice)) * 100
            : 0;
          return acc + margin;
        }, 0) / activeProducts.length
      : 0;

    return {
      total: activeProducts.length,
      lowStock: lowStockProducts.length,
      totalStockValue,
      totalCostValue,
      potentialProfit: totalStockValue - totalCostValue,
      avgMargin: Math.round(avgMargin),
    };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.isActive) return false;

      const matchesSearch = search
        ? product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description?.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesCategory = categoryFilter
        ? product.categoryId === categoryFilter
        : true;

      const matchesStock = stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? product.quantity <= product.minQuantity
          : product.quantity > product.minQuantity;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Watch prices to calculate margin preview
  const watchCostPrice = watch('costPrice');
  const watchSalePrice = watch('salePrice');
  const marginPreview = useMemo(() => {
    if (watchCostPrice > 0 && watchSalePrice > 0) {
      return ((watchSalePrice - watchCostPrice) / watchCostPrice * 100).toFixed(0);
    }
    return null;
  }, [watchCostPrice, watchSalePrice]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(),
        productsApi.getCategories(),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      reset({
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        costPrice: Number(product.costPrice),
        salePrice: Number(product.salePrice),
      });
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        description: '',
        categoryId: '',
        quantity: 0,
        minQuantity: 5,
        costPrice: 0,
        salePrice: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); reset(); };

  const onSubmit = async (data: ProductFormData) => {
    const payload = {
      ...data,
      quantity: Number(data.quantity),
      minQuantity: Number(data.minQuantity),
      costPrice: Number(data.costPrice),
      salePrice: Number(data.salePrice),
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await productsApi.create(payload);
        toast.success('Produto criado!');
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar');
    }
  };

  const openDeleteDialog = (product: Product) => {
    setDeleteDialog({ isOpen: true, product });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, product: null });
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    try {
      await productsApi.delete(deleteDialog.product.id);
      toast.success('Produto desativado!');
      fetchData();
      closeDeleteDialog();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    stockForm.reset({ type: 'ENTRY', quantity: 1, reason: '' });
    setIsStockModalOpen(true);
  };

  const onStockSubmit = async (data: StockFormData) => {
    try {
      await productsApi.addStockMovement(selectedProduct!.id, {
        ...data,
        quantity: Number(data.quantity),
      });
      toast.success('Estoque atualizado!');
      setIsStockModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Helper to check if low stock
  const isLowStock = (product: Product) => product.quantity <= product.minQuantity;

  // Get stock level indicator
  const getStockLevel = (product: Product) => {
    const ratio = product.quantity / product.minQuantity;
    if (ratio <= 0.5) return { color: 'red', label: 'Crítico' };
    if (ratio <= 1) return { color: 'yellow', label: 'Baixo' };
    if (ratio <= 2) return { color: 'blue', label: 'Normal' };
    return { color: 'green', label: 'Bom' };
  };

  // Calculate margin
  const getMargin = (product: Product) => {
    if (Number(product.costPrice) <= 0) return 0;
    return Math.round(((Number(product.salePrice) - Number(product.costPrice)) / Number(product.costPrice)) * 100);
  };

  return (
    <PageTransition>
      <Header title="Produtos" subtitle={`${stats.total} produtos em estoque`} />

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        {!isLoading && products.length > 0 && (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                title="Total de Produtos"
                value={<AnimatedNumber value={stats.total} />}
                icon={<ShoppingBagIcon className="w-8 h-8" />}
                iconColor="text-primary-500"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Valor em Estoque"
                value={<AnimatedCurrency value={stats.totalStockValue} />}
                subtitle={`Custo: ${formatCurrency(stats.totalCostValue)}`}
                icon={<CurrencyDollarIcon className="w-8 h-8" />}
                iconColor="text-green-500"
              />
            </StaggerItem>
            <StaggerItem>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                className="cursor-pointer"
              >
                <StatCard
                  title="Estoque Baixo"
                  value={<AnimatedNumber value={stats.lowStock} />}
                  subtitle={stats.lowStock > 0 ? 'Clique para filtrar' : 'Tudo em ordem'}
                  icon={<ExclamationTriangleIcon className="w-8 h-8" />}
                  iconColor={stats.lowStock > 0 ? 'text-red-500' : 'text-green-500'}
                  className={stockFilter === 'low' ? 'ring-2 ring-red-500' : ''}
                />
              </motion.div>
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Margem Média"
                value={`${stats.avgMargin}%`}
                subtitle={`Lucro potencial: ${formatCurrency(stats.potentialProfit)}`}
                icon={<ChartBarIcon className="w-8 h-8" />}
                iconColor="text-blue-500"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Low Stock Alert */}
        {!isLoading && stats.lowStock > 0 && stockFilter !== 'low' && (
          <FadeIn>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">
                  {stats.lowStock} produto{stats.lowStock > 1 ? 's' : ''} com estoque baixo
                </p>
                <p className="text-dark-400 text-sm">
                  Verifique o estoque e faça a reposição necessária
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStockFilter('low')}
              >
                Ver produtos
              </Button>
            </motion.div>
          </FadeIn>
        )}

        {/* Actions Bar */}
        <FadeIn>
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <SearchInput
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  className="w-64"
                />
                <Select
                  options={categoryFilterOptions}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-44"
                />
                <div className="flex items-center bg-dark-800 rounded-lg p-1">
                  <button
                    onClick={() => setStockFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      stockFilter === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStockFilter('low')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      stockFilter === 'low'
                        ? 'bg-red-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    Estoque Baixo
                  </button>
                  <button
                    onClick={() => setStockFilter('ok')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      stockFilter === 'ok'
                        ? 'bg-green-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-dark-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary-500 text-white'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  onClick={() => openModal()}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                >
                  Novo Produto
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<ShoppingBagIcon className="w-16 h-16" />}
              title={search || categoryFilter || stockFilter !== 'all' ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
              description={search || categoryFilter || stockFilter !== 'all' ? "Tente ajustar os filtros" : "Comece cadastrando seu primeiro produto"}
              action={
                search || categoryFilter || stockFilter !== 'all' ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setCategoryFilter('');
                      setStockFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <Button onClick={() => openModal()}>Cadastrar Produto</Button>
                )
              }
            />
          </FadeIn>
        ) : viewMode === 'grid' ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const stockLevel = getStockLevel(product);
                const margin = getMargin(product);

                return (
                  <StaggerItem key={product.id}>
                    <Card
                      hoverable
                      className={`h-full relative ${isLowStock(product) ? 'border-red-500/50' : ''}`}
                    >
                      {/* Stock Alert Badge */}
                      {isLowStock(product) && (
                        <div className="absolute -top-2 -right-2">
                          <Badge variant="danger" size="sm">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            Baixo
                          </Badge>
                        </div>
                      )}

                      {/* Category Badge */}
                      {product.category && (
                        <Badge variant="neutral" size="sm" className="mb-3">
                          <TagIcon className="w-3 h-3 mr-1" />
                          {product.category.name}
                        </Badge>
                      )}

                      {/* Product Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1 pr-8">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-dark-400 text-sm line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Stock Indicator */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-dark-400 text-sm">Estoque</span>
                          <span className={`text-sm font-medium ${
                            stockLevel.color === 'red' ? 'text-red-500' :
                            stockLevel.color === 'yellow' ? 'text-yellow-500' :
                            stockLevel.color === 'blue' ? 'text-blue-500' : 'text-green-500'
                          }`}>
                            {product.quantity} / {product.minQuantity}
                          </span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((product.quantity / (product.minQuantity * 2)) * 100, 100)}%` }}
                            className={`h-full rounded-full ${
                              stockLevel.color === 'red' ? 'bg-red-500' :
                              stockLevel.color === 'yellow' ? 'bg-yellow-500' :
                              stockLevel.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Prices */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-dark-500 text-xs">Custo</p>
                          <p className="text-dark-300 font-medium">
                            {formatCurrency(product.costPrice)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-dark-500 text-xs">Margem</p>
                          <p className={`font-bold ${margin > 0 ? 'text-primary-500' : 'text-red-500'}`}>
                            {margin}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-dark-500 text-xs">Venda</p>
                          <p className="text-green-500 font-bold">
                            {formatCurrency(product.salePrice)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => openStockModal(product)}
                          leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                        >
                          Estoque
                        </Button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openModal(product)}
                          className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openDeleteDialog(product)}
                          className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </AnimatePresence>
          </StaggerContainer>
        ) : (
          /* List View */
          <FadeIn delay={0.1}>
            <Card padding="none" className="overflow-hidden">
              <div className="divide-y divide-dark-800">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => {
                    const stockLevel = getStockLevel(product);
                    const margin = getMargin(product);

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center justify-between p-4 hover:bg-dark-800/50 transition-colors ${
                          isLowStock(product) ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Product Icon */}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isLowStock(product) ? 'bg-red-500/10' : 'bg-primary-500/10'
                          }`}>
                            <CubeIcon className={`w-6 h-6 ${
                              isLowStock(product) ? 'text-red-500' : 'text-primary-500'
                            }`} />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white truncate">
                                {product.name}
                              </h3>
                              {product.category && (
                                <Badge variant="neutral" size="sm">
                                  {product.category.name}
                                </Badge>
                              )}
                              {isLowStock(product) && (
                                <Badge variant="danger" size="sm">
                                  Estoque Baixo
                                </Badge>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-dark-400 text-sm truncate">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-8">
                          <div className="text-center w-20">
                            <p className="text-dark-500 text-xs">Estoque</p>
                            <p className={`font-bold ${
                              stockLevel.color === 'red' ? 'text-red-500' :
                              stockLevel.color === 'yellow' ? 'text-yellow-500' : 'text-white'
                            }`}>
                              {product.quantity}
                              <span className="text-dark-500 font-normal"> / {product.minQuantity}</span>
                            </p>
                          </div>

                          <div className="text-center w-20">
                            <p className="text-dark-500 text-xs">Custo</p>
                            <p className="text-dark-300">{formatCurrency(product.costPrice)}</p>
                          </div>

                          <div className="text-center w-20">
                            <p className="text-dark-500 text-xs">Venda</p>
                            <p className="text-green-500 font-bold">{formatCurrency(product.salePrice)}</p>
                          </div>

                          <div className="text-center w-16">
                            <p className="text-dark-500 text-xs">Margem</p>
                            <p className={`font-bold ${margin > 0 ? 'text-primary-500' : 'text-red-500'}`}>
                              {margin}%
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openStockModal(product)}
                              className="p-2 text-dark-400 hover:text-blue-500 hover:bg-dark-700 rounded-lg transition-colors"
                              title="Movimentar estoque"
                            >
                              <ArrowPathIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openModal(product)}
                              className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openDeleteDialog(product)}
                              className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nome */}
          <Input
            label="Nome do produto"
            placeholder="Ex: Pomada Modeladora"
            leftIcon={<CubeIcon className="w-5 h-5" />}
            required
            error={errors.name?.message as string}
            {...register('name', { required: 'Nome é obrigatório' })}
          />

          {/* Descrição */}
          <Textarea
            label="Descrição"
            placeholder="Descreva o produto..."
            {...register('description')}
            rows={2}
          />

          {/* Categoria */}
          <Controller
            name="categoryId"
            control={control}
            rules={{ required: 'Categoria é obrigatória' }}
            render={({ field }) => (
              <SearchableSelect
                label="Categoria"
                value={field.value}
                onChange={field.onChange}
                options={categoryOptions}
                placeholder="Selecione a categoria"
                error={errors.categoryId?.message as string}
                required
              />
            )}
          />

          {/* Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantidade inicial"
              type="number"
              min={0}
              placeholder="0"
              helperText="Estoque atual do produto"
              {...register('quantity')}
            />
            <Input
              label="Estoque mínimo"
              type="number"
              min={0}
              placeholder="5"
              helperText="Alerta quando abaixo deste valor"
              {...register('minQuantity')}
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="costPrice"
              control={control}
              rules={{ required: 'Preço de custo é obrigatório' }}
              render={({ field }) => (
                <CurrencyInput
                  label="Preço de custo"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.costPrice?.message as string}
                  required
                />
              )}
            />

            <Controller
              name="salePrice"
              control={control}
              rules={{ required: 'Preço de venda é obrigatório' }}
              render={({ field }) => (
                <CurrencyInput
                  label="Preço de venda"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.salePrice?.message as string}
                  required
                />
              )}
            />
          </div>

          {/* Margin preview */}
          {marginPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-dark-800 rounded-lg border border-dark-700"
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Margem de lucro:</span>
                <span className={`font-semibold ${Number(marginPreview) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {marginPreview}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? 'Atualizar' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Movimentar Estoque">
        <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-5">
          {/* Product Info Card */}
          <Card variant="outline" className="bg-dark-800/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-dark-400 text-sm">Produto</p>
                <p className="text-white font-medium">{selectedProduct?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-dark-400 text-sm">Estoque atual</p>
                <p className="text-2xl font-bold text-white">{selectedProduct?.quantity}</p>
              </div>
            </div>
          </Card>

          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Tipo de Movimentação
            </label>
            <Controller
              name="type"
              control={stockForm.control}
              render={({ field }) => (
                <RadioGroup
                  name="stockType"
                  value={field.value}
                  onChange={field.onChange}
                  options={stockTypeOptions}
                  direction="horizontal"
                />
              )}
            />
          </div>

          {/* Quantity */}
          <Input
            label="Quantidade"
            type="number"
            min={1}
            placeholder="1"
            {...stockForm.register('quantity', { min: 1 })}
          />

          {/* Reason */}
          <Input
            label="Motivo"
            placeholder="Ex: Compra de fornecedor, venda avulsa..."
            {...stockForm.register('reason')}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Confirmar Movimentação
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Desativar Produto"
        itemName={deleteDialog.product?.name || ''}
      />
    </PageTransition>
  );
}
