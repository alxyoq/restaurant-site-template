import type { MenuSection } from "@/types/content";

export const menuContent: {
  title: string;
  intro: string;
  notice: string;
  sections: MenuSection[];
} = {
  title: "Our Menu",
  intro:
    "Use the sample categories below as a starting point. Replace every item, description, and price with the restaurant’s current menu.",
  notice:
    "Please tell your server about allergies or dietary restrictions. Menu items and prices are subject to change.",
  sections: [
    {
      title: "Breakfast",
      description: "Served during breakfast hours.",
      items: [
        {
          name: "Signature Breakfast",
          price: "$12",
          description: "Replace with the item description and included sides.",
        },
        {
          name: "Seasonal Pancakes",
          price: "$11",
          description: "Replace with current flavors, toppings, and options.",
          tags: ["Vegetarian"],
        },
        {
          name: "Breakfast Sandwich",
          price: "$9",
          description: "Replace with bread, protein, cheese, and add-ons.",
        },
      ],
    },
    {
      title: "Lunch",
      items: [
        {
          name: "House Burger",
          price: "$15",
          description:
            "Replace with the patty, toppings, bun, and included side.",
        },
        {
          name: "Seasonal Salad",
          price: "$13",
          description: "Replace with greens, vegetables, cheese, and dressing.",
          tags: ["Gluten-aware"],
        },
        {
          name: "Chef’s Sandwich",
          price: "$14",
          description: "Replace with the sandwich description and side.",
        },
      ],
    },
    {
      title: "Specialty Selections",
      items: [
        {
          name: "House Specialty",
          price: "$22",
          description: "Feature the dish the restaurant is best known for.",
        },
        {
          name: "Seasonal Entrée",
          price: "Market",
          description: "Use this space for a rotating or market-price item.",
        },
      ],
    },
    {
      title: "Beverages",
      items: [
        { name: "Coffee or Tea", price: "$3" },
        { name: "Fresh Juice", price: "$5" },
        { name: "House Beverage", price: "$4" },
      ],
    },
    {
      title: "Catering",
      description:
        "List popular packages here, or direct guests to contact the restaurant for a custom quote.",
      items: [
        {
          name: "Small Gathering Package",
          price: "Starting at $99",
          description:
            "Replace with serving size and what the package includes.",
        },
        {
          name: "Custom Event Menu",
          price: "Call for pricing",
          description: "Describe available customization and lead time.",
        },
      ],
    },
  ],
};
