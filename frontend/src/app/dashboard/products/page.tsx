'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { productsApi } from '@/lib/api';
import { Product, ProductCategory } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ShoppingBagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Produto desativado!');
      fetchData();
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

  if (isLoading) return <PageLoading />;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <Header title="Produtos" subtitle={`${products.length} produtos`} />

      <div className="p-8">
        <div className="flex justify-end mb-6">
          <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Novo Produto
          </button>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon className="w-16 h-16" />}
            title="Nenhum produto cadastrado"
            action={<button onClick={() => openModal()} className="btn btn-primary">Cadastrar</button>}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Custo</th>
                  <th>Venda</th>
                  <th>Margem</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const margin = ((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(0);
                  const isLowStock = product.quantity <= product.minQuantity;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-dark-400 text-sm">{product.description}</p>
                        </div>
                      </td>
                      <td>{product.category?.name}</td>
                      <td>
                        <span className={isLowStock ? 'text-red-500 font-semibold' : 'text-white'}>
                          {product.quantity}
                        </span>
                        <span className="text-dark-400"> / {product.minQuantity}</span>
                      </td>
                      <td className="text-dark-400">{formatCurrency(product.costPrice)}</td>
                      <td className="text-green-500 font-semibold">{formatCurrency(product.salePrice)}</td>
                      <td className="text-primary-500">{margin}%</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openStockModal(product)} className="p-2 text-dark-400 hover:text-blue-500" title="Movimentar estoque">
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => openModal(product)} className="p-2 text-dark-400 hover:text-primary-500">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-dark-400 hover:text-red-500">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" {...register('name', { required: 'Obrigatório' })} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" {...register('description')} />
          </div>
          <div>
            <label className="label">Categoria *</label>
            <select className="input" {...register('categoryId', { required: 'Obrigatório' })}>
              <option value="">Selecione...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade</label>
              <input type="number" className="input" {...register('quantity')} />
            </div>
            <div>
              <label className="label">Estoque Mínimo</label>
              <input type="number" className="input" {...register('minQuantity')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Preço de Custo *</label>
              <input type="number" step="0.01" className="input" {...register('costPrice', { required: 'Obrigatório' })} />
            </div>
            <div>
              <label className="label">Preço de Venda *</label>
              <input type="number" step="0.01" className="input" {...register('salePrice', { required: 'Obrigatório' })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Movimentar Estoque">
        <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4">
          <p className="text-dark-300">Produto: <span className="text-white font-medium">{selectedProduct?.name}</span></p>
          <p className="text-dark-300">Estoque atual: <span className="text-white font-medium">{selectedProduct?.quantity}</span></p>
          <div>
            <label className="label">Tipo de Movimentação</label>
            <select className="input" {...stockForm.register('type')}>
              <option value="ENTRY">Entrada</option>
              <option value="EXIT">Saída</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="label">Quantidade</label>
            <input type="number" min="1" className="input" {...stockForm.register('quantity')} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" placeholder="Ex: Compra de fornecedor" {...stockForm.register('reason')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Confirmar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
