CREATE DATABASE IF NOT EXISTS ds_0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS ds_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS db0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ds_0;
CREATE TABLE IF NOT EXISTS t_order_0 (
  order_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50),
  PRIMARY KEY (order_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_1 (
  order_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50),
  PRIMARY KEY (order_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_item_0 (
  item_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product VARCHAR(50),
  qty INT,
  PRIMARY KEY (item_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_item_1 (
  item_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product VARCHAR(50),
  qty INT,
  PRIMARY KEY (item_id)
) ENGINE=InnoDB;

USE ds_1;
CREATE TABLE IF NOT EXISTS t_order_0 (
  order_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50),
  PRIMARY KEY (order_id)
) ENGINE=InnoDB;

-- XUC schema for db0
USE db0;
CREATE TABLE IF NOT EXISTS xuc_stu (
  xuc_sno BIGINT NOT NULL,
  name VARCHAR(50),
  PRIMARY KEY (xuc_sno)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS xuc_cou (
  xuc_cno BIGINT NOT NULL,
  title VARCHAR(100),
  PRIMARY KEY (xuc_cno)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS xuc_sc (
  id BIGINT NOT NULL AUTO_INCREMENT,
  xuc_sno BIGINT NOT NULL,
  xuc_cno BIGINT NOT NULL,
  grade INT,
  PRIMARY KEY (id),
  KEY idx_sc_sno (xuc_sno),
  KEY idx_sc_cno (xuc_cno)
) ENGINE=InnoDB;

-- XUC schema for db1
USE db1;
CREATE TABLE IF NOT EXISTS xuc_stu (
  xuc_sno BIGINT NOT NULL,
  name VARCHAR(50),
  PRIMARY KEY (xuc_sno)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS xuc_cou (
  xuc_cno BIGINT NOT NULL,
  title VARCHAR(100),
  PRIMARY KEY (xuc_cno)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS xuc_sc (
  id BIGINT NOT NULL AUTO_INCREMENT,
  xuc_sno BIGINT NOT NULL,
  xuc_cno BIGINT NOT NULL,
  grade INT,
  PRIMARY KEY (id),
  KEY idx_sc_sno (xuc_sno),
  KEY idx_sc_cno (xuc_cno)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_1 (
  order_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50),
  PRIMARY KEY (order_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_item_0 (
  item_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product VARCHAR(50),
  qty INT,
  PRIMARY KEY (item_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS t_order_item_1 (
  item_id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product VARCHAR(50),
  qty INT,
  PRIMARY KEY (item_id)
) ENGINE=InnoDB;