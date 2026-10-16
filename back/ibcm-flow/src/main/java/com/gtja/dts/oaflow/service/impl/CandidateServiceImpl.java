package com.gtja.dts.oaflow.service.impl;


import com.gtja.dts.oaflow.mapper.tyglryj.FlowDocCmpTyglryjMapper;
import com.gtja.dts.oaflow.mapper.zpqld.FlowDocCmpZqpldyjMapper;
import com.gtja.flow.helper.domain.Candidate;
import com.gtja.flow.helper.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * @author wxx
 * @date 2023-06-12 16:07
 */
@Service
@RequiredArgsConstructor
public class CandidateServiceImpl implements CandidateService {

    private final FlowDocCmpZqpldyjMapper candidateMapper;
    private final FlowDocCmpTyglryjMapper tyglryjMapper;

    /**
     * 该处实现用户查询
     * @param candidates
     * @return
     */
    @Override
    public List<Candidate> list(String candidates) {
//        List<Candidate> candidateList = new ArrayList<>();
//        Candidate candidate = new Candidate();
//        candidate.setUserCode("018152");
//        candidate.setUserOaCode("huangzhichang");
//        candidate.setUserName("黄志昌");
//        candidate.setOrgCode("0220");
//        candidate.setOrgName("信息技术部");
//        candidateList.add(candidate);
//        return candidateList;
        // 起草节点会跳过 默认都是huangzhichang发起
        List<Candidate> candidateList = new ArrayList<>();
        String[] split = candidates.split(",");
        if(split.length == 2 && "CMP090".equalsIgnoreCase(split[1])){
            // '同一管理人预警--CMP090' 获取候选人与原先不同
            candidateList.add(tyglryjMapper.findCandidateByUserId(split[0]));
        }else{
            for (String s : split) {
                candidateList.add(candidateMapper.findCandidateByUserId(s));
            }
        }
        return candidateList;
    }
}
