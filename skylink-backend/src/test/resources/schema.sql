DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS seat;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS aircraft_cabin_configs;
DROP TABLE IF EXISTS users;

CREATE TABLE routes (
  route_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  departure_city VARCHAR(64),
  departure_airport VARCHAR(16),
  arrival_city VARCHAR(64),
  arrival_airport VARCHAR(16),
  base_price DECIMAL(12,2),
  estimated_duration INT,
  distance_km INT,
  create_time TIMESTAMP,
  update_time TIMESTAMP
);

CREATE TABLE flights (
  flight_id BIGINT PRIMARY KEY,
  flight_no VARCHAR(32),
  model_id BIGINT,
  route_id BIGINT,
  departure_time TIMESTAMP,
  arrival_time TIMESTAMP,
  departure_city VARCHAR(64),
  departure_airport VARCHAR(16),
  arrival_city VARCHAR(64),
  arrival_airport VARCHAR(16),
  airline_company VARCHAR(64),
  total_seats INT,
  stopover_info VARCHAR(255),
  status INT,
  create_time TIMESTAMP,
  update_time TIMESTAMP,
  lowest_price DECIMAL(12,2)
);

CREATE TABLE aircraft_cabin_configs (
  config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  model_id BIGINT,
  cabin_type VARCHAR(32),
  cabin_coefficient DECIMAL(12,4),
  cabin_layout_no INT,
  capacity INT,
  default_carry_on VARCHAR(64),
  default_checked VARCHAR(64),
  default_services VARCHAR(255),
  start_row_num INT,
  seat_col_layout VARCHAR(32)
);

CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,
  phone_number VARCHAR(32),
  password_hash VARCHAR(255),
  real_name VARCHAR(64),
  email VARCHAR(128),
  avatar_url VARCHAR(255),
  id_card VARCHAR(64),
  gender INT,
  user_status INT,
  create_time TIMESTAMP
);

CREATE TABLE seat (
  seat_id BIGINT PRIMARY KEY,
  flight_id BIGINT,
  seat_number VARCHAR(16),
  cabin_type VARCHAR(32),
  status INT,
  update_time TIMESTAMP,
  version INT,
  order_id BIGINT,
  passenger_index INT
);

CREATE TABLE orders (
  order_id BIGINT PRIMARY KEY,
  user_id BIGINT,
  flight_id BIGINT,
  cabin_id BIGINT,
  order_status INT,
  ticket_num INT,
  total_amount DECIMAL(12,2),
  passenger_name VARCHAR(64),
  contact_email VARCHAR(128),
  contact_phone VARCHAR(32),
  passengers_json CLOB,
  seat_id BIGINT,
  order_time TIMESTAMP,
  audit_time TIMESTAMP,
  pay_time TIMESTAMP,
  refund_time TIMESTAMP,
  change_time TIMESTAMP,
  create_time TIMESTAMP,
  update_time TIMESTAMP,
  parent_order_id BIGINT,
  trip_type INT,
  flight_snapshot CLOB
);

