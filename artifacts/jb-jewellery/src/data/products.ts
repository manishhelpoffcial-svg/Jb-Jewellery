export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

export const products: Product[] = [
  { id: "1", name: "Pearl Drop Earrings", price: 299, originalPrice: 599, discount: 50, category: "Earrings", rating: 4.8, reviews: 124, isBestseller: true },
  { id: "2", name: "Gold Hoop Earrings", price: 199, originalPrice: 399, discount: 50, category: "Earrings", rating: 4.9, reviews: 89, isBestseller: true },
  { id: "3", name: "Layered Necklace Set", price: 499, originalPrice: 899, discount: 44, category: "Necklaces", rating: 4.7, reviews: 201, isBestseller: true },
  { id: "4", name: "Butterfly Hair Clips Set", price: 149, originalPrice: 299, discount: 50, category: "Hair Accessories", rating: 4.8, reviews: 67, isNew: true },
  { id: "5", name: "Floral Finger Ring", price: 99, originalPrice: 199, discount: 50, category: "Rings", rating: 4.6, reviews: 45, isNew: true },
  { id: "6", name: "Gold Chain Bracelet", price: 249, originalPrice: 499, discount: 50, category: "Bracelets", rating: 4.9, reviews: 156, isBestseller: true },
  { id: "7", name: "Diamond Choker Necklace", price: 399, originalPrice: 799, discount: 50, category: "Necklaces", rating: 4.8, reviews: 98, isBestseller: true },
  { id: "8", name: "Star Stud Earrings", price: 149, originalPrice: 299, discount: 50, category: "Earrings", rating: 4.7, reviews: 112 },
  { id: "9", name: "Adjustable Bangles Set", price: 299, originalPrice: 599, discount: 50, category: "Bracelets", rating: 4.8, reviews: 78, isNew: true },
  { id: "10", name: "Crystal Ring Set", price: 199, originalPrice: 399, discount: 50, category: "Rings", rating: 4.9, reviews: 134, isBestseller: true },
  { id: "11", name: "Long Tassel Earrings", price: 249, originalPrice: 499, discount: 50, category: "Earrings", rating: 4.7, reviews: 56 },
  { id: "12", name: "Delicate Chain Anklet", price: 149, originalPrice: 299, discount: 50, category: "Bracelets", rating: 4.8, reviews: 89, isNew: true },
  { id: "13", name: "Oxidized Silver Earrings", price: 179, originalPrice: 349, discount: 49, category: "Earrings", rating: 4.6, reviews: 43 },
  { id: "14", name: "Gold Leaf Necklace", price: 449, originalPrice: 899, discount: 50, category: "Necklaces", rating: 4.9, reviews: 167, isBestseller: true },
  { id: "15", name: "Scrunchie Hair Band", price: 99, originalPrice: 199, discount: 50, category: "Hair Accessories", rating: 4.5, reviews: 34 },
  { id: "16", name: "Kundan Ring", price: 249, originalPrice: 499, discount: 50, category: "Rings", rating: 4.8, reviews: 91, isBestseller: true },
  { id: "17", name: "Beaded Bracelet Set", price: 199, originalPrice: 399, discount: 50, category: "Bracelets", rating: 4.7, reviews: 62 },
  { id: "18", name: "Geometric Stud Earrings", price: 129, originalPrice: 259, discount: 50, category: "Earrings", rating: 4.6, reviews: 47, isNew: true },
  { id: "19", name: "Pearl Choker", price: 349, originalPrice: 699, discount: 50, category: "Necklaces", rating: 4.8, reviews: 118, isNew: true },
  { id: "20", name: "Floral Hair Pin Set", price: 129, originalPrice: 259, discount: 50, category: "Hair Accessories", rating: 4.7, reviews: 52 },
];
