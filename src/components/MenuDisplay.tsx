import React from 'react';
import { menu } from '../data/menu';

export function MenuDisplay() {
  return (
    <div className="grid gap-6 p-4">
      {Object.entries(menu).map(([category, items]) => (
        <div key={category} className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-800">{category}</h2>
          <div className="grid gap-2">
            {Object.entries(items).map(([item, price]) => (
              <div key={item} className="flex justify-between">
                <span className="text-gray-700">{item}</span>
                <span className="font-medium text-gray-900">RS.{price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}