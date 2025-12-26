-- Add layout_no column to flights table to support multiple cabin layouts per aircraft model
ALTER TABLE flights ADD COLUMN layout_no INT DEFAULT 1 COMMENT '舱位布局方案号';
