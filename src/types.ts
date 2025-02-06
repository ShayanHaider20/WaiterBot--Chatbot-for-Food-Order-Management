export interface MenuItem {
  price: number;
}

export interface MenuCategory {
  [key: string]: MenuItem;
}

export interface Menu {
  [category: string]: {
    [item: string]: number;
  };
}

export interface OrderItem {
  price: number;
  quantity: number;
}

export interface Order {
  [item: string]: OrderItem;
}

export interface Message {
  type: 'user' | 'bot';
  content: string;
}