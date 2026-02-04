import { CartService } from './cart.service';

const STORAGE_KEY = 'jj_store_cart_items';

describe('CartService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('adiciona item e soma subtotal corretamente', () => {
    const service = new CartService();

    const result = service.addProduct({
      id: 'produto-1',
      name: 'Cafeteira',
      price: 350,
      imageUrl: null,
      stockQuantity: 3,
    });

    expect(result.success).toBe(true);
    expect(service.items()).toHaveLength(1);
    expect(service.totalItems()).toBe(1);
    expect(service.subtotal()).toBe(350);
  });

  it('retorna erro ao ultrapassar estoque disponivel', () => {
    const service = new CartService();

    service.addProduct({
      id: 'produto-1',
      name: 'Cafeteira',
      price: 350,
      imageUrl: null,
      stockQuantity: 1,
    });

    const result = service.addProduct({
      id: 'produto-1',
      name: 'Cafeteira',
      price: 350,
      imageUrl: null,
      stockQuantity: 1,
    });

    expect(result).toEqual({
      success: false,
      mensagem: 'Quantidade indisponível em estoque.',
    });
  });

  it('persiste itens no localStorage e restaura no novo service', () => {
    const service = new CartService();

    service.addProduct({
      id: 'produto-1',
      name: 'Cafeteira',
      price: 350,
      imageUrl: null,
      stockQuantity: 3,
    });

    const reloadedService = new CartService();

    expect(reloadedService.items()).toHaveLength(1);
    expect(reloadedService.items()[0].name).toBe('Cafeteira');
  });
});
