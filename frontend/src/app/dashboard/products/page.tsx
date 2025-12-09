'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  PageTransition,
  FadeIn,
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
  RadioGroup,
  Card,
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
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

  // Category options for SearchableSelect
  const categoryOptions: SelectOption<string>[] = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );

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

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      render: (product: Product) => (
        <div>
          <p className="font-medium text-white">{product.name}</p>
          {product.description && (
            <p className="text-dark-400 text-sm truncate max-w-xs">{product.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (product: Product) => product.category?.name || '-',
    },
    {
      key: 'quantity',
      header: 'Estoque',
      sortable: true,
      render: (product: Product) => {
        const isLowStock = product.quantity <= product.minQuantity;
        return (
          <span>
            <span className={isLowStock ? 'text-red-500 font-semibold' : 'text-white'}>
              {product.quantity}
            </span>
            <span className="text-dark-400"> / {product.minQuantity}</span>
          </span>
        );
      },
    },
    {
      key: 'costPrice',
      header: 'Custo',
      render: (product: Product) => (
        <span className="text-dark-400">{formatCurrency(product.costPrice)}</span>
      ),
    },
    {
      key: 'salePrice',
      header: 'Venda',
      sortable: true,
      render: (product: Product) => (
        <span className="text-green-500 font-semibold">{formatCurrency(product.salePrice)}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margem',
      render: (product: Product) => {
        const margin = ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(0);
        return <span className="text-primary-500">{margin}%</span>;
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openStockModal(product)}
            className="p-2 text-dark-400 hover:text-blue-500 hover:bg-dark-700 rounded-lg transition-colors"
            title="Movimentar estoque"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal(product)}
            className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openDeleteDialog(product)}
            className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <Header title="Produtos" subtitle={`${products.length} produtos`} />

      <div className="p-8">
        <FadeIn>
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => openModal()}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Novo Produto
            </Button>
          </div>
        </FadeIn>

        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : products.length === 0 ? (
          <FadeIn delay={0.1}>
            <EmptyState
              icon={<ShoppingBagIcon className="w-16 h-16" />}
              title="Nenhum produto cadastrado"
              action={<Button onClick={() => openModal()}>Cadastrar</Button>}
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <Table
              data={products}
              columns={columns}
              keyExtractor={(product) => product.id}
            />
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
