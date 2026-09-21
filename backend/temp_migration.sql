
      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_margarita_pizza', 'Margarita Pizza', 100, 'Pizza', '/icons/pizza.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_corn_cheese_pizza', 'Corn Cheese Pizza', 110, 'Pizza', '/icons/pizza.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_farmhouse_pizza', 'Farmhouse Pizza', 170, 'Pizza', '/icons/pizza.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_paneer_pizza', 'Paneer Pizza', 150, 'Pizza', '/icons/pizza.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_vegie_pizza', 'Vegie Pizza', 150, 'Pizza', '/icons/pizza.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_veg_cheese_grill_sandwich', 'Veg Cheese Grill Sandwich', 100, 'Sandwich', '/icons/sandwich.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_paneer_grill_sandwich', 'Paneer Grill Sandwich', 120, 'Sandwich', '/icons/sandwich.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_club_sandwich', 'Club Sandwich', 70, 'Sandwich', '/icons/sandwich.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_corn_cheese_sandwich', 'Corn Cheese Sandwich', 120, 'Sandwich', '/icons/sandwich.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_aloo_tikki_burger', 'Aloo Tikki Burger', 90, 'Burger', '/icons/burger.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_aloo_cheese_burger', 'Aloo Cheese Burger', 120, 'Burger', '/icons/burger.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_paneer_burger', 'Paneer Burger', 130, 'Burger', '/icons/burger.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_peri_peri_burger', 'Peri Peri Burger', 150, 'Burger', '/icons/burger.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_white_sauce_pasta', 'White Sauce Pasta', 180, 'Pasta', '/icons/pasta.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_red_sauce_pasta', 'Red Sauce Pasta', 180, 'Pasta', '/icons/pasta.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_mix_sauce_pasta', 'Mix Sauce Pasta', 200, 'Pasta', '/icons/pasta.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_garlic_toast', 'Garlic Toast', 110, 'Toast', '/icons/toast.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_cheese_chili_toast', 'Cheese Chili Toast', 120, 'Toast', '/icons/toast.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_salsa_nachos', 'Salsa Nachos', 110, 'Nachos', '/icons/nachos.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_loaded_nachos', 'Loaded Nachos', 140, 'Nachos', '/icons/nachos.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_salted_fries', 'Salted Fries', 70, 'Fries', '/icons/fries.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_masala_fries', 'Masala Fries', 100, 'Fries', '/icons/fries.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_peri_peri_fries', 'Peri Peri Fries', 80, 'Fries', '/icons/fries.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_cheese_fries', 'Cheese Fries', 150, 'Fries', '/icons/fries.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_loaded_fries', 'Loaded Fries', 160, 'Fries', '/icons/fries.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_masala_maggi', 'Masala Maggi', 80, 'Maggi', '/images/maggie.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_vegetable_maggi', 'Vegetable Maggi', 110, 'Maggi', '/images/maggie.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_cheese_maggi', 'Cheese Maggi', 100, 'Maggi', '/images/maggie.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_tandoor_maggi', 'Tandoor Maggi', 110, 'Maggi', '/images/maggie.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_red_sauce_spaghetti', 'Red Sauce Spaghetti', 200, 'Spaghetti', '/icons/spaghetti.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_white_sauce_spaghetti', 'White Sauce Spaghetti', 200, 'Spaghetti', '/icons/spaghetti.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_mix_sauce_spaghetti', 'Mix Sauce Spaghetti', 250, 'Spaghetti', '/icons/spaghetti.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_brownie_sizzling', 'Brownie Sizzling', 150, 'Dessert', '/icons/dessert.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_plain_brownie', 'Plain Brownie', 110, 'Dessert', '/icons/dessert.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_fudge_brownie', 'Fudge Brownie', 120, 'Dessert', '/icons/dessert.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_plain_cold_coffee', 'Plain Cold Coffee', 80, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_irish_cold_coffee', 'Irish Cold Coffee', 100, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_chocolate_cold_coffee', 'Chocolate Cold Coffee', 100, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_hazelnut_cold_coffee', 'Hazelnut Cold Coffee', 100, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_cold_coffee_with_ice_cream', 'Cold Coffee with Ice Cream', 100, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_brownie_cold_coffee', 'Brownie Cold Coffee', 150, 'Coffee', '/icons/coffee.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_strawberry_shake', 'Strawberry Shake', 90, 'Shake', '/images/shake.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_mango_shake', 'Mango Shake', 90, 'Shake', '/images/shake.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_chocolate_milk_shake', 'Chocolate Milk Shake', 90, 'Shake', '/images/shake.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_brownie_milk_shake', 'Brownie Milk Shake', 110, 'Shake', '/images/shake.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_corn_cheese_ball', 'Corn Cheese Ball', 130, 'Nuggets', '/images/nuggets.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_potato_cheese_ball', 'Potato Cheese Ball', 110, 'Nuggets', '/images/nuggets.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_mojito', 'Mojito', 90, 'Mocktail', '/images/mocktail.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_green_applemocktail', 'Green AppleMocktail', 90, 'Mocktail', '/images/mocktail.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_lemonade', 'Lemonade', 90, 'Mocktail', '/images/mocktail.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    

      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('prod_masala_lemonade', 'Masala Lemonade', 110, 'Mocktail', '/images/mocktail.png', 1, '2026-09-16T10:52:00.932Z')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    