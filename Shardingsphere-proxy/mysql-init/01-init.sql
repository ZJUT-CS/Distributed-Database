-- =========================================================

-- 1. 用户表 (users)

-- 对应 YAML: users 表, 分片键 user_id, 算法 user_id % 3

-- =========================================================

CREATE TABLE IF NOT EXISTS users (

    user_id BIGINT NOT NULL COMMENT '用户ID(雪花算法生成)',

    phone_number VARCHAR(20) NOT NULL COMMENT '手机号',

    password_hash VARCHAR(255) NOT NULL COMMENT '加密密码',

    real_name VARCHAR(50) COMMENT '真实姓名',

    email VARCHAR(100) COMMENT '邮箱',

    id_card VARCHAR(20) COMMENT '身份证号',

    gender TINYINT DEFAULT 0 COMMENT '性别:0-未知,1-男,2-女',

    birth_date DATE COMMENT '出生日期',

    user_status TINYINT DEFAULT 1 COMMENT '状态:1-正常,2-锁定,3-注销',

    register_time BIGINT NOT NULL COMMENT '注册时间戳',

    last_login_time BIGINT COMMENT '最后登录时间戳',

    PRIMARY KEY (user_id),

    UNIQUE KEY uk_phone (phone_number)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';



-- =========================================================

-- 2. 航班表 (flights)

-- 对应 YAML: flights 表, 分片键 flight_id, 算法 flight_id % 3

-- =========================================================

CREATE TABLE IF NOT EXISTS flights (

    flight_id BIGINT NOT NULL COMMENT '航班ID(雪花算法)',

    flight_number VARCHAR(20) NOT NULL COMMENT '航班号',

    airline VARCHAR(50) NOT NULL COMMENT '航空公司',

    departure_city VARCHAR(50) NOT NULL COMMENT '出发城市',

    departure_airport VARCHAR(100) NOT NULL COMMENT '出发机场',

    arrival_city VARCHAR(50) NOT NULL COMMENT '到达城市',

    arrival_airport VARCHAR(100) NOT NULL COMMENT '到达机场',

    departure_time BIGINT NOT NULL COMMENT '起飞时间戳',

    arrival_time BIGINT NOT NULL COMMENT '到达时间戳',

    flight_duration INT COMMENT '飞行时长(分钟)',

    aircraft_type VARCHAR(50) COMMENT '机型',

    total_seats INT NOT NULL COMMENT '总座位数',

    available_seats INT NOT NULL COMMENT '可用座位数',

    economy_price DECIMAL(10,2) NOT NULL COMMENT '经济舱价格',

    business_price DECIMAL(10,2) COMMENT '商务舱价格',

    first_class_price DECIMAL(10,2) COMMENT '头等舱价格',

    flight_status TINYINT DEFAULT 1 COMMENT '状态:1-计划中...6-已到达',

    create_time BIGINT NOT NULL COMMENT '创建时间戳',

    update_time BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (flight_id),

    INDEX idx_route (departure_city, arrival_city),

    INDEX idx_departure_time (departure_time)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='航班表';



-- =========================================================

-- 3. 座位表 (seats)

-- 对应 YAML: seats 表, 分片键 flight_id (与 flights 绑定)

-- =========================================================

CREATE TABLE IF NOT EXISTS seats (

    seat_id BIGINT NOT NULL COMMENT '座位ID(雪花算法)',

    flight_id BIGINT NOT NULL COMMENT '航班ID (分片键)',

    seat_number VARCHAR(10) NOT NULL COMMENT '座位号',

    seat_class TINYINT NOT NULL COMMENT '舱位:1-经济舱,2-商务舱,3-头等舱',

    seat_status TINYINT DEFAULT 1 COMMENT '状态:1-可用,2-已售,3-锁定',

    price DECIMAL(10,2) NOT NULL COMMENT '价格',

    create_time BIGINT NOT NULL COMMENT '创建时间戳',

    PRIMARY KEY (seat_id),

    -- 联合唯一索引确保同一航班无重复座位

    UNIQUE KEY uk_flight_seat (flight_id, seat_number),

    INDEX idx_flight_id (flight_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='座位表';



-- =========================================================

-- 4. 订单表 (orders)

-- 对应 YAML: orders 表, 分片键 user_id

-- =========================================================

CREATE TABLE IF NOT EXISTS orders (

    order_id BIGINT NOT NULL COMMENT '订单ID(雪花算法)',

    order_number VARCHAR(50) NOT NULL COMMENT '业务订单号',

    user_id BIGINT NOT NULL COMMENT '用户ID (分片键)',

    flight_id BIGINT NOT NULL COMMENT '航班ID',

    seat_id BIGINT NOT NULL COMMENT '座位ID',

    passenger_name VARCHAR(50) NOT NULL COMMENT '乘客姓名',

    passenger_id_card VARCHAR(20) NOT NULL COMMENT '乘客身份证',

    seat_class TINYINT NOT NULL COMMENT '舱位等级',

    actual_amount DECIMAL(10,2) NOT NULL COMMENT '实际支付金额',

    order_status TINYINT DEFAULT 1 COMMENT '状态:1-待支付...7-已完成',

    create_time BIGINT NOT NULL COMMENT '创建时间戳',

    pay_time BIGINT COMMENT '支付时间戳',

    cancel_time BIGINT COMMENT '取消时间戳',

    PRIMARY KEY (order_id),

    INDEX idx_user_id (user_id),

    INDEX idx_order_status (order_status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';



-- =========================================================

-- 5. 支付记录表 (payments)

-- 对应 YAML: payments 表, 分片键 order_id

-- =========================================================

CREATE TABLE IF NOT EXISTS payments (

    payment_id BIGINT NOT NULL COMMENT '支付ID(雪花算法)',

    order_id BIGINT NOT NULL COMMENT '订单ID (分片键)',

    payment_number VARCHAR(50) NOT NULL COMMENT '支付流水号',

    payment_method TINYINT NOT NULL COMMENT '方式:1-支付宝,2-微信',

    payment_amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',

    payment_status TINYINT DEFAULT 1 COMMENT '状态',

    transaction_id VARCHAR(100) COMMENT '第三方交易ID',

    payment_time BIGINT COMMENT '支付时间戳',

    create_time BIGINT NOT NULL COMMENT '创建时间戳',

    PRIMARY KEY (payment_id),

    INDEX idx_order_id (order_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';



-- =========================================================

-- 6. 退款申请表 (refund_requests)

-- 对应 YAML: refund_requests 表, 分片键 order_id

-- =========================================================

CREATE TABLE IF NOT EXISTS refund_requests (

    request_id BIGINT NOT NULL COMMENT '申请ID(雪花算法)',

    order_id BIGINT NOT NULL COMMENT '订单ID (分片键)',

    payment_id BIGINT NOT NULL COMMENT '支付记录ID',

    refund_amount DECIMAL(10,2) NOT NULL COMMENT '退款金额',

    refund_reason VARCHAR(500) COMMENT '退款原因',

    request_status TINYINT DEFAULT 1 COMMENT '状态',

    create_time BIGINT NOT NULL COMMENT '申请时间戳',

    PRIMARY KEY (request_id),

    INDEX idx_order_id (order_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款申请表';



-- =========================================================

-- 7. 改签申请表 (change_requests)

-- 对应 YAML: change_requests 表, 分片键 original_order_id

-- =========================================================

CREATE TABLE IF NOT EXISTS change_requests (

    request_id BIGINT NOT NULL COMMENT '申请ID(雪花算法)',

    original_order_id BIGINT NOT NULL COMMENT '原订单ID (分片键)',

    new_flight_id BIGINT NOT NULL COMMENT '新航班ID',

    new_seat_id BIGINT NOT NULL COMMENT '新座位ID',

    change_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '改签费用',

    request_status TINYINT DEFAULT 1 COMMENT '状态',

    create_time BIGINT NOT NULL COMMENT '申请时间戳',

    PRIMARY KEY (request_id),

    INDEX idx_original_order (original_order_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='改签申请表';



-- =========================================================

-- 9. 操作日志表 (operation_logs)

-- 对应 YAML: operation_logs 表, 分片键 log_id

-- 注意：YAML 中改为按 log_id 分片，所以这里去掉之前的日期分区结构

-- =========================================================

CREATE TABLE IF NOT EXISTS operation_logs (

    log_id BIGINT NOT NULL COMMENT '日志ID(雪花算法-分片键)',

    log_type TINYINT NOT NULL COMMENT '类型:1-操作,2-登录',

    operator_id BIGINT COMMENT '操作人ID',

    operator_type TINYINT COMMENT '类型:1-用户,2-管理员',

    operation VARCHAR(100) NOT NULL COMMENT '操作名称',

    operation_detail JSON COMMENT '详情',

    ip_address VARCHAR(50) COMMENT 'IP地址',

    operation_time BIGINT NOT NULL COMMENT '操作时间戳',

    PRIMARY KEY (log_id),

    INDEX idx_operator (operator_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';



-- =========================================================

-- 10. 广播表 - 管理员 (admins)

-- 对应 YAML: !BROADCAST tables (所有库都有一份)

-- =========================================================

CREATE TABLE IF NOT EXISTS admins (

    admin_id BIGINT NOT NULL COMMENT '管理员ID(雪花算法)',

    username VARCHAR(50) NOT NULL COMMENT '用户名',

    password_hash VARCHAR(255) NOT NULL COMMENT '加密密码',

    role TINYINT DEFAULT 2 COMMENT '角色',

    last_login_time BIGINT COMMENT '最后登录时间',

    create_time BIGINT NOT NULL COMMENT '创建时间戳',

    PRIMARY KEY (admin_id),

    UNIQUE KEY uk_admin_name (username)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';



-- =========================================================

-- 11. 广播表 - 配置表 (configs)

-- 对应 YAML: !BROADCAST tables

-- =========================================================

CREATE TABLE IF NOT EXISTS configs (

    config_key VARCHAR(100) NOT NULL COMMENT '配置键',

    config_value TEXT COMMENT '配置值',

    description VARCHAR(500) COMMENT '描述',

    update_time BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (config_key)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';



-- =========================================================

-- 12. 航班日统计表 (flight_daily_stats)

-- 对应 YAML: flight_daily_stats 表, 分片键 flight_id

-- =========================================================

CREATE TABLE IF NOT EXISTS flight_daily_stats (

    stat_date DATE NOT NULL COMMENT '统计日期',

    flight_id BIGINT NOT NULL COMMENT '航班ID (分片键)',

    total_seats INT NOT NULL COMMENT '总座位数',

    sold_seats INT DEFAULT 0 COMMENT '已售座位数',

    total_revenue DECIMAL(15,2) DEFAULT 0.00 COMMENT '总收入',

    update_time BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (stat_date, flight_id),

    INDEX idx_flight_id (flight_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='航班日统计表';



-- =========================================================

-- 13. 用户行为统计表 (user_behavior_stats)

-- 对应 YAML: user_behavior_stats 表, 分片键 user_id

-- =========================================================

CREATE TABLE IF NOT EXISTS user_behavior_stats (

    user_id BIGINT NOT NULL COMMENT '用户ID (分片键)',

    stat_date DATE NOT NULL COMMENT '统计日期',

    login_count INT DEFAULT 0 COMMENT '登录次数',

    order_count INT DEFAULT 0 COMMENT '下单次数',

    total_spent DECIMAL(15,2) DEFAULT 0.00 COMMENT '总消费',

    update_time BIGINT NOT NULL COMMENT '更新时间戳',

    PRIMARY KEY (user_id, stat_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为统计表';