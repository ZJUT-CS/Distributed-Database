-- 增量迁移：flight_id 作为全链路锚点（约束/索引补齐）
-- 日期：2025-12-25
-- 说明：
-- 1) ShardingSphere 分库分表下，orders(user_id 分片) 与 flights(flight_id 分片) 不同分片键，通常不建议/不支持跨库外键。
-- 2) 本脚本仅补充“能安全加”的唯一键/索引，用于：flightNo→flightId 唯一解析、更快的 LIMIT 2 判重、以及退改签按 flight_id 查询。
-- 3) 如线上已有重复数据导致 UNIQUE 添加失败，请先清理重复数据后再执行。

-- 0) 预检查：flight_no + departure_time 是否存在重复（若有，将导致 UNIQUE 失败）
SELECT flight_no, departure_time, COUNT(*) AS cnt
FROM flights
GROUP BY flight_no, departure_time
HAVING COUNT(*) > 1;

-- 1) flights：定义“航班实例”的自然键，并加速 flightNo→flightId 的判重/取最新
ALTER TABLE flights
  ADD UNIQUE KEY uk_flight_no_departure_time (flight_no, departure_time);

ALTER TABLE flights
  ADD KEY idx_flight_no_id (flight_no, flight_id);

-- 2) refund_change_record：补齐 old/new flight_id 索引（常用于审核/追溯/统计）
ALTER TABLE refund_change_record
  ADD KEY idx_old_flight_id (old_flight_id),
  ADD KEY idx_new_flight_id (new_flight_id);
