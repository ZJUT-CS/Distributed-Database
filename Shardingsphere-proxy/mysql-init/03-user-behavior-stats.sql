-- 创建用户行为统计表
CREATE TABLE IF NOT EXISTS user_behavior_stats (
    stat_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    action_type VARCHAR(50) NOT NULL COMMENT '行为类型：search/view/book/cancel',
    action_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '行为时间',
    metadata JSON COMMENT '行为元数据（JSON格式）',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    INDEX idx_user_id (user_id),
    INDEX idx_action_time (action_time),
    INDEX idx_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为统计表';
