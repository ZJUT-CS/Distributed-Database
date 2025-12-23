INSERT INTO routes (route_id, departure_city, departure_airport, arrival_city, arrival_airport, base_price, estimated_duration, distance_km, create_time, update_time)
VALUES (100, 'Shanghai', 'SHA', 'Beijing', 'PEK', 1000.00, 120, 1200, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO flights (flight_id, flight_no, model_id, route_id, departure_time, arrival_time, departure_city, departure_airport, arrival_city, arrival_airport, airline_company, total_seats, stopover_info, status, create_time, update_time, lowest_price)
VALUES (2000, 'SK100', 10, 100, CURRENT_TIMESTAMP(), DATEADD('MINUTE', 120, CURRENT_TIMESTAMP()), 'Shanghai', 'SHA', 'Beijing', 'PEK', 'SkyLink', 180, '', 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 1000.00);

INSERT INTO aircraft_cabin_configs (config_id, model_id, cabin_type, cabin_coefficient, cabin_layout_no, capacity, default_carry_on, default_checked, default_services, start_row_num, seat_col_layout)
VALUES (300, 10, 'ECONOMY', 1.0, 1, 5, '1pc', '1pc', 'basic', 1, 'ABCDEF');

INSERT INTO users (user_id, phone_number, password_hash, real_name, email, avatar_url, id_card, gender, user_status, create_time)
VALUES (5000, '13800000000', 'hash', 'Test User', 'test@example.com', NULL, NULL, 1, 1, CURRENT_TIMESTAMP());

