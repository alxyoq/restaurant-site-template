export type NavigationItem = {
  href: string;
  label: string;
};

export type ContentLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type FeaturedSection = {
  title: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  cta?: ContentLink;
};

export type MenuItem = {
  name: string;
  price: string;
  description?: string;
  tags?: string[];
};

export type MenuSection = {
  title: string;
  description?: string;
  items: MenuItem[];
};

export type Review = {
  name: string;
  date: string;
  content: string;
  rating: number;
  source: string;
  link?: string;
  featured?: boolean;
};

export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};
