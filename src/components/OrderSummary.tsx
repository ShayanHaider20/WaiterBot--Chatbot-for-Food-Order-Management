import React from 'react';
import { Order } from '../types';

interface OrderSummaryProps {
  order: Order;
  onClose: () => void;
  onConfirm: (orderType: 'Dine-In' | 'Takeaway') => void;
}

export function OrderSummary({ order, onClose, onConfirm }: OrderSummaryProps) {
  const total = Object.entries(order).reduce(
    (sum, [_, { price, quantity }]) => sum + price * quantity,
    0
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-bold">Order Summary</h2>
      <div className="mb-4 space-y-2">
        {Object.entries(order).map(([item, { price, quantity }]) => (
          <div key={item} className="flex justify-between">
            <span>
              {item} x{quantity}
            </span>
            <span>RS.{price * quantity}</span>
          </div>
        ))}
      </div>
      <div className="mb-6 border-t border-gray-200 pt-4">
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>RS.{total}</span>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onConfirm('Dine-In')}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Dine-In
        </button>
        <button
          onClick={() => onConfirm('Takeaway')}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Takeaway
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}