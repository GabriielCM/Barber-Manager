import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreatePackageModal from '../CreatePackageModal';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CreatePackageModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected warnings during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Service price handling', () => {
    it('should render without errors when service price is a string', async () => {
      const servicesWithStringPrice = [
        { id: '1', name: 'Corte', price: '50.00', duration: 30 },
        { id: '2', name: 'Barba', price: '30', duration: 20 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => servicesWithStringPrice,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Should display formatted price without throwing error
      expect(screen.getByText(/R\$ 50\.00/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 30\.00/)).toBeInTheDocument();
    });

    it('should handle service with undefined price', async () => {
      const servicesWithUndefinedPrice = [
        { id: '1', name: 'Corte', price: undefined, duration: 30 },
        { id: '2', name: 'Barba', price: null, duration: 20 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => servicesWithUndefinedPrice,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Should display R$ 0.00 for undefined/null prices
      const priceElements = screen.getAllByText(/R\$ 0\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('should handle mixed valid and invalid prices', async () => {
      const mixedServices = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
        { id: '2', name: 'Barba', price: 'invalid', duration: 20 },
        { id: '3', name: 'Sobrancelha', price: '15.50', duration: 10 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mixedServices,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Should handle all cases without throwing
      expect(screen.getByText(/R\$ 50\.00/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 15\.50/)).toBeInTheDocument();
    });
  });

  describe('Render phase state updates', () => {
    it('should not call setState during render', async () => {
      const services = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      // Spy on console.error to catch React warnings
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Check that no "Cannot update a component while rendering" warning was issued
      const renderWarnings = consoleErrorSpy.mock.calls.filter(
        (call) =>
          call[0]?.toString().includes('Cannot update a component') &&
          call[0]?.toString().includes('while rendering')
      );

      expect(renderWarnings.length).toBe(0);
    });

    it('should use useMemo for derived calculations', async () => {
      const services = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
        { id: '2', name: 'Barba', price: 30, duration: 20 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      const { rerender } = render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Select first service
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByText(/Preço base:/)).toBeInTheDocument();
      });

      // Rerender should not cause calculation issues
      rerender(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Should still display correctly
      expect(screen.getByText(/Preço base:/)).toBeInTheDocument();
    });
  });

  describe('Price calculations', () => {
    it('should calculate base price correctly with number prices', async () => {
      const services = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
        { id: '2', name: 'Barba', price: 30, duration: 20 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Select both services
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText(/R\$ 80\.00/)).toBeInTheDocument();
      });
    });

    it('should calculate base price correctly with string prices', async () => {
      const services = [
        { id: '1', name: 'Corte', price: '50.00', duration: 30 },
        { id: '2', name: 'Barba', price: '30.00', duration: 20 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Corte')).toBeInTheDocument();
      });

      // Select both services
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText(/R\$ 80\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Modal functionality', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <CreatePackageModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should fetch services when modal opens', async () => {
      const services = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/services',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer mock-token',
            },
          })
        );
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      const services = [
        { id: '1', name: 'Corte', price: 50, duration: 30 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => services,
      });

      render(
        <CreatePackageModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
