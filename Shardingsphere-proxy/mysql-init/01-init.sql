-- sharding_db.admins definition

CREATE TABLE `admins` (
  `admin_id` bigint NOT NULL COMMENT '后端标识(雪花算法)',
  `admin_account` varchar(50) NOT NULL COMMENT '管理员账号',
  `password_hash` varchar(255) NOT NULL COMMENT '加密密码',
  `role` tinyint DEFAULT '2' COMMENT '角色',
  `last_login_time` bigint DEFAULT NULL COMMENT '最后登录时间',
  `create_time` bigint NOT NULL COMMENT '创建时间戳',
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `uk_admin_account` (`admin_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';

-- sharding_db.aircraft_cabin_configs definition

CREATE TABLE `aircraft_cabin_configs` (
  `config_id` bigint NOT NULL AUTO_INCREMENT,
  `model_id` bigint NOT NULL COMMENT '关联机型ID',
  `cabin_type` varchar(20) NOT NULL COMMENT '舱位类型 (ECONOMY, BUSINESS, FIRST)',
  `cabin_coefficient` decimal(3,1) NOT NULL COMMENT '舱位系数（最终票价=航线基础价×该系数×季节/供需系数）',
  `cabin_layout_no` tinyint NOT NULL COMMENT '舱位布局方案号（如1/2/3，标识机型的第N种布局方案）',
  `capacity` int NOT NULL COMMENT '该舱位分配的座位数',
  
  -- 【核心新增字段】用于生成真实座位号
  `start_row_num` int NOT NULL DEFAULT 1 COMMENT '起始行号 (如经济舱从31排开始)',
  `seat_col_layout` varchar(20) NOT NULL DEFAULT 'ABCDEF' COMMENT '列布局规则 (如 ABCDEF 或 ACHK)',
  
  `default_carry_on` varchar(50) DEFAULT '7KG',
  `default_checked` varchar(50) DEFAULT '20KG',
  `default_services` text COMMENT '该舱位默认服务描述',
  
  PRIMARY KEY (`config_id`),
  KEY `model_id` (`model_id`),
  CONSTRAINT `aircraft_cabin_configs_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `aircraft_models` (`model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='机型舱位配置详情';

-- sharding_db.aircraft_models definition

CREATE TABLE `aircraft_models` (
  `model_id` bigint NOT NULL AUTO_INCREMENT,
  `model_name` varchar(50) NOT NULL COMMENT '机型名称 (如: Boeing 737-800)',
  `manufacturer` varchar(50) DEFAULT NULL COMMENT '制造商 (Boeing/Airbus)',
  `total_physical_seats` int NOT NULL COMMENT '物理座位总上限',
  PRIMARY KEY (`model_id`),
  UNIQUE KEY `model_name` (`model_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='机型基础信息表';

-- sharding_db.flights definition

CREATE TABLE `flights` (
  `flight_id` bigint NOT NULL COMMENT '航班ID，主键(雪花算法生成)',
  `flight_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班班次（如CA1234，注意：每天可复用，不能仅对 flight_no 设唯一键）',
  `model_id` bigint NOT NULL COMMENT '机型ID (关联 aircraft_models，用于确定总座位和布局)',
  `route_id` bigint NOT NULL COMMENT '航线ID (关联 routes，用于确定基准票价和预计时长)',
  `departure_time` datetime NOT NULL COMMENT '计划起飞时间',
  `arrival_time` datetime NOT NULL COMMENT '计划到达时间',
  `departure_city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '出发城市 (冗余)',
  `departure_airport` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '出发机场 (冗余)',
  `arrival_city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '到达城市 (冗余)',
  `arrival_airport` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '到达机场 (冗余)',
  `airline_company` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航空公司',
  `total_seats` int NOT NULL COMMENT '总座位数 (从 aircraft_models 冗余，方便显示余票进度)',
  `stopover_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '经停信息',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1-计划中，2-取消，3-延误，4-已起飞，5-已到达',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `lowest_price` decimal(10,2) DEFAULT NULL COMMENT '最低票价(冗余字段，用于列表展示)',
  PRIMARY KEY (`flight_id`),
  UNIQUE KEY `uk_flight_no_departure_time` (`flight_no`,`departure_time`),
  KEY `idx_flight_no` (`flight_no`),
  KEY `idx_flight_no_id` (`flight_no`,`flight_id`),
  KEY `idx_route_date` (`departure_city`,`arrival_city`,`departure_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班计划/实例表';

-- sharding_db.orders definition

CREATE TABLE `orders` (
  `order_id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID，主键',
  `user_id` bigint NOT NULL COMMENT '关联用户ID',
  `flight_id` bigint NOT NULL COMMENT '关联航班ID',
  `cabin_id` bigint NOT NULL COMMENT '关联舱位ID',
  `order_status` tinyint NOT NULL DEFAULT '0' COMMENT '订单状态：0-待支付，1-已支付，2-已取消，3-已退票，4-改签中，5-改签完成',
  `ticket_num` int NOT NULL DEFAULT '1' COMMENT '购票数量',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额（元）',
  `passenger_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '乘客姓名(下单时记录)',
  `contact_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系邮箱(下单时记录)',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系手机(下单时记录)',
  `passengers_json` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '乘客信息JSON(下单时记录)',
  `seat_id` bigint DEFAULT NULL COMMENT '座位ID',
  `order_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  `pay_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `refund_time` datetime DEFAULT NULL COMMENT '退票完成时间',
  `change_time` datetime DEFAULT NULL COMMENT '改签完成时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `parent_order_id` bigint DEFAULT NULL COMMENT '父订单ID(联程票关联键)',
  `trip_type` tinyint DEFAULT '0' COMMENT '类型:0-独立,1-联程首段,2-联程后段',
  `flight_snapshot` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '航班快照JSON(下单时记录)',
  PRIMARY KEY (`order_id`),
  KEY `idx_user_order` (`user_id`,`order_time`) COMMENT '用户订单查询索引',
  KEY `idx_flight_order` (`flight_id`,`order_status`) COMMENT '航班订单统计索引',
  KEY `idx_order_status` (`order_status`) COMMENT '订单状态筛选索引',
  KEY `idx_parent_order` (`parent_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机票订单核心表';

-- sharding_db.payments definition

CREATE TABLE `payments` (
  `payment_id` bigint NOT NULL COMMENT '支付ID，主键(雪花算法生成)',
  `order_id` bigint NOT NULL COMMENT '关联机票订单ID（唯一）',
  `payment_amount` decimal(10,2) NOT NULL COMMENT '支付金额（元）',
  `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付方式：wechat-微信，alipay-支付宝，card-银行卡',
  `payment_status` tinyint NOT NULL DEFAULT '0' COMMENT '支付状态：0-待支付，1-已支付，2-支付失败，3-退款中，4-已退款',
  `trade_no` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '第三方交易流水号（唯一，如微信/支付宝单号）',
  `payment_time` datetime DEFAULT NULL COMMENT '支付完成时间',
  `refund_time` datetime DEFAULT NULL COMMENT '退款完成时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  UNIQUE KEY `uk_trade_no` (`trade_no`),
  KEY `idx_payment_status` (`payment_status`) COMMENT '支付状态筛选索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付订单表';

-- sharding_db.refund_change_record definition

CREATE TABLE `refund_change_record` (
  `record_id` bigint NOT NULL COMMENT '记录ID，主键(雪花算法生成)',
  `order_id` bigint NOT NULL COMMENT '关联机票订单ID',
  `oper_type` tinyint NOT NULL COMMENT '操作类型：1-退票，2-改签',
  `old_flight_id` bigint NOT NULL COMMENT '原航班ID',
  `new_flight_id` bigint DEFAULT NULL COMMENT '新航班ID（改签用，退票为NULL）',
  `old_cabin_id` bigint NOT NULL COMMENT '原舱位ID',
  `new_cabin_id` bigint DEFAULT NULL COMMENT '新舱位ID（改签用，退票为NULL）',
  `oper_user_id` bigint NOT NULL COMMENT '操作人ID（用户ID/管理员ID）',
  `oper_user_type` tinyint NOT NULL COMMENT '操作人类型：1-用户，2-管理员',
  `audit_status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0-待审核，1-审核通过，2-审核拒绝',
  `oper_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作发起时间',
  `audit_time` datetime DEFAULT NULL COMMENT '审核完成时间',
  `audit_admin_id` bigint DEFAULT NULL COMMENT '审核管理员ID',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作/审核备注',
  PRIMARY KEY (`record_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_old_flight_id` (`old_flight_id`),
  KEY `idx_new_flight_id` (`new_flight_id`),
  KEY `idx_audit_status` (`audit_status`) COMMENT '审核状态筛选索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退票/改签操作记录表';

-- sharding_db.routes definition

CREATE TABLE `routes` (
  `route_id` bigint NOT NULL AUTO_INCREMENT COMMENT '航线ID',
  `departure_city` varchar(50) NOT NULL COMMENT '出发城市 (如: 上海)',
  `departure_airport` varchar(50) NOT NULL COMMENT '出发机场三字码 (如: SHA)',
  `arrival_city` varchar(50) NOT NULL COMMENT '到达城市 (如: 北京)',
  `arrival_airport` varchar(50) NOT NULL COMMENT '到达机场三字码 (如: PEK)',
  `base_price` decimal(10,2) NOT NULL COMMENT '经济舱基准票价 (用于计算)',
  `estimated_duration` int DEFAULT NULL COMMENT '预计飞行时长 (分钟)',
  `distance_km` int DEFAULT NULL COMMENT '航线距离 (公里)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间 (数据变动时自动更新)',
  PRIMARY KEY (`route_id`),
  UNIQUE KEY `uk_route` (`departure_airport`,`arrival_airport`) COMMENT '防止重复录入同一航线'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='航线基础信息表';

-- sharding_db.seat definition

CREATE TABLE `seat` (
  `seat_id` bigint NOT NULL AUTO_INCREMENT COMMENT '座位ID（自增主键）',
  `flight_id` bigint NOT NULL COMMENT '所属航班ID（关联航班表flight的主键）',
  `seat_number` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '座位号（如：12A、3B）',
  `cabin_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '舱位等级（如：ECONOMY/BUSINESS/FIRST）',
  `status` tinyint NOT NULL COMMENT '座位状态：1-可用，2-已售，3-锁定',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间（自动更新）',
  `version` int NOT NULL DEFAULT '0' COMMENT '乐观锁版本号',
  `order_id` bigint DEFAULT NULL COMMENT '占用该座位的订单ID',
  `passenger_index` int DEFAULT '0' COMMENT '对应订单中第几位乘客(处理多座订单)',
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uk_flight` (`flight_id`,`seat_number`),
  KEY `idx_flight_id` (`flight_id`),
  KEY `idx_cabin_type` (`cabin_type`),
  KEY `idx_status` (`status`),
  KEY `idx_flight_status` (`flight_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=1209529667754110978 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班座位信息表';

-- sharding_db.system_config definition

CREATE TABLE `system_config` (
  `config_id` bigint NOT NULL COMMENT '配置ID，主键(雪花算法生成)',
  `config_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置项名称（唯一，如payment_timeout/flight_cache_ttl）',
  `config_value` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置项值（如1800/3600）',
  `config_desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置项描述（如支付超时时间/航班缓存过期时间）',
  `effective_time` datetime NOT NULL COMMENT '配置生效时间',
  `oper_admin_id` bigint NOT NULL COMMENT '操作管理员ID',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_config_name` (`config_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- sharding_db.system_log definition

CREATE TABLE `system_log` (
  `log_id` bigint NOT NULL COMMENT '日志ID，主键(雪花算法生成)',
  `oper_user_type` tinyint NOT NULL COMMENT '操作人类型：1-用户，2-管理员',
  `oper_user_id` bigint NOT NULL COMMENT '操作人ID（用户ID/管理员ID）',
  `oper_module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作模块：flight-航班管理，order-订单管理，user-用户管理，payment-支付管理，config-系统配置',
  `oper_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型：query-查询，add-添加，update-修改，delete-删除，login-登录，audit-审核',
  `oper_content` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作内容（如“修改航班CA1234出发时间为2025-12-20 08:00”）',
  `oper_ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作IP地址',
  `oper_result` tinyint NOT NULL DEFAULT '1' COMMENT '操作结果：1-成功，0-失败',
  `oper_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_oper_user` (`oper_user_type`,`oper_user_id`),
  KEY `idx_oper_time` (`oper_time`) COMMENT '时间范围查询索引',
  KEY `idx_oper_module` (`oper_module`) COMMENT '模块筛选索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

-- sharding_db.users definition

CREATE TABLE `users` (
  `user_id` bigint NOT NULL COMMENT '用户ID(雪花算法生成)',
  `phone_number` varchar(20) NOT NULL COMMENT '手机号',
  `password_hash` varchar(255) NOT NULL COMMENT '加密密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `id_card` varchar(20) DEFAULT NULL COMMENT '身份证号',
  `gender` tinyint DEFAULT '0' COMMENT '性别:0-未知,1-男,2-女',
  `user_status` tinyint DEFAULT '1' COMMENT '状态:1-正常,2-锁定,3-注销',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户核心表';

