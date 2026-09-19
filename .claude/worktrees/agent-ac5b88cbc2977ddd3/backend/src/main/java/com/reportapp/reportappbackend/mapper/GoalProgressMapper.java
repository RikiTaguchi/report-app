package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.GoalProgress;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface GoalProgressMapper {

    Optional<GoalProgress> findById(@Param("id") UUID id);

    List<GoalProgress> findByGoalId(@Param("goalId") UUID goalId);

    Optional<GoalProgress> findLatestByGoalId(@Param("goalId") UUID goalId);

    void insert(GoalProgress progress);

    void update(GoalProgress progress);

    void deleteById(@Param("id") UUID id);

    void deleteByGoalId(@Param("goalId") UUID goalId);
}
