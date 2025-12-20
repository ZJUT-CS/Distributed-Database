package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper; // 导入 QueryWrapper
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin; // 导入 Admin 实体
import com.team.skylink.module.admin.mapper.AdminMapper;
import com.team.skylink.module.system.mapper.ConfigMapper;
import com.team.skylink.module.system.mapper.OperationLogMapper;
import com.team.skylink.module.system.mapper.UserBehaviorStatMapper;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import jakarta.servlet.http.HttpServletRequest; // 导入 Request
import lombok.Data; // 导入 Data
import org.springframework.security.crypto.password.PasswordEncoder; // 导入密码加密
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; // 导入 PostMapping
import org.springframework.web.bind.annotation.RequestBody; // 导入 RequestBody
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime; // 导入时间

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
public class AdminController {
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final PasswordEncoder passwordEncoder; // 1. 新增：密码加密器

    public AdminController(AdminMapper adminMapper,
                           ConfigMapper configMapper,
                           OperationLogMapper operationLogMapper,
                           UserBehaviorStatMapper userBehaviorStatMapper,
                           RefundChangeRecordMapper refundChangeRecordMapper,
                           PasswordEncoder passwordEncoder) { // 2. 新增：构造函数注入
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.passwordEncoder = passwordEncoder;
    }

    // ▼▼▼▼▼▼ 新增：创建管理员的接口 ▼▼▼▼▼▼
    @PostMapping("/admins")
    public Result<Admin> createAdmin(HttpServletRequest request, @RequestBody AdminCreateRequest body) {
        // 1. 鉴权 (这里假设只有现有管理员能创建新管理员)
        // 注意：如果是系统初始化，没有第一个管理员，你可能需要暂时注释掉下面这一行鉴权代码
        // String t = request.getHeader("X-User-Type");
        // if (t == null || !"2".equals(t.trim())) return Result.fail(403, "admin required");

        // 2. 检查账号是否存在
        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", body.getAdminAccount()));
        if (existing != null) {
            return Result.fail(409, "admin account already exists");
        }

        // 3. 创建对象
        Admin admin = new Admin();
        admin.setAdminAccount(body.getAdminAccount());
        // 加密密码
        admin.setPasswordHash(passwordEncoder.encode(body.getPassword()));
        admin.setRole(2); // 默认普通管理员
        admin.setCreateTime(System.currentTimeMillis()); // 使用时间戳

        // 4. 插入数据库
        adminMapper.insert(admin);
        return Result.ok(admin);
    }
    // ▲▲▲▲▲▲ 新增结束 ▲▲▲▲▲▲

    @GetMapping("/admins/count")
    public Result<Long> adminCount() {
        return Result.ok(adminMapper.selectCount(null));
    }

    // ... 其他 count 方法保持不变 ...
    @GetMapping("/configs/count")
    public Result<Long> configCount() { return Result.ok(configMapper.selectCount(null)); }
    @GetMapping("/logs/operation/count")
    public Result<Long> operationLogCount() { return Result.ok(operationLogMapper.selectCount(null)); }
    @GetMapping("/stats/user-behavior/count")
    public Result<Long> userBehaviorStatCount() { return Result.ok(userBehaviorStatMapper.selectCount(null)); }
    @GetMapping("/change-requests/count")
    public Result<Long> changeRequestCount() { return Result.ok(refundChangeRecordMapper.selectCount(null)); }

    // 定义接收参数的内部类 (DTO)
    @Data
    public static class AdminCreateRequest {
        private String adminAccount;
        private String password;
    }
}
