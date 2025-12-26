package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.module.flight.entity.Lal;
import com.team.skylink.module.flight.mapper.LalMapper;
import com.team.skylink.module.flight.service.LalService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LalServiceImpl extends ServiceImpl<LalMapper, Lal> implements LalService {

    @Override
    public List<Lal> getAllAirports() {
        // 直接查询所有数据，ShardingSphere 会自动处理广播表的路由
        return list(Wrappers.<Lal>lambdaQuery()
                .orderByAsc(Lal::getId)); // 可选：按ID排序
    }
}