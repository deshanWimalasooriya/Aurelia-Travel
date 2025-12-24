// db/seeders/01_hotels.js
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('hotels').del()
    .then(function () {
      // Inserts seed entries
      return knex('hotels').insert([
        {
          name: 'Grand Paris Palace',
          location: 'Paris, France',
          price: 299.99,
          description: 'Luxury 5-star hotel in the heart of Paris with Eiffel Tower views',
          image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500',
          amenities: 'WiFi,Pool,Spa,Gym,Restaurant,AC,Room Service',
          rating: 5
        },
        {
          name: 'Bali Ocean Resort',
          location: 'Seminyak, Bali',
          price: 189.99,
          description: 'Beachfront paradise with private pool villas and sunset views',
          image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=500',
          amenities: 'WiFi,Pool,Beach Access,Spa,Restaurant,AC',
          rating: 4
        },
        {
          name: 'Tokyo Imperial Hotel',
          location: 'Tokyo, Japan',
          price: 399.99,
          description: 'Modern luxury in the heart of Tokyo with rooftop onsen',
          image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500',
          amenities: 'WiFi,Spa,Gym,Restaurant,Onsen,AC,Room Service',
          rating: 5
        },
        {
          name: 'New York Loft Hotel',
          location: 'Manhattan, NYC',
          price: 249.99,
          description: 'Trendy loft-style rooms with skyline views in SoHo',
          image_url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500',
          amenities: 'WiFi,Gym,Restaurant,AC,Room Service',
          rating: 4
        },
        {
          name: 'Maldives Overwater Villa',
          location: 'Maldives',
          price: 599.99,
          description: 'Private overwater bungalow with direct ocean access',
          image_url: 'https://images.unsplash.com/photo-1571896349840-0d6f5f44d49a?w=500',
          amenities: 'WiFi,Private Pool,Butler Service,Spa,AC',
          rating: 5
        }
      ]);
    });
};
