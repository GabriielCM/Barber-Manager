'use client';

import { useEffect, useState } from 'react';
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
} from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { productsApi } from '@/lib/api';
import { Product, ProductCategory } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ShoppingBagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const stockForm = useForm();

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
        costPrice: product.costPrice,
        salePrice: product.salePrice,
      });
    } else {
      setEditingProduct(null);
      reset({ name: '', description: '', categoryId: '', quantity: 0, minQuantity: 5, costPrice: '', salePrice: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); reset(); };

  const onSubmit = async (data: any) => {
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

  const onStockSubmit = async (data: any) => {
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

  const stockTypeOptions = [
    { value: 'ENTRY', label: 'Entrada' },
    { value: 'EXIT', label: 'Saída' },
    { value: 'ADJUSTMENT', label: 'Ajuste' },
  ];

  const categoryOptions = [
    { value: '', label: 'Selecione...' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
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
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            required
            error={errors.name?.message as string}
            {...register('name', { required: 'Obrigatório' })}
          />
          <Textarea
            label="Descrição"
            {...register('description')}
            rows={2}
          />
          <Select
            label="Categoria"
            required
            options={categoryOptions}
            error={errors.categoryId?.message as string}
            {...register('categoryId', { required: 'Obrigatório' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              {...register('quantity')}
            />
            <Input
              label="Estoque Mínimo"
              type="number"
              {...register('minQuantity')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço de Custo"
              type="number"
              step="0.01"
              required
              error={errors.costPrice?.message as string}
              {...register('costPrice', { required: 'Obrigatório' })}
            />
            <Input
              label="Preço de Venda"
              type="number"
              step="0.01"
              required
              error={errors.salePrice?.message as string}
              {...register('salePrice', { required: 'Obrigatório' })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Movimentar Estoque">
        <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4">
          <FadeIn>
            <div className="bg-dark-800 p-4 rounded-lg mb-4">
              <p className="text-dark-300">Produto: <span className="text-white font-medium">{selectedProduct?.name}</span></p>
              <p className="text-dark-300">Estoque atual: <span className="text-white font-medium">{selectedProduct?.quantity}</span></p>
            </div>
          </FadeIn>
          <Select
            label="Tipo de Movimentação"
            options={stockTypeOptions}
            {...stockForm.register('type')}
          />
          <Input
            label="Quantidade"
            type="number"
            min={1}
            {...stockForm.register('quantity')}
          />
          <Input
            label="Motivo"
            placeholder="Ex: Compra de fornecedor"
            {...stockForm.register('reason')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Confirmar</Button>
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
